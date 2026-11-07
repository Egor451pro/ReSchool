"use client";

import { useActionState, useState } from "react";
import { claimItemAction, type OrderFormState } from "@/app/actions/orders";
import { formatByn, formatBynAmount } from "@/domain/economy/money";

const initial: OrderFormState = {};

export function ClaimItemForm({
  itemId,
  defaultFeeKop,
  newPriceKop,
  schoolBudgetKop,
}: {
  itemId: string;
  defaultFeeKop: number;
  newPriceKop: number;
  schoolBudgetKop: number;
}) {
  const [mode, setMode] = useState<"closed" | "custom">("closed");
  const [state, action, pending] = useActionState(claimItemAction, initial);
  const budget = schoolBudgetKop > 0 ? schoolBudgetKop : defaultFeeKop;

  if (mode === "closed") {
    return (
      <div className="flex flex-col gap-2">
        <form action={action}>
          <input type="hidden" name="itemId" value={itemId} />
          <input type="hidden" name="feeByn" value={formatBynAmount(budget)} />
          <button type="submit" disabled={pending} className="btn-primary btn-sm w-full">
            {pending ? "Отправляем…" : `Взять по бюджету ${formatByn(budget)}`}
          </button>
        </form>
        <button
          type="button"
          className="btn-ghost btn-sm w-full"
          disabled={pending}
          onClick={() => setMode("custom")}
        >
          Предложить свою цену
        </button>
        {state.error ? <p className="text-sm text-ink">{state.error}</p> : null}
      </div>
    );
  }

  return (
    <form
      action={action}
      className="flex flex-col gap-3 rounded-3xl border border-line bg-surface p-4 shadow-[0_8px_24px_rgba(47,36,28,0.03)]"
    >
      <input type="hidden" name="itemId" value={itemId} />
      <p className="text-xs leading-5 text-leaf">
        Бюджет школы — {formatByn(schoolBudgetKop)} (новые ≈ {formatByn(newPriceKop)}). В вашей
        цене уже материалы, доставка и заработок — школа платит только эту сумму.
      </p>
      <label className="flex flex-col gap-1 text-sm text-leaf">
        Ваша цена, BYN
        <input
          name="feeByn"
          type="text"
          inputMode="decimal"
          required
          defaultValue={formatBynAmount(defaultFeeKop)}
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
          onClick={() => setMode("closed")}
        >
          Отмена
        </button>
      </div>
    </form>
  );
}
