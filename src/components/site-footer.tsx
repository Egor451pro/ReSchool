import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line bg-muted/25">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-6 pl-[calc(0.85rem+2.85rem+0.75rem)] text-sm text-leaf sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:pl-[calc(1.15rem+2.85rem+0.9rem)]">
        <p>© 2026 ReSchool · пилот</p>
        <nav className="flex flex-wrap gap-x-4 gap-y-2">
          <Link href="/legal/terms" className="hover:text-ink">
            Соглашение
          </Link>
          <Link href="/legal/privacy" className="hover:text-ink">
            Политика ПДн
          </Link>
          <Link href="/legal/consent" className="hover:text-ink">
            Согласие
          </Link>
        </nav>
      </div>
    </footer>
  );
}
