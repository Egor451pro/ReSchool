import Link from "next/link";

export function BackLink({ href, children = "Назад" }: { href: string; children?: string }) {
  return (
    <Link
      href={href}
      className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-leaf transition hover:text-ink"
    >
      <span aria-hidden>←</span>
      {children}
    </Link>
  );
}
