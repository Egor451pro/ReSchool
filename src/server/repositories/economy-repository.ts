import "server-only";

import type { ScenarioKind } from "@prisma/client";
import { prisma } from "@/server/db";

const assumptionSelect = {
  id: true,
  kind: true,
  title: true,
  shownOnDashboard: true,
  expectedListedPerYear: true,
  avgNewPriceKop: true,
  avgMaterialsKop: true,
  avgDisposalKop: true,
  defaultTransportKop: true,
  practiceConsumableKop: true,
  substitutionMilli: true,
  completionMilli: true,
  hostingKopAnnual: true,
  supportKopAnnual: true,
  illustrativeLaborKopHour: true,
  basisNote: true,
} as const;

export function listAssumptionSets() {
  return prisma.assumptionSet.findMany({
    orderBy: { kind: "asc" },
    select: assumptionSelect,
  });
}

export function findAssumptionByKind(kind: ScenarioKind) {
  return prisma.assumptionSet.findUnique({
    where: { kind },
    select: assumptionSelect,
  });
}

export function findDashboardAssumption() {
  return prisma.assumptionSet.findFirst({
    where: { shownOnDashboard: true },
    select: assumptionSelect,
  });
}

export function listDistrictSnapshots(district: string | null) {
  return prisma.economySnapshot.findMany({
    where: district
      ? { order: { item: { institution: { district } } } }
      : {},
    orderBy: { computedAt: "desc" },
    select: {
      id: true,
      newPriceKop: true,
      materialsKop: true,
      transportKop: true,
      procurementSavingKop: true,
      avoidedDisposalKop: true,
      propertyBudgetKop: true,
      practiceSavingKop: true,
      computedAt: true,
      order: {
        select: {
          actualMinutes: true,
          item: {
            select: {
              id: true,
              quantity: true,
              title: true,
              institution: { select: { id: true, name: true, district: true } },
            },
          },
        },
      },
    },
  });
}

export function districtOverview(district: string | null) {
  const institutionWhere = district ? { district } : {};
  return Promise.all([
    prisma.institution.count({ where: institutionWhere }),
    prisma.item.count({ where: { institution: institutionWhere } }),
    prisma.item.count({
      where: {
        institution: institutionWhere,
        status: "CLOSED",
        closeReason: "COMPLETED",
      },
    }),
    prisma.repairOrder.count({
      where: {
        status: { in: ["ASSIGNED", "IN_PROGRESS", "QUALITY_CHECK"] },
        item: { institution: institutionWhere },
      },
    }),
  ]);
}

export async function updateAssumptionSet(input: {
  kind: ScenarioKind;
  shownOnDashboard: boolean;
  expectedListedPerYear: number;
  avgNewPriceKop: number;
  avgMaterialsKop: number;
  defaultTransportKop: number;
  practiceConsumableKop: number;
  substitutionMilli: number;
  completionMilli: number;
  hostingKopAnnual: number;
  supportKopAnnual: number;
  illustrativeLaborKopHour: number;
  basisNote: string;
}) {
  return prisma.$transaction(async (tx) => {
    if (input.shownOnDashboard) {
      await tx.assumptionSet.updateMany({
        data: { shownOnDashboard: false },
      });
    }

    return tx.assumptionSet.update({
      where: { kind: input.kind },
      data: {
        shownOnDashboard: input.shownOnDashboard,
        expectedListedPerYear: input.expectedListedPerYear,
        avgNewPriceKop: input.avgNewPriceKop,
        avgMaterialsKop: input.avgMaterialsKop,
        defaultTransportKop: input.defaultTransportKop,
        practiceConsumableKop: input.practiceConsumableKop,
        substitutionMilli: input.substitutionMilli,
        completionMilli: input.completionMilli,
        hostingKopAnnual: input.hostingKopAnnual,
        supportKopAnnual: input.supportKopAnnual,
        illustrativeLaborKopHour: input.illustrativeLaborKopHour,
        basisNote: input.basisNote,
      },
      select: assumptionSelect,
    });
  });
}

export function findCloseableOrder(orderId: string) {
  return prisma.repairOrder.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      status: true,
      masterId: true,
      workshopInstitutionId: true,
      actualMaterialsKop: true,
      transportKop: true,
      actualMinutes: true,
      item: {
        select: {
          id: true,
          status: true,
          quantity: true,
          newUnitPriceKop: true,
          categoryId: true,
        },
      },
    },
  });
}

export async function closeOrderWithSnapshot(input: {
  orderId: string;
  itemId: string;
  actorId: string;
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
    const existing = await tx.economySnapshot.findUnique({
      where: { orderId: input.orderId },
      select: { id: true },
    });
    if (existing) return { ok: false as const, reason: "snapshot" as const };

    const itemUpdate = await tx.item.updateMany({
      where: { id: input.itemId, status: "DELIVERED" },
      data: { status: "CLOSED", closeReason: "COMPLETED" },
    });
    if (itemUpdate.count !== 1) return { ok: false as const, reason: "locked" as const };

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
        comment: "Заказ закрыт, экономия зафиксирована снимком.",
      },
    });

    return { ok: true as const };
  });
}

export function findDisposalRate(assumptionId: string, categoryId: string) {
  return prisma.disposalRate.findUnique({
    where: {
      assumptionId_categoryId: { assumptionId, categoryId },
    },
    select: { perUnitKop: true },
  });
}
