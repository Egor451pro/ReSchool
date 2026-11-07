import "server-only";

import type { ScenarioKind } from "@prisma/client";
import { calculateItemEconomy, projectYear, sumSnapshots } from "@/domain/economy";
import type { SnapshotTotals, YearProjection } from "@/domain/economy";
import type { UserRole } from "@/domain/access/roles";
import {
  districtOverview,
  findAssumptionByKind,
  listAssumptionSets,
  listDistrictSnapshots,
  updateAssumptionSet,
} from "@/server/repositories/economy-repository";

export type EconomyActor = {
  id: string;
  role: UserRole;
  institutionId: string | null;
};

export type AssumptionUpdateResult =
  | { ok: true }
  | { ok: false; error: string };

export type InstitutionSaving = {
  institutionId: string;
  name: string;
  propertyBudgetKop: number;
  orders: number;
};

export type DistrictDashboard = {
  districtLabel: string;
  overview: {
    institutions: number;
    items: number;
    completedClosed: number;
    activeOrders: number;
    disposed: number;
  };
  fact: SnapshotTotals;
  topInstitutions: InstitutionSaving[];
  scenarios: {
    kind: ScenarioKind;
    title: string;
    shownOnDashboard: boolean;
    projection: YearProjection;
    basisNote: string;
  }[];
  dashboardKind: ScenarioKind | null;
};

export type AdminRepairedItem = {
  itemId: string;
  title: string;
  quantity: number;
  institutionName: string;
  district: string;
  newPriceKop: number;
  costsKop: number;
  savingKop: number;
  computedAt: Date;
};

export type AdminEconomyOverview = {
  repairedCount: number;
  /** Сколько стоило бы купить всё новое. */
  newPriceTotalKop: number;
  /** Материалы + транспорт по закрытым ремонтам. */
  costsTotalKop: number;
  /** Экономия закупки: новые − затраты на ремонт. */
  savingTotalKop: number;
  items: AdminRepairedItem[];
};

function rankInstitutions(
  rows: Awaited<ReturnType<typeof listDistrictSnapshots>>,
): InstitutionSaving[] {
  const map = new Map<string, InstitutionSaving>();
  for (const row of rows) {
    const institution = row.order.item.institution;
    const current = map.get(institution.id) ?? {
      institutionId: institution.id,
      name: institution.name,
      propertyBudgetKop: 0,
      orders: 0,
    };
    current.propertyBudgetKop += row.propertyBudgetKop;
    current.orders += 1;
    map.set(institution.id, current);
  }
  return [...map.values()].sort((a, b) => b.propertyBudgetKop - a.propertyBudgetKop).slice(0, 5);
}

export async function loadDistrictDashboard(
  district: string | null,
): Promise<DistrictDashboard> {
  const [assumptions, snapshots, overviewCounts] = await Promise.all([
    listAssumptionSets(),
    listDistrictSnapshots(district),
    districtOverview(district),
  ]);

  const [institutions, items, completedClosed, activeOrders, disposed] = overviewCounts;
  const fact = sumSnapshots(
    snapshots.map((row) => ({
      procurementSavingKop: row.procurementSavingKop,
      avoidedDisposalKop: row.avoidedDisposalKop,
      propertyBudgetKop: row.propertyBudgetKop,
      practiceSavingKop: row.practiceSavingKop,
      freelancerFeeKop: row.freelancerFeeKop,
      minutes: row.order.actualMinutes,
    })),
  );

  const scenarios = assumptions.map((set) => ({
    kind: set.kind,
    title: set.title,
    shownOnDashboard: set.shownOnDashboard,
    basisNote: set.basisNote,
    projection: projectYear({
      expectedListedPerYear: set.expectedListedPerYear,
      avgNewPriceKop: set.avgNewPriceKop,
      avgMaterialsKop: set.avgMaterialsKop,
      avgDisposalKop: set.avgDisposalKop,
      defaultTransportKop: set.defaultTransportKop,
      freelancerAvgFeeKop: set.freelancerAvgFeeKop,
      practiceConsumableKop: set.practiceConsumableKop,
      substitutionMilli: set.substitutionMilli,
      completionMilli: set.completionMilli,
      hostingKopAnnual: set.hostingKopAnnual,
      supportKopAnnual: set.supportKopAnnual,
    }),
  }));

  const dashboard = assumptions.find((set) => set.shownOnDashboard) ?? null;

  return {
    districtLabel: district ?? "Все районы в базе",
    overview: { institutions, items, completedClosed, activeOrders, disposed },
    fact,
    topInstitutions: rankInstitutions(snapshots),
    scenarios,
    dashboardKind: dashboard?.kind ?? null,
  };
}

/** Сводка кабинета администратора: факт по подтверждённым ремонтам. */
export async function loadAdminEconomyOverview(): Promise<AdminEconomyOverview> {
  const snapshots = await listDistrictSnapshots(null);
  const items: AdminRepairedItem[] = snapshots.map((row) => {
    const costsKop = row.materialsKop + row.transportKop + row.freelancerFeeKop;
    return {
      itemId: row.order.item.id,
      title: row.order.item.title,
      quantity: row.order.item.quantity,
      institutionName: row.order.item.institution.name,
      district: row.order.item.institution.district,
      newPriceKop: row.newPriceKop,
      costsKop,
      savingKop: row.procurementSavingKop,
      computedAt: row.computedAt,
    };
  });

  return {
    repairedCount: items.length,
    newPriceTotalKop: items.reduce((sum, row) => sum + row.newPriceKop, 0),
    costsTotalKop: items.reduce((sum, row) => sum + row.costsKop, 0),
    savingTotalKop: items.reduce((sum, row) => sum + row.savingKop, 0),
    items,
  };
}

export function listEditableAssumptions() {
  return listAssumptionSets();
}

export async function saveAssumptionSet(
  actor: EconomyActor,
  input: {
    kind: ScenarioKind;
    shownOnDashboard: boolean;
    expectedListedPerYear: number;
    avgNewPriceKop: number;
    avgMaterialsKop: number;
    defaultTransportKop: number;
    completionMilli: number;
    hostingKopAnnual: number;
    supportKopAnnual: number;
  },
): Promise<AssumptionUpdateResult> {
  if (actor.role !== "DISTRICT_ANALYST" && actor.role !== "PLATFORM_ADMIN") {
    return { ok: false, error: "Менять допущения может аналитик или администратор" };
  }

  const existing = await findAssumptionByKind(input.kind);
  if (!existing) return { ok: false, error: "Сценарий не найден" };

  if (!input.shownOnDashboard && existing.shownOnDashboard) {
    return {
      ok: false,
      error: "Снимите галочку только после выбора другого сценария на дашборде",
    };
  }

  await updateAssumptionSet({
    kind: input.kind,
    shownOnDashboard: input.shownOnDashboard,
    expectedListedPerYear: input.expectedListedPerYear,
    avgNewPriceKop: input.avgNewPriceKop,
    avgMaterialsKop: input.avgMaterialsKop,
    defaultTransportKop: input.defaultTransportKop,
    practiceConsumableKop: existing.practiceConsumableKop,
    substitutionMilli: existing.substitutionMilli,
    completionMilli: input.completionMilli,
    hostingKopAnnual: input.hostingKopAnnual,
    supportKopAnnual: input.supportKopAnnual,
    illustrativeLaborKopHour: existing.illustrativeLaborKopHour,
    basisNote: existing.basisNote,
  });
  return { ok: true };
}

