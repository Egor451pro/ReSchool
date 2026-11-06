import Link from "next/link";
import type { ReactNode } from "react";

const className =
  "inline-flex w-fit items-center gap-1.5 text-sm font-medium text-leaf transition hover:text-ink";

export function BackLink({
  href,
  children = "Назад",
}: {
  href: string;
  children?: ReactNode;
}) {
  return (
    <Link href={href} className={className}>
      <span aria-hidden>←</span>
      {children}
    </Link>
  );
}

/** Кнопка «назад» для клиентских шагов (выбор роли / аккаунта). */
export function BackButton({
  onClick,
  children = "Назад",
}: {
  onClick: () => void;
  children?: ReactNode;
}) {
  return (
    <button type="button" onClick={onClick} className={className}>
      <span aria-hidden>←</span>
      {children}
    </button>
  );
}
