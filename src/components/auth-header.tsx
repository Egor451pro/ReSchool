"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { logoutAction, switchAccountAction } from "@/app/actions/auth";
import { mvpRoleLabel, roleHome, type UserRole } from "@/domain/access/roles";

export type AuthHeaderProfile = {
  fullName: string;
  role: UserRole;
  email: string;
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}

function Avatar({ name, online }: { name: string; online?: boolean }) {
  return (
    <span className="relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-mint/30 text-xs font-semibold text-ink ring-1 ring-line-strong">
      {initials(name)}
      {online ? (
        <span
          aria-hidden
          className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-[#7d9a7a] ring-2 ring-paper"
          title="В сети"
        />
      ) : null}
    </span>
  );
}

function GuestActions() {
  return (
    <Link href="/login" className="btn-ghost btn-sm">
      Войти / Зарегистрироваться
    </Link>
  );
}

function AuthedMenu({ profile }: { profile: AuthHeaderProfile }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const home = roleHome(profile.role);
  const firstName = profile.fullName.trim().split(/\s+/)[0] ?? profile.fullName;

  useEffect(() => {
    if (!open) return;
    function onPointer(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        className="flex items-center gap-2 rounded-2xl border border-line bg-surface/90 py-1 pl-1 pr-2.5 text-left shadow-[var(--shadow-soft)] transition hover:border-mint"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
      >
        <Avatar name={profile.fullName} online />
        <span className="hidden min-w-0 sm:block">
          <span className="block truncate text-sm font-medium text-ink">{firstName}</span>
          <span className="block text-[11px] text-leaf">В сети · {mvpRoleLabel(profile.role)}</span>
        </span>
      </button>
      {open ? (
        <div
          id={menuId}
          className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-line bg-surface shadow-[var(--shadow-soft)]"
        >
          <div className="border-b border-line px-3 py-2.5">
            <p className="truncate text-sm font-medium text-ink">{profile.fullName}</p>
            <p className="truncate text-xs text-leaf">{profile.email}</p>
          </div>
          <div className="flex flex-col p-1.5 text-sm">
            <Link
              href={home}
              className="rounded-xl px-2.5 py-2 text-ink hover:bg-muted"
              onClick={() => setOpen(false)}
            >
              Личный кабинет
            </Link>
            <form action={logoutAction}>
              <button
                type="submit"
                className="w-full rounded-xl px-2.5 py-2 text-left text-ink hover:bg-muted"
              >
                Выйти
              </button>
            </form>
            <form action={switchAccountAction}>
              <button
                type="submit"
                className="w-full rounded-xl px-2.5 py-2 text-left text-leaf hover:bg-muted hover:text-ink"
              >
                Сменить аккаунт
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function AuthHeader({ user }: { user: AuthHeaderProfile | null }) {
  if (user) return <AuthedMenu profile={user} />;
  return <GuestActions />;
}
