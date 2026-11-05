import "server-only";

import type { UserRole } from "@/domain/access/roles";
import {
  planOrderAdvance,
  planOrderCancel,
} from "@/domain/workflow/order-item-sync";
import { prisma } from "@/server/db";
import {
  applyOrderTransition,
  claimItemOrder,
  findClaimableItem,
  findOrderForMaster,
  listMasterGroups,
} from "@/server/repositories/order-repository";
import {
  deliverOrderWithAct,
  markUnrepairableWithAct,
} from "@/server/services/document-service";

export type OrderActor = {
  id: string;
  role: UserRole;
  institutionId: string | null;
};

export type OrderResult = { ok: true; orderId: string } | { ok: false; error: string };

const DEFAULT_MATERIALS_KOP = 4_000;
const DEFAULT_TRANSPORT_KOP = 1_500;
const MINUTES_PER_UNIT = 120;

async function planDefaults() {
  const base = await prisma.assumptionSet.findUnique({
    where: { kind: "BASE" },
    select: {
      avgMaterialsKop: true,
      defaultTransportKop: true,
    },
  });
  return {
    materials: base?.avgMaterialsKop ?? DEFAULT_MATERIALS_KOP,
    transport: base?.defaultTransportKop ?? DEFAULT_TRANSPORT_KOP,
  };
}

function canManageOrder(
  actor: OrderActor,
  order: { masterId: string; workshopInstitutionId: string },
): boolean {
  if (actor.role === "PLATFORM_ADMIN") return true;
  if (actor.role !== "WORKSHOP_MASTER") return false;
  return order.masterId === actor.id;
}

export async function claimListedItem(
  actor: OrderActor,
  input: { itemId: string; groupId?: string },
): Promise<OrderResult> {
  if (actor.role !== "WORKSHOP_MASTER" || !actor.institutionId) {
    return { ok: false, error: "Взять в работу может исполнитель" };
  }

  const groups = await listMasterGroups(actor.id);
  const group =
    (input.groupId ? groups.find((entry) => entry.id === input.groupId) : null) ?? groups[0];
  if (!group || group.institutionId !== actor.institutionId) {
    return { ok: false, error: "У исполнителя нет группы для заказа" };
  }

  const item = await findClaimableItem(input.itemId);
  if (!item) return { ok: false, error: "Предмет не найден" };
  if (item.status !== "LISTED") return { ok: false, error: "Предмет уже не опубликован" };
  if (item.condition === "SCRAP") return { ok: false, error: "Лом в учебный ремонт не берём" };
  if (item.orders.length > 0) return { ok: false, error: "У предмета уже есть активный заказ" };

  // MVP: исполнитель берёт любой заказ; специальность группы только для учёта.
  const specialtyId =
    item.category.specialties.find((link) => link.specialtyId === group.specialtyId)
      ?.specialtyId ??
    item.category.specialties[0]?.specialtyId ??
    group.specialtyId;

  const defaults = await planDefaults();
  const dueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  const result = await claimItemOrder({
    itemId: item.id,
    workshopInstitutionId: actor.institutionId,
    specialtyId,
    masterId: actor.id,
    groupId: group.id,
    plannedMaterialsKop: defaults.materials,
    transportKop: defaults.transport,
    plannedMinutes: Math.max(MINUTES_PER_UNIT, item.quantity * MINUTES_PER_UNIT),
    dueDate,
  });

  if (!result.ok) {
    if (result.reason === "busy") return { ok: false, error: "У предмета уже есть активный заказ" };
    return { ok: false, error: "Карточку уже взяли или сняли" };
  }
  return { ok: true, orderId: result.orderId };
}

export async function advanceOrder(actor: OrderActor, orderId: string): Promise<OrderResult> {
  const order = await findOrderForMaster(orderId);
  if (!order) return { ok: false, error: "Заказ не найден" };
  if (!canManageOrder(actor, order)) return { ok: false, error: "Это заказ другого исполнителя" };

  try {
    const plan = planOrderAdvance(order.status, order.item.status);
    const ok = await applyOrderTransition({
      orderId: order.id,
      itemId: order.item.id,
      fromOrder: order.status,
      toOrder: plan.orderTo,
      fromItem: order.item.status,
      toItem: plan.itemTo,
      actorId: actor.id,
      comment: plan.comment,
      actualMaterialsKop:
        plan.orderTo === "COMPLETED" ? order.plannedMaterialsKop : undefined,
      actualMinutes: plan.orderTo === "COMPLETED" ? order.plannedMinutes : undefined,
    });
    if (!ok) return { ok: false, error: "Статус заказа уже изменился" };
    return { ok: true, orderId: order.id };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Нельзя продвинуть заказ" };
  }
}

export async function cancelOrder(actor: OrderActor, orderId: string): Promise<OrderResult> {
  const order = await findOrderForMaster(orderId);
  if (!order) return { ok: false, error: "Заказ не найден" };
  if (!canManageOrder(actor, order)) return { ok: false, error: "Это заказ другого исполнителя" };

  try {
    const plan = planOrderCancel(order.status, order.item.status);
    const ok = await applyOrderTransition({
      orderId: order.id,
      itemId: order.item.id,
      fromOrder: order.status,
      toOrder: plan.orderTo,
      fromItem: order.item.status,
      toItem: plan.itemTo,
      closeReason: null,
      actorId: actor.id,
      comment: plan.comment,
    });
    if (!ok) return { ok: false, error: "Статус заказа уже изменился" };
    return { ok: true, orderId: order.id };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Нельзя отменить заказ" };
  }
}

export async function markOrderDelivered(actor: OrderActor, orderId: string): Promise<OrderResult> {
  const result = await deliverOrderWithAct(actor, orderId);
  if (!result.ok) return { ok: false, error: result.error };
  return { ok: true, orderId: result.orderId };
}

export async function markOrderUnrepairable(
  actor: OrderActor,
  orderId: string,
): Promise<OrderResult> {
  const result = await markUnrepairableWithAct(actor, orderId);
  if (!result.ok) return { ok: false, error: result.error };
  return { ok: true, orderId: result.orderId };
}
