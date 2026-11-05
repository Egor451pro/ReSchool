import type { UserRole } from "@/domain/access/roles";

export type ItemActor = {
  id: string;
  role: UserRole;
  institutionId: string | null;
};

/** Школы и колледжи публикуют заявки от своего учреждения. */
export function canPublishItems(actor: ItemActor): boolean {
  return (
    (actor.role === "DONOR_STAFF" || actor.role === "WORKSHOP_MASTER") &&
    actor.institutionId !== null
  );
}

export function itemManageState(
  actor: ItemActor,
  item: { institutionId: string; status: string },
): "edit" | "locked" | "foreign" {
  const owns =
    actor.role === "PLATFORM_ADMIN" ||
    ((actor.role === "DONOR_STAFF" || actor.role === "WORKSHOP_MASTER") &&
      actor.institutionId === item.institutionId);
  if (!owns) return "foreign";
  if (item.status !== "LISTED") return "locked";
  return "edit";
}
