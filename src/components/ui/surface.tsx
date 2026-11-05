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
      ? "panel-accent rounded-3xl border p-4 shadow-[var(--shadow-soft)] transition-colors duration-300"
      : "rounded-3xl border border-line/90 bg-surface p-4 text-ink shadow-[var(--shadow-soft)] transition-colors duration-300";

  return <Tag className={`${base} ${className}`.trim()}>{children}</Tag>;
}

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-8">
      {children}
    </main>
  );
}
