import "server-only";

import type { UserRole } from "@/domain/access/roles";
import {
  buildTransferActPayload,
  buildWriteOffPayload,
  isReturnAct,
} from "@/domain/documents";
import { planItemDeliver, planUnrepairable } from "@/domain/workflow/order-item-sync";
import { calculateItemEconomy } from "@/domain/economy";
import {
  confirmSchoolRepair,
  createReturnOrTransferAct,
  createWriteOffWithClose,
  findDocumentById,
} from "@/server/repositories/document-repository";
import {
  findAssumptionByKind,
  findDashboardAssumption,
  findDisposalRate,
} from "@/server/repositories/economy-repository";
import { findConfirmableOrderForItem } from "@/server/repositories/item-repository";
import { findOrderForMaster } from "@/server/repositories/order-repository";
import { renderActPdf } from "@/server/services/document-pdf";

export type DocumentActor = {
  id: string;
  role: UserRole;
  institutionId: string | null;
};

export type DocumentResult =
  | { ok: true; orderId: string; documentId: string }
  | { ok: false; error: string };

function canManageOrder(
  actor: DocumentActor,
  order: { masterId: string; workshopInstitutionId: string },
): boolean {
  if (actor.role === "PLATFORM_ADMIN") return true;
  if (actor.role !== "WORKSHOP_MASTER") return false;
  return order.masterId === actor.id;
}

const catalogRoles: readonly UserRole[] = [
  "DONOR_STAFF",
  "WORKSHOP_MASTER",
  "DISTRICT_ANALYST",
  "PLATFORM_ADMIN",
];

/** Школа подтверждает получение ремонта: акт + закрытие + снимок экономии. */
export async function confirmRepairBySchool(
  actor: DocumentActor,
  itemId: string,
): Promise<DocumentResult> {
  if (
    actor.role !== "DONOR_STAFF" &&
    actor.role !== "WORKSHOP_MASTER" &&
    actor.role !== "PLATFORM_ADMIN"
  ) {
    return { ok: false, error: "Подтвердить ремонт может сотрудник учреждения" };
  }
  if (!actor.institutionId) {
    return { ok: false, error: "Нужно учреждение" };
  }

  const order = await findConfirmableOrderForItem(itemId);
  if (!order) {
    return { ok: false, error: "Нет готового ремонта для подтверждения" };
  }
  if (order.item.institutionId !== actor.institutionId && actor.role !== "PLATFORM_ADMIN") {
    return { ok: false, error: "Это предмет другого учреждения" };
  }

  const base =
    (await findAssumptionByKind("BASE")) ?? (await findDashboardAssumption());
  if (!base) return { ok: false, error: "Нет набора допущений для снимка" };

  const rate = await findDisposalRate(base.id, order.item.categoryId);
  const disposalPerUnitKop = rate?.perUnitKop ?? base.avgDisposalKop;
  const materialsKop = order.actualMaterialsKop;
  const transportKop = order.transportKop;
  const economy = calculateItemEconomy({
    quantity: order.item.quantity,
    newUnitPriceKop: order.item.newUnitPriceKop,
    materialsKop,
    transportKop,
    disposalPerUnitKop,
    practiceConsumableKop: base.practiceConsumableKop,
    substitutionMilli: base.substitutionMilli,
  });

  const ownerId = order.item.institutionId;
  const ownerName = order.item.institution.name;
  const payload = buildTransferActPayload({
    title: order.item.title,
    quantity: order.item.quantity,
    materialsKop,
    transportKop,
    fromName: ownerName,
    toName: ownerName,
  });

  try {
    const result = await confirmSchoolRepair({
      orderId: order.id,
      itemId: order.item.id,
      actorId: actor.id,
      fromInstitutionId: ownerId,
      toInstitutionId: ownerId,
      payloadJson: JSON.stringify(payload),
      assumptionId: base.id,
      materialsKop,
      transportKop,
      newPriceKop: economy.newPriceKop,
      procurementSavingKop: economy.procurementSavingKop,
      avoidedDisposalKop: economy.avoidedDisposalKop,
      propertyBudgetKop: economy.propertyBudgetKop,
      practiceSavingKop: economy.practiceSavingKop,
    });

    if (!result.ok) {
      if (result.reason === "exists") return { ok: false, error: "Акт по этому заказу уже есть" };
      if (result.reason === "snapshot") {
        return { ok: false, error: "Снимок экономии уже записан" };
      }
      return { ok: false, error: "Статус уже изменился" };
    }

    return { ok: true, orderId: order.id, documentId: result.document.id };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Нельзя подтвердить ремонт",
    };
  }
}

