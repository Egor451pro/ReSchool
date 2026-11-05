"use client";

import { useActionState } from "react";
import { registerFreelancerAction, type AuthFormState } from "@/app/actions/auth";

const initialState: AuthFormState = {};

export function RegisterFreelancerForm({
  specialties,
}: {
  specialties: { id: string; name: string }[];
}) {
  const [state, action, pending] = useActionState(registerFreelancerAction, initialState);

  return (
    <form action={action} className="flex flex-col gap-4">
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
        Почта
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
      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm text-leaf">Навыки (необязательно)</legend>
        <div className="flex flex-col gap-2">
          {specialties.map((specialty) => (
            <label key={specialty.id} className="flex items-center gap-2 text-sm text-ink">
              <input type="checkbox" name="specialtyIds" value={specialty.id} />
              {specialty.name}
            </label>
          ))}
        </div>
      </fieldset>
      {state.error ? (
        <p className="rounded-lg bg-gold/40 px-3 py-2 text-sm text-ink">{state.error}</p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="h-11 rounded-lg bg-ink text-sm font-medium text-white hover:bg-leaf disabled:opacity-60"
      >
        {pending ? "Создаём учётку…" : "Стать фрилансером"}
      </button>
    </form>
  );
}
