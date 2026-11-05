import { orderStatuses, type OrderStatus } from "@/domain/workflow/order-lifecycle";

export { orderStatuses };
export type { OrderStatus };

export const orderStatusLabels: Record<OrderStatus, string> = {
  ASSIGNED: "Ожидает завхоза",
  IN_PROGRESS: "В работе",
  QUALITY_CHECK: "Проверка",
  COMPLETED: "Завершён",
  CANCELLED: "Отменён",
};

export const kanbanColumns: OrderStatus[] = [
  "ASSIGNED",
  "IN_PROGRESS",
  "QUALITY_CHECK",
  "COMPLETED",
];
