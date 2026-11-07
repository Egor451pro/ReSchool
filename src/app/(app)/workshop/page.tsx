import Link from "next/link";
import { ClaimItemForm } from "@/components/claim-item-form";
import { PageHeader } from "@/components/ui/page-header";
import { PageShell, Surface } from "@/components/ui/surface";
import { formatByn } from "@/domain/economy/money";
import { itemPhotoSrc } from "@/domain/items/photo";
import { suggestedClaimFeeKop } from "@/domain/orders/fee";
import { distanceKm, formatDistanceKm } from "@/domain/workflow/distance";
import { requireRoles } from "@/server/auth/current-user";
import {
  listExchangeItems,
  listFreelancerSpecialtyIds,
} from "@/server/repositories/order-repository";
import { prisma } from "@/server/db";

export const instant = false;

export default async function WorkshopPage() {
  const user = await requireRoles(["FREELANCER"]);
  const [items, skillIds, profile] = await Promise.all([
    listExchangeItems({ take: 48 }),
    listFreelancerSpecialtyIds(user.id),
    prisma.user.findUnique({
      where: { id: user.id },
      select: { lat: true, lng: true, address: true },
    }),
  ]);
  const skillSet = new Set(skillIds);
  const origin =
    profile?.lat != null && profile?.lng != null
      ? { lat: profile.lat, lng: profile.lng }
      : null;
  const sorted = [...items].sort((left, right) => {
    if (!origin) return 0;
    const leftPoint =
      left.institution.lat != null && left.institution.lng != null
        ? { lat: left.institution.lat, lng: left.institution.lng }
        : null;
    const rightPoint =
      right.institution.lat != null && right.institution.lng != null
        ? { lat: right.institution.lat, lng: right.institution.lng }
        : null;
    if (!leftPoint && !rightPoint) return 0;
    if (!leftPoint) return 1;
    if (!rightPoint) return -1;
    return distanceKm(origin, leftPoint) - distanceKm(origin, rightPoint);
  });

  return (
    <PageShell>
      <PageHeader
        title="Биржа"
        description="Свободные объявления школ и учреждений. Можно взять по бюджету школы или предложить свою цену."
        banner="Бюджет школы → ваше предложение или встречка → завхоз подтверждает в блоке сделки → заказ «В работе»."
      />

      {sorted.length === 0 ? (
        <Surface className="border-dashed text-sm text-leaf">
          Сейчас нет опубликованных заданий. Загляните позже.
        </Surface>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((item) => {
            const photo = item.photos[0];
            const matchesSkill = item.category.specialties.some((link) =>
              skillSet.has(link.specialtyId),
            );
            const newPriceKop = item.newUnitPriceKop * item.quantity;
            const defaultFeeKop = suggestedClaimFeeKop({
              repairBudgetKop: item.repairBudgetKop,
              newUnitPriceKop: item.newUnitPriceKop,
              quantity: item.quantity,
            });
            const schoolPoint =
              item.institution.lat != null && item.institution.lng != null
                ? { lat: item.institution.lat, lng: item.institution.lng }
                : null;
            const distanceLabel =
              origin && schoolPoint
                ? formatDistanceKm(distanceKm(origin, schoolPoint))
                : null;
            return (
              <Surface key={item.id} as="li" className="flex h-full flex-col gap-3">
                <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-placeholder">
                  {photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={itemPhotoSrc(photo)}
                      alt=""
                      className="h-full w-full bg-placeholder object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-leaf" aria-hidden>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-10 w-10 opacity-70">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8l-9-4.5L3 8m18 0v8l-9 4.5M21 8l-9 4.5M3 8v8l9 4.5m0-8V21" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-1">
                  <Link
                    href={`/catalog/${item.id}`}
                    className="font-medium text-ink hover:text-ink hover:underline"
                  >
                    {item.title}
                  </Link>
                  <p className="text-sm text-ink">{item.institution.name}</p>
                  <p className="text-sm text-leaf">
                    {item.category.name} · {item.quantity} шт. · новое {formatByn(newPriceKop)}
                    {distanceLabel ? ` · ${distanceLabel}` : ""}
                  </p>
                  {matchesSkill ? (
                    <p className="text-xs font-medium text-leaf">Подходит вашим навыкам</p>
                  ) : null}
                  <p className="text-sm text-ink">
                    Бюджет школы {formatByn(item.repairBudgetKop)}
                  </p>
                </div>
                <ClaimItemForm
                  itemId={item.id}
                  defaultFeeKop={defaultFeeKop}
                  newPriceKop={newPriceKop}
                  schoolBudgetKop={item.repairBudgetKop}
                />
              </Surface>
            );
          })}
        </ul>
      )}
    </PageShell>
  );
}
