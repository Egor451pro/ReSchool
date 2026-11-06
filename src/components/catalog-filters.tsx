import Link from "next/link";
import { catalogHref, type CatalogQuery } from "@/domain/items/filters";
import { Surface } from "@/components/ui/surface";

export function CatalogFilters({
  query,
  categories,
}: {
  query: CatalogQuery;
  categories: { slug: string; name: string }[];
}) {
  return (
    <Surface>
      <form method="get" className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <label className="flex w-full min-w-0 flex-1 flex-col gap-1 text-sm text-leaf sm:min-w-[12rem]">
          Категория
          <select name="category" defaultValue={query.category ?? ""} className="field">
            <option value="">Все категории</option>
            {categories.map((category) => (
              <option key={category.slug} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <div className="flex flex-wrap gap-2">
          <button type="submit" className="btn-primary btn-sm flex-1 sm:flex-none">
            Показать
          </button>
          <Link href={catalogHref({})} className="btn-ghost btn-sm flex-1 sm:flex-none">
            Сбросить
          </Link>
        </div>
      </form>
    </Surface>
  );
}
