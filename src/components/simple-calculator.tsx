"use client";

import { useActionState, useMemo, useState } from "react";
import {
  updateAssumptionAction,
  type AssumptionFormState,
} from "@/app/actions/district";
import { projectYear } from "@/domain/economy";
import { formatByn, formatBynAmount, parseBynToKop } from "@/domain/economy/money";
import { scenarioKinds } from "@/lib/validators/assumption";

export type SimpleScenario = {
  kind: (typeof scenarioKinds)[number];
  title: string;
  shownOnDashboard: boolean;
  expectedListedPerYear: string;
  completionPercent: string;
  avgNewPrice: string;
  avgRepair: string;
  platformAnnual: string;
  avgDisposalKop: number;
  freelancerAvgFeeKop: number;
};

const initialState: AssumptionFormState = {};

function parseIntSafe(value: string): number | null {
  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  return Number(trimmed);
}

function parseBynSafe(value: string): number | null {
  try {
    return parseBynToKop(value);
  } catch {
    return null;
  }
}

export function SimpleCalculator({ scenarios }: { scenarios: SimpleScenario[] }) {
  const [kind, setKind] = useState<(typeof scenarioKinds)[number]>(() => {
    const shown = scenarios.find((row) => row.shownOnDashboard);
    return shown?.kind ?? scenarios[1]?.kind ?? scenarios[0]?.kind ?? "BASE";
  });
  const active = scenarios.find((row) => row.kind === kind) ?? scenarios[0]!;

  const [values, setValues] = useState({
    expectedListedPerYear: active.expectedListedPerYear,
    completionPercent: active.completionPercent,
    avgNewPrice: active.avgNewPrice,
    avgRepair: active.avgRepair,
    platformAnnual: active.platformAnnual,
    shownOnDashboard: active.shownOnDashboard,
  });

  function selectKind(next: (typeof scenarioKinds)[number]) {
    const row = scenarios.find((item) => item.kind === next);
    if (!row) return;
    setKind(next);
    setValues({
      expectedListedPerYear: row.expectedListedPerYear,
      completionPercent: row.completionPercent,
      avgNewPrice: row.avgNewPrice,
      avgRepair: row.avgRepair,
      platformAnnual: row.platformAnnual,
      shownOnDashboard: row.shownOnDashboard,
    });
  }

  const projection = useMemo(() => {
    const listed = parseIntSafe(values.expectedListedPerYear);
    const completion = parseIntSafe(values.completionPercent);
    const newPrice = parseBynSafe(values.avgNewPrice);
    const repair = parseBynSafe(values.avgRepair);
    const platform = parseBynSafe(values.platformAnnual);
    if (
      listed === null ||
      completion === null ||
      completion > 100 ||
      newPrice === null ||
      repair === null ||
      platform === null
    ) {
      return null;
    }

    return projectYear({
      expectedListedPerYear: listed,
      avgNewPriceKop: newPrice,
      avgMaterialsKop: repair,
      avgDisposalKop: active.avgDisposalKop,
      defaultTransportKop: 0,
      freelancerAvgFeeKop: active.freelancerAvgFeeKop,
      practiceConsumableKop: 0,
      substitutionMilli: 0,
      completionMilli: completion * 10,
      hostingKopAnnual: platform,
      supportKopAnnual: 0,
    });
  }, [values, active.avgDisposalKop, active.freelancerAvgFeeKop]);

  const [state, formAction, pending] = useActionState(updateAssumptionAction, initialState);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-2">
        {scenarios.map((row) => {
          const selected = row.kind === kind;
          return (
            <button
              key={row.kind}
              type="button"
              onClick={() => selectKind(row.kind)}
              className={
                selected
                  ? "rounded-2xl border border-mint bg-mint px-4 py-2 text-sm font-medium text-[#2f241c]"
                  : "rounded-2xl border border-line bg-surface px-4 py-2 text-sm font-medium text-ink hover:border-mint"
              }
            >
              {row.title}
              {row.shownOnDashboard ? (
                <span className={`ml-2 text-xs ${selected ? "text-[#2f241c]/70" : "text-leaf"}`}>
                  на дашборде
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <form
        action={formAction}
        className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]"
      >
        <input type="hidden" name="kind" value={kind} />
        <section className="flex flex-col gap-4 rounded-3xl border border-line bg-surface p-5 shadow-[var(--shadow-soft)]">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold text-ink">Допущения</h2>
            <p className="text-sm text-leaf">Пять чисел — и сразу виден прогноз на год.</p>
          </div>

          {state.error ? <p className="text-sm text-ink">{state.error}</p> : null}

          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              name="expectedListedPerYear"
              label="Карточек в год"
              value={values.expectedListedPerYear}
              onChange={(value) => setValues((prev) => ({ ...prev, expectedListedPerYear: value }))}
            />
            <Field
              name="completionPercent"
              label="Доля до выдачи, %"
              value={values.completionPercent}
              onChange={(value) => setValues((prev) => ({ ...prev, completionPercent: value }))}
            />
            <Field
              name="avgNewPrice"
              label="Средняя цена новой, BYN"
              value={values.avgNewPrice}
              onChange={(value) => setValues((prev) => ({ ...prev, avgNewPrice: value }))}
            />
            <Field
              name="avgRepair"
              label="Средняя цена ремонта, BYN"
              value={values.avgRepair}
              onChange={(value) => setValues((prev) => ({ ...prev, avgRepair: value }))}
            />
            <Field
              name="platformAnnual"
              label="Платформа в год, BYN"
              value={values.platformAnnual}
              onChange={(value) => setValues((prev) => ({ ...prev, platformAnnual: value }))}
              className="sm:col-span-2"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-leaf">
            <input
              type="checkbox"
              name="shownOnDashboard"
              checked={values.shownOnDashboard}
              onChange={(event) =>
                setValues((prev) => ({ ...prev, shownOnDashboard: event.target.checked }))
              }
              className="size-4 accent-leaf"
            />
            Показывать этот сценарий на дашборде района
          </label>

          <button
            type="submit"
            disabled={pending}
            className="panel-accent h-10 self-start rounded-2xl px-4 text-sm font-medium shadow-[0_8px_20px_rgba(47,36,28,0.12)] transition-colors duration-300 hover:opacity-90 disabled:opacity-60"
          >
            {pending ? "Сохраняем…" : "Сохранить сценарий"}
          </button>
        </section>

        <section className="flex flex-col gap-4 rounded-3xl border border-line bg-surface p-5 shadow-[var(--shadow-soft)]">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold text-ink">Прогноз на год</h2>
            <p className="text-sm text-leaf">Считается сразу, без сохранения.</p>
          </div>

          {projection ? (
            <ul className="grid gap-3 sm:grid-cols-2">
              <Result value={String(projection.completedOrders)} label="заказов до выдачи" />
              <Result
                value={formatByn(projection.propertyBudgetKop)}
                label="экономия бюджета"
              />
              <Result
                value={formatByn(projection.platformCostKop)}
                label="затраты платформы"
              />
              <Result
                value={
                  projection.paybackYears === null
                    ? "—"
                    : `${projection.paybackYears.toLocaleString("ru-BY", {
                        maximumFractionDigits: 1,
                      })} лет`
                }
                label="окупаемость"
              />
            </ul>
          ) : (
            <p className="text-sm leading-6 text-leaf">
              Проверьте числа: целые карточки и проценты, суммы в BYN через запятую или точку.
            </p>
          )}

          {projection ? (
            <p className="text-sm leading-6 text-leaf">
              На один заказ экономия около {formatBynAmount(projection.perItem.propertyBudgetKop)}{" "}
              BYN. В расчёте ремонта учтён средний гонорар фрилансера из сценария.
            </p>
          ) : null}
        </section>
      </form>
    </div>
  );
}

function Field({
  name,
  label,
  value,
  onChange,
  className = "",
}: {
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <label className={`flex flex-col gap-1 text-sm text-leaf ${className}`}>
      {label}
      <input
        name={name}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="field h-10"
        inputMode="decimal"
      />
    </label>
  );
}

function Result({ value, label }: { value: string; label: string }) {
  return (
    <li className="rounded-2xl border border-line bg-muted/40 px-4 py-3">
      <p className="text-xl font-semibold tabular-nums text-ink">{value}</p>
      <p className="text-sm text-leaf">{label}</p>
    </li>
  );
}
