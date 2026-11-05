import type { ReactNode } from "react";

export function Surface({
  children,
  className = "",
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "li" | "article";
}) {
  return (
    <Tag
      className={`rounded-3xl border border-line/90 bg-surface/95 p-4 shadow-[var(--shadow-soft)] transition-colors duration-300 ${className}`.trim()}
    >
      {children}
    </Tag>
  );
}

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-8">
      {children}
    </main>
  );
}
