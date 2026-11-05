import { itemConditions, itemStatuses, type ItemCondition, type ItemStatus } from "./labels";

export type CatalogQuery = {
  district?: string;
  category?: string;
  condition?: ItemCondition;
  status?: ItemStatus;
};

type Raw = string | string[] | undefined;

function first(value: Raw): string {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw?.trim() ?? "";
}

const conditions = new Set<string>(itemConditions);
const statuses = new Set<string>(itemStatuses);

export function readCatalogQuery(input: {
  district?: Raw;
  category?: Raw;
  condition?: Raw;
  status?: Raw;
}): CatalogQuery {
  const district = first(input.district);
  const category = first(input.category);
  const condition = first(input.condition);
  const status = first(input.status);

  return {
    district: district || undefined,
    category: /^[a-z0-9-]+$/.test(category) ? category : undefined,
    condition: conditions.has(condition) ? (condition as ItemCondition) : undefined,
    status: statuses.has(status) ? (status as ItemStatus) : undefined,
  };
}

export function catalogHref(query: CatalogQuery): string {
  const params = new URLSearchParams();
  if (query.district) params.set("district", query.district);
  if (query.category) params.set("category", query.category);
  if (query.condition) params.set("condition", query.condition);
  if (query.status) params.set("status", query.status);
  const search = params.toString();
  return search ? `/catalog?${search}` : "/catalog";
}
