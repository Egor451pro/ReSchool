import Link from "next/link";
import { ItemForm } from "@/components/item-form";
import { ItemTile } from "@/components/item-tile";
import { PageHeader } from "@/components/ui/page-header";
import { PageShell, Surface } from "@/components/ui/surface";
import { compareCategorySlug, itemsCountLabel } from "@/domain/items/labels";
import { requireRoles } from "@/server/auth/current-user";
import { listCategories, listInstitutionItems } from "@/server/repositories/item-repository";

export const instant = false;

export default async function CabinetPage() {
  const user = await requireRoles(["DONOR_STAFF", "PLATFORM_ADMIN"]);
  const categories = (await listCategories()).sort((left, right) =>
    compareCategorySlug(left.slug, right.slug),
  );

  if (!user.institutionId) {
    return (
      <PageShell>
        <PageHeader
          title="Кабинет"
          description="Публикация идёт от имени школы. Перейдите в каталог или к участникам."
          actions={
            <div className="flex flex-wrap gap-2">
              <Link href="/catalog" className="btn-primary btn-sm">
                Каталог
              </Link>
              <Link href="/admin" className="btn-ghost btn-sm">
                Участники
              </Link>
            </div>
          }
        />
      </PageShell>
    );
  }

  const items = await listInstitutionItems(user.institutionId);

  return (
    <PageShell>
      <PageHeader
        title="Кабинет"
        description={`${user.institutionName}. Сейчас ${itemsCountLabel(items.length)}.`}
        banner="Опубликуйте вещь, которую можно починить. Мастерская возьмёт её в работу как учебное задание."
      />

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-ink">Мои предметы</h2>
          {items.length === 0 ? (
            <Surface className="border-dashed text-sm text-leaf">
              Пока пусто. Добавьте первую карточку формой справа.
            </Surface>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {items.map((item) => (
                <ItemTile key={item.id} item={item} />
              ))}
            </div>
          )}
        </section>
        <Surface as="section" className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-ink">Новый предмет</h2>
          <ItemForm categories={categories} />
        </Surface>
      </div>
    </PageShell>
  );
}
