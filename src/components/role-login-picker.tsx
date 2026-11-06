"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { demoAnalystLoginAction, quickLoginAction } from "@/app/actions/auth";
import { BackButton } from "@/components/back-link";
import { LoginForm } from "@/components/login-form";
import type { LoginRoleChoice } from "@/domain/access/demo-accounts";
import { isSeedDemoEmail } from "@/domain/access/saved-accounts";
import { mvpRoleLabel, type UserRole } from "@/domain/access/roles";

export type PickerAccount = {
  userId: string;
  email: string;
  fullName: string;
  role: UserRole;
  hint?: string | null;
};

const roleCards: {
  id: LoginRoleChoice;
  title: string;
  text: string;
  registerHref?: string;
  accent?: boolean;
  roles: UserRole[];
}[] = [
  {
    id: "DONOR_STAFF",
    title: "Я завхоз",
    text: "Войти в кабинет школы или зарегистрировать учреждение",
    registerHref: "/register",
    accent: true,
    roles: ["DONOR_STAFF"],
  },
  {
    id: "FREELANCER",
    title: "Я фрилансер",
    text: "Войти на биржу или создать учётку исполнителя",
    registerHref: "/register?role=freelancer",
    roles: ["FREELANCER"],
  },
  {
    id: "DISTRICT_ANALYST",
    title: "Я аналитик",
    text: "Дашборд района, экономия и калькулятор сценариев",
    roles: ["DISTRICT_ANALYST"],
  },
];

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}

function parseInitialRole(value?: string): LoginRoleChoice | null {
  if (value === "donor" || value === "zavhoz" || value === "DONOR_STAFF") return "DONOR_STAFF";
  if (value === "freelancer" || value === "FREELANCER") return "FREELANCER";
  if (
    value === "analyst" ||
    value === "other" ||
    value === "admin" ||
    value === "DISTRICT_ANALYST"
  ) {
    return "DISTRICT_ANALYST";
  }
  return null;
}

