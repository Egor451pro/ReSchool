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
  slesarAnnualSalaryKop: true,
  zavhozBonusShareMilli: true,
  freelancerAvgFeeKop: true,
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

const SNAPSHOTS_TAKE = 200;

export function listDistrictSnapshots(
  district: string | null,
  options?: { take?: number },
) {
  return prisma.economySnapshot.findMany({
    where: district
      ? { order: { item: { institution: { district } } } }
      : {},
    orderBy: { computedAt: "desc" },
    take: Math.min(Math.max(options?.take ?? SNAPSHOTS_TAKE, 1), 500),
    select: {
      id: true,
      newPriceKop: true,
      materialsKop: true,
      transportKop: true,
      freelancerFeeKop: true,
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

/** Расходы учреждения по подтверждённым ремонтам (снимки экономии). */
export function listInstitutionExpenseSnapshots(
  institutionId: string,
  options?: { take?: number },
) {
  return prisma.economySnapshot.findMany({
    where: { order: { item: { institutionId } } },
    orderBy: { computedAt: "desc" },
    take: Math.min(Math.max(options?.take ?? SNAPSHOTS_TAKE, 1), 500),
    select: {
      id: true,
      newPriceKop: true,
      materialsKop: true,
      transportKop: true,
      freelancerFeeKop: true,
      procurementSavingKop: true,
      avoidedDisposalKop: true,
      propertyBudgetKop: true,
      computedAt: true,
      order: {
        select: {
          id: true,
          master: { select: { fullName: true } },
          item: {
            select: {
              id: true,
              title: true,
              quantity: true,
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
    prisma.item.count({
      where: {
        institution: institutionWhere,
        status: "DISPOSED",
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

export function findDisposalRate(assumptionId: string, categoryId: string) {
  return prisma.disposalRate.findUnique({
    where: {
      assumptionId_categoryId: { assumptionId, categoryId },
    },
    select: { perUnitKop: true },
  });
}
