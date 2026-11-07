import "server-only";

import type { UserRole } from "@/domain/access/roles";
import {
  planOrderAdvance,
  planOrderCancel,
} from "@/domain/workflow/order-item-sync";
import {
  assertOfferAmountKop,
  canConfirmPrice,
  canProposePrice,
  maxRepairFeeKop,
  type PriceOfferSide,
} from "@/domain/orders/price-deal";
import {
  acceptOrderBySchool,
  applyOrderTransition,
  claimItemOrder,
  findClaimableItem,
  findOrderForMaster,
  proposePriceOnOrder,
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

export type OrderResult =
  | { ok: true; orderId: string; itemId?: string }
  | { ok: false; error: string };

const MINUTES_PER_UNIT = 120;

function canManageOrder(actor: OrderActor, order: { masterId: string }): boolean {
  if (actor.role === "PLATFORM_ADMIN") return true;
  if (actor.role !== "FREELANCER") return false;
  return order.masterId === actor.id;
}

export async function claimListedItem(
  actor: OrderActor,
  input: { itemId: string; agreedFeeKop: number },
): Promise<OrderResult> {
  if (actor.role !== "FREELANCER") {
    return { ok: false, error: "Взять в работу может фрилансер" };
  }
  if (!Number.isInteger(input.agreedFeeKop) || input.agreedFeeKop <= 0) {
    return { ok: false, error: "Укажите цену за ремонт больше нуля" };
  }

  const item = await findClaimableItem(input.itemId);
  if (!item) return { ok: false, error: "Предмет не найден" };
  if (item.status !== "LISTED") return { ok: false, error: "Предмет уже не опубликован" };
  if (item.condition === "SCRAP") return { ok: false, error: "Лом в ремонт не берём" };
  if (item.orders.length > 0) return { ok: false, error: "У предмета уже есть активный заказ" };

  try {
    assertOfferAmountKop(
      input.agreedFeeKop,
      maxRepairFeeKop({
        repairBudgetKop: item.repairBudgetKop,
        newUnitPriceKop: item.newUnitPriceKop,
        quantity: item.quantity,
      }),
    );
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Некорректная цена" };
  }

  // Материалы и доставка — внутри цены фрилансера, школа их отдельно не платит.
  const dueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  const result = await claimItemOrder({
    itemId: item.id,
    masterId: actor.id,
    agreedFeeKop: input.agreedFeeKop,
    plannedMaterialsKop: 0,
    transportKop: 0,
    plannedMinutes: Math.max(MINUTES_PER_UNIT, item.quantity * MINUTES_PER_UNIT),
    dueDate,
  });

  if (!result.ok) {
    if (result.reason === "busy") return { ok: false, error: "У предмета уже есть активный заказ" };
    return { ok: false, error: "Карточку уже взяли или сняли" };
  }
  return { ok: true, orderId: result.orderId, itemId: item.id };
}

export async function proposeOrderPrice(
  actor: OrderActor,
  input: { orderId: string; amountKop: number },
): Promise<OrderResult> {
  const order = await findOrderForMaster(input.orderId);
  if (!order) return { ok: false, error: "Заказ не найден" };

  const isMaster = order.masterId === actor.id;
  const isSchoolStaff =
    actor.role === "DONOR_STAFF" &&
    actor.institutionId !== null &&
    actor.institutionId === order.item.institutionId;

  if (
    !canProposePrice({
      role: actor.role,
      isMaster,
      isSchoolStaff,
      orderStatus: order.status,
      schoolAcceptedAt: order.schoolAcceptedAt,
    })
  ) {
    return { ok: false, error: "Сейчас нельзя менять цену" };
  }

  try {
    assertOfferAmountKop(
      input.amountKop,
      maxRepairFeeKop({
        repairBudgetKop: order.item.repairBudgetKop,
        newUnitPriceKop: order.item.newUnitPriceKop,
        quantity: order.item.quantity,
      }),
    );
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Некорректная цена" };
  }

  const side: PriceOfferSide =
    actor.role === "FREELANCER" || (actor.role === "PLATFORM_ADMIN" && isMaster)
      ? "FREELANCER"
      : "SCHOOL";

  const result = await proposePriceOnOrder({
    orderId: order.id,
    actorId: actor.id,
    side,
    amountKop: input.amountKop,
  });
  if (!result.ok) {
    if (result.reason === "same") {
      return { ok: false, error: "Это уже текущая открытая цена" };
    }
    return { ok: false, error: "Статус уже изменился" };
  }
  return { ok: true, orderId: order.id, itemId: order.item.id };
}

export async function acceptOrderProposal(
  actor: OrderActor,
  orderId: string,
): Promise<OrderResult> {
  if (actor.role !== "DONOR_STAFF" && actor.role !== "PLATFORM_ADMIN") {
    return { ok: false, error: "Подтвердить цену может завхоз" };
  }
  if (!actor.institutionId && actor.role !== "PLATFORM_ADMIN") {
    return { ok: false, error: "Нужно учреждение" };
  }

  const order = await findOrderForMaster(orderId);
  if (!order) return { ok: false, error: "Заказ не найден" };
  const isSchoolStaff =
    actor.institutionId !== null && actor.institutionId === order.item.institutionId;
  if (!isSchoolStaff && actor.role !== "PLATFORM_ADMIN") {
    return { ok: false, error: "Это предмет другого учреждения" };
  }
  if (
    !canConfirmPrice({
      role: actor.role,
      isSchoolStaff,
      orderStatus: order.status,
      schoolAcceptedAt: order.schoolAcceptedAt,
      openOfferKop: order.openOfferKop,
    })
  ) {
    return { ok: false, error: "Нет открытой цены для подтверждения" };
  }

  const result = await acceptOrderBySchool({
    orderId: order.id,
    itemId: order.item.id,
    actorId: actor.id,
    institutionId: order.item.institutionId,
  });
  if (!result.ok) {
    if (result.reason === "no-offer") {
      return { ok: false, error: "Нет открытой цены для подтверждения" };
    }
    return { ok: false, error: "Статус уже изменился" };
  }
  return { ok: true, orderId: order.id, itemId: order.item.id };
}

export async function advanceOrder(actor: OrderActor, orderId: string): Promise<OrderResult> {
  const order = await findOrderForMaster(orderId);
  if (!order) return { ok: false, error: "Заказ не найден" };
  if (!canManageOrder(actor, order)) return { ok: false, error: "Это заказ другого фрилансера" };

  if (order.status === "ASSIGNED" && !order.schoolAcceptedAt) {
    return {
      ok: false,
      error: "Ремонт начнётся, когда завхоз подтвердит вашу цену",
    };
  }

  try {
    // Старые заказы: цена уже подтверждена, но статус ещё ASSIGNED — сначала в работу.
    if (order.status === "ASSIGNED" && order.schoolAcceptedAt) {
      const start = planOrderAdvance("ASSIGNED", order.item.status);
      const started = await applyOrderTransition({
        orderId: order.id,
        itemId: order.item.id,
        fromOrder: "ASSIGNED",
        toOrder: start.orderTo,
        fromItem: order.item.status,
        toItem: start.itemTo,
        actorId: actor.id,
        comment: start.comment,
      });
      if (!started) return { ok: false, error: "Статус заказа уже изменился" };
      // Сразу завершаем ремонт по кнопке «Завершить заказ».
      const finish = planOrderAdvance("IN_PROGRESS", start.itemTo ?? "IN_REPAIR");
      const done = await applyOrderTransition({
        orderId: order.id,
        itemId: order.item.id,
        fromOrder: "IN_PROGRESS",
        toOrder: finish.orderTo,
        fromItem: start.itemTo ?? "IN_REPAIR",
        toItem: finish.itemTo,
        actorId: actor.id,
        comment: finish.comment,
        actualMaterialsKop: order.plannedMaterialsKop,
        actualMinutes: order.plannedMinutes,
      });
      if (!done) return { ok: false, error: "Не удалось завершить заказ" };
      return { ok: true, orderId: order.id, itemId: order.item.id };
    }

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
    return { ok: true, orderId: order.id, itemId: order.item.id };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Нельзя продвинуть заказ" };
  }
}

export async function cancelOrder(actor: OrderActor, orderId: string): Promise<OrderResult> {
  const order = await findOrderForMaster(orderId);
  if (!order) return { ok: false, error: "Заказ не найден" };
  if (!canManageOrder(actor, order)) return { ok: false, error: "Это заказ другого фрилансера" };

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
    return { ok: true, orderId: order.id, itemId: order.item.id };
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