export function RoleLoginPicker({
  next,
  title = "Войти как",
  showRegister = true,
  initialRole,
  rememberedUserId,
  accounts: registeredAccounts = [],
}: {
  next?: string;
  title?: string;
  showRegister?: boolean;
  initialRole?: string;
  rememberedUserId?: string | null;
  /** Зарегистрированные учётки из БД (+ сидовый аналитик) */
  accounts?: PickerAccount[];
}) {
  const [role, setRole] = useState<LoginRoleChoice | null>(() => parseInitialRole(initialRole));
  const [picked, setPicked] = useState<PickerAccount | null>(null);

  const activeCard = roleCards.find((card) => card.id === role);
  const accounts = useMemo(() => {
    if (!role || !activeCard) return [];
    return registeredAccounts.filter((account) => activeCard.roles.includes(account.role));
  }, [role, activeCard, registeredAccounts]);

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        {picked ? (
          <BackButton
            onClick={() => {
              setPicked(null);
            }}
          >
            К списку аккаунтов
          </BackButton>
        ) : role ? (
          <BackButton
            onClick={() => {
              setRole(null);
              setPicked(null);
            }}
          >
            К выбору роли
          </BackButton>
        ) : null}
        <h2 className="text-lg font-semibold text-ink">
          {picked
            ? "Введите пароль"
            : role
              ? activeCard?.title ?? title
              : title}
        </h2>
      </div>

      {!role ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {roleCards.map((card) => {
            const count = registeredAccounts.filter((account) =>
              card.roles.includes(account.role),
            ).length;
            return (
              <button
                key={card.id}
                type="button"
                onClick={() => {
                  setRole(card.id);
                  setPicked(null);
                }}
                className={
                  card.accent
                    ? "flex flex-col gap-2 rounded-2xl border border-mint bg-mint px-4 py-4 text-left text-[#2f241c] shadow-[var(--shadow-soft)] transition hover:opacity-95 sm:rounded-3xl sm:px-5 sm:py-5"
                    : "flex flex-col gap-2 rounded-2xl border border-line bg-surface px-4 py-4 text-left text-ink shadow-[var(--shadow-soft)] transition hover:border-mint hover:bg-muted/60 sm:rounded-3xl sm:px-5 sm:py-5"
                }
              >
                <span className="text-lg font-semibold">{card.title}</span>
                <span
                  className={`text-sm leading-6 ${card.accent ? "text-[#2f241c]/70" : "text-leaf"}`}
                >
                  {card.text}
                </span>
                {count > 0 ? (
                  <span
                    className={`text-xs font-medium ${card.accent ? "text-[#2f241c]/80" : "text-gold"}`}
                  >
                    Аккаунтов: {count}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {accounts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line bg-muted/40 px-4 py-5 text-sm leading-6 text-leaf">
              Пока нет зарегистрированных аккаунтов для роли «{activeCard?.title ?? ""}». Создайте
              учётку — она появится в этом списке.
            </div>
          ) : (
            <>
              {!picked ? (
                <p className="text-sm text-leaf">
                  {role === "DISTRICT_ANALYST"
                    ? "Выберите профиль аналитика"
                    : `Выберите свой аккаунт и введите пароль${
                        rememberedUserId ? " (или «Это я» для последнего входа)" : ""
                      }.`}
                </p>
              ) : null}
              {picked ? (
                <div className="max-w-md rounded-2xl border border-line bg-surface p-4 shadow-[var(--shadow-soft)]">
                  <div className="mb-3 flex items-center gap-3">
                    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-mint/35 text-xs font-semibold text-ink ring-1 ring-line-strong">
                      {initials(picked.fullName)}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-ink">{picked.fullName}</span>
                      <span className="block truncate text-xs text-leaf">
                        {picked.hint || mvpRoleLabel(picked.role)} · {picked.email}
                      </span>
                    </span>
                  </div>
                  <LoginForm next={next} defaultEmail={picked.email} />
                </div>
              ) : (
              <ul className="grid gap-2 sm:grid-cols-2">
                {accounts.map((account) => {
                  const seedAnalyst =
                    role === "DISTRICT_ANALYST" && isSeedDemoEmail(account.email);
                  const canQuick =
                    !seedAnalyst &&
                    Boolean(rememberedUserId) &&
                    rememberedUserId === account.userId;
                  return (
                    <li key={account.email} className="flex flex-col gap-2">
                      {seedAnalyst ? (
                        <form action={demoAnalystLoginAction}>
                          {next ? <input type="hidden" name="next" value={next} /> : null}
                          <input type="hidden" name="email" value={account.email} />
                          <button
                            type="submit"
                            className="flex w-full items-center gap-3 rounded-2xl border border-line bg-surface px-3 py-3 text-left shadow-[var(--shadow-soft)] transition hover:border-mint hover:bg-muted/50"
                          >
                            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-mint/35 text-xs font-semibold text-ink ring-1 ring-line-strong">
                              {initials(account.fullName)}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate font-medium text-ink">
                                {account.fullName}
                              </span>
                              <span className="block truncate text-xs text-leaf">
                                {account.hint || mvpRoleLabel(account.role)} · {account.email}
                              </span>
                            </span>
                            <span className="shrink-0 text-sm font-medium text-gold">Войти</span>
                          </button>
                        </form>
                      ) : canQuick ? (
                        <form action={quickLoginAction}>
                          {next ? <input type="hidden" name="next" value={next} /> : null}
                          <button
                            type="submit"
                            className="flex w-full items-center gap-3 rounded-2xl border border-line bg-surface px-3 py-3 text-left shadow-[var(--shadow-soft)] transition hover:border-mint hover:bg-muted/50"
                          >
                            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-mint/35 text-xs font-semibold text-ink ring-1 ring-line-strong">
                              {initials(account.fullName)}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate font-medium text-ink">
                                {account.fullName}
                              </span>
                              <span className="block truncate text-xs text-leaf">
                                {account.hint || mvpRoleLabel(account.role)} · {account.email}
                              </span>
                            </span>
                            <span className="shrink-0 text-sm font-medium text-gold">Это я</span>
                          </button>
                        </form>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setPicked(account)}
                          className="flex w-full items-center gap-3 rounded-2xl border border-line bg-surface px-3 py-3 text-left shadow-[var(--shadow-soft)] transition hover:border-mint hover:bg-muted/50"
                        >
                          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-mint/35 text-xs font-semibold text-ink ring-1 ring-line-strong">
                            {initials(account.fullName)}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-medium text-ink">
                              {account.fullName}
                            </span>
                            <span className="block truncate text-xs text-leaf">
                              {account.hint || mvpRoleLabel(account.role)} · {account.email}
                            </span>
                          </span>
                          <span className="shrink-0 text-sm font-medium text-gold">Войти</span>
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
              )}
            </>
          )}

          {showRegister && activeCard?.registerHref ? (
            <p className="text-sm text-leaf">
              Нужна новая учётка?{" "}
              <Link
                href={activeCard.registerHref}
                className="font-medium text-ink underline decoration-line underline-offset-2 hover:text-leaf"
              >
                Зарегистрироваться
              </Link>
            </p>
          ) : null}
        </div>
      )}
    </section>
  );
}
