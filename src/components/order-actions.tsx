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
import { formatByn } from "@/domain/economy/money";

const initialState: OrderFormState = {};

function ActionButton({
  action,
  orderId,
  label,
  pendingLabel,
  tone = "primary",
  size = "sm",
}: {
  action: (state: OrderFormState, formData: FormData) => Promise<OrderFormState>;
  orderId: string;
  label: string;
  pendingLabel: string;
  tone?: "primary" | "ghost";
  size?: "sm" | "md";
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const classes =
    tone === "primary"
      ? size === "md"
        ? "btn-primary w-full"
        : "btn-primary btn-sm w-full"
      : size === "md"
        ? "btn-ghost w-full"
        : "btn-ghost btn-sm w-full";
  return (
    <form action={formAction} className="flex flex-col gap-1">
      <input type="hidden" name="orderId" value={orderId} />
      {state.error ? <p className="text-xs text-ink">{state.error}</p> : null}
      <button type="submit" disabled={pending} className={classes}>
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
  agreedFeeKop,
}: {
  orderId: string;
  orderStatus: OrderStatus;
  itemStatus: ItemStatus;
  schoolAccepted: boolean;
  agreedFeeKop: number;
}) {
  const waitingAccept = orderStatus === "ASSIGNED" && !schoolAccepted;
  /** В работе: новый поток (IN_PROGRESS) или старый (цена подтверждена, статус ещё ASSIGNED). */
  const working =
    orderStatus === "IN_PROGRESS" ||
    (orderStatus === "ASSIGNED" && schoolAccepted) ||
    (orderStatus === "QUALITY_CHECK" && itemStatus === "IN_REPAIR");
  const canFinish = working && itemStatus !== "READY" && itemStatus !== "CLOSED";
  const canCancel = orderStatus === "ASSIGNED" || orderStatus === "IN_PROGRESS";
  const canUnrepair =
    (orderStatus === "IN_PROGRESS" || (orderStatus === "ASSIGNED" && schoolAccepted)) &&
    (itemStatus === "IN_REPAIR" || itemStatus === "REQUESTED");
  const waitingSchool = orderStatus === "COMPLETED" && itemStatus === "READY";
  const closed = itemStatus === "CLOSED";

  return (
    <div className="flex flex-col gap-3">
      {waitingAccept ? (
        <p className="rounded-2xl border border-line bg-muted/60 px-3 py-2 text-sm leading-6 text-leaf">
          Открытая сумма {formatByn(agreedFeeKop)}. Пока завхоз не подтвердит цену в блоке сделки,
          заказ не в работе — детали ремонта можно обсуждать в чате.
        </p>
      ) : null}

      {canFinish ? (
        <div className="flex flex-col gap-2 rounded-2xl border border-mint/50 bg-mint/10 p-3">
          <p className="text-sm leading-6 text-ink">
            Ремонт идёт. Когда закончите — завершите заказ, завхоз подтвердит закрытие и придёт
            выплата.
          </p>
          <ActionButton
            action={advanceOrderAction}
            orderId={orderId}
            label="Завершить заказ"
            pendingLabel="Завершаем…"
            size="md"
          />
        </div>
      ) : null}

      {waitingSchool ? (
        <p className="rounded-2xl border border-line bg-muted/60 px-3 py-2 text-sm leading-6 text-leaf">
          Заказ завершён с вашей стороны. Ждём подтверждения завхоза — после этого придёт выплата.
        </p>
      ) : null}

      {closed ? (
        <p className="text-sm text-leaf">Завхоз подтвердил закрытие. Выплата в кошельке.</p>
      ) : null}

      {canCancel || canUnrepair ? (
        <div className="flex flex-col gap-2">
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
        </div>
      ) : null}

      {orderStatus === "CANCELLED" ? (
        <p className="text-sm text-leaf">{orderStatusLabels.CANCELLED}</p>
      ) : null}
    </div>
  );
}
