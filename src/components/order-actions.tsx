"use client";

import { useActionState } from "react";
import {
  advanceOrderAction,
  cancelOrderAction,
  closeOrderAction,
  deliverOrderAction,
  unrepairableOrderAction,
  type OrderFormState,
} from "@/app/actions/orders";
import { nextOrderStatus } from "@/domain/workflow/order-item-sync";
import type { OrderStatus } from "@/domain/orders/labels";
import { orderStatusLabels } from "@/domain/orders/labels";
import type { ItemStatus } from "@/domain/items/labels";

const initialState: OrderFormState = {};

function ActionButton({
  action,
  orderId,
  label,
  pendingLabel,
  tone = "primary",
}: {
  action: (state: OrderFormState, formData: FormData) => Promise<OrderFormState>;
  orderId: string;
  label: string;
  pendingLabel: string;
  tone?: "primary" | "ghost";
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  return (
    <form action={formAction} className="flex flex-col gap-1">
      <input type="hidden" name="orderId" value={orderId} />
      {state.error ? <p className="text-xs text-ink">{state.error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className={tone === "primary" ? "btn-primary btn-sm w-full" : "btn-ghost btn-sm w-full"}
      >
        {pending ? pendingLabel : label}
      </button>
    </form>
  );
}

export function OrderActions({
  orderId,
  orderStatus,
  itemStatus,
}: {
  orderId: string;
  orderStatus: OrderStatus;
  itemStatus: ItemStatus;
}) {
  const next = nextOrderStatus(orderStatus);
  const canCancel = orderStatus === "ASSIGNED" || orderStatus === "IN_PROGRESS";
  const canDeliver = orderStatus === "COMPLETED" && itemStatus === "READY";
  const canClose = orderStatus === "COMPLETED" && itemStatus === "DELIVERED";
  const canUnrepair = orderStatus === "IN_PROGRESS" && itemStatus === "IN_REPAIR";

  return (
    <div className="flex flex-col gap-2">
      {next ? (
        <ActionButton
          action={advanceOrderAction}
          orderId={orderId}
          label={
            next === "IN_PROGRESS"
              ? "Начать ремонт"
              : next === "QUALITY_CHECK"
                ? "На проверку"
                : "Подтвердить качество"
          }
          pendingLabel="Сохраняем…"
        />
      ) : null}
      {canDeliver ? (
        <ActionButton
          action={deliverOrderAction}
          orderId={orderId}
          label="Отметить передачу"
          pendingLabel="Сохраняем…"
        />
      ) : null}
      {canClose ? (
        <ActionButton
          action={closeOrderAction}
          orderId={orderId}
          label="Закрыть со снимком"
          pendingLabel="Фиксируем…"
        />
      ) : null}
      {orderStatus === "COMPLETED" && itemStatus === "CLOSED" ? (
        <p className="text-xs text-leaf">Закрыто. Экономия зафиксирована снимком.</p>
      ) : null}
      {canCancel ? (
        <ActionButton
          action={cancelOrderAction}
          orderId={orderId}
          label="Вернуть в каталог"
          pendingLabel="Отменяем…"
          tone="ghost"
        />
      ) : null}
      {canUnrepair ? (
        <ActionButton
          action={unrepairableOrderAction}
          orderId={orderId}
          label="Неремонтопригодно"
          pendingLabel="Закрываем…"
          tone="ghost"
        />
      ) : null}
      {orderStatus === "CANCELLED" ? (
        <p className="text-xs text-leaf">{orderStatusLabels.CANCELLED}</p>
      ) : null}
    </div>
  );
}
