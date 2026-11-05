import {
  PrismaClient,
  type CloseReason,
  type DocumentType,
  type ItemStatus,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import { calculateItemEconomy } from "../src/domain/economy/calculate";
import {
  assertItemTransition,
  type ItemStatus as DomainItemStatus,
} from "../src/domain/workflow/item-lifecycle";
import { assumptionSetSchema } from "../src/lib/validators/assumption";
import {
  DEMO_NOW,
  DEMO_PASSWORD,
  DISTRICT,
  assumptionSets,
  categories,
  categorySpecialtyLinks,
  disposalKop,
  groups,
  institutions,
  items,
  orders,
  requests,
  specialties,
  staff,
  students,
  type ItemSeed,
  type OrderSeed,
  type UserKey,
} from "./seed-data";

const prisma = new PrismaClient();
const PRACTICE_CONSUMABLE_KOP = 2_500;
const SUBSTITUTION_MILLI = 700;

function daysAgo(days: number): Date {
  return new Date(DEMO_NOW.getTime() - days * 24 * 60 * 60 * 1000);
}

function daysFromNow(days: number): Date {
  return new Date(DEMO_NOW.getTime() + days * 24 * 60 * 60 * 1000);
}

function must<T>(map: Map<string, T>, key: string): T {
  const value = map.get(key);
  if (value === undefined) {
    throw new Error(`В сиде нет ключа «${key}»`);
  }
  return value;
}

function statusPath(item: ItemSeed): ItemStatus[] {
  if (item.status === "CLOSED" && item.closeReason === "WITHDRAWN") {
    return ["LISTED", "CLOSED"];
  }
  if (item.status === "CLOSED" && item.closeReason === "UNREPAIRABLE") {
    return ["LISTED", "REQUESTED", "IN_REPAIR", "CLOSED"];
  }

  const full: ItemStatus[] = [
    "LISTED",
    "REQUESTED",
    "IN_REPAIR",
    "READY",
    "DELIVERED",
    "CLOSED",
  ];
  const index = full.indexOf(item.status);
  if (index < 0) throw new Error(`Неизвестный статус ${item.status}`);
  return full.slice(0, index + 1);
}

function commentFor(from: string, to: string, closeReason?: CloseReason): string {
  if (from === "NONE") return "Предмет опубликован учреждением.";
  if (to === "REQUESTED") return "Мастерская взяла предмет в работу.";
  if (to === "IN_REPAIR") return "Группа приступила к ремонту.";
  if (to === "READY") return "Мастер подтвердил качество.";
  if (to === "DELIVERED") return "Учреждение подтвердило получение. Акт — черновик.";
  if (to === "CLOSED" && closeReason === "COMPLETED") {
    return "Заказ закрыт, экономия зафиксирована снимком.";
  }
  if (to === "CLOSED" && closeReason === "WITHDRAWN") {
    return "Учреждение сняло предмет с публикации.";
  }
  if (to === "CLOSED" && closeReason === "UNREPAIRABLE") {
    return "Ремонт в рамках практики признан нецелесообразным.";
  }
  return "";
}

function needsTransfer(item: ItemSeed): boolean {
  return item.status === "DELIVERED" || (item.status === "CLOSED" && item.closeReason === "COMPLETED");
}

async function clearDatabase(): Promise<void> {
  await prisma.portfolioEntry.deleteMany();
  await prisma.economySnapshot.deleteMany();
  await prisma.transfer.deleteMany();
  await prisma.document.deleteMany();
  await prisma.orderParticipant.deleteMany();
  await prisma.statusEvent.deleteMany();
  await prisma.repairOrder.deleteMany();
  await prisma.request.deleteMany();
  await prisma.itemPhoto.deleteMany();
  await prisma.item.deleteMany();
  await prisma.user.updateMany({ data: { groupId: null } });
  await prisma.studyGroup.deleteMany();
  await prisma.disposalRate.deleteMany();
  await prisma.assumptionSet.deleteMany();
  await prisma.categorySpecialty.deleteMany();
  await prisma.category.deleteMany();
  await prisma.specialty.deleteMany();
  await prisma.user.deleteMany();
  await prisma.institution.deleteMany();
}

async function main(): Promise<void> {
  if (items.length !== 36) {
    throw new Error(`Ожидалось 36 предметов, в данных ${items.length}`);
  }
  if (new Set(items.map((item) => item.key)).size !== items.length) {
    throw new Error("Ключи предметов повторяются");
  }
  for (const order of orders) {
    if (!items.some((item) => item.key === order.item)) {
      throw new Error(`Заказ ссылается на неизвестный предмет ${order.item}`);
    }
  }

  const avgDisposalKop = Math.round(
    Object.values(disposalKop).reduce((sum, value) => sum + value, 0) /
      Object.values(disposalKop).length,
  );

  await clearDatabase();
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const institutionId = new Map<string, string>();
  for (const institution of institutions) {
    const created = await prisma.institution.create({
      data: {
        name: institution.name,
        type: institution.type,
        district: DISTRICT,
        address: institution.address,
        lat: institution.lat,
        lng: institution.lng,
        phone: institution.phone,
        email: institution.email,
      },
    });
    institutionId.set(institution.key, created.id);
  }

  const userId = new Map<string, string>();
  for (const person of staff) {
    const created = await prisma.user.create({
      data: {
        fullName: person.fullName,
        role: person.role,
        email: person.email,
        passwordHash,
        institutionId: person.institution ? must(institutionId, person.institution) : null,
      },
    });
    userId.set(person.key, created.id);
  }

  const categoryId = new Map<string, string>();
  for (const category of categories) {
    const created = await prisma.category.create({ data: category });
    categoryId.set(category.slug, created.id);
  }

  const specialtyId = new Map<string, string>();
  for (const specialty of specialties) {
    const created = await prisma.specialty.create({ data: specialty });
    specialtyId.set(specialty.slug, created.id);
  }

  for (const link of categorySpecialtyLinks) {
    await prisma.categorySpecialty.create({
      data: {
        categoryId: must(categoryId, link.category),
        specialtyId: must(specialtyId, link.specialty),
      },
    });
  }

  const assumptionId = new Map<string, string>();
  for (const set of assumptionSets) {
    const parsed = assumptionSetSchema.parse({ ...set, avgDisposalKop });
    const created = await prisma.assumptionSet.create({ data: parsed });
    assumptionId.set(parsed.kind, created.id);
    for (const [slug, perUnitKop] of Object.entries(disposalKop)) {
      await prisma.disposalRate.create({
        data: {
          assumptionId: created.id,
          categoryId: must(categoryId, slug),
          perUnitKop,
        },
      });
    }
  }

  const groupId = new Map<string, string>();
  for (const group of groups) {
    const created = await prisma.studyGroup.create({
      data: {
        name: group.name,
        institutionId: must(institutionId, group.institution),
        specialtyId: must(specialtyId, group.specialty),
        masterId: must(userId, group.master),
      },
    });
    groupId.set(group.key, created.id);
  }

  for (const student of students) {
    const created = await prisma.user.create({
      data: {
        fullName: student.fullName,
        role: "STUDENT",
        email: student.email,
        passwordHash,
        institutionId: must(institutionId, student.institution),
        groupId: must(groupId, student.group),
      },
    });
    userId.set(student.key, created.id);
  }

  let documentSerial = 1;
  const baseAssumptionId = must(assumptionId, "BASE");

  for (const item of items) {
    const order = orders.find((entry) => entry.item === item.key);
    const path = statusPath(item);
    const spanDays = (path.length - 1) * 2;
    if (item.publishedDaysAgo < spanDays) {
      throw new Error(`У «${item.title}» история уходит в будущее`);
    }
    if ((item.status === "CLOSED") !== Boolean(item.closeReason)) {
      throw new Error(`У «${item.title}» причина закрытия не сходится со статусом`);
    }
    if (order && item.condition === "SCRAP") {
      throw new Error(`Лом «${item.title}» не должен иметь заказ`);
    }

    const events = path.map((to, index) => {
      const from = index === 0 ? "NONE" : path[index - 1];
      const closeReason = to === "CLOSED" ? item.closeReason : undefined;
      if (from !== "NONE") {
        assertItemTransition(from as DomainItemStatus, to, closeReason);
      }
      return {
        from,
        to,
        closeReason,
        createdAt: daysAgo(item.publishedDaysAgo - index * 2),
      };
    });

    const createdItem = await prisma.item.create({
      data: {
        institutionId: must(institutionId, item.owner),
        categoryId: must(categoryId, item.category),
        title: item.title,
        description: item.description,
        condition: item.condition,
        status: item.status,
        closeReason: item.closeReason,
        quantity: item.quantity,
        year: item.year,
        newUnitPriceKop: item.newUnitPriceKop,
        listedById: must(userId, item.listedBy),
        createdAt: events[0].createdAt,
        photos: {
          create: { path: `/placeholders/${item.category}.svg`, sort: 0 },
        },
      },
    });

    const createdOrder = order
      ? await createOrder(order, createdItem.id, userId, institutionId, specialtyId, groupId)
      : null;

    if (createdOrder && needsTransfer(item)) {
      const recipient = order?.recipient ?? item.owner;
      const documentType: DocumentType = recipient === item.owner ? "RETURN_ACT" : "TRANSFER_ACT";
      await createAct({
        type: documentType,
        serial: documentSerial++,
        orderId: createdOrder.id,
        item,
        order: order!,
        fromId: must(institutionId, item.owner),
        toId: must(institutionId, recipient),
        itemId: createdItem.id,
        transferredAt: events[events.length - 1].createdAt,
      });
    }

    if (createdOrder && item.closeReason === "UNREPAIRABLE") {
      await prisma.document.create({
        data: {
          type: "WRITE_OFF_DRAFT",
          number: actNumber(documentSerial++),
          orderId: createdOrder.id,
          payload: JSON.stringify({
            watermark: "ЧЕРНОВИК. Не заменяет решение комиссии по списанию.",
            title: item.title,
            reason: "Ремонт в рамках практики признан нецелесообразным.",
            synthetic: true,
          }),
        },
      });
    }

    if (createdOrder && item.closeReason === "COMPLETED" && order) {
      const economy = calculateItemEconomy({
        quantity: item.quantity,
        newUnitPriceKop: item.newUnitPriceKop,
        materialsKop: order.actualMaterialsKop,
        transportKop: order.transportKop,
        disposalPerUnitKop: disposalKop[item.category],
        practiceConsumableKop: PRACTICE_CONSUMABLE_KOP,
        substitutionMilli: SUBSTITUTION_MILLI,
      });
      await prisma.economySnapshot.create({
        data: {
          orderId: createdOrder.id,
          assumptionId: baseAssumptionId,
          newPriceKop: economy.newPriceKop,
          materialsKop: order.actualMaterialsKop,
          transportKop: order.transportKop,
          procurementSavingKop: economy.procurementSavingKop,
          avoidedDisposalKop: economy.avoidedDisposalKop,
          propertyBudgetKop: economy.propertyBudgetKop,
          practiceSavingKop: economy.practiceSavingKop,
          computedAt: events[events.length - 1].createdAt,
        },
      });

      for (const entry of order.portfolio ?? []) {
        await prisma.portfolioEntry.create({
          data: {
            studentId: must(userId, entry.student),
            orderId: createdOrder.id,
            skills: entry.skills,
            grade: entry.grade,
            minutes: entry.minutes,
            masterComment: entry.comment,
            createdAt: events[events.length - 1].createdAt,
          },
        });
      }
    }

    for (const event of events) {
      const actor = actorFor(event.from, event.to, item, order);
      await prisma.statusEvent.create({
        data: {
          itemId: createdItem.id,
          orderId: event.from === "NONE" ? null : createdOrder?.id,
          fromStatus: event.from,
          toStatus: event.to,
          actorId: must(userId, actor),
          comment: commentFor(event.from, event.to, event.closeReason),
          createdAt: event.createdAt,
        },
      });
    }
  }

  for (const request of requests) {
    await prisma.request.create({
      data: {
        institutionId: must(institutionId, request.owner),
        categoryId: must(categoryId, request.category),
        title: request.title,
        description: request.description,
        quantity: request.quantity,
        status: "OPEN",
      },
    });
  }

  const [itemCount, orderCount, snapshotCount, portfolioCount] = await Promise.all([
    prisma.item.count(),
    prisma.repairOrder.count(),
    prisma.economySnapshot.count(),
    prisma.portfolioEntry.count(),
  ]);
  const activeOrders = await prisma.repairOrder.groupBy({
    by: ["itemId"],
    where: { status: { not: "CANCELLED" } },
    _count: { _all: true },
  });
  if (activeOrders.some((row) => row._count._all > 1)) {
    throw new Error("У предмета больше одного активного заказа");
  }
  if (itemCount !== 36 || orderCount !== orders.length || snapshotCount !== 6) {
    throw new Error(
      `Сид собрался неполностью: предметы ${itemCount}, заказы ${orderCount}, снимки ${snapshotCount}`,
    );
  }

  console.log(
    `Сид готов: ${institutions.length} учреждений, ${itemCount} предметов, ${orderCount} заказов, ${snapshotCount} снимков экономии, ${portfolioCount} записей портфолио.`,
  );
  console.log(`Демо-пароль всех учёток: ${DEMO_PASSWORD}`);
}

function actorFor(from: string, to: string, item: ItemSeed, order?: OrderSeed): UserKey {
  const donorCloses = to === "CLOSED" && item.closeReason === "WITHDRAWN";
  if (from === "NONE" || to === "DELIVERED" || donorCloses) return item.listedBy;
  if (!order) throw new Error(`Для «${item.title}» не найден мастер перехода ${from} → ${to}`);
  return order.master;
}

function actNumber(serial: number): string {
  return `РС-2026-${String(serial).padStart(4, "0")}`;
}

async function createOrder(
  order: OrderSeed,
  itemId: string,
  userId: Map<string, string>,
  institutionId: Map<string, string>,
  specialtyId: Map<string, string>,
  groupId: Map<string, string>,
) {
  return prisma.repairOrder.create({
    data: {
      itemId,
      workshopInstitutionId: must(institutionId, order.workshop),
      specialtyId: must(specialtyId, order.specialty),
      masterId: must(userId, order.master),
      groupId: must(groupId, order.group),
      status: order.status,
      dueDate: daysFromNow(order.dueOffsetDays),
      plannedMaterialsKop: order.plannedMaterialsKop,
      actualMaterialsKop: order.actualMaterialsKop,
      transportKop: order.transportKop,
      plannedMinutes: order.plannedMinutes,
      actualMinutes: order.actualMinutes,
      participants: {
        create: order.participants.map((student) => ({
          studentId: must(userId, student),
        })),
      },
    },
  });
}

async function createAct(input: {
  type: DocumentType;
  serial: number;
  orderId: string;
  item: ItemSeed;
  order: OrderSeed;
  fromId: string;
  toId: string;
  itemId: string;
  transferredAt: Date;
}): Promise<void> {
  const document = await prisma.document.create({
    data: {
      type: input.type,
      number: actNumber(input.serial),
      orderId: input.orderId,
      payload: JSON.stringify({
        watermark: "ЧЕРНОВИК. Не заменяет решение комиссии по списанию.",
        title: input.item.title,
        quantity: input.item.quantity,
        materialsKop: input.order.actualMaterialsKop,
        transportKop: input.order.transportKop,
        synthetic: true,
      }),
    },
  });
  await prisma.transfer.create({
    data: {
      itemId: input.itemId,
      fromInstitutionId: input.fromId,
      toInstitutionId: input.toId,
      transferredAt: input.transferredAt,
      documentId: document.id,
    },
  });
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
