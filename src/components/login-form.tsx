"use client";

import { useActionState } from "react";
import { loginAction, type AuthFormState } from "@/app/actions/auth";

const initialState: AuthFormState = {};

export function LoginForm({
  next,
  defaultEmail,
}: {
  next?: string;
  defaultEmail?: string;
}) {
  const [state, action, pending] = useActionState(loginAction, initialState);

  return (
    <form action={action} className="flex flex-col gap-4">
      {next ? <input type="hidden" name="next" value={next} /> : null}
      <label className="flex flex-col gap-1 text-sm text-leaf">
        Почта
        <input
          name="email"
          type="email"
          autoComplete="username"
          required
          defaultValue={defaultEmail}
          className="field"
        />
        {state.fields?.email ? <span className="font-medium text-ink">{state.fields.email}</span> : null}
      </label>
      <label className="flex flex-col gap-1 text-sm text-leaf">
        Пароль
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="field"
        />
        {state.fields?.password ? (
          <span className="font-medium text-ink">{state.fields.password}</span>
        ) : null}
      </label>
      {state.error ? (
        <p className="rounded-2xl border border-line-strong bg-muted px-3 py-2 text-sm text-ink">{state.error}</p>
      ) : null}
      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? "Входим…" : "Войти"}
      </button>
    </form>
  );
}
