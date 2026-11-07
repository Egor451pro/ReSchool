import type { UserRole } from "@/domain/access/roles";

export type ItemActor = {
  id: string;
  role: UserRole;
  institutionId: string | null;
};

/** Публикует заявки только завхоз своего учреждения. */
export function canPublishItems(actor: ItemActor): boolean {
  return actor.role === "DONOR_STAFF" && actor.institutionId !== null;
}

export function itemManageState(
  actor: ItemActor,
  item: { institutionId: string; status: string },
): "edit" | "locked" | "foreign" {
  // Править может только завхоз своего учреждения — не админ (у него нет /cabinet edit).
  if (actor.role === "DONOR_STAFF" && actor.institutionId === item.institutionId) {
    return item.status === "LISTED" ? "edit" : "locked";
  }
  if (actor.role === "PLATFORM_ADMIN") {
    return "locked";
  }
  return "foreign";
}

/** Стартовый бюджет — только пока карточка свободна; дальше цена через панель сделки. */
export function canUpdateRepairBudget(
  actor: ItemActor,
  item: { institutionId: string; status: string },
): boolean {
  if (actor.role !== "DONOR_STAFF" || actor.institutionId !== item.institutionId) {
    return false;
  }
  return item.status === "LISTED";
}

export function canManageDisposal(
  actor: ItemActor,
  item: { institutionId: string; status: string },
): boolean {
  return (
    actor.role === "DONOR_STAFF" &&
    actor.institutionId === item.institutionId &&
    item.status === "DISPOSAL_PENDING"
  );
}
