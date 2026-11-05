"use client";

import { useActionState } from "react";
import { claimItemAction, type OrderFormState } from "@/app/actions/orders";

const initialState: OrderFormState = {};

export function ClaimItemForm({ itemId, groupId }: { itemId: string; groupId: string }) {
  const [state, action, pending] = useActionState(claimItemAction, initialState);

  return (
    <form action={action} className="mt-auto flex flex-col gap-2">
      <input type="hidden" name="itemId" value={itemId} />
      <input type="hidden" name="groupId" value={groupId} />
      {state.error ? (
        <p className="rounded-lg bg-gold/40 px-3 py-2 text-sm text-ink">{state.error}</p>
      ) : null}
      <button type="submit" disabled={pending} className="btn-primary btn-sm w-full">
        {pending ? "Берём…" : "Взять в работу"}
      </button>
    </form>
  );
}
