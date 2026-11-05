"use client";

import { useActionState } from "react";
import { loginAction, type AuthFormState } from "@/app/actions/auth";

const initialState: AuthFormState = {};

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(loginAction, initialState);

  return (
    <form action={action} className="flex flex-col gap-4">
      {next ? <input type="hidden" name="next" value={next} /> : null}
      <label className="flex flex-col gap-1 text-sm text-zinc-700">
        Почта
        <input
          name="email"
          type="email"
          autoComplete="username"
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
          autoComplete="current-password"
          required
          className="rounded-lg border border-zinc-300 px-3 py-2 text-base text-zinc-900"
        />
        {state.fields?.password ? (
          <span className="text-red-700">{state.fields.password}</span>
        ) : null}
      </label>
      {state.error ? <p className="text-sm text-red-700">{state.error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="h-11 rounded-lg bg-sky-800 text-sm font-medium text-white hover:bg-sky-900 disabled:opacity-60"
      >
        {pending ? "Входим…" : "Войти"}
      </button>
    </form>
  );
}
