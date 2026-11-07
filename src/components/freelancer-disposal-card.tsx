"use client";

import { useActionState } from "react";
import { deliverDisposalAction, type DisposalFormState } from "@/app/actions/disposal";
import { formatByn } from "@/domain/economy/money";

const initial: DisposalFormState = {};

export function FreelancerDisposalCard({
  itemId,
  title,
  institutionName,
  pointName,
  pointAddress,
  feeKop,
  status,
}: {
  itemId: string;
  title: string;
  institutionName: string;
  pointName: string;
  pointAddress: string;
  feeKop: number;
  status: "PENDING" | "DELIVERED" | "CONFIRMED" | "CANCELLED";
}) {
  const [state, action, pending] = useActionState(deliverDisposalAction, initial);

  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4 shadow-[var(--shadow-soft)]">
      <div>
        <h3 className="font-semibold text-ink">{title}</h3>
        <p className="text-sm text-leaf">{institutionName}</p>
      </div>
      <p className="text-sm leading-6 text-leaf">
        Сдать в: <span className="text-ink">{pointName}</span>
        <br />
        {pointAddress}
        <br />
        Плата: {formatByn(feeKop)}
      </p>
      {status === "PENDING" ? (
        <form action={action}>
          <input type="hidden" name="itemId" value={itemId} />
          {state.error ? (
            <p className="mb-2 text-sm text-red-700" role="alert">
              {state.error}
            </p>
          ) : null}
          <button type="submit" className="btn-primary btn-sm" disabled={pending}>
            {pending ? "Отмечаем…" : "Отметить: сдано в пункт"}
          </button>
        </form>
      ) : (
        <p className="text-sm font-medium text-gold">Сдано, ждём подтверждения завхоза</p>
      )}
    </article>
  );
}
