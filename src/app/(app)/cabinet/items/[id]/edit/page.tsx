import Link from "next/link";
import { notFound } from "next/navigation";
import { DeleteItemButton } from "@/components/delete-item-button";
import { ItemForm } from "@/components/item-form";
import { formatBynAmount } from "@/domain/economy/money";
import { itemManageState } from "@/domain/items/access";
import { compareCategorySlug, statusLabels } from "@/domain/items/labels";
import { itemPhotoSrc } from "@/domain/items/photo";
import { requireRoles } from "@/server/auth/current-user";
import { findItemForEdit, listCategories } from "@/server/repositories/item-repository";

export const instant = false;

export default async function EditItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireRoles(["DONOR_STAFF", "WORKSHOP_MASTER"]);
  const item = await findItemForEdit(id);
  if (!item) notFound();

  const manage = itemManageState(user, item);
  const photo = item.photos[0];

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-8">
      <div className="flex max-w-xl flex-col gap-2">
        <Link href={`/catalog/${item.id}`} className="text-sm font-medium text-leaf hover:text-ink">
          К карточке
        </Link>
        <h1 className="text-2xl font-semibold text-ink">{item.title}</h1>
      </div>

      {manage === "foreign" ? (
        <p className="max-w-xl text-leaf">Это карточка другого учреждения.</p>
      ) : null}

      {manage === "locked" ? (
        <p className="max-w-xl text-leaf">
          Править карточку можно, пока она опубликована. Сейчас статус — {statusLabels[item.status]}.
        </p>
      ) : null}

      {manage === "edit" ? (
        <div className="grid max-w-xl gap-6">
          <section className="rounded-xl border border-mint/70 p-4">
            <ItemForm
              itemId={item.id}
              categories={(await listCategories()).sort((left, right) =>
                compareCategorySlug(left.slug, right.slug),
              )}
              currentPhotoSrc={photo ? itemPhotoSrc(photo) : undefined}
              defaults={{
                title: item.title,
                description: item.description,
                categoryId: item.categoryId,
                condition: item.condition,
                quantity: String(item.quantity),
                year: item.year ? String(item.year) : "",
                price: formatBynAmount(item.newUnitPriceKop),
              }}
            />
          </section>
          <div>
            <h2 className="mb-2 text-sm font-medium text-ink">Удалить карточку</h2>
            <DeleteItemButton itemId={item.id} />
          </div>
        </div>
      ) : null}
    </main>
  );
}
