"use client";

import { useActionState, type ReactNode } from "react";
import { publishRequestAction, type CabinetFormState } from "@/app/actions/cabinet";

const initialState: CabinetFormState = {};
const controlClass = "field";

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-sm text-leaf">
      {label}
      {children}
      {error ? <span className="font-medium text-ink">{error}</span> : null}
    </label>
  );
}

export function RequestForm({ categories }: { categories: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState(publishRequestAction, initialState);
  const values = state.request ?? { title: "", description: "", categoryId: "", quantity: "1" };

  return (
    <form key={state.request ? JSON.stringify(state.request) : "new"} action={action} className="flex flex-col gap-4">
      <Field label="Что нужно" error={state.fields?.title}>
        <input
          name="title"
          required
          minLength={3}
          maxLength={160}
          defaultValue={values.title}
          className={controlClass}
        />
      </Field>
      <Field label="Зачем" error={state.fields?.description}>
        <textarea
          name="description"
          required
          minLength={3}
          maxLength={2000}
          rows={3}
          defaultValue={values.description}
          className={controlClass}
        />
      </Field>
      <Field label="Категория" error={state.fields?.categoryId}>
        <select name="categoryId" required defaultValue={values.categoryId} className={controlClass}>
          <option value="">Выберите</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Количество, шт." error={state.fields?.quantity}>
        <input
          name="quantity"
          required
          inputMode="numeric"
          min={1}
          defaultValue={values.quantity}
          className={controlClass}
        />
      </Field>
      {state.error ? <p className="rounded-2xl border border-line-strong bg-muted px-3 py-2 text-sm text-ink">{state.error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="h-11 rounded-2xl bg-deep px-4 text-sm font-medium text-cream shadow-[0_8px_20px_rgba(47,36,28,0.12)] transition-colors duration-300 hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Сохраняем…" : "Добавить запрос"}
      </button>
    </form>
  );
}
