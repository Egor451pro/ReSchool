import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

export function LegalDoc({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <SiteHeader />
      <main className="page-shell page-shell-narrow gap-6 text-ink">
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-leaf">Документы</p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
          <p className="text-sm text-leaf">
            Шаблон для пилота. Перед промышленной эксплуатацией текст нужно согласовать с юристом.
          </p>
        </div>
        <article className="prose-legal flex flex-col gap-4 text-sm leading-7 text-leaf [&_h2]:mt-2 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-ink [&_strong]:text-ink">
          {children}
        </article>
        <p className="text-sm text-leaf">
          <Link href="/" className="font-medium text-ink underline decoration-line underline-offset-2">
            На главную
          </Link>
          {" · "}
          <Link href="/legal/terms" className="underline decoration-line underline-offset-2">
            Соглашение
          </Link>
          {" · "}
          <Link href="/legal/privacy" className="underline decoration-line underline-offset-2">
            Политика
          </Link>
          {" · "}
          <Link href="/legal/consent" className="underline decoration-line underline-offset-2">
            Согласие
          </Link>
        </p>
      </main>
    </>
  );
}
