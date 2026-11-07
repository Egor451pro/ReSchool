"use client";

import Link from "next/link";
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
          className="field"
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
          className="field"
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
          className="field"
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
          className="field"
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
          className="field"
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
          className="field"
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
          className="field"
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
          className="field"
        />
        {state.fields?.phone ? <span className="font-medium text-ink">{state.fields.phone}</span> : null}
      </label>
      <label className="flex flex-col gap-1 text-sm text-leaf">
        Почта учреждения
        <input
          name="institutionEmail"
          type="email"
          required
          className="field"
        />
        {state.fields?.institutionEmail ? (
          <span className="font-medium text-ink">{state.fields.institutionEmail}</span>
        ) : null}
      </label>

      <label className="flex items-start gap-2 text-sm text-leaf">
        <input type="checkbox" name="acceptTerms" required className="mt-1" />
        <span>
          Принимаю{" "}
          <Link href="/legal/terms" className="font-medium text-ink underline decoration-line underline-offset-2">
            пользовательское соглашение
          </Link>
        </span>
      </label>
      {state.fields?.acceptTerms ? (
        <span className="text-sm font-medium text-ink">{state.fields.acceptTerms}</span>
      ) : null}
      <label className="flex items-start gap-2 text-sm text-leaf">
        <input type="checkbox" name="personalDataConsent" required className="mt-1" />
        <span>
          Даю отдельное согласие на обработку персональных данных по Закону РБ № 99-З (
          <Link href="/legal/consent" className="font-medium text-ink underline decoration-line underline-offset-2">
            текст согласия
          </Link>
          ,{" "}
          <Link href="/legal/privacy" className="font-medium text-ink underline decoration-line underline-offset-2">
            политика
          </Link>
          )
        </span>
      </label>
      {state.fields?.personalDataConsent ? (
        <span className="text-sm font-medium text-ink">{state.fields.personalDataConsent}</span>
      ) : null}

      {state.error ? (
        <p className="rounded-2xl border border-line-strong bg-muted px-3 py-2 text-sm text-ink">
          {state.error}
        </p>
      ) : null}
      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? "Создаём учётку…" : "Зарегистрировать школу"}
      </button>
    </form>
  );
}
