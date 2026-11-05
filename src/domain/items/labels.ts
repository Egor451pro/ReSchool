import { closeReasons, itemStatuses, type CloseReason, type ItemStatus } from "@/domain/workflow/item-lifecycle";

export const itemConditions = ["WORKING", "REPAIRABLE", "SCRAP"] as const;
export type ItemCondition = (typeof itemConditions)[number];

export const requestStatuses = ["OPEN", "MATCHED", "CLOSED"] as const;
export type RequestStatus = (typeof requestStatuses)[number];

export { closeReasons, itemStatuses };
export type { CloseReason, ItemStatus };

export const conditionLabels: Record<ItemCondition, string> = {
  WORKING: "Исправно",
  REPAIRABLE: "Подлежит ремонту",
  SCRAP: "Лом",
};

export const statusLabels: Record<ItemStatus, string> = {
  LISTED: "Опубликовано",
  REQUESTED: "Запрошено",
  IN_REPAIR: "В ремонте",
  READY: "Готово",
  DELIVERED: "Передано",
  CLOSED: "Закрыто",
};

export const closeReasonLabels: Record<CloseReason, string> = {
  COMPLETED: "Работа завершена",
  WITHDRAWN: "Снято учреждением",
  UNREPAIRABLE: "Ремонт нецелесообразен",
};

export const requestStatusLabels: Record<RequestStatus, string> = {
  OPEN: "Открыт",
  MATCHED: "Подобран предмет",
  CLOSED: "Закрыт",
};

export const categorySlugOrder = [
  "furniture",
  "computers",
  "lab",
  "tools",
  "sport",
  "other",
] as const;

export function compareCategorySlug(left: string, right: string): number {
  const rank = (slug: string) => {
    const index = categorySlugOrder.indexOf(slug as (typeof categorySlugOrder)[number]);
    return index === -1 ? categorySlugOrder.length : index;
  };
  return rank(left) - rank(right);
}

export function itemsCountLabel(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return `${count} предмет`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${count} предмета`;
  return `${count} предметов`;
}
