import "server-only";

import { unstable_cache } from "next/cache";
import type { ItemCondition, Prisma } from "@prisma/client";
import type { CatalogQuery } from "@/domain/items/filters";
import { prisma } from "@/server/db";

const CATALOG_TAKE = 48;
const CABINET_TAKE = 50;

const tileSelect = {
  id: true,
  title: true,
  condition: true,
  status: true,
  quantity: true,
  newUnitPriceKop: true,
  repairBudgetKop: true,
  category: { select: { name: true, slug: true } },
  institution: { select: { name: true, district: true } },
  photos: { orderBy: { sort: "asc" as const }, take: 1, select: { id: true, path: true } },
} satisfies Prisma.ItemSelect;

function clampTake(value: number | undefined, fallback: number, max: number) {
  return Math.min(Math.max(value ?? fallback, 1), max);
}

const loadCategories = unstable_cache(
  async () =>
    prisma.category.findMany({
      select: { id: true, slug: true, name: true },
    }),
  ["catalog-meta-categories"],
  { revalidate: 3600, tags: ["catalog-meta"] },
);

export function listCategories() {
  return loadCategories();
}

export function findCategoryById(id: string) {
  return prisma.category.findUnique({
    where: { id },
    select: { id: true, slug: true, name: true },
  });
}

export function listCatalogItems(
  query: CatalogQuery,
  options?: { take?: number; skip?: number },
) {
  const where: Prisma.ItemWhereInput = {};
  if (query.district) where.institution = { district: query.district };
  if (query.category) where.category = { slug: query.category };
  if (query.condition) where.condition = query.condition;
  // В каталоге только свободные объявления — взятые в работу скрыты.
  where.status = "LISTED";

  return prisma.item.findMany({
    where,
    orderBy: [{ createdAt: "desc" }, { title: "asc" }],
    take: clampTake(options?.take, CATALOG_TAKE, 100),
    skip: Math.max(options?.skip ?? 0, 0),
    select: tileSelect,
  });
}

/** Активные карточки школы: ещё не ушли в историю. */
export function listInstitutionActiveItems(
  institutionId: string,
  options?: { take?: number; skip?: number },
) {
  return prisma.item.findMany({
    where: { institutionId, status: { notIn: ["CLOSED", "DISPOSED"] } },
    orderBy: [{ createdAt: "desc" }, { title: "asc" }],
    take: clampTake(options?.take, CABINET_TAKE, 100),
    skip: Math.max(options?.skip ?? 0, 0),
    select: {
      ...tileSelect,
      orders: {
        where: { status: { not: "CANCELLED" } },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          id: true,
          status: true,
          agreedFeeKop: true,
          openOfferKop: true,
          schoolAcceptedAt: true,
          master: { select: { fullName: true } },
        },
      },
    },
  });
}

/** История подтверждённых ремонтов (снятые вручную сюда не попадают). */
export function listInstitutionRepairHistory(
  institutionId: string,
  options?: { take?: number; skip?: number },
) {
  return prisma.item.findMany({
    where: {
      institutionId,
      OR: [
        { status: "CLOSED", closeReason: { in: ["COMPLETED", "UNREPAIRABLE"] } },
        { status: "DISPOSED" },
      ],
    },
    orderBy: [{ updatedAt: "desc" }, { title: "asc" }],
    take: clampTake(options?.take, CABINET_TAKE, 100),
    skip: Math.max(options?.skip ?? 0, 0),
    select: {
      ...tileSelect,
      closeReason: true,
      updatedAt: true,
    },
  });
}

export function listInstitutionItems(institutionId: string) {
  return prisma.item.findMany({
    where: { institutionId },
    orderBy: [{ createdAt: "desc" }, { title: "asc" }],
    select: tileSelect,
  });
}

export function findConfirmableOrderForItem(itemId: string) {
  return prisma.repairOrder.findFirst({
    where: {
      itemId,
      status: "COMPLETED",
      item: { status: "READY" },
    },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      status: true,
      masterId: true,
      agreedFeeKop: true,
      actualMaterialsKop: true,
      transportKop: true,
      item: {
        select: {
          id: true,
          title: true,
          status: true,
          quantity: true,
          newUnitPriceKop: true,
          categoryId: true,
          institutionId: true,
          institution: { select: { id: true, name: true } },
        },
      },
    },
  });
}

