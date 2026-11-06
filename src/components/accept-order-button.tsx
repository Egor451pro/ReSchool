"use client";

import { useActionState } from "react";
import { acceptOrderAction, type OrderFormState } from "@/app/actions/orders";
import { formatByn } from "@/domain/economy/money";

const initial: OrderFormState = {};

export function AcceptOrderButton({
  orderId,
  agreedFeeKop,
}: {
  orderId: string;
  agreedFeeKop: number;
}) {
  const [state, action, pending] = useActionState(acceptOrderAction, initial);

  return (
    <form action={action} className="mt-3 flex flex-col gap-2">
      <input type="hidden" name="orderId" value={orderId} />
      {state.error ? <p className="text-sm font-medium">{state.error}</p> : null}
      <button type="submit" disabled={pending} className="btn-ghost bg-surface text-ink">
        {pending ? "Подтверждаем…" : `Подтвердить цену ${formatByn(agreedFeeKop)}`}
      </button>
      <p className="panel-accent-muted text-xs leading-5">
        После подтверждения заказ сразу станет «В работе» — фрилансер сможет чинить.
      </p>
    </form>
  );
}
