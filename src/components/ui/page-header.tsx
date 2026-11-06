import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  banner,
  actions,
}: {
  title: string;
  description?: string;
  banner?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex max-w-3xl min-w-0 flex-col gap-2">
          <h1 className="text-[1.5rem] font-semibold tracking-tight text-ink sm:text-3xl">{title}</h1>
          {description ? <p className="text-base leading-7 text-leaf">{description}</p> : null}
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
      {banner ? (
        <div className="rounded-2xl border border-line bg-mint/20 px-4 py-3 text-sm leading-6 text-ink shadow-[var(--shadow-soft)] transition-colors duration-300">
          {banner}
        </div>
      ) : null}
    </div>
  );
}
