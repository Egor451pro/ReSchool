import { CatalogFilters } from "@/components/catalog-filters";
import { ItemTile } from "@/components/item-tile";
import { PageHeader } from "@/components/ui/page-header";
import { PageShell, Surface } from "@/components/ui/surface";
import { readCatalogQuery } from "@/domain/items/filters";
import { compareCategorySlug, itemsCountLabel } from "@/domain/items/labels";
import { requireRoles } from "@/server/auth/current-user";
import { listCatalogItems, listCategories } from "@/server/repositories/item-repository";

export const instant = false;

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{
    district?: string | string[];
    category?: string | string[];
    condition?: string | string[];
    status?: string | string[];
  }>;
}) {
  const user = await requireRoles([
    "DONOR_STAFF",
    "FREELANCER",
    "DISTRICT_ANALYST",
    "PLATFORM_ADMIN",
  ]);
  const raw = await searchParams;
  const query = readCatalogQuery({
    district: raw.district,
    category: raw.category,
    condition: raw.condition,
    status: raw.status,
  });
  const [items, categories] = await Promise.all([listCatalogItems(query), listCategories()]);
  const orderedCategories = categories.sort((left, right) =>
    compareCategorySlug(left.slug, right.slug),
  );

  const description =
    user.role === "FREELANCER"
      ? "Обзор объявлений. Взять заказ в работу — на бирже; открытые карточки — в разделе «Заказы»."
      : "Свободные объявления района. Свои карточки публикуйте в кабинете; взять в работу — для фрилансеров.";

  const emptyText = query.category
    ? "По этой категории предметов нет."
    : query.condition || query.district
      ? "По выбранным фильтрам предметов нет."
      : "Пока нет свободных объявлений.";

  return (
    <PageShell>
      <PageHeader
        title="Каталог"
        description={`${description} В выдаче ${itemsCountLabel(items.length)}.`}
      />
      <CatalogFilters query={query} categories={orderedCategories} />
      {items.length === 0 ? (
        <Surface className="border-dashed text-sm text-leaf">{emptyText}</Surface>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <ItemTile key={item.id} item={item} showPlace />
          ))}
        </div>
      )}
    </PageShell>
  );
}
