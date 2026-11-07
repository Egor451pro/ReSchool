import { assertItemTransition, type CloseReason, type ItemStatus } from "./item-lifecycle";
import { assertOrderTransition, type OrderStatus } from "./order-lifecycle";

export type SyncedAdvance = {
  orderTo: OrderStatus;
  itemTo: ItemStatus | null;
  closeReason?: CloseReason;
  comment: string;
};

const orderAdvance: Partial<Record<OrderStatus, OrderStatus>> = {
  ASSIGNED: "IN_PROGRESS",
  IN_PROGRESS: "COMPLETED",
  QUALITY_CHECK: "COMPLETED",
};

export function nextOrderStatus(from: OrderStatus): OrderStatus | null {
  return orderAdvance[from] ?? null;
}

export function planOrderAdvance(from: OrderStatus, itemStatus: ItemStatus): SyncedAdvance {
  const orderTo = nextOrderStatus(from);
  if (!orderTo) throw new Error("Дальше заказ не двигается");
  assertOrderTransition(from, orderTo);

  if (from === "ASSIGNED" && orderTo === "IN_PROGRESS") {
    assertItemTransition(itemStatus, "IN_REPAIR");
    return {
      orderTo,
      itemTo: "IN_REPAIR",
      comment: "Завхоз подтвердил цену — ремонт в работе.",
    };
  }

  if (from === "IN_PROGRESS" && orderTo === "COMPLETED") {
    assertItemTransition(itemStatus, "READY");
    return {
      orderTo,
      itemTo: "READY",
      comment: "Фрилансер завершил ремонт. Ждём подтверждения завхоза.",
    };
  }

  if (from === "QUALITY_CHECK" && orderTo === "COMPLETED") {
    if (itemStatus === "READY") {
      return {
        orderTo,
        itemTo: null,
        comment: "Фрилансер завершил ремонт. Ждём подтверждения завхоза.",
      };
    }
    assertItemTransition(itemStatus, "READY");
    return {
      orderTo,
      itemTo: "READY",
      comment: "Фрилансер завершил ремонт. Ждём подтверждения завхоза.",
    };
  }

  throw new Error("Неизвестный шаг заказа");
}

export function planOrderCancel(from: OrderStatus, itemStatus: ItemStatus): SyncedAdvance {
  assertOrderTransition(from, "CANCELLED");
  assertItemTransition(itemStatus, "LISTED");
  return {
    orderTo: "CANCELLED",
    itemTo: "LISTED",
    comment: "Исполнитель вернул карточку до выдачи. Объявление снова в каталоге.",
  };
}

export function planItemDeliver(itemStatus: ItemStatus): {
  itemTo: ItemStatus;
  comment: string;
} {
  assertItemTransition(itemStatus, "DELIVERED");
  return {
    itemTo: "DELIVERED",
    comment: "Завхоз подтвердил получение. Акт — черновик.",
  };
}

export function planUnrepairable(itemStatus: ItemStatus, orderStatus: OrderStatus): SyncedAdvance {
  if (orderStatus !== "IN_PROGRESS") {
    throw new Error("Неремонтопригодным закрывают уже начатый ремонт");
  }
  assertOrderTransition(orderStatus, "CANCELLED");
  assertItemTransition(itemStatus, "DISPOSAL_PENDING");
  return {
    orderTo: "CANCELLED",
    itemTo: "DISPOSAL_PENDING",
    closeReason: "UNREPAIRABLE",
    comment: "Ремонт признан нецелесообразным. Нужна сдача в пункт приёма.",
  };
}

/** После передачи: фиксируем снимок экономии и закрываем карточку. */
export function planCloseCompleted(itemStatus: ItemStatus): {
  itemTo: ItemStatus;
  closeReason: CloseReason;
  comment: string;
} {
  assertItemTransition(itemStatus, "CLOSED", "COMPLETED");
  return {
    itemTo: "CLOSED",
    closeReason: "COMPLETED",
    comment: "Заказ закрыт, экономия зафиксирована снимком.",
  };
}
