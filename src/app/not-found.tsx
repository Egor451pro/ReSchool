import Link from "next/link";

export default function NotFound() {
  return (
    <main className="page-shell items-start gap-4 text-ink">
      <h1 className="text-2xl font-semibold">Страница не найдена</h1>
      <p className="max-w-lg text-sm leading-6 text-leaf">
        Такой страницы нет или у вас нет к ней доступа.
      </p>
      <Link href="/" className="btn-primary">
        На главную
      </Link>
    </main>
  );
}
