"use client";

import { useActionState } from "react";
import {
  updateRepairBudgetAction,
  type RepairBudgetFormState,
} from "@/app/actions/cabinet";
import { formatBynAmount } from "@/domain/economy/money";

const initial: RepairBudgetFormState = {};

export function RepairBudgetForm({
  itemId,
  repairBudgetKop,
  maxKop,
  agreedFeeKop,
}: {
  itemId: string;
  repairBudgetKop: number;
  maxKop: number;
  agreedFeeKop?: number | null;
}) {
  const [state, action, pending] = useActionState(updateRepairBudgetAction, initial);
  const defaultValue = state.budget ?? formatBynAmount(repairBudgetKop);

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="itemId" value={itemId} />
      <input type="hidden" name="maxKop" value={String(maxKop)} />
      <div>
        <h2 className="text-sm font-semibold text-ink">Цена ремонта</h2>
        <p className="mt-1 text-sm leading-6 text-leaf">
          Сколько школа готова заплатить за весь ремонт. Обсудите с фрилансером в чате и обновите
          сумму — она станет ценой заказа
          {typeof agreedFeeKop === "number" ? ` (сейчас в заказе ${formatBynAmount(agreedFeeKop)} BYN)` : ""}.
        </p>
      </div>
      <label className="flex flex-col gap-1 text-sm text-leaf">
        Бюджет ремонта, BYN
        <input
          name="repairBudget"
          required
          inputMode="decimal"
          defaultValue={defaultValue}
          className="field"
        />
      </label>
      <p className="text-xs text-leaf">Не выше стоимости новых: {formatBynAmount(maxKop)} BYN.</p>
      {state.error ? <p className="text-sm text-ink">{state.error}</p> : null}
      <button type="submit" disabled={pending} className="btn-primary btn-sm w-fit">
        {pending ? "Сохраняем…" : "Обновить цену"}
      </button>
    </form>
  );
}
