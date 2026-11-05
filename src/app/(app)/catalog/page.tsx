import { CatalogFilters } from "@/components/catalog-filters";
import { ItemTile } from "@/components/item-tile";
import { readCatalogQuery } from "@/domain/items/filters";
import { compareCategorySlug, itemsCountLabel } from "@/domain/items/labels";
import { requireRoles } from "@/server/auth/current-user";
import { listDistricts } from "@/server/repositories/institution-repository";
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
  await requireRoles(["DONOR_STAFF", "WORKSHOP_MASTER", "DISTRICT_ANALYST", "PLATFORM_ADMIN"]);
  const query = readCatalogQuery(await searchParams);
  const [items, categories, districts] = await Promise.all([
    listCatalogItems(query),
    listCategories(),
    listDistricts(),
  ]);
  const orderedCategories = categories.sort((left, right) => compareCategorySlug(left.slug, right.slug));

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-ink">Каталог</h1>
        <p className="max-w-3xl text-leaf">
          Предметы учреждений района. Лом виден для учёта, в ремонт его не берут. В списке{" "}
          {itemsCountLabel(items.length)}.
        </p>
      </div>
      <CatalogFilters query={query} districts={districts} categories={orderedCategories} />
      {items.length === 0 ? (
        <p className="text-leaf">По этим фильтрам предметов нет.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <ItemTile key={item.id} item={item} showPlace />
          ))}
        </div>
      )}
    </main>
  );
}
