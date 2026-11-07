import Link from "next/link";

export default function AppNotFound() {
  return (
    <main className="page-shell items-start gap-4 text-ink">
      <h1 className="text-2xl font-semibold">Не найдено</h1>
      <p className="max-w-lg text-sm leading-6 text-leaf">
        Карточка или раздел недоступны.
      </p>
      <Link href="/cabinet" className="btn-primary">
        В кабинет
      </Link>
    </main>
  );
}
