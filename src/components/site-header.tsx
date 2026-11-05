import Link from "next/link";

/** Статическая шапка гостя: без cookies, чтобы не подвешивать cacheComponents. */
export function SiteHeader() {
  return (
    <header className="border-b border-mint/50 bg-paper">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-3">
        <Link href="/" className="text-sm font-semibold tracking-wide text-ink">
          ReSchool
        </Link>
        <Link href="/login" className="btn-ghost btn-sm">
          Войти
        </Link>
      </div>
    </header>
  );
}
