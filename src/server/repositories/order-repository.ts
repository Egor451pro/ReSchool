import "server-only";

import type { CloseReason, ItemStatus, OrderStatus, Prisma } from "@prisma/client";
import { prisma } from "@/server/db";

const exchangeSelect = {
  id: true,
  title: true,
  condition: true,
  quantity: true,
  newUnitPriceKop: true,
  categoryId: true,
  category: {
    select: {
      id: true,
      name: true,
      slug: true,
      specialties: { select: { specialtyId: true, specialty: { select: { id: true, name: true } } } },
    },
  },
  institution: { select: { id: true, name: true, district: true, lat: true, lng: true } },
  photos: { orderBy: { sort: "asc" as const }, take: 1, select: { id: true, path: true } },
} satisfies Prisma.ItemSelect;

const orderCardSelect = {
  id: true,
  status: true,
  plannedMaterialsKop: true,
  actualMaterialsKop: true,
  transportKop: true,
  plannedMinutes: true,
  actualMinutes: true,
  dueDate: true,
  createdAt: true,
  masterId: true,
  workshopInstitutionId: true,
  group: { select: { id: true, name: true } },
  specialty: { select: { id: true, name: true } },
  item: {
    select: {
      id: true,
      title: true,
      status: true,
      condition: true,
      quantity: true,
      institutionId: true,
      institution: { select: { id: true, name: true, district: true } },
      photos: { orderBy: { sort: "asc" as const }, take: 1, select: { id: true, path: true } },
    },
  },
  documents: {
    orderBy: { createdAt: "asc" as const },
    select: { id: true, type: true, number: true, createdAt: true },
  },
} satisfies Prisma.RepairOrderSelect;

export function listMasterGroups(masterId: string) {
  return prisma.studyGroup.findMany({
    where: { masterId },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      specialtyId: true,
      specialty: { select: { id: true, name: true } },
      institutionId: true,
    },
  });
}

export function listExchangeItems(specialtyIds: string[]) {
  if (specialtyIds.length === 0) return Promise.resolve([]);
  return prisma.item.findMany({
    where: {
      status: "LISTED",
      condition: { in: ["WORKING", "REPAIRABLE"] },
      category: { specialties: { some: { specialtyId: { in: specialtyIds } } } },
      orders: { none: { status: { not: "CANCELLED" } } },
    },
    orderBy: { createdAt: "desc" },
    select: exchangeSelect,
  });
}

export function listWorkshopOrders(workshopInstitutionId: string) {
  return prisma.repairOrder.findMany({
    where: { workshopInstitutionId },
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    select: orderCardSelect,
  });
}

export function listMasterOrders(masterId: string) {
  return prisma.repairOrder.findMany({
    where: { masterId },
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    select: orderCardSelect,
  });
}

export function findOrderForMaster(orderId: string) {
  return prisma.repairOrder.findUnique({
    where: { id: orderId },
    select: {
      ...orderCardSelect,
      itemId: true,
      specialtyId: true,
      groupId: true,
    },
  });
}

export function findClaimableItem(itemId: string) {
  return prisma.item.findUnique({
    where: { id: itemId },
    select: {
      id: true,
      status: true,
      condition: true,
      quantity: true,
      categoryId: true,
      institutionId: true,
      category: {
        select: {
          specialties: { select: { specialtyId: true } },
        },
      },
      orders: {
        where: { status: { not: "CANCELLED" } },
        select: { id: true },
      },
    },
  });
}

export function findWorkshopCoords(institutionId: string) {
  return prisma.institution.findUnique({
    where: { id: institutionId },
    select: { id: true, name: true, lat: true, lng: true },
  });
}

export async function claimItemOrder(input: {
  itemId: string;
  workshopInstitutionId: string;
  specialtyId: string;
  masterId: string;
  groupId: string;
  plannedMaterialsKop: number;
  transportKop: number;
  plannedMinutes: number;
  dueDate: Date;
}) {
  return prisma.$transaction(async (tx) => {
    const active = await tx.repairOrder.count({
      where: { itemId: input.itemId, status: { not: "CANCELLED" } },
    });
    if (active > 0) return { ok: false as const, reason: "busy" as const };

    const updated = await tx.item.updateMany({
      where: { id: input.itemId, status: "LISTED" },
      data: { status: "REQUESTED" },
    });
    if (updated.count !== 1) return { ok: false as const, reason: "locked" as const };

    const order = await tx.repairOrder.create({
      data: {
        itemId: input.itemId,
        workshopInstitutionId: input.workshopInstitutionId,
        specialtyId: input.specialtyId,
        masterId: input.masterId,
        groupId: input.groupId,
        status: "ASSIGNED",
        plannedMaterialsKop: input.plannedMaterialsKop,
        transportKop: input.transportKop,
        plannedMinutes: input.plannedMinutes,
        dueDate: input.dueDate,
      },
      select: { id: true },
    });

    await tx.statusEvent.create({
      data: {
        itemId: input.itemId,
        orderId: order.id,
        fromStatus: "LISTED",
        toStatus: "REQUESTED",
        actorId: input.masterId,
        comment: "Мастерская взяла предмет в работу.",
      },
    });

    return { ok: true as const, orderId: order.id };
  });
}

export async function applyOrderTransition(input: {
  orderId: string;
  itemId: string;
  fromOrder: OrderStatus;
  toOrder: OrderStatus;
  fromItem: ItemStatus;
  toItem: ItemStatus | null;
  closeReason?: CloseReason | null;
  actorId: string;
  comment: string;
  actualMaterialsKop?: number;
  actualMinutes?: number;
}) {
  return prisma.$transaction(async (tx) => {
    const orderUpdate = await tx.repairOrder.updateMany({
      where: { id: input.orderId, status: input.fromOrder },
      data: {
        status: input.toOrder,
        ...(input.actualMaterialsKop !== undefined
          ? { actualMaterialsKop: input.actualMaterialsKop }
          : {}),
        ...(input.actualMinutes !== undefined ? { actualMinutes: input.actualMinutes } : {}),
      },
    });
    if (orderUpdate.count !== 1) return false;

    if (input.toItem) {
      const itemUpdate = await tx.item.updateMany({
        where: { id: input.itemId, status: input.fromItem },
        data: {
          status: input.toItem,
          closeReason: input.closeReason ?? null,
        },
      });
      if (itemUpdate.count !== 1) {
        throw new Error("Статус предмета изменился параллельно");
      }
      await tx.statusEvent.create({
        data: {
          itemId: input.itemId,
          orderId: input.orderId,
          fromStatus: input.fromItem,
          toStatus: input.toItem,
          actorId: input.actorId,
          comment: input.comment,
        },
      });
    } else {
      await tx.statusEvent.create({
        data: {
          itemId: input.itemId,
          orderId: input.orderId,
          fromStatus: input.fromItem,
          toStatus: input.fromItem,
          actorId: input.actorId,
          comment: input.comment,
        },
      });
    }

    return true;
  });
}

export async function applyItemOnlyTransition(input: {
  itemId: string;
  orderId: string;
  fromItem: ItemStatus;
  toItem: ItemStatus;
  actorId: string;
  comment: string;
}) {
  return prisma.$transaction(async (tx) => {
    const updated = await tx.item.updateMany({
      where: { id: input.itemId, status: input.fromItem },
      data: { status: input.toItem },
    });
    if (updated.count !== 1) return false;
    await tx.statusEvent.create({
      data: {
        itemId: input.itemId,
        orderId: input.orderId,
        fromStatus: input.fromItem,
        toStatus: input.toItem,
        actorId: input.actorId,
        comment: input.comment,
      },
    });
    return true;
  });
}
