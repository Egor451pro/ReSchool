"use client";

import { useActionState, type ReactNode } from "react";
import {
  publishItemAction,
  reviseItemAction,
  type CabinetFormState,
} from "@/app/actions/cabinet";
import { conditionLabels, itemConditions } from "@/domain/items/labels";

const initialState: CabinetFormState = {};

type CategoryOption = { id: string; name: string };

export type ItemFormDefaults = {
  title: string;
  description: string;
  categoryId: string;
  condition: string;
  quantity: string;
  year: string;
  price: string;
};

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm text-leaf">
      {label}
      {children}
      {hint ? <span>{hint}</span> : null}
      {error ? <span className="font-medium text-ink">{error}</span> : null}
    </label>
  );
}

export function ItemForm({
  categories,
  defaults,
  itemId,
  currentPhotoSrc,
}: {
  categories: CategoryOption[];
  defaults?: ItemFormDefaults;
  itemId?: string;
  currentPhotoSrc?: string;
}) {
  const action = itemId ? reviseItemAction : publishItemAction;
  const [state, formAction, pending] = useActionState(action, initialState);
  const values = state.item ??
    defaults ?? {
      title: "",
      description: "",
      categoryId: "",
      condition: "",
      quantity: "1",
      year: "",
      price: "",
    };

  return (
    <form key={state.item ? JSON.stringify(state.item) : "new"} action={formAction} className="flex flex-col gap-4">
      {itemId ? <input type="hidden" name="itemId" value={itemId} /> : null}
      <Field label="Название" error={state.fields?.title}>
        <input
          name="title"
          required
          minLength={3}
          maxLength={160}
          defaultValue={values.title}
          className="field"
        />
      </Field>
      <Field label="Описание" error={state.fields?.description}>
        <textarea
          name="description"
          required
          minLength={3}
          maxLength={2000}
          rows={4}
          defaultValue={values.description}
          className="field"
        />
      </Field>
      <Field label="Категория" error={state.fields?.categoryId}>
        <select name="categoryId" required defaultValue={values.categoryId} className="field">
          <option value="">Выберите</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </Field>
      <Field
        label="Состояние"
        hint="Лом остаётся в каталоге для учёта, в учебный ремонт его не передаём."
        error={state.fields?.condition}
      >
        <select name="condition" required defaultValue={values.condition} className="field">
          <option value="">Выберите</option>
          {itemConditions.map((condition) => (
            <option key={condition} value={condition}>
              {conditionLabels[condition]}
            </option>
          ))}
        </select>
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Количество, шт." error={state.fields?.quantity}>
          <input
            name="quantity"
            required
            inputMode="numeric"
            min={1}
            defaultValue={values.quantity}
            className="field"
          />
        </Field>
        <Field label="Год выпуска" error={state.fields?.year}>
          <input
            name="year"
            inputMode="numeric"
            placeholder="2012"
            defaultValue={values.year}
            className="field"
          />
        </Field>
      </div>
      <Field
        label="Цена новой такой же вещи, BYN"
        hint="Оценка завхоза. Это допущение, не нормативная стоимость."
        error={state.fields?.newUnitPriceKop}
      >
        <input
          name="price"
          required
          inputMode="decimal"
          placeholder="180,00"
          defaultValue={values.price}
          className="field"
        />
      </Field>
      <Field
        label="Фото"
        hint="JPG, PNG или WebP, до 5 МБ. Без файла останется картинка категории."
      >
        {currentPhotoSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={currentPhotoSrc} alt="" className="mb-2 aspect-[4/3] w-full rounded-lg object-cover" />
        ) : null}
        <input name="photo" type="file" accept="image/jpeg,image/png,image/webp" className="text-sm text-ink" />
      </Field>
      {state.error ? <p className="rounded-2xl border border-line-strong bg-muted px-3 py-2 text-sm text-ink">{state.error}</p> : null}
      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? "Сохраняем…" : itemId ? "Сохранить" : "Опубликовать"}
      </button>
    </form>
  );
}
