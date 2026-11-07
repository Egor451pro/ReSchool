"use client";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="page-shell items-start gap-4 text-ink">
      <h1 className="text-2xl font-semibold">Ошибка раздела</h1>
      <p className="max-w-lg text-sm leading-6 text-leaf">
        Не удалось открыть кабинет или связанный раздел. Повторите запрос.
      </p>
      {error.digest ? (
        <p className="text-xs text-leaf">Код: {error.digest}</p>
      ) : null}
      <button type="button" className="btn-primary" onClick={reset}>
        Повторить
      </button>
    </main>
  );
}
