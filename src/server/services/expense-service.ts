import "server-only";

import type { UserRole } from "@/domain/access/roles";
import { listInstitutionDisposalExpenses } from "@/server/repositories/disposal-repository";
import { listInstitutionExpenseSnapshots } from "@/server/repositories/economy-repository";

export type ExpenseActor = {
  id: string;
  role: UserRole;
  institutionId: string | null;
};

export type InstitutionSavingRow = {
  id: string;
  itemId: string;
  title: string;
  quantity: number;
  masterName: string;
  computedAt: Date;
  /** Стоимость новых вместо ремонта. */
  newPriceKop: number;
  /** Фактическая стоимость ремонта (материалы + транспорт + гонорар). */
  restorationKop: number;
  /** Экономия закупки по позиции. */
  procurementSavingKop: number;
  /** Избежанная утилизация. */
  avoidedDisposalKop: number;
  /** Вклад в бюджет имущества. */
  propertyBudgetKop: number;
};

export type InstitutionSavings = {
  repairedCount: number;
  /** Экономия закупки: стоимость новых − цена ремонта. */
  procurementSavingKop: number;
  /** Экономия бюджета имущества: закупка + избежанная утилизация. */
  propertyBudgetKop: number;
  /** Потрачено на ремонты (гонорары). */
  repairSpentKop: number;
  /** Потрачено на сдачу лома фрилансеру. */
  disposalSpentKop: number;
  /** Теоретический итог: экономия имущества минус плата за утиль. */
  netSavingKop: number;
  rows: InstitutionSavingRow[];
};

export type InstitutionExpenseRow = {
  id: string;
  itemId: string;
  title: string;
  quantity: number;
  masterName: string;
  kind: "REPAIR" | "DISPOSAL";
  /** Сумма расхода школы (ремонт или плата за сдачу). */
  amountKop: number;
  newPriceKop: number;
  computedAt: Date;
};

export async function loadInstitutionExpenses(actor: ExpenseActor): Promise<{
  rows: InstitutionExpenseRow[];
  totalKop: number;
  repairTotalKop: number;
  disposalTotalKop: number;
} | null> {
  if (actor.role !== "DONOR_STAFF" || !actor.institutionId) return null;

  const [snapshots, disposals] = await Promise.all([
    listInstitutionExpenseSnapshots(actor.institutionId),
    listInstitutionDisposalExpenses(actor.institutionId),
  ]);

  const repairRows: InstitutionExpenseRow[] = snapshots.map((row) => {
    const amountKop = Math.round(Number(row.freelancerFeeKop) || 0);
    const newPriceKop = Math.round(Number(row.newPriceKop) || 0);
    return {
      id: `repair-${row.id}`,
      itemId: row.order.item.id,
      title: row.order.item.title,
      quantity: row.order.item.quantity,
      masterName: row.order.master.fullName,
      kind: "REPAIR",
      amountKop,
      newPriceKop,
      computedAt: row.computedAt,
    };
  });

  const disposalRows: InstitutionExpenseRow[] = disposals.map((row) => ({
    id: `disposal-${row.id}`,
    itemId: row.item.id,
    title: row.item.title,
    quantity: row.item.quantity,
    masterName: row.freelancer?.fullName ?? "Фрилансер",
    kind: "DISPOSAL",
    amountKop: Math.round(Number(row.feeKop) || 0),
    newPriceKop: Math.round(Number(row.item.newUnitPriceKop) * row.item.quantity) || 0,
    computedAt: row.confirmedAt ?? row.updatedAt,
  }));

  const rows = [...repairRows, ...disposalRows].sort(
    (left, right) => right.computedAt.getTime() - left.computedAt.getTime(),
  );

  const repairTotalKop = repairRows.reduce((sum, row) => sum + row.amountKop, 0);
  const disposalTotalKop = disposalRows.reduce((sum, row) => sum + row.amountKop, 0);

  return {
    rows,
    totalKop: repairTotalKop + disposalTotalKop,
    repairTotalKop,
    disposalTotalKop,
  };
}

/** Теоретическая экономия школы по подтверждённым ремонтам. */
export async function loadInstitutionSavings(
  actor: ExpenseActor,
): Promise<InstitutionSavings | null> {
  if (actor.role !== "DONOR_STAFF" || !actor.institutionId) return null;

  const [snapshots, disposals] = await Promise.all([
    listInstitutionExpenseSnapshots(actor.institutionId),
    listInstitutionDisposalExpenses(actor.institutionId),
  ]);

  const rows: InstitutionSavingRow[] = snapshots.map((row) => {
    const materialsKop = Math.round(Number(row.materialsKop) || 0);
    const transportKop = Math.round(Number(row.transportKop) || 0);
    const freelancerFeeKop = Math.round(Number(row.freelancerFeeKop) || 0);
    return {
      id: row.id,
      itemId: row.order.item.id,
      title: row.order.item.title,
      quantity: row.order.item.quantity,
      masterName: row.order.master.fullName,
      computedAt: row.computedAt,
      newPriceKop: Math.round(Number(row.newPriceKop) || 0),
      restorationKop: materialsKop + transportKop + freelancerFeeKop,
      procurementSavingKop: Math.round(Number(row.procurementSavingKop) || 0),
      avoidedDisposalKop: Math.round(Number(row.avoidedDisposalKop) || 0),
      propertyBudgetKop: Math.round(Number(row.propertyBudgetKop) || 0),
    };
  });

  const procurementSavingKop = rows.reduce((sum, row) => sum + row.procurementSavingKop, 0);
  const propertyBudgetKop = rows.reduce((sum, row) => sum + row.propertyBudgetKop, 0);
  const repairSpentKop = snapshots.reduce(
    (sum, row) => sum + Math.round(Number(row.freelancerFeeKop) || 0),
    0,
  );
  const disposalSpentKop = disposals.reduce(
    (sum, row) => sum + Math.round(Number(row.feeKop) || 0),
    0,
  );

  return {
    repairedCount: rows.length,
    procurementSavingKop,
    propertyBudgetKop,
    repairSpentKop,
    disposalSpentKop,
    netSavingKop: propertyBudgetKop - disposalSpentKop,
    rows,
  };
}
