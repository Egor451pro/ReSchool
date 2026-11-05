import Link from "next/link";
import { Suspense } from "react";
import { AuthHeader } from "@/components/auth-header";
import { BrandLockup } from "@/components/brand-mark";
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
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-3">
        <Link href="/" className="inline-flex items-center" aria-label="ReSchool">
          <BrandLockup />
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Suspense
            fallback={
              <Link href="/login" className="btn-ghost btn-sm">
                Войти / Зарегистрироваться
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
