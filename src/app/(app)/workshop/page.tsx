import Link from "next/link";
import { ClaimItemForm } from "@/components/claim-item-form";
import { PageHeader } from "@/components/ui/page-header";
import { PageShell, Surface } from "@/components/ui/surface";
import { itemPhotoSrc } from "@/domain/items/photo";
import { requireRoles } from "@/server/auth/current-user";
import { listExchangeItems, listMasterGroups } from "@/server/repositories/order-repository";

export const instant = false;

export default async function WorkshopPage() {
  const user = await requireRoles(["WORKSHOP_MASTER"]);
  const groups = await listMasterGroups(user.id);
  const items = await listExchangeItems();

  return (
    <PageShell>
      <PageHeader
        title="Биржа"
        description="Все свободные объявления района. Возьмите любой подходящий заказ."
        banner="Нажмите «Взять в работу» — заказ появится в разделе «Заказы»."
      />

      {groups.length === 0 ? (
        <Surface className="text-sm text-leaf">
          У этой учётки нет учебной группы — взять заказ пока нельзя.
        </Surface>
      ) : null}

      {items.length === 0 ? (
        <Surface className="border-dashed text-sm text-leaf">
          Сейчас нет опубликованных заданий. Загляните позже.
        </Surface>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
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
                  <p className="text-sm text-ink">{item.institution.name}</p>
                  <p className="text-sm text-leaf">
                    {item.category.name} · {item.quantity} шт.
                  </p>
                </div>
                {groups.length > 0 ? (
                  <ClaimItemForm itemId={item.id} groupId={groups[0].id} />
                ) : null}
              </Surface>
            );
          })}
        </ul>
      )}
    </PageShell>
  );
}
