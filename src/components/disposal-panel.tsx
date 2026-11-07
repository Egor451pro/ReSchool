"use client";

import { useActionState, useState } from "react";
import {
  chooseFreelancerDisposalAction,
  chooseSelfDisposalAction,
  confirmDisposalAction,
  type DisposalFormState,
} from "@/app/actions/disposal";
import { formatByn } from "@/domain/economy/money";

type Point = {
  id: string;
  name: string;
  address: string;
  phone: string;
  hours: string;
  lat?: number | null;
  lng?: number | null;
};

type Job = {
  id: string;
  mode: "SELF" | "FREELANCER";
  status: "PENDING" | "DELIVERED" | "CONFIRMED" | "CANCELLED";
  feeKop: number;
  point: Point | null;
  freelancer: { id: string; fullName: string } | null;
};

const initial: DisposalFormState = {};

export function DisposalPanel({
  itemId,
  points,
  job,
  freelancerName,
}: {
  itemId: string;
  points: Point[];
  job: Job | null;
  freelancerName?: string | null;
}) {
  const [mode, setMode] = useState<"SELF" | "FREELANCER">("SELF");
  const [pointId, setPointId] = useState(points[0]?.id ?? "");
  const [selfState, selfAction, selfPending] = useActionState(chooseSelfDisposalAction, initial);
  const [feeState, feeAction, feePending] = useActionState(
    chooseFreelancerDisposalAction,
    initial,
  );
  const [confirmState, confirmAction, confirmPending] = useActionState(
    confirmDisposalAction,
    initial,
  );

  if (!job) {
    return (
      <div className="rounded-2xl border border-dashed border-line bg-muted/40 p-4 text-sm text-leaf">
        Заявка на утиль ещё не создана.
      </div>
    );
  }

  const chosen = Boolean(job.point);
  // Подтверждает завхоз только если сдаёт сам; фрилансер закрывает утиль сам при отметке сдачи.
  const canConfirm = job.mode === "SELF" && chosen && job.status === "PENDING";

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-sm font-semibold text-ink">Сдача в пункт приёма</h2>
        <p className="mt-1 text-sm leading-6 text-leaf">
          Вещь признана неремонтопригодной. Выберите: сдать сами или поручить фрилансеру за
          отдельную плату.
        </p>
      </div>

      {chosen && job.point ? (
        <div className="rounded-2xl border border-line bg-muted/30 p-4 text-sm leading-6 text-leaf">
          <p className="font-medium text-ink">{job.point.name}</p>
          <p>{job.point.address}</p>
          {job.point.hours ? <p>Часы: {job.point.hours}</p> : null}
          {job.point.phone ? <p>Тел.: {job.point.phone}</p> : null}
          <p className="mt-2">
            Способ: {job.mode === "SELF" ? "сдаёте сами" : `фрилансер${freelancerName ? ` (${freelancerName})` : ""}`}
            {job.mode === "FREELANCER" ? ` · плата ${formatByn(job.feeKop)}` : ""}
          </p>
          <p>
            Статус:{" "}
            {job.mode === "FREELANCER" && job.status === "PENDING"
              ? "ожидает сдачи фрилансером"
              : job.status === "PENDING"
                ? "ожидает вашей сдачи"
                : job.status === "DELIVERED"
                  ? "сдано, ждёт подтверждения"
                  : job.status === "CONFIRMED"
                    ? "сдано"
                    : job.status}
          </p>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setMode("SELF")}
              className={mode === "SELF" ? "btn-primary btn-sm" : "btn-ghost btn-sm"}
            >
              Сдам сам
            </button>
            <button
              type="button"
              onClick={() => setMode("FREELANCER")}
              className={mode === "FREELANCER" ? "btn-primary btn-sm" : "btn-ghost btn-sm"}
              disabled={!freelancerName}
            >
              Поручить фрилансеру
            </button>
          </div>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-ink">Пункт приёма</span>
            <select
              className="field"
              value={pointId}
              onChange={(event) => setPointId(event.target.value)}
            >
              {points.map((point) => (
                <option key={point.id} value={point.id}>
                  {point.name} — {point.address}
                </option>
              ))}
            </select>
          </label>

          {mode === "SELF" ? (
            <form action={selfAction} className="flex flex-col gap-3">
              <input type="hidden" name="itemId" value={itemId} />
              <input type="hidden" name="pointId" value={pointId} />
              {selfState.error ? (
                <p className="text-sm text-red-700" role="alert">
                  {selfState.error}
                </p>
              ) : null}
              <button type="submit" className="btn-primary" disabled={selfPending || !pointId}>
                {selfPending ? "Сохраняем…" : "Выбрать и сдать самому"}
              </button>
            </form>
          ) : (
            <form action={feeAction} className="flex flex-col gap-3">
              <input type="hidden" name="itemId" value={itemId} />
              <input type="hidden" name="pointId" value={pointId} />
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-ink">Плата фрилансеру, BYN</span>
                <input
                  name="feeByn"
                  className="field"
                  inputMode="decimal"
                  placeholder="например 15"
                  required
                />
              </label>
              {feeState.error ? (
                <p className="text-sm text-red-700" role="alert">
                  {feeState.error}
                </p>
              ) : null}
              <button type="submit" className="btn-primary" disabled={feePending || !pointId}>
                {feePending ? "Сохраняем…" : "Поручить сдачу"}
              </button>
            </form>
          )}
        </>
      )}

      {canConfirm ? (
        <form action={confirmAction} className="flex flex-col gap-2">
          <input type="hidden" name="itemId" value={itemId} />
          {confirmState.error ? (
            <p className="text-sm text-red-700" role="alert">
              {confirmState.error}
            </p>
          ) : null}
          <button type="submit" className="btn-primary" disabled={confirmPending}>
            {confirmPending ? "Подтверждаем…" : "Подтвердить сдачу"}
          </button>
        </form>
      ) : null}
    </div>
  );
}
