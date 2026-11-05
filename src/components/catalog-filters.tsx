import Link from "next/link";
import { conditionLabels, itemConditions, itemStatuses, statusLabels } from "@/domain/items/labels";
import { catalogHref, type CatalogQuery } from "@/domain/items/filters";

const controlClass = "rounded-lg border border-mint bg-paper px-3 py-2 text-sm text-ink";

export function CatalogFilters({
  query,
  districts,
  categories,
}: {
  query: CatalogQuery;
  districts: string[];
  categories: { slug: string; name: string }[];
}) {
  return (
    <form method="get" className="flex flex-col gap-3 rounded-xl border border-mint/70 p-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="flex flex-col gap-1 text-sm text-leaf">
          Район
          <select name="district" defaultValue={query.district ?? ""} className={controlClass}>
            <option value="">Все районы</option>
            {districts.map((district) => (
              <option key={district} value={district}>
                {district}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm text-leaf">
          Категория
          <select name="category" defaultValue={query.category ?? ""} className={controlClass}>
            <option value="">Все категории</option>
            {categories.map((category) => (
              <option key={category.slug} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm text-leaf">
          Состояние
          <select name="condition" defaultValue={query.condition ?? ""} className={controlClass}>
            <option value="">Любое</option>
            {itemConditions.map((condition) => (
              <option key={condition} value={condition}>
                {conditionLabels[condition]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm text-leaf">
          Статус
          <select name="status" defaultValue={query.status ?? ""} className={controlClass}>
            <option value="">Любой</option>
            {itemStatuses.map((status) => (
              <option key={status} value={status}>
                {statusLabels[status]}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className="h-10 rounded-lg bg-ink px-4 text-sm font-medium text-white hover:bg-leaf">
          Показать
        </button>
        <Link href={catalogHref({})} className="text-sm font-medium text-leaf hover:text-ink">
          Сбросить
        </Link>
      </div>
    </form>
  );
}
