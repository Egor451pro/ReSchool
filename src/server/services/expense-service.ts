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
  materialsKop: number;
  transportKop: number;
  freelancerFeeKop: number;
  totalKop: number;
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
    const totalKop = row.materialsKop + row.transportKop + row.freelancerFeeKop;
    return {
      id: row.id,
      itemId: row.order.item.id,
      title: row.order.item.title,
      quantity: row.order.item.quantity,
      masterName: row.order.master.fullName,
      materialsKop: row.materialsKop,
      transportKop: row.transportKop,
      freelancerFeeKop: row.freelancerFeeKop,
      totalKop,
      newPriceKop: row.newPriceKop,
      computedAt: row.computedAt,
    };
  });

  return {
    rows,
    totalKop: rows.reduce((sum, row) => sum + row.totalKop, 0),
  };
}
