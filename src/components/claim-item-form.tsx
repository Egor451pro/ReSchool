"use client";

import { useActionState, useState } from "react";
import { claimItemAction, type OrderFormState } from "@/app/actions/orders";
import { formatBynAmount } from "@/domain/economy/money";

const initial: OrderFormState = {};

export function ClaimItemForm({
  itemId,
  defaultFeeKop,
  newPriceKop,
}: {
  itemId: string;
  defaultFeeKop: number;
  newPriceKop: number;
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(claimItemAction, initial);
  const defaultFee = formatBynAmount(defaultFeeKop);

  if (!open) {
    return (
      <button type="button" className="btn-primary btn-sm" onClick={() => setOpen(true)}>
        Взять в работу
      </button>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-3 rounded-3xl border border-line bg-surface p-4 shadow-[0_8px_24px_rgba(47,36,28,0.03)]">
      <input type="hidden" name="itemId" value={itemId} />
      <p className="text-xs leading-5 text-leaf">
        База — 14% от стоимости новых ({formatBynAmount(newPriceKop)} BYN). Можете изменить свою
        цену за ремонт.
      </p>
      <label className="flex flex-col gap-1 text-sm text-leaf">
        Ваша цена, BYN
        <input
          name="feeByn"
          type="text"
          inputMode="decimal"
          required
          defaultValue={defaultFee}
          className="field"
        />
      </label>
      {state.error ? <p className="text-sm text-ink">{state.error}</p> : null}
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className="btn-primary btn-sm flex-1">
          {pending ? "Отправляем…" : "Предложить заказ"}
        </button>
        <button
          type="button"
          className="btn-ghost btn-sm"
          disabled={pending}
          onClick={() => setOpen(false)}
        >
          Отмена
        </button>
      </div>
    </form>
  );
}
