"use client";

import { useActionState } from "react";
import {
  updateAssumptionAction,
  type AssumptionFormState,
  type AssumptionFormValues,
} from "@/app/actions/district";
import { scenarioKinds } from "@/lib/validators/assumption";

const initialState: AssumptionFormState = {};

export function AssumptionForm({
  kind,
  title,
  values,
}: {
  kind: (typeof scenarioKinds)[number];
  title: string;
  values: AssumptionFormValues;
}) {
  const [state, formAction, pending] = useActionState(updateAssumptionAction, initialState);
  const current = state.values ?? values;

  return (
    <form action={formAction} className="flex flex-col gap-4 rounded-3xl border border-line bg-surface p-4 shadow-[0_8px_24px_rgba(47,36,28,0.03)]">
      <input type="hidden" name="kind" value={kind} />
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-ink">{title}</h2>
        <label className="flex items-center gap-2 text-sm text-leaf">
          <input
            type="checkbox"
            name="shownOnDashboard"
            defaultChecked={current.shownOnDashboard}
            className="size-4 accent-leaf"
          />
          Показывать на дашборде района
        </label>
      </div>

      {state.error ? <p className="text-sm text-ink">{state.error}</p> : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          name="expectedListedPerYear"
          label="Карточек в год"
          defaultValue={current.expectedListedPerYear}
        />
        <Field
          name="completionPercent"
          label="Доля до выдачи, %"
          defaultValue={current.completionPercent}
        />
        <Field name="avgNewPrice" label="Средняя цена новой, BYN" defaultValue={current.avgNewPrice} />
        <Field name="avgMaterials" label="Средние материалы, BYN" defaultValue={current.avgMaterials} />
        <Field
          name="defaultTransport"
          label="Транспорт по умолчанию, BYN"
          defaultValue={current.defaultTransport}
        />
        <Field
          name="practiceConsumable"
          label="Учебная заготовка, BYN"
          defaultValue={current.practiceConsumable}
        />
        <Field
          name="substitutionPercent"
          label="Замещение заготовки, %"
          defaultValue={current.substitutionPercent}
        />
        <Field
          name="illustrativeLaborHour"
          label="Иллюстративная ставка часа, BYN"
          defaultValue={current.illustrativeLaborHour}
        />
        <Field name="hostingAnnual" label="Хостинг в год, BYN" defaultValue={current.hostingAnnual} />
        <Field name="supportAnnual" label="Сопровождение в год, BYN" defaultValue={current.supportAnnual} />
      </div>

      <label className="flex flex-col gap-1 text-sm text-leaf">
        Основание допущений
        <textarea
          name="basisNote"
          rows={4}
          defaultValue={current.basisNote}
          className="field"
        />
      </label>

      <button
        type="submit"
        disabled={pending}
        className="h-10 self-start rounded-2xl bg-deep px-4 text-sm font-medium text-cream shadow-[0_8px_20px_rgba(47,36,28,0.12)] transition-colors duration-300 hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Сохраняем…" : "Сохранить сценарий"}
      </button>
    </form>
  );
}

function Field({
  name,
  label,
  defaultValue,
}: {
  name: string;
  label: string;
  defaultValue: string;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm text-leaf">
      {label}
      <input
        name={name}
        defaultValue={defaultValue}
        className="field h-10"
      />
    </label>
  );
}