export async function findItemCard(id: string) {
  const item = await prisma.item.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      description: true,
      condition: true,
      status: true,
      closeReason: true,
      quantity: true,
      year: true,
      newUnitPriceKop: true,
      repairBudgetKop: true,
      institutionId: true,
      createdAt: true,
      category: { select: { id: true, slug: true, name: true } },
      institution: {
        select: { name: true, district: true, address: true, lat: true, lng: true },
      },
      listedBy: { select: { id: true, fullName: true, role: true } },
      photos: {
        orderBy: { sort: "asc" },
        take: 8,
        select: { id: true, path: true, sort: true },
      },
      orders: {
        where: { status: { not: "CANCELLED" } },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          id: true,
          status: true,
          agreedFeeKop: true,
          openOfferKop: true,
          openOfferSide: true,
          schoolAcceptedAt: true,
          masterId: true,
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
          documents: {
            orderBy: { createdAt: "asc" },
            select: { id: true, type: true, number: true, createdAt: true },
          },
          priceOffers: {
            orderBy: { createdAt: "asc" },
            take: 40,
            select: {
              id: true,
              amountKop: true,
              side: true,
              status: true,
              createdAt: true,
              actorId: true,
              actor: { select: { id: true, fullName: true, role: true } },
            },
          },
        },
      },
      events: {
        orderBy: { createdAt: "desc" },
        take: 30,
        select: {
          id: true,
          fromStatus: true,
          toStatus: true,
          comment: true,
          createdAt: true,
          actor: { select: { role: true } },
        },
      },
    },
  });
  if (!item) return null;
  return { ...item, events: [...item.events].reverse() };
}

export function findItemForEdit(id: string) {
  return prisma.item.findUnique({
    where: { id },
    select: {
      id: true,
      institutionId: true,
      status: true,
      title: true,
      description: true,
      condition: true,
      quantity: true,
      year: true,
      newUnitPriceKop: true,
      repairBudgetKop: true,
      categoryId: true,
      photos: { orderBy: { sort: "asc" }, take: 1, select: { id: true, path: true } },
    },
  });
}

export function findPhotoFile(id: string) {
  return prisma.itemPhoto.findUnique({
    where: { id },
    select: { id: true, path: true },
  });
}

export function createListedItem(input: {
  institutionId: string;
  categoryId: string;
  title: string;
  description: string;
  condition: ItemCondition;
  quantity: number;
  year?: number;
  newUnitPriceKop: number;
  repairBudgetKop: number;
  listedById: string;
  photoPath: string;
}) {
  return prisma.item.create({
    data: {
      institutionId: input.institutionId,
      categoryId: input.categoryId,
      title: input.title,
      description: input.description,
      condition: input.condition,
      status: "LISTED",
      quantity: input.quantity,
      year: input.year,
      newUnitPriceKop: input.newUnitPriceKop,
      repairBudgetKop: input.repairBudgetKop,
      listedById: input.listedById,
      photos: { create: { path: input.photoPath, sort: 0 } },
      events: {
        create: {
          fromStatus: "NONE",
          toStatus: "LISTED",
          actorId: input.listedById,
          comment: "Предмет опубликован учреждением.",
        },
      },
    },
    select: { id: true },
  });
}

