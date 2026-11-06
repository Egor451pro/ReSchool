import type { ReactNode } from "react";

export function Surface({
  children,
  className = "",
  as: Tag = "div",
  tone = "default",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "li" | "article";
  /** accent — кофейная/бежевая плашка с гарантированно читаемым текстом */
  tone?: "default" | "accent";
}) {
  const base =
    tone === "accent"
      ? "panel-accent rounded-2xl border p-3.5 shadow-[var(--shadow-soft)] transition-colors duration-300 sm:rounded-3xl sm:p-4"
      : "rounded-2xl border border-line/90 bg-surface p-3.5 text-ink shadow-[var(--shadow-soft)] transition-colors duration-300 sm:rounded-3xl sm:p-4";

  return <Tag className={`${base} ${className}`.trim()}>{children}</Tag>;
}

export function PageShell({
  children,
  className = "",
  wide = false,
}: {
  children: ReactNode;
  className?: string;
  /** Шире обычного контейнера (карточка объекта и т.п.) */
  wide?: boolean;
}) {
  return (
    <main
      className={`page-shell ${wide ? "page-shell-wide" : ""} ${className}`.trim()}
    >
      {children}
    </main>
  );
}
