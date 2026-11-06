import Link from "next/link";
import { Suspense } from "react";
import { AuthHeader } from "@/components/auth-header";
import { ThemeToggle } from "@/components/theme-toggle";
import { getCurrentUser } from "@/server/auth/current-user";

async function AuthSlot() {
  const user = await getCurrentUser();
  return (
    <AuthHeader
      user={user ? { fullName: user.fullName, role: user.role, email: user.email } : null}
    />
  );
}

/** Шапка гостя: auth-слот в Suspense, чтобы cookies не блокировали оболочку. */
export function SiteHeader() {
  return (
    <header className="site-header sticky top-0 z-50 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-2.5 sm:gap-4 sm:px-6 sm:py-3">
        <Link href="/" className="shrink-0 text-sm font-semibold tracking-wide text-ink">
          ReSchool
        </Link>
        <div className="flex min-w-0 items-center gap-2">
          <ThemeToggle />
          <Suspense
            fallback={
              <Link href="/login" className="btn-ghost btn-sm">
                <span className="sm:hidden">Войти</span>
                <span className="hidden sm:inline">Войти / Зарегистрироваться</span>
              </Link>
            }
          >
            <AuthSlot />
          </Suspense>
        </div>
      </div>
    </header>
  );
}
