"use client";

import { useActionState } from "react";
import {
  confirmRepairAction,
  type ConfirmRepairState,
} from "@/app/actions/cabinet";

const initialState: ConfirmRepairState = {};

export function ConfirmRepairButton({ itemId }: { itemId: string }) {
  const [state, formAction, pending] = useActionState(confirmRepairAction, initialState);

  return (
    <form action={formAction} className="mt-3 flex flex-col gap-1">
      <input type="hidden" name="itemId" value={itemId} />
      {state.error ? <p className="text-xs text-ink">{state.error}</p> : null}
      <button type="submit" disabled={pending} className="btn-primary btn-sm w-full">
        {pending ? "Подтверждаем…" : "Подтвердить закрытие"}
      </button>
    </form>
  );
}
