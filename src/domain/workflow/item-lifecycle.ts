export const itemStatuses = [
  "LISTED",
  "REQUESTED",
  "IN_REPAIR",
  "READY",
  "DELIVERED",
  "CLOSED",
] as const;

export type ItemStatus = (typeof itemStatuses)[number];

export const closeReasons = ["COMPLETED", "WITHDRAWN", "UNREPAIRABLE"] as const;
export type CloseReason = (typeof closeReasons)[number];

const transitions: Record<ItemStatus, readonly ItemStatus[]> = {
  LISTED: ["REQUESTED", "CLOSED"],
  REQUESTED: ["LISTED", "IN_REPAIR"],
  // LISTED — мастерская вернула карточку до выдачи, без закрытия как лом.
  IN_REPAIR: ["READY", "CLOSED", "LISTED"],
  READY: ["DELIVERED"],
  DELIVERED: ["CLOSED"],
  CLOSED: [],
};

const closeReasonBySource: Partial<Record<ItemStatus, CloseReason>> = {
  LISTED: "WITHDRAWN",
  IN_REPAIR: "UNREPAIRABLE",
  DELIVERED: "COMPLETED",
};

export function canTransitionItem(from: ItemStatus, to: ItemStatus): boolean {
  return transitions[from].includes(to);
}

export function assertItemTransition(
  from: ItemStatus,
  to: ItemStatus,
  closeReason?: CloseReason,
): void {
  if (!canTransitionItem(from, to)) {
    throw new Error(`Недопустимый переход предмета: ${from} → ${to}`);
  }

  if (to !== "CLOSED") {
    if (closeReason !== undefined) {
      throw new Error("Причина закрытия допустима только при переходе в CLOSED");
    }
    return;
  }

  const expected = closeReasonBySource[from];
  if (expected === undefined || closeReason !== expected) {
    throw new Error(
      `Для перехода ${from} → CLOSED нужна причина ${expected ?? "недопустимо"}`,
    );
  }
}
