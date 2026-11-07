import { orderStatuses, type OrderStatus } from "@/domain/workflow/order-lifecycle";

export { orderStatuses };
export type { OrderStatus };

export const orderStatusLabels: Record<OrderStatus, string> = {
  ASSIGNED: "Ждёт подтверждения цены",
  IN_PROGRESS: "В работе",
  QUALITY_CHECK: "В работе",
  COMPLETED: "Завершён",
  CANCELLED: "Отменён",
};

/** Колонки UI: QUALITY_CHECK в модели есть, в демо не показываем отдельно. */
export const kanbanColumns: OrderStatus[] = [
  "ASSIGNED",
  "IN_PROGRESS",
  "COMPLETED",
];
