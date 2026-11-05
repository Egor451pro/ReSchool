import "server-only";

import type { DocumentType, Prisma } from "@prisma/client";
import { formatActNumber, parseActSerial } from "@/domain/documents";
import { prisma } from "@/server/db";

const documentSelect = {
  id: true,
  type: true,
  number: true,
  orderId: true,
  payload: true,
  createdAt: true,
} satisfies Prisma.DocumentSelect;

export function findDocumentById(id: string) {
  return prisma.document.findUnique({
    where: { id },
    select: {
      ...documentSelect,
      order: {
        select: {
          id: true,
          item: {
            select: {
              id: true,
              institutionId: true,
              institution: { select: { district: true } },
            },
          },
          workshopInstitutionId: true,
        },
      },
    },
  });
}

export function listDocumentsForOrder(orderId: string) {
  return prisma.document.findMany({
    where: { orderId },
    orderBy: { createdAt: "asc" },
    select: documentSelect,
  });
}

export function listDocumentsForItem(itemId: string) {
  return prisma.document.findMany({
    where: { order: { itemId } },
    orderBy: { createdAt: "asc" },
    select: documentSelect,
  });
}

async function nextActNumber(tx: Prisma.TransactionClient): Promise<string> {
  const latest = await tx.document.findMany({
    select: { number: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  let max = 0;
  for (const row of latest) {
    const serial = parseActSerial(row.number);
    if (serial !== null && serial > max) max = serial;
  }
  return formatActNumber(max + 1);
}

export async function createReturnOrTransferAct(input: {
  type: Extract<DocumentType, "RETURN_ACT" | "TRANSFER_ACT">;
  orderId: string;
  itemId: string;
  fromInstitutionId: string;
  toInstitutionId: string;
  payloadJson: string;
  actorId: string;
  fromItemStatus: "READY";
  comment: string;
}) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.document.count({
      where: {
        orderId: input.orderId,
        type: { in: ["RETURN_ACT", "TRANSFER_ACT"] },
      },
    });
    if (existing > 0) return { ok: false as const, reason: "exists" as const };

    const updated = await tx.item.updateMany({
      where: { id: input.itemId, status: input.fromItemStatus },
      data: { status: "DELIVERED" },
    });
    if (updated.count !== 1) return { ok: false as const, reason: "locked" as const };

    const number = await nextActNumber(tx);
    const document = await tx.document.create({
      data: {
        type: input.type,
        number,
        orderId: input.orderId,
        payload: input.payloadJson,
      },
      select: documentSelect,
    });

    await tx.transfer.create({
      data: {
        itemId: input.itemId,
        fromInstitutionId: input.fromInstitutionId,
        toInstitutionId: input.toInstitutionId,
        transferredAt: new Date(),
        documentId: document.id,
      },
    });

    await tx.statusEvent.create({
      data: {
        itemId: input.itemId,
        orderId: input.orderId,
        fromStatus: input.fromItemStatus,
        toStatus: "DELIVERED",
        actorId: input.actorId,
        comment: input.comment,
      },
    });

    return { ok: true as const, document };
  });
}

