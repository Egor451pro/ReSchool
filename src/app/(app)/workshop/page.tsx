import Link from "next/link";
import { ClaimItemForm } from "@/components/claim-item-form";
import { PageHeader } from "@/components/ui/page-header";
import { PageShell, Surface } from "@/components/ui/surface";
import { itemPhotoSrc } from "@/domain/items/photo";
import { requireRoles } from "@/server/auth/current-user";
import { listExchangeItems, listMasterGroups } from "@/server/repositories/order-repository";

export const instant = false;

export default async function WorkshopPage() {
  const user = await requireRoles(["WORKSHOP_MASTER", "PLATFORM_ADMIN"]);
  const groups = user.role === "WORKSHOP_MASTER" ? await listMasterGroups(user.id) : [];
  const specialtyIds = [...new Set(groups.map((group) => group.specialtyId))];
  const rawItems =
    user.role === "PLATFORM_ADMIN" && specialtyIds.length === 0
      ? []
      : await listExchangeItems(specialtyIds);

  const items = rawItems.map((item) => {
    const matchingGroups = groups.filter((group) =>
      item.category.specialties.some((link) => link.specialtyId === group.specialtyId),
    );
    return { item, matchingGroups };
  });

  return (
    <PageShell>
      <PageHeader
        title="Биржа"
        description={`${user.institutionName ?? "Платформа"}. Здесь предметы школ, подходящие вашим группам.`}
        banner="Выберите предмет и нажмите «Взять в работу» — заказ появится в разделе «Заказы»."
      />

      {groups.length === 0 ? (
        <Surface className="text-sm text-leaf">
          {user.role === "PLATFORM_ADMIN"
            ? "Администратор смотрит разделы без своей группы. Войдите профилем «Мастерская», чтобы брать заказы."
            : "У этой учётки нет учебных групп."}
        </Surface>
      ) : null}

      {items.length === 0 ? (
        <Surface className="border-dashed text-sm text-leaf">
          Сейчас нет опубликованных заданий. Загляните позже.
        </Surface>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map(({ item, matchingGroups }) => {
            const photo = item.photos[0];
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
                  <p className="text-sm text-leaf">{item.institution.name}</p>
                  <p className="text-sm text-leaf">
                    {item.category.name} · {item.quantity} шт.
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
              </Surface>
            );
          })}
        </ul>
      )}
    </PageShell>
  );
}
