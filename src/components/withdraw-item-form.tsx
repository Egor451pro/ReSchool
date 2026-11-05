"use client";

import { useActionState } from "react";
import { withdrawItemAction, type CabinetFormState } from "@/app/actions/cabinet";

const initialState: CabinetFormState = {};

export function WithdrawItemForm({ itemId }: { itemId: string }) {
  const [state, action, pending] = useActionState(withdrawItemAction, initialState);

  return (
    <form action={action} className="flex flex-col gap-3 rounded-xl border border-mint/70 p-4">
      <input type="hidden" name="itemId" value={itemId} />
      <p className="text-sm text-leaf">
        Снятие закрывает карточку. Чтобы вернуть вещь в каталог, её публикуют заново.
      </p>
      <label className="flex items-start gap-2 text-sm text-ink">
        <input name="confirm" type="checkbox" className="mt-1" />
        Снять с публикации
      </label>
      {state.error ? <p className="rounded-lg bg-gold/40 px-3 py-2 text-sm text-ink">{state.error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="h-11 rounded-lg border border-ink text-sm font-medium text-ink hover:bg-mint/30 disabled:opacity-60"
      >
        {pending ? "Снимаем…" : "Снять карточку"}
      </button>
    </form>
  );
}
