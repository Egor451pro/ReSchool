import Link from "next/link";
import { ClaimItemForm } from "@/components/claim-item-form";
import { PageHeader } from "@/components/ui/page-header";
import { PageShell, Surface } from "@/components/ui/surface";
import { formatByn } from "@/domain/economy/money";
import { itemPhotoSrc } from "@/domain/items/photo";
import { defaultFreelancerFeeKop } from "@/domain/orders/fee";
import { requireRoles } from "@/server/auth/current-user";
import {
  listExchangeItems,
  listFreelancerSpecialtyIds,
} from "@/server/repositories/order-repository";

export const instant = false;

export default async function WorkshopPage() {
  const user = await requireRoles(["FREELANCER"]);
  const [items, skillIds] = await Promise.all([
    listExchangeItems(),
    listFreelancerSpecialtyIds(user.id),
  ]);
  const skillSet = new Set(skillIds);

  return (
    <PageShell>
      <PageHeader
        title="Биржа"
        description="Свободные объявления школ и учреждений. Берёте первым — предлагаете свою цену."
        banner="Базовая цена — 14% от стоимости нового изделия. Завхоз должен принять заказ, прежде чем вы начнёте ремонт."
      />

      {items.length === 0 ? (
        <Surface className="border-dashed text-sm text-leaf">
          Сейчас нет опубликованных заданий. Загляните позже.
        </Surface>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            const photo = item.photos[0];
            const matchesSkill = item.category.specialties.some((link) =>
              skillSet.has(link.specialtyId),
            );
            const newPriceKop = item.newUnitPriceKop * item.quantity;
            const defaultFeeKop = defaultFreelancerFeeKop(
              item.newUnitPriceKop,
              item.quantity,
            );
            return (
              <Surface key={item.id} as="li" className="flex h-full flex-col gap-3">
                <div className="aspect-[4/3] overflow-hidden rounded-lg bg-mint/20">
                  {photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={itemPhotoSrc(photo)} alt="" className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <div className="flex flex-1 flex-col gap-1">
                  <Link
                    href={`/catalog/${item.id}`}
                    className="font-medium text-ink hover:text-leaf"
                  >
                    {item.title}
                  </Link>
                  <p className="text-sm text-ink">{item.institution.name}</p>
                  <p className="text-sm text-leaf">
                    {item.category.name} · {item.quantity} шт. · новое {formatByn(newPriceKop)}
                  </p>
                  {matchesSkill ? (
                    <p className="text-xs font-medium text-leaf">Подходит вашим навыкам</p>
                  ) : null}
                  <p className="text-sm text-ink">База 14% ≈ {formatByn(defaultFeeKop)}</p>
                </div>
                <ClaimItemForm
                  itemId={item.id}
                  defaultFeeKop={defaultFeeKop}
                  newPriceKop={newPriceKop}
                />
              </Surface>
            );
          })}
        </ul>
      )}
    </PageShell>
  );
}
