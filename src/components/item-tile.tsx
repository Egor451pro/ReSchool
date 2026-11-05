import Link from "next/link";
import { formatByn } from "@/domain/economy/money";
import { conditionLabels, type ItemCondition, type ItemStatus } from "@/domain/items/labels";
import { itemPhotoSrc } from "@/domain/items/photo";
import { StatusBadge } from "@/components/status-badge";

export type ItemTileData = {
  id: string;
  title: string;
  condition: ItemCondition;
  status: ItemStatus;
  quantity: number;
  newUnitPriceKop: number;
  category: { name: string };
  institution: { name: string; district: string };
  photos: { id: string; path: string }[];
};

export function ItemTile({ item, showPlace }: { item: ItemTileData; showPlace?: boolean }) {
  const photo = item.photos[0];

  return (
    <Link
      href={`/catalog/${item.id}`}
      className="flex h-full flex-col overflow-hidden rounded-xl border border-mint/70 bg-paper hover:border-leaf"
    >
      <div className="aspect-[4/3] bg-mint/20">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={itemPhotoSrc(photo)} alt="" className="h-full w-full object-cover" />
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={item.status} />
          <span className="text-xs text-leaf">{conditionLabels[item.condition]}</span>
        </div>
        <h2 className="font-medium leading-6 text-ink">{item.title}</h2>
        {showPlace ? (
          <>
            <p className="text-sm text-ink">{item.institution.name}</p>
            <p className="text-xs text-leaf">
              {item.category.name} · {item.institution.district}
            </p>
          </>
        ) : (
          <p className="text-sm text-leaf">{item.category.name}</p>
        )}
        <p className="mt-auto text-sm text-ink">
          {item.quantity} шт. · {formatByn(item.newUnitPriceKop)} за штуку
        </p>
      </div>
    </Link>
  );
}
