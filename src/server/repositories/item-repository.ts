import "server-only";

import type { ItemCondition, Prisma } from "@prisma/client";
import type { CatalogQuery } from "@/domain/items/filters";
import { prisma } from "@/server/db";

const tileSelect = {
  id: true,
  title: true,
  condition: true,
  status: true,
  quantity: true,
  newUnitPriceKop: true,
  category: { select: { name: true, slug: true } },
  institution: { select: { name: true, district: true } },
  photos: { orderBy: { sort: "asc" as const }, take: 1, select: { id: true, path: true } },
} satisfies Prisma.ItemSelect;

export function listCategories() {
  return prisma.category.findMany({
    select: { id: true, slug: true, name: true },
  });
}

export function findCategoryById(id: string) {
  return prisma.category.findUnique({
    where: { id },
    select: { id: true, slug: true, name: true },
  });
}

export function listCatalogItems(query: CatalogQuery) {
  const where: Prisma.ItemWhereInput = {};
  if (query.district) where.institution = { district: query.district };
  if (query.category) where.category = { slug: query.category };
  if (query.condition) where.condition = query.condition;
  if (query.status) where.status = query.status;

  return prisma.item.findMany({
    where,
    orderBy: [{ createdAt: "desc" }, { title: "asc" }],
    select: tileSelect,
  });
}

export function listInstitutionItems(institutionId: string) {
  return prisma.item.findMany({
    where: { institutionId },
    orderBy: [{ createdAt: "desc" }, { title: "asc" }],
    select: tileSelect,
  });
}

export function findItemCard(id: string) {
  return prisma.item.findUnique({
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
      institutionId: true,
      createdAt: true,
      category: { select: { id: true, slug: true, name: true } },
      institution: { select: { name: true, district: true, address: true } },
      listedBy: { select: { fullName: true } },
      photos: { orderBy: { sort: "asc" }, select: { id: true, path: true, sort: true } },
      events: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          fromStatus: true,
          toStatus: true,
          comment: true,
          createdAt: true,
          actor: { select: { fullName: true } },
        },
      },
    },
  });
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
        comment: "Учреждение сняло предмет с публикации.",
      },
    });
    return "ok" as const;
  });
}
