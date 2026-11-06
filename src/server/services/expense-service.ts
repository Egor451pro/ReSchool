import "server-only";

import type { UserRole } from "@/domain/access/roles";
import { listInstitutionExpenseSnapshots } from "@/server/repositories/economy-repository";

export type ExpenseActor = {
  id: string;
  role: UserRole;
  institutionId: string | null;
};

export type InstitutionExpenseRow = {
  id: string;
  itemId: string;
  title: string;
  quantity: number;
  masterName: string;
  /** Согласованная цена ремонта (всё включено для школы). */
  repairPriceKop: number;
  newPriceKop: number;
  computedAt: Date;
};

export async function loadInstitutionExpenses(actor: ExpenseActor): Promise<{
  rows: InstitutionExpenseRow[];
  totalKop: number;
} | null> {
  if (actor.role !== "DONOR_STAFF" || !actor.institutionId) return null;

  const snapshots = await listInstitutionExpenseSnapshots(actor.institutionId);
  const rows = snapshots.map((row) => {
    const repairPriceKop = Math.round(Number(row.freelancerFeeKop) || 0);
    const newPriceKop = Math.round(Number(row.newPriceKop) || 0);
    return {
      id: row.id,
      itemId: row.order.item.id,
      title: row.order.item.title,
      quantity: row.order.item.quantity,
      masterName: row.order.master.fullName,
      repairPriceKop,
      newPriceKop,
      computedAt: row.computedAt,
    };
  });

  return {
    rows,
    totalKop: rows.reduce((sum, row) => sum + row.repairPriceKop, 0),
  };
}
