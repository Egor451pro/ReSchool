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
      <form method="get" className="flex flex-wrap items-end gap-3">
        <label className="flex min-w-[12rem] flex-1 flex-col gap-1 text-sm text-leaf">
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
        <button type="submit" className="btn-primary btn-sm">
          Показать
        </button>
        <Link href={catalogHref({})} className="btn-ghost btn-sm">
          Сбросить
        </Link>
      </form>
    </Surface>
  );
}
