"use client";

import { useActionState } from "react";
import { registerDonorAction, type AuthFormState } from "@/app/actions/auth";
import {
  donorInstitutionTypes,
  institutionTypeLabels,
  type DonorInstitutionType,
} from "@/domain/access/roles";

const initialState: AuthFormState = {};

export function RegisterForm() {
  const [state, action, pending] = useActionState(registerDonorAction, initialState);

  return (
    <form action={action} className="flex flex-col gap-4">
      <p className="text-sm text-leaf">Данные завхоза</p>
      <label className="flex flex-col gap-1 text-sm text-leaf">
        ФИО
        <input
          name="fullName"
          autoComplete="name"
          required
          className="rounded-lg border border-mint px-3 py-2 text-base text-ink"
        />
        {state.fields?.fullName ? (
          <span className="font-medium text-ink">{state.fields.fullName}</span>
        ) : null}
      </label>
      <label className="flex flex-col gap-1 text-sm text-leaf">
        Почта для входа
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          className="rounded-lg border border-mint px-3 py-2 text-base text-ink"
        />
        {state.fields?.email ? <span className="font-medium text-ink">{state.fields.email}</span> : null}
      </label>
      <label className="flex flex-col gap-1 text-sm text-leaf">
        Пароль
        <input
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className="rounded-lg border border-mint px-3 py-2 text-base text-ink"
        />
        {state.fields?.password ? (
          <span className="font-medium text-ink">{state.fields.password}</span>
        ) : null}
      </label>

      <p className="mt-2 text-sm text-leaf">Данные учреждения</p>
      <label className="flex flex-col gap-1 text-sm text-leaf">
        Название
        <input
          name="institutionName"
          required
          placeholder="ГУО «Средняя школа №…»"
          className="rounded-lg border border-mint px-3 py-2 text-base text-ink"
        />
        {state.fields?.institutionName ? (
          <span className="font-medium text-ink">{state.fields.institutionName}</span>
        ) : null}
      </label>
      <label className="flex flex-col gap-1 text-sm text-leaf">
        Тип
        <select
          name="institutionType"
          required
          defaultValue=""
          className="rounded-lg border border-mint bg-white px-3 py-2 text-base text-ink"
        >
          <option value="" disabled>
            Выберите тип
          </option>
          {donorInstitutionTypes.map((type) => (
            <option key={type} value={type}>
              {institutionTypeLabels[type as DonorInstitutionType]}
            </option>
          ))}
        </select>
        {state.fields?.institutionType ? (
          <span className="font-medium text-ink">{state.fields.institutionType}</span>
        ) : null}
      </label>
      <label className="flex flex-col gap-1 text-sm text-leaf">
        Район
        <input
          name="district"
          required
          placeholder="Пилотный район"
          className="rounded-lg border border-mint px-3 py-2 text-base text-ink"
        />
        {state.fields?.district ? (
          <span className="font-medium text-ink">{state.fields.district}</span>
        ) : null}
      </label>
      <label className="flex flex-col gap-1 text-sm text-leaf">
        Адрес
        <input
          name="address"
          required
          className="rounded-lg border border-mint px-3 py-2 text-base text-ink"
        />
        {state.fields?.address ? (
          <span className="font-medium text-ink">{state.fields.address}</span>
        ) : null}
      </label>
      <label className="flex flex-col gap-1 text-sm text-leaf">
        Телефон учреждения
        <input
          name="phone"
          required
          className="rounded-lg border border-mint px-3 py-2 text-base text-ink"
        />
        {state.fields?.phone ? <span className="font-medium text-ink">{state.fields.phone}</span> : null}
      </label>
      <label className="flex flex-col gap-1 text-sm text-leaf">
        Почта учреждения
        <input
          name="institutionEmail"
          type="email"
          required
          className="rounded-lg border border-mint px-3 py-2 text-base text-ink"
        />
        {state.fields?.institutionEmail ? (
          <span className="font-medium text-ink">{state.fields.institutionEmail}</span>
        ) : null}
      </label>

      {state.error ? (
        <p className="rounded-lg bg-gold/40 px-3 py-2 text-sm text-ink">{state.error}</p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="h-11 rounded-lg bg-ink text-sm font-medium text-white hover:bg-leaf disabled:opacity-60"
      >
        {pending ? "Создаём учётку…" : "Зарегистрировать школу"}
      </button>
    </form>
  );
}
