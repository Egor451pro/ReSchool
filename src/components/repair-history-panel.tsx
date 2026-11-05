"use client";

import { useState } from "react";
import { ItemTile, type ItemTileData } from "@/components/item-tile";
import { Surface } from "@/components/ui/surface";
import { closeReasonLabels, itemsCountLabel, type CloseReason } from "@/domain/items/labels";

export type HistoryItem = ItemTileData & {
  closeReason: CloseReason | null;
};

export function RepairHistoryPanel({ items }: { items: HistoryItem[] }) {
  const [open, setOpen] = useState(false);

  return (
    <section className="flex flex-col gap-4">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-3 rounded-xl border border-mint/70 bg-paper px-4 py-3 text-left hover:border-leaf"
      >
        <span className="font-semibold text-ink">История ремонтов</span>
        <span className="text-sm text-leaf">
          {items.length > 0 ? itemsCountLabel(items.length) : "пусто"} · {open ? "Скрыть" : "Открыть"}
        </span>
      </button>

      {open ? (
        items.length === 0 ? (
          <Surface className="border-dashed text-sm text-leaf">
            Здесь появятся подтверждённые ремонты.
          </Surface>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {items.map((item) => (
              <div key={item.id} className="flex flex-col gap-2">
                <ItemTile item={item} />
                <p className="px-1 text-xs text-leaf">
                  {item.closeReason ? closeReasonLabels[item.closeReason] : "Закрыто"}
                </p>
              </div>
            ))}
          </div>
        )
      ) : null}
    </section>
  );
}
