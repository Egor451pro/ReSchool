import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

/** Статическая шапка гостя: без cookies, чтобы не подвешивать cacheComponents. */
export function SiteHeader() {
  return (
    <header className="site-header sticky top-0 z-50 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-3">
        <Link href="/" className="text-sm font-semibold tracking-wide text-ink">
          ReSchool
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link href="/login" className="btn-ghost btn-sm">
            Войти
          </Link>
        </div>
      </div>
    </header>
  );
}
