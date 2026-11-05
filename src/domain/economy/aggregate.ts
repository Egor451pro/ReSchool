import type { SnapshotRow, SnapshotTotals } from "./types";

/** Сумма снимков, зафиксированных при закрытии заказов. Допущения задним числом не меняет. */
export function sumSnapshots(rows: SnapshotRow[]): SnapshotTotals {
  return rows.reduce<SnapshotTotals>(
    (totals, row) => ({
      orders: totals.orders + 1,
      procurementSavingKop: totals.procurementSavingKop + row.procurementSavingKop,
      avoidedDisposalKop: totals.avoidedDisposalKop + row.avoidedDisposalKop,
      propertyBudgetKop: totals.propertyBudgetKop + row.propertyBudgetKop,
      practiceSavingKop: totals.practiceSavingKop + row.practiceSavingKop,
      combinedKop:
        totals.combinedKop + row.propertyBudgetKop + row.practiceSavingKop,
      minutes: totals.minutes + row.minutes,
    }),
    {
      orders: 0,
      procurementSavingKop: 0,
      avoidedDisposalKop: 0,
      propertyBudgetKop: 0,
      practiceSavingKop: 0,
      combinedKop: 0,
      minutes: 0,
    },
  );
}