export async function updateListedItem(input: {
  id: string;
  categoryId: string;
  title: string;
  description: string;
  condition: ItemCondition;
  quantity: number;
  year: number | null;
  newUnitPriceKop: number;
  repairBudgetKop: number;
  nextPhotoPath?: string;
  placeholderPath?: string;
}): Promise<{ updated: boolean; removedPhotoPaths: string[] }> {
  return prisma.$transaction(async (tx) => {
    const current = await tx.item.findUnique({
      where: { id: input.id },
      select: { status: true, photos: { select: { path: true } } },
    });
    if (!current || current.status !== "LISTED") {
      return { updated: false, removedPhotoPaths: [] };
    }

    await tx.item.update({
      where: { id: input.id },
      data: {
        categoryId: input.categoryId,
        title: input.title,
        description: input.description,
        condition: input.condition,
        quantity: input.quantity,
        year: input.year,
        newUnitPriceKop: input.newUnitPriceKop,
        repairBudgetKop: input.repairBudgetKop,
      },
    });

    if (input.nextPhotoPath) {
      await tx.itemPhoto.deleteMany({ where: { itemId: input.id } });
      await tx.itemPhoto.create({
        data: { itemId: input.id, path: input.nextPhotoPath, sort: 0 },
      });
      return { updated: true, removedPhotoPaths: current.photos.map((photo) => photo.path) };
    }

    if (input.placeholderPath) {
      await tx.itemPhoto.updateMany({
        where: { itemId: input.id, path: { startsWith: "/placeholders/" } },
        data: { path: input.placeholderPath },
      });
    }

    return { updated: true, removedPhotoPaths: [] };
  });
}

export async function withdrawListedItem(input: { id: string; actorId: string }) {
  return prisma.$transaction(async (tx) => {
    const orders = await tx.repairOrder.count({
      where: { itemId: input.id, status: { not: "CANCELLED" } },
    });
    if (orders > 0) return "has-order" as const;

    const updated = await tx.item.updateMany({
      where: { id: input.id, status: "LISTED" },
      data: { status: "CLOSED", closeReason: "WITHDRAWN" },
    });
    if (updated.count !== 1) return "locked" as const;

    await tx.statusEvent.create({
      data: {
        itemId: input.id,
        fromStatus: "LISTED",
        toStatus: "CLOSED",
        actorId: input.actorId,
        comment: "Завхоз снял предмет с публикации.",
      },
    });
    return "ok" as const;
  });
}

/** Полное удаление опубликованной карточки без активного заказа. */
export async function deleteListedItem(input: { id: string; institutionId: string }) {
  return prisma.$transaction(async (tx) => {
    const item = await tx.item.findFirst({
      where: { id: input.id, institutionId: input.institutionId, status: "LISTED" },
      select: {
        id: true,
        photos: { select: { path: true } },
      },
    });
    if (!item) return { ok: false as const, reason: "locked" as const };

    const orders = await tx.repairOrder.count({
      where: { itemId: item.id, status: { not: "CANCELLED" } },
    });
    if (orders > 0) return { ok: false as const, reason: "has-order" as const };

    await tx.request.updateMany({
      where: { matchedItemId: item.id },
      data: { matchedItemId: null },
    });
    await tx.statusEvent.deleteMany({ where: { itemId: item.id } });
    await tx.itemPhoto.deleteMany({ where: { itemId: item.id } });

    const cancelled = await tx.repairOrder.findMany({
      where: { itemId: item.id, status: "CANCELLED" },
      select: { id: true },
    });
    if (cancelled.length > 0) {
      const orderIds = cancelled.map((row) => row.id);
      await tx.document.deleteMany({ where: { orderId: { in: orderIds } } });
      await tx.repairOrder.deleteMany({ where: { id: { in: orderIds } } });
    }

    await tx.item.delete({ where: { id: item.id } });
    return { ok: true as const, photoPaths: item.photos.map((photo) => photo.path) };
  });
}

/** Меняет стартовый бюджет ремонта только пока карточка свободна (LISTED). */
export async function updateItemRepairBudget(input: {
  id: string;
  institutionId: string;
  repairBudgetKop: number;
}): Promise<{ ok: true } | { ok: false; reason: "not-found" | "locked" | "too-high" }> {
  return prisma.$transaction(async (tx) => {
    const item = await tx.item.findFirst({
      where: { id: input.id, institutionId: input.institutionId },
      select: {
        status: true,
        newUnitPriceKop: true,
        quantity: true,
      },
    });
    if (!item) return { ok: false, reason: "not-found" };
    if (item.status !== "LISTED") {
      return { ok: false, reason: "locked" };
    }

    const maxKop = item.newUnitPriceKop * item.quantity;
    if (input.repairBudgetKop > maxKop) return { ok: false, reason: "too-high" };

    await tx.item.update({
      where: { id: input.id },
      data: { repairBudgetKop: input.repairBudgetKop },
    });

    return { ok: true };
  });
}