/** Школа подтверждает ремонт: акт возврата + закрытие со снимком экономии. */
export async function confirmSchoolRepair(input: {
  orderId: string;
  itemId: string;
  actorId: string;
  fromInstitutionId: string;
  toInstitutionId: string;
  payloadJson: string;
  assumptionId: string;
  materialsKop: number;
  transportKop: number;
  newPriceKop: number;
  procurementSavingKop: number;
  avoidedDisposalKop: number;
  propertyBudgetKop: number;
  practiceSavingKop: number;
}) {
  return prisma.$transaction(async (tx) => {
    const existingAct = await tx.document.count({
      where: {
        orderId: input.orderId,
        type: { in: ["RETURN_ACT", "TRANSFER_ACT"] },
      },
    });
    if (existingAct > 0) return { ok: false as const, reason: "exists" as const };

    const existingSnapshot = await tx.economySnapshot.findUnique({
      where: { orderId: input.orderId },
      select: { id: true },
    });
    if (existingSnapshot) return { ok: false as const, reason: "snapshot" as const };

    const delivered = await tx.item.updateMany({
      where: { id: input.itemId, status: "READY" },
      data: { status: "DELIVERED" },
    });
    if (delivered.count !== 1) return { ok: false as const, reason: "locked" as const };

    const number = await nextActNumber(tx);
    const document = await tx.document.create({
      data: {
        type: "RETURN_ACT",
        number,
        orderId: input.orderId,
        payload: input.payloadJson,
      },
      select: documentSelect,
    });

    await tx.transfer.create({
      data: {
        itemId: input.itemId,
        fromInstitutionId: input.fromInstitutionId,
        toInstitutionId: input.toInstitutionId,
        transferredAt: new Date(),
        documentId: document.id,
      },
    });

    await tx.statusEvent.create({
      data: {
        itemId: input.itemId,
        orderId: input.orderId,
        fromStatus: "READY",
        toStatus: "DELIVERED",
        actorId: input.actorId,
        comment: "Школа подтвердила получение отремонтированного предмета.",
      },
    });

    const closed = await tx.item.updateMany({
      where: { id: input.itemId, status: "DELIVERED" },
      data: { status: "CLOSED", closeReason: "COMPLETED" },
    });
    if (closed.count !== 1) {
      throw new Error("Не удалось закрыть предмет после подтверждения");
    }

    await tx.economySnapshot.create({
      data: {
        orderId: input.orderId,
        assumptionId: input.assumptionId,
        newPriceKop: input.newPriceKop,
        materialsKop: input.materialsKop,
        transportKop: input.transportKop,
        procurementSavingKop: input.procurementSavingKop,
        avoidedDisposalKop: input.avoidedDisposalKop,
        propertyBudgetKop: input.propertyBudgetKop,
        practiceSavingKop: input.practiceSavingKop,
      },
    });

    await tx.statusEvent.create({
      data: {
        itemId: input.itemId,
        orderId: input.orderId,
        fromStatus: "DELIVERED",
        toStatus: "CLOSED",
        actorId: input.actorId,
        comment: "Ремонт подтверждён школой, экономия зафиксирована.",
      },
    });

    return { ok: true as const, document };
  });
}

export async function createWriteOffWithClose(input: {
  orderId: string;
  itemId: string;
  fromOrderStatus: "IN_PROGRESS";
  fromItemStatus: "IN_REPAIR";
  payloadJson: string;
  actorId: string;
  comment: string;
}) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.document.count({
      where: { orderId: input.orderId, type: "WRITE_OFF_DRAFT" },
    });
    if (existing > 0) return { ok: false as const, reason: "exists" as const };

    const orderUpdate = await tx.repairOrder.updateMany({
      where: { id: input.orderId, status: input.fromOrderStatus },
      data: { status: "CANCELLED" },
    });
    if (orderUpdate.count !== 1) return { ok: false as const, reason: "locked" as const };

    const itemUpdate = await tx.item.updateMany({
      where: { id: input.itemId, status: input.fromItemStatus },
      data: { status: "CLOSED", closeReason: "UNREPAIRABLE" },
    });
    if (itemUpdate.count !== 1) {
      throw new Error("Статус предмета изменился параллельно");
    }

    const number = await nextActNumber(tx);
    const document = await tx.document.create({
      data: {
        type: "WRITE_OFF_DRAFT",
        number,
        orderId: input.orderId,
        payload: input.payloadJson,
      },
      select: documentSelect,
    });

    await tx.statusEvent.create({
      data: {
        itemId: input.itemId,
        orderId: input.orderId,
        fromStatus: input.fromItemStatus,
        toStatus: "CLOSED",
        actorId: input.actorId,
        comment: input.comment,
      },
    });

    return { ok: true as const, document };
  });
}
