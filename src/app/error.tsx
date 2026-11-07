"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="page-shell items-start gap-4 text-ink">
      <h1 className="text-2xl font-semibold">Что-то пошло не так</h1>
      <p className="max-w-lg text-sm leading-6 text-leaf">
        Страница не загрузилась. Можно повторить попытку. Если ошибка повторяется — обновите
        вкладку или зайдите позже.
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
