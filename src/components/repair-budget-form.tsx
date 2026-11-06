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
  const budgetKop = Math.round(Number(repairBudgetKop) || 0);
  const ceilingKop = Math.round(Number(maxKop) || 0);
  const feeKop =
    typeof agreedFeeKop === "number" ? Math.round(Number(agreedFeeKop) || 0) : null;
  const defaultValue = state.budget ?? formatBynAmount(budgetKop);

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="itemId" value={itemId} />
      <input type="hidden" name="maxKop" value={String(ceilingKop)} />
      <div>
        <h2 className="text-sm font-semibold text-ink">Цена ремонта</h2>
        <p className="mt-1 text-sm leading-6 text-leaf">
          Сколько школа готова заплатить за весь ремонт. Обсудите с фрилансером в чате и обновите
          сумму — она станет ценой заказа
          {feeKop !== null ? ` (сейчас в заказе ${formatBynAmount(feeKop)} BYN)` : ""}.
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
      <p className="text-xs text-leaf">Не выше стоимости новых: {formatBynAmount(ceilingKop)} BYN.</p>
      {state.error ? <p className="text-sm text-ink">{state.error}</p> : null}
      {!state.error && state.budget ? (
        <p className="text-sm text-leaf">Цена обновлена.</p>
      ) : null}
      <button type="submit" disabled={pending} className="btn-primary btn-sm w-fit">
        {pending ? "Сохраняем…" : "Обновить цену"}
      </button>
    </form>
  );
}
