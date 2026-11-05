import { statusLabels, type ItemStatus } from "@/domain/items/labels";

const tone: Record<ItemStatus, string> = {
  LISTED: "bg-mint/50 text-ink",
  REQUESTED: "bg-ink text-white",
  IN_REPAIR: "bg-ink text-white",
  READY: "bg-leaf text-white",
  DELIVERED: "bg-leaf text-white",
  CLOSED: "border border-mint text-leaf",
};

export function StatusBadge({ status }: { status: ItemStatus }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${tone[status]}`}>
      {statusLabels[status]}
    </span>
  );
}
