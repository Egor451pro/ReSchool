import "server-only";

import type {
  CloseReason,
  ItemStatus,
  OrderStatus,
  PriceOfferSide,
  Prisma,
} from "@prisma/client";
import { prisma } from "@/server/db";
import {
  priceAcceptedChatBody,
  priceOfferChatBody,
} from "@/domain/orders/price-deal";

const exchangeSelect = {
  id: true,
  title: true,
  condition: true,
  quantity: true,
  newUnitPriceKop: true,
  repairBudgetKop: true,
  categoryId: true,
  category: {
    select: {
      id: true,
      name: true,
      slug: true,
      specialties: {
        select: { specialtyId: true, specialty: { select: { id: true, name: true } } },
      },
    },
  },
  institution: { select: { id: true, name: true, district: true, lat: true, lng: true } },
  photos: { orderBy: { sort: "asc" as const }, take: 1, select: { id: true, path: true } },
} satisfies Prisma.ItemSelect;

const priceOfferSelect = {
  id: true,
  amountKop: true,
  side: true,
  status: true,
  createdAt: true,
  actorId: true,
  actor: { select: { id: true, fullName: true, role: true } },
} satisfies Prisma.PriceOfferSelect;

const orderCardSelect = {
  id: true,
  status: true,
  plannedMaterialsKop: true,
  actualMaterialsKop: true,
  transportKop: true,
  plannedMinutes: true,
  actualMinutes: true,
  agreedFeeKop: true,
  openOfferKop: true,
  openOfferSide: true,
  schoolAcceptedAt: true,
  dueDate: true,
  createdAt: true,
  masterId: true,
  item: {
    select: {
      id: true,
      title: true,
      status: true,
      condition: true,
      quantity: true,
      newUnitPriceKop: true,
      repairBudgetKop: true,
      institutionId: true,
      institution: { select: { id: true, name: true, district: true } },
      photos: { orderBy: { sort: "asc" as const }, take: 1, select: { id: true, path: true } },
    },
  },
  documents: {
    orderBy: { createdAt: "asc" as const },
    select: { id: true, type: true, number: true, createdAt: true },
  },
  priceOffers: {
    orderBy: { createdAt: "asc" as const },
    select: priceOfferSelect,
  },
} satisfies Prisma.RepairOrderSelect;

/** Свободные объявления биржи (с пагинацией). LISTED = нет активного заказа. */
export function listExchangeItems(options?: { take?: number; skip?: number }) {
  const take = Math.min(Math.max(options?.take ?? 48, 1), 100);
  const skip = Math.max(options?.skip ?? 0, 0);
  return prisma.item.findMany({
    where: {
      status: "LISTED",
      condition: "REPAIRABLE",
    },
    orderBy: { createdAt: "desc" },
    take,
    skip,
    select: exchangeSelect,
  });
}

export function listMasterOrders(masterId: string) {
  return prisma.repairOrder.findMany({
    where: { masterId },
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    select: orderCardSelect,
  });
}

const ORDERS_TAKE = 50;

function clampOrdersTake(value: number | undefined) {
  return Math.min(Math.max(value ?? ORDERS_TAKE, 1), 100);
}

/** Активные заказы фрилансера (ещё не ушли в историю). */
export function listMasterActiveOrders(
  masterId: string,
  options?: { take?: number; skip?: number },
) {
  return prisma.repairOrder.findMany({
    where: {
      masterId,
      status: { not: "CANCELLED" },
      OR: [
        { status: { in: ["ASSIGNED", "IN_PROGRESS", "QUALITY_CHECK"] } },
        { status: "COMPLETED", item: { status: "READY" } },
      ],
    },
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    take: clampOrdersTake(options?.take),
    skip: Math.max(options?.skip ?? 0, 0),
    select: orderCardSelect,
  });
}

