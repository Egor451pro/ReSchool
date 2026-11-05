"use client";

import { useActionState } from "react";
import {
  advanceOrderAction,
  cancelOrderAction,
  unrepairableOrderAction,
  type OrderFormState,
} from "@/app/actions/orders";
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
  schoolAccepted,
}: {
  orderId: string;
  orderStatus: OrderStatus;
  itemStatus: ItemStatus;
  schoolAccepted: boolean;
}) {
  const waitingAccept = orderStatus === "ASSIGNED" && !schoolAccepted;
  const canStart = orderStatus === "ASSIGNED" && schoolAccepted;
  const canFinish =
    orderStatus === "IN_PROGRESS" ||
    (orderStatus === "QUALITY_CHECK" && itemStatus === "IN_REPAIR");
  const canCancel = orderStatus === "ASSIGNED" || orderStatus === "IN_PROGRESS";
  const canUnrepair = orderStatus === "IN_PROGRESS" && itemStatus === "IN_REPAIR";
  const waitingSchool = orderStatus === "COMPLETED" && itemStatus === "READY";
  const closed = orderStatus === "COMPLETED" && itemStatus === "CLOSED";

  return (
    <div className="flex flex-col gap-2">
      {waitingAccept ? (
        <p className="text-xs leading-5 text-leaf">
          Предложение отправлено. Ждём, пока завхоз примет заказ — потом появится «Начать
          ремонт».
        </p>
      ) : null}
      {canStart ? (
        <ActionButton
          action={advanceOrderAction}
          orderId={orderId}
          label="Начать ремонт"
          pendingLabel="Сохраняем…"
        />
      ) : null}
      {canFinish ? (
        <ActionButton
          action={advanceOrderAction}
          orderId={orderId}
          label="Закрыть заказ"
          pendingLabel="Закрываем…"
        />
      ) : null}
      {waitingSchool ? (
        <p className="rounded-2xl border border-line bg-muted/60 px-3 py-2 text-xs leading-5 text-leaf">
          Вы закрыли заказ. Ждём подтверждения завхоза — после этого придёт выплата.
        </p>
      ) : null}
      {closed ? (
        <p className="text-xs text-leaf">Завхоз подтвердил закрытие. Выплата в кошельке.</p>
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
