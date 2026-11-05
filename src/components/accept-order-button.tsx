"use client";

import { useActionState } from "react";
import { acceptOrderAction, type OrderFormState } from "@/app/actions/orders";

const initial: OrderFormState = {};

export function AcceptOrderButton({ orderId }: { orderId: string }) {
  const [state, action, pending] = useActionState(acceptOrderAction, initial);

  return (
    <form action={action} className="mt-2 flex flex-col gap-2">
      <input type="hidden" name="orderId" value={orderId} />
      {state.error ? <p className="text-sm text-ink">{state.error}</p> : null}
      <button type="submit" disabled={pending} className="btn-primary btn-sm">
        {pending ? "Принимаем…" : "Принять заказ"}
      </button>
    </form>
  );
}
