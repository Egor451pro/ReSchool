"use client";

import { useActionState } from "react";
import { registerAction, type AuthFormState } from "@/app/actions/auth";

const initialState: AuthFormState = {};

export function RegisterForm({
  institutions,
}: {
  institutions: { id: string; name: string }[];
}) {
  const [state, action, pending] = useActionState(registerAction, initialState);

  return (
    <form action={action} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm text-zinc-700">
        ФИО
        <input
          name="fullName"
          autoComplete="name"
          required
          className="rounded-lg border border-zinc-300 px-3 py-2 text-base text-zinc-900"
        />
        {state.fields?.fullName ? (
          <span className="text-red-700">{state.fields.fullName}</span>
        ) : null}
      </label>
      <label className="flex flex-col gap-1 text-sm text-zinc-700">
        Почта
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          className="rounded-lg border border-zinc-300 px-3 py-2 text-base text-zinc-900"
        />
        {state.fields?.email ? <span className="text-red-700">{state.fields.email}</span> : null}
      </label>
      <label className="flex flex-col gap-1 text-sm text-zinc-700">
        Пароль
        <input
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-base text-zinc-900"
        />
        {state.fields?.password ? (
          <span className="text-red-700">{state.fields.password}</span>
        ) : null}
      </label>
      <label className="flex flex-col gap-1 text-sm text-zinc-700">
        Учреждение
        <select
          name="institutionId"
          required
          defaultValue=""
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-base text-zinc-900"
        >
          <option value="" disabled>
            Выберите учреждение
          </option>
          {institutions.map((institution) => (
            <option key={institution.id} value={institution.id}>
              {institution.name}
            </option>
          ))}
        </select>
        {state.fields?.institutionId ? (
          <span className="text-red-700">{state.fields.institutionId}</span>
        ) : null}
      </label>
      {state.error ? <p className="text-sm text-red-700">{state.error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="h-11 rounded-lg bg-sky-800 text-sm font-medium text-white hover:bg-sky-900 disabled:opacity-60"
      >
        {pending ? "Создаём учётку…" : "Зарегистрироваться"}
      </button>
    </form>
  );
}
