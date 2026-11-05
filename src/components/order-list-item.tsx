import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { formatByn } from "@/domain/economy/money";
import type { ItemStatus } from "@/domain/items/labels";

export function OrderListItem({
  href,
  title,
  subtitle,
  status,
  meta,
  hint,
}: {
  href: string;
  title: string;
  subtitle: string;
  status: ItemStatus;
  meta?: string;
  hint?: string;
}) {
  return (
    <li>
      <Link
        href={href}
        className="flex items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3 shadow-[var(--shadow-soft)] transition hover:border-mint hover:bg-muted/40"
      >
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-ink">{title}</p>
          <p className="mt-0.5 truncate text-sm text-leaf">{subtitle}</p>
          {hint ? <p className="mt-1 text-xs text-leaf">{hint}</p> : null}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <StatusBadge status={status} />
          {meta ? <span className="text-xs tabular-nums text-leaf">{meta}</span> : null}
        </div>
        <span aria-hidden className="shrink-0 text-leaf">
          →
        </span>
      </Link>
    </li>
  );
}

export function feeMeta(feeKop: number): string {
  return formatByn(feeKop);
}
