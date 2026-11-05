import Link from "next/link";
import { ClaimItemForm } from "@/components/claim-item-form";
import { conditionLabels } from "@/domain/items/labels";
import { itemPhotoSrc } from "@/domain/items/photo";
import { formatByn } from "@/domain/economy/money";
import { distanceKm, formatDistanceKm } from "@/domain/workflow/distance";
import { requireRoles } from "@/server/auth/current-user";
import {
  findWorkshopCoords,
  listExchangeItems,
  listMasterGroups,
} from "@/server/repositories/order-repository";

export const instant = false;

export default async function WorkshopPage() {
  const user = await requireRoles(["WORKSHOP_MASTER", "PLATFORM_ADMIN"]);
  const groups = user.role === "WORKSHOP_MASTER" ? await listMasterGroups(user.id) : [];
  const specialtyIds = [...new Set(groups.map((group) => group.specialtyId))];
  const workshop = user.institutionId ? await findWorkshopCoords(user.institutionId) : null;
  const rawItems =
    user.role === "PLATFORM_ADMIN" && specialtyIds.length === 0
      ? []
      : await listExchangeItems(specialtyIds);

  const items = rawItems
    .map((item) => {
      const matchingGroups = groups.filter((group) =>
        item.category.specialties.some((link) => link.specialtyId === group.specialtyId),
      );
      const km =
        workshop != null
          ? distanceKm(
              { lat: workshop.lat, lng: workshop.lng },
              { lat: item.institution.lat, lng: item.institution.lng },
            )
          : null;
      return { item, matchingGroups, km };
    })
    .sort((left, right) => (left.km ?? 999) - (right.km ?? 999));

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-ink">Биржа заданий</h1>
        <p className="max-w-3xl text-leaf">
          {user.institutionName ?? "Платформа"}. Здесь предметы, подходящие специальностям ваших
          групп. Ближе к мастерской — выше в списке. Лом не показываем.
        </p>
      </div>

      {groups.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {groups.map((group) => (
            <li
              key={group.id}
              className="rounded-full bg-mint/35 px-3 py-1.5 text-sm font-medium text-ink"
            >
              {group.name} · {group.specialty.name}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-leaf">
          {user.role === "PLATFORM_ADMIN"
            ? "Администратор смотрит разделы без своей группы. Войдите мастером, чтобы брать заказы."
            : "У этой учётки нет учебных групп."}
        </p>
      )}

      {items.length === 0 ? (
        <p className="text-leaf">Сейчас нет опубликованных заданий под ваши специальности.</p>
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {items.map(({ item, matchingGroups, km }) => {
            const photo = item.photos[0];
            return (
              <li
                key={item.id}
                className="flex flex-col gap-4 rounded-xl border border-mint/70 p-4 sm:flex-row"
              >
                <div className="aspect-[4/3] w-full shrink-0 overflow-hidden rounded-lg bg-mint/20 sm:w-40">
                  {photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={itemPhotoSrc(photo)} alt="" className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-3">
                  <div className="flex flex-col gap-1">
                    <Link
                      href={`/catalog/${item.id}`}
                      className="font-medium text-ink hover:text-leaf"
                    >
                      {item.title}
                    </Link>
                    <p className="text-sm text-leaf">
                      {item.institution.name}
                      {km != null ? ` · ${formatDistanceKm(km)}` : ""}
                    </p>
                    <p className="text-sm text-leaf">
                      {item.category.name} · {conditionLabels[item.condition]} · {item.quantity} шт. ·{" "}
                      {formatByn(item.newUnitPriceKop)}
                    </p>
                  </div>
                  <ClaimItemForm
                    itemId={item.id}
                    groups={matchingGroups.map((group) => ({
                      id: group.id,
                      name: group.name,
                      specialtyName: group.specialty.name,
                    }))}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
