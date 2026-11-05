"use client";

import { useActionState } from "react";
import { claimItemAction, type OrderFormState } from "@/app/actions/orders";

const initialState: OrderFormState = {};

export function ClaimItemForm({
  itemId,
  groups,
}: {
  itemId: string;
  groups: { id: string; name: string; specialtyName: string }[];
}) {
  const [state, action, pending] = useActionState(claimItemAction, initialState);
  if (groups.length === 0) {
    return <p className="text-sm text-leaf">Нет группы с подходящей специальностью.</p>;
  }

  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="itemId" value={itemId} />
      {groups.length === 1 ? (
        <input type="hidden" name="groupId" value={groups[0].id} />
      ) : (
        <label className="flex flex-col gap-1 text-sm text-leaf">
          Группа
          <select
            name="groupId"
            required
            defaultValue={groups[0].id}
            className="rounded-lg border border-mint bg-paper px-3 py-2 text-sm text-ink"
          >
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name} · {group.specialtyName}
              </option>
            ))}
          </select>
        </label>
      )}
      {state.error ? <p className="rounded-lg bg-gold/40 px-3 py-2 text-sm text-ink">{state.error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="h-10 rounded-lg bg-ink px-3 text-sm font-medium text-white hover:bg-leaf disabled:opacity-60"
      >
        {pending ? "Берём…" : "Взять в работу"}
      </button>
    </form>
  );
}
