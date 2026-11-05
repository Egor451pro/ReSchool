export const orderStatuses = [
  "ASSIGNED",
  "IN_PROGRESS",
  "QUALITY_CHECK",
  "COMPLETED",
  "CANCELLED",
] as const;

export type OrderStatus = (typeof orderStatuses)[number];

const transitions: Record<OrderStatus, readonly OrderStatus[]> = {
  ASSIGNED: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["QUALITY_CHECK", "COMPLETED", "CANCELLED"],
  QUALITY_CHECK: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
};

export function canTransitionOrder(from: OrderStatus, to: OrderStatus): boolean {
  return transitions[from].includes(to);
}

export function assertOrderTransition(from: OrderStatus, to: OrderStatus): void {
  if (!canTransitionOrder(from, to)) {
    throw new Error(`Недопустимый переход заказа: ${from} → ${to}`);
  }
}
