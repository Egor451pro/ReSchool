import "server-only";

import type { UserRole } from "@/domain/access/roles";
import { buildTransferActPayload, buildWriteOffPayload } from "@/domain/documents";
import { planUnrepairable } from "@/domain/workflow/order-item-sync";
import {
  confirmSchoolRepair,
  createWriteOffWithClose,
  findDocumentById,
} from "@/server/repositories/document-repository";
import { findConfirmableOrderForItem } from "@/server/repositories/item-repository";
import { findOrderForMaster } from "@/server/repositories/order-repository";
import { renderActPdf } from "@/server/services/document-pdf";
import { buildOrderEconomySnapshot } from "@/server/services/economy-snapshot";

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
  order: { masterId: string },
): boolean {
  if (actor.role === "PLATFORM_ADMIN") return true;
  if (actor.role !== "FREELANCER") return false;
  return order.masterId === actor.id;
}

const catalogRoles: readonly UserRole[] = [
  "DONOR_STAFF",
  "FREELANCER",
  "DISTRICT_ANALYST",
  "PLATFORM_ADMIN",
];

/**
 * Каноническое закрытие ремонта: акт возврата + EconomySnapshot + выплаты.
 * Фрилансер только завершает заказ; снимок пишет эта функция.
 */
export async function confirmRepairBySchool(
  actor: DocumentActor,
  itemId: string,
): Promise<DocumentResult> {
  if (actor.role !== "DONOR_STAFF" && actor.role !== "PLATFORM_ADMIN") {
    return { ok: false, error: "Подтвердить ремонт может завхоз учреждения" };
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

  const snapshot = await buildOrderEconomySnapshot(order);
  if (!snapshot) return { ok: false, error: "Нет набора допущений для снимка" };

  const { base, materialsKop, transportKop, freelancerFeeKop, economy } = snapshot;
  const zavhozBonusKop = Math.round(
    (base.slesarAnnualSalaryKop * base.zavhozBonusShareMilli) / 1000 / 12,
  );

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
      freelancerId: order.masterId,
      agreedFeeKop: freelancerFeeKop,
      zavhozBonusKop: actor.role === "DONOR_STAFF" ? zavhozBonusKop : 0,
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
      freelancerFeeKop: economy.freelancerFeeKop,
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

export async function markUnrepairableWithAct(
  actor: DocumentActor,
  orderId: string,
): Promise<DocumentResult> {
  if (actor.role !== "FREELANCER" && actor.role !== "PLATFORM_ADMIN") {
    return { ok: false, error: "Закрыть заказ может фрилансер или администратор" };
  }

  const order = await findOrderForMaster(orderId);
  if (!order) return { ok: false, error: "Заказ не найден" };
  if (!canManageOrder(actor, order)) return { ok: false, error: "Это заказ другого фрилансера" };

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

function canViewDocument(
  actor: DocumentActor,
  document: {
    order: {
      masterId: string;
      item: { institutionId: string };
    };
  },
): boolean {
  if (actor.role === "PLATFORM_ADMIN" || actor.role === "DISTRICT_ANALYST") return true;
  if (actor.role === "DONOR_STAFF") {
    return actor.institutionId === document.order.item.institutionId;
  }
  if (actor.role === "FREELANCER") {
    return actor.id === document.order.masterId;
  }
  return false;
}

export async function loadActPdfBytes(
  actor: DocumentActor,
  documentId: string,
): Promise<{ bytes: Uint8Array; filename: string } | null> {
  if (!catalogRoles.includes(actor.role)) return null;

  const document = await findDocumentById(documentId);
  if (!document?.order) return null;
  if (!canViewDocument(actor, { order: document.order })) return null;

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