/** История выполненных заказов фрилансера — как у завхоза. */
export function listFreelancerRepairHistory(
  masterId: string,
  options?: { take?: number; skip?: number },
) {
  return prisma.repairOrder.findMany({
    where: {
      masterId,
      item: {
        OR: [
          { status: "CLOSED", closeReason: { in: ["COMPLETED", "UNREPAIRABLE"] } },
          { status: "DISPOSED" },
        ],
      },
    },
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    take: clampOrdersTake(options?.take),
    skip: Math.max(options?.skip ?? 0, 0),
    select: {
      id: true,
      agreedFeeKop: true,
      updatedAt: true,
      item: {
        select: {
          id: true,
          title: true,
          condition: true,
          status: true,
          closeReason: true,
          quantity: true,
          newUnitPriceKop: true,
          category: { select: { name: true, slug: true } },
          institution: { select: { name: true, district: true } },
          photos: {
            orderBy: { sort: "asc" as const },
            take: 1,
            select: { id: true, path: true },
          },
        },
      },
    },
  });
}

export function findOrderForMaster(orderId: string) {
  return prisma.repairOrder.findUnique({
    where: { id: orderId },
    select: {
      ...orderCardSelect,
      itemId: true,
    },
  });
}

export function findOrderDetail(orderId: string) {
  return prisma.repairOrder.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      status: true,
      plannedMaterialsKop: true,
      actualMaterialsKop: true,
      transportKop: true,
      plannedMinutes: true,
      actualMinutes: true,
      agreedFeeKop: true,
      openOfferKop: true,
      openOfferSide: true,
      schoolAcceptedAt: true,
      dueDate: true,
      createdAt: true,
      masterId: true,
      itemId: true,
      master: {
        select: {
          id: true,
          fullName: true,
          role: true,
          address: true,
          lat: true,
          lng: true,
        },
      },
      item: {
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          condition: true,
          quantity: true,
          newUnitPriceKop: true,
          repairBudgetKop: true,
          institutionId: true,
          institution: {
            select: { id: true, name: true, district: true, address: true, lat: true, lng: true },
          },
          category: { select: { name: true } },
          photos: {
            orderBy: { sort: "asc" as const },
            take: 1,
            select: { id: true, path: true },
          },
        },
      },
      documents: {
        orderBy: { createdAt: "asc" as const },
        select: { id: true, type: true, number: true, createdAt: true },
      },
      priceOffers: {
        orderBy: { createdAt: "asc" as const },
        select: priceOfferSelect,
      },
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
      newUnitPriceKop: true,
      repairBudgetKop: true,
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

export function listFreelancerSpecialtyIds(userId: string) {
  return prisma.freelancerSkill
    .findMany({
      where: { userId },
      select: { specialtyId: true },
    })
    .then((rows) => rows.map((row) => row.specialtyId));
}

export async function claimItemOrder(input: {
  itemId: string;
  masterId: string;
  agreedFeeKop: number;
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
        masterId: input.masterId,
        agreedFeeKop: input.agreedFeeKop,
        openOfferKop: input.agreedFeeKop,
        openOfferSide: "FREELANCER",
        schoolAcceptedAt: null,
        status: "ASSIGNED",
        plannedMaterialsKop: input.plannedMaterialsKop,
        transportKop: input.transportKop,
        plannedMinutes: input.plannedMinutes,
        dueDate: input.dueDate,
      },
      select: { id: true },
    });

    await tx.priceOffer.create({
      data: {
        orderId: order.id,
        actorId: input.masterId,
        amountKop: input.agreedFeeKop,
        side: "FREELANCER",
        status: "OPEN",
      },
    });

    await tx.orderMessage.create({
      data: {
        orderId: order.id,
        authorId: input.masterId,
        body: priceOfferChatBody("FREELANCER", input.agreedFeeKop),
      },
    });

    await tx.statusEvent.create({
      data: {
        itemId: input.itemId,
        orderId: order.id,
        fromStatus: "LISTED",
        toStatus: "REQUESTED",
        actorId: input.masterId,
        comment: "Фрилансер открыл торг по цене. Ждём подтверждения или встречного предложения завхоза.",
      },
    });

    return { ok: true as const, orderId: order.id };
  });
}

