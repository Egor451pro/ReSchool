"use client";

import { useState } from "react";
import { ItemTile, type ItemTileData } from "@/components/item-tile";
import { Surface } from "@/components/ui/surface";
import { formatByn } from "@/domain/economy/money";
import { closeReasonLabels, itemsCountLabel, type CloseReason } from "@/domain/items/labels";

export type HistoryItem = ItemTileData & {
  closeReason: CloseReason | null;
  feeKop?: number;
};

export function RepairHistoryPanel({
  items,
  title = "История ремонтов",
  emptyText = "Здесь появятся подтверждённые ремонты.",
  showPlace = false,
}: {
  items: HistoryItem[];
  title?: string;
  emptyText?: string;
  showPlace?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <section className="flex flex-col gap-4">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-3 rounded-2xl border border-line bg-surface px-4 py-3 text-left shadow-[0_6px_18px_rgba(47,36,28,0.03)] hover:border-mint"
      >
        <span className="font-semibold text-ink">{title}</span>
        <span className="text-sm text-leaf">
          {items.length > 0 ? itemsCountLabel(items.length) : "пусто"} · {open ? "Скрыть" : "Открыть"}
        </span>
      </button>

      {open ? (
        items.length === 0 ? (
          <Surface className="border-dashed text-sm text-leaf">{emptyText}</Surface>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {items.map((item) => (
              <div key={item.id} className="flex flex-col gap-2">
                <ItemTile item={item} showPlace={showPlace} />
                <p className="px-1 text-xs text-leaf">
                  {item.closeReason ? closeReasonLabels[item.closeReason] : "Закрыто"}
                  {typeof item.feeKop === "number" ? ` · ${formatByn(item.feeKop)}` : null}
                </p>
              </div>
            ))}
          </div>
        )
      ) : null}
    </section>
  );
}