export async function deliverOrderWithAct(
  actor: DocumentActor,
  orderId: string,
): Promise<DocumentResult> {
  if (actor.role !== "WORKSHOP_MASTER" && actor.role !== "PLATFORM_ADMIN") {
    return { ok: false, error: "Отметить передачу может исполнитель или администратор" };
  }

  const order = await findOrderForMaster(orderId);
  if (!order) return { ok: false, error: "Заказ не найден" };
  if (!canManageOrder(actor, order)) return { ok: false, error: "Это заказ другого исполнителя" };
  if (order.status !== "COMPLETED") {
    return { ok: false, error: "Сначала завершите проверку качества" };
  }

  try {
    const plan = planItemDeliver(order.item.status);
    const ownerId = order.item.institutionId;
    const ownerName = order.item.institution.name;
    // MVP: восстановленное имущество возвращается владельцу карточки.
    const type = isReturnAct(ownerId, ownerId) ? "RETURN_ACT" : "TRANSFER_ACT";
    const payload = buildTransferActPayload({
      title: order.item.title,
      quantity: order.item.quantity,
      materialsKop: order.actualMaterialsKop,
      transportKop: order.transportKop,
      fromName: ownerName,
      toName: ownerName,
    });

    const result = await createReturnOrTransferAct({
      type,
      orderId: order.id,
      itemId: order.item.id,
      fromInstitutionId: ownerId,
      toInstitutionId: ownerId,
      payloadJson: JSON.stringify(payload),
      actorId: actor.id,
      fromItemStatus: "READY",
      comment: plan.comment,
    });

    if (!result.ok) {
      if (result.reason === "exists") return { ok: false, error: "Акт по этому заказу уже есть" };
      return { ok: false, error: "Предмет уже передан или закрыт" };
    }

    return { ok: true, orderId: order.id, documentId: result.document.id };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Нельзя отметить передачу",
    };
  }
}

export async function markUnrepairableWithAct(
  actor: DocumentActor,
  orderId: string,
): Promise<DocumentResult> {
  if (actor.role !== "WORKSHOP_MASTER" && actor.role !== "PLATFORM_ADMIN") {
    return { ok: false, error: "Закрыть заказ может исполнитель или администратор" };
  }

  const order = await findOrderForMaster(orderId);
  if (!order) return { ok: false, error: "Заказ не найден" };
  if (!canManageOrder(actor, order)) return { ok: false, error: "Это заказ другого исполнителя" };

  try {
    const plan = planUnrepairable(order.item.status, order.status);
    const payload = buildWriteOffPayload({ title: order.item.title });
    const result = await createWriteOffWithClose({
      orderId: order.id,
      itemId: order.item.id,
      fromOrderStatus: "IN_PROGRESS",
      fromItemStatus: "IN_REPAIR",
      payloadJson: JSON.stringify(payload),
      actorId: actor.id,
      comment: plan.comment,
    });

    if (!result.ok) {
      if (result.reason === "exists") {
        return { ok: false, error: "Черновик списания уже создан" };
      }
      return { ok: false, error: "Статус уже изменился" };
    }

    return { ok: true, orderId: order.id, documentId: result.document.id };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Нельзя закрыть как неремонтопригодный",
    };
  }
}

export async function loadActPdfBytes(
  actor: DocumentActor,
  documentId: string,
): Promise<{ bytes: Uint8Array; filename: string } | null> {
  if (!catalogRoles.includes(actor.role)) return null;

  const document = await findDocumentById(documentId);
  if (!document) return null;

  const bytes = await renderActPdf({
    number: document.number,
    type: document.type,
    createdAt: document.createdAt,
    payloadRaw: document.payload,
  });

  return {
    bytes,
    filename: `${document.number}.pdf`,
  };
}