/** Встречное предложение цены, пока заказ в ASSIGNED без schoolAcceptedAt. */
export async function proposePriceOnOrder(input: {
  orderId: string;
  actorId: string;
  side: PriceOfferSide;
  amountKop: number;
}) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.repairOrder.findFirst({
      where: {
        id: input.orderId,
        status: "ASSIGNED",
        schoolAcceptedAt: null,
      },
      select: {
        id: true,
        itemId: true,
        openOfferKop: true,
        item: { select: { status: true } },
      },
    });
    if (!order || order.item.status !== "REQUESTED") {
      return { ok: false as const, reason: "locked" as const };
    }
    if (order.openOfferKop === input.amountKop) {
      return { ok: false as const, reason: "same" as const };
    }

    await tx.priceOffer.updateMany({
      where: { orderId: order.id, status: "OPEN" },
      data: { status: "SUPERSEDED" },
    });

    await tx.priceOffer.create({
      data: {
        orderId: order.id,
        actorId: input.actorId,
        amountKop: input.amountKop,
        side: input.side,
        status: "OPEN",
      },
    });

    await tx.repairOrder.update({
      where: { id: order.id },
      data: {
        openOfferKop: input.amountKop,
        openOfferSide: input.side,
        // Пока торг идёт — agreedFeeKop зеркалит открытое предложение для списков.
        agreedFeeKop: input.amountKop,
      },
    });

    await tx.orderMessage.create({
      data: {
        orderId: order.id,
        authorId: input.actorId,
        body: priceOfferChatBody(input.side, input.amountKop),
      },
    });

    await tx.statusEvent.create({
      data: {
        itemId: order.itemId,
        orderId: order.id,
        fromStatus: "REQUESTED",
        toStatus: "REQUESTED",
        actorId: input.actorId,
        comment: priceOfferChatBody(input.side, input.amountKop),
      },
    });

    return { ok: true as const, orderId: order.id, itemId: order.itemId };
  });
}

/** Завхоз подтверждает текущую открытую цену — заказ сразу «В работе». */
export async function acceptOrderBySchool(input: {
  orderId: string;
  itemId: string;
  actorId: string;
  institutionId: string;
}) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.repairOrder.findFirst({
      where: {
        id: input.orderId,
        itemId: input.itemId,
        status: "ASSIGNED",
        schoolAcceptedAt: null,
        item: { institutionId: input.institutionId, status: "REQUESTED" },
      },
      select: { id: true, openOfferKop: true },
    });
    if (!order) return { ok: false as const, reason: "locked" as const };
    if (!Number.isInteger(order.openOfferKop) || order.openOfferKop <= 0) {
      return { ok: false as const, reason: "no-offer" as const };
    }

    const feeKop = order.openOfferKop;

    const updated = await tx.repairOrder.updateMany({
      where: { id: order.id, status: "ASSIGNED", schoolAcceptedAt: null, openOfferKop: feeKop },
      data: {
        schoolAcceptedAt: new Date(),
        status: "IN_PROGRESS",
        agreedFeeKop: feeKop,
        openOfferKop: feeKop,
      },
    });
    if (updated.count !== 1) return { ok: false as const, reason: "locked" as const };

    await tx.priceOffer.updateMany({
      where: { orderId: order.id, status: "OPEN" },
      data: { status: "ACCEPTED" },
    });

    const itemUpdated = await tx.item.updateMany({
      where: { id: input.itemId, status: "REQUESTED" },
      data: {
        status: "IN_REPAIR",
        repairBudgetKop: feeKop,
      },
    });
    if (itemUpdated.count !== 1) return { ok: false as const, reason: "locked" as const };

    await tx.orderMessage.create({
      data: {
        orderId: order.id,
        authorId: input.actorId,
        body: priceAcceptedChatBody(feeKop),
      },
    });

    await tx.statusEvent.create({
      data: {
        itemId: input.itemId,
        orderId: order.id,
        fromStatus: "REQUESTED",
        toStatus: "IN_REPAIR",
        actorId: input.actorId,
        comment: "Завхоз подтвердил цену — ремонт в работе.",
      },
    });

    return { ok: true as const, orderId: order.id, agreedFeeKop: feeKop };
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
