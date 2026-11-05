"use client";

import { useActionState, useState } from "react";
import { deleteItemAction, type DeleteItemState } from "@/app/actions/cabinet";

const initialState: DeleteItemState = {};

export function DeleteItemButton({ itemId }: { itemId: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(deleteItemAction, initialState);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn-ghost btn-sm mt-2 w-full"
      >
        Удалить
      </button>
    );
  }

  return (
    <form action={formAction} className="mt-2 flex flex-col gap-2 rounded-2xl border border-line bg-surface p-3 shadow-[0_6px_18px_rgba(47,36,28,0.03)]">
      <input type="hidden" name="itemId" value={itemId} />
      <p className="text-xs leading-5 text-leaf">
        Карточка исчезнет из каталога и кабинета. Удалить можно, пока её не взяли в работу.
      </p>
      <label className="flex items-start gap-2 text-sm text-ink">
        <input name="confirm" type="checkbox" className="mt-1" />
        Подтверждаю удаление
      </label>
      {state.error ? <p className="text-xs text-ink">{state.error}</p> : null}
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className="btn-primary btn-sm flex-1">
          {pending ? "Удаляем…" : "Удалить"}
        </button>
        <button
          type="button"
          className="btn-ghost btn-sm flex-1"
          onClick={() => setOpen(false)}
          disabled={pending}
        >
          Отмена
        </button>
      </div>
    </form>
  );
}
