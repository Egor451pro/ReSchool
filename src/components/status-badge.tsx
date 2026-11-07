import {
  conditionLabels,
  statusLabels,
  type ItemCondition,
  type ItemStatus,
} from "@/domain/items/labels";

/** Приглушённые тона: полупрозрачные подложки, без неонового свечения в dark. */
const statusTone: Record<ItemStatus, string> = {
  LISTED: "bg-mint/20 text-ink ring-1 ring-mint/35",
  REQUESTED: "bg-gold/15 text-leaf ring-1 ring-gold/30",
  IN_REPAIR: "bg-gold/20 text-leaf ring-1 ring-gold/35",
  READY: "bg-mint/25 text-ink ring-1 ring-mint/40",
  DELIVERED: "bg-muted text-ink ring-1 ring-line-strong",
  CLOSED: "bg-transparent text-leaf ring-1 ring-line-strong",
  DISPOSAL_PENDING: "bg-gold/15 text-leaf ring-1 ring-gold/35",
  DISPOSED: "bg-transparent text-leaf ring-1 ring-line-strong",
};

const conditionTone: Record<ItemCondition, string> = {
  WORKING: "bg-mint/20 text-ink ring-1 ring-mint/35",
  REPAIRABLE: "bg-gold/15 text-leaf ring-1 ring-gold/30",
  SCRAP: "bg-muted text-leaf ring-1 ring-line-strong",
};

function BadgeShell({ className, children }: { className: string; children: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide transition-colors duration-300 ${className}`}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: ItemStatus }) {
  return <BadgeShell className={statusTone[status]}>{statusLabels[status]}</BadgeShell>;
}

export function ConditionBadge({ condition }: { condition: ItemCondition }) {
  return (
    <BadgeShell className={conditionTone[condition]}>{conditionLabels[condition]}</BadgeShell>
  );
}
