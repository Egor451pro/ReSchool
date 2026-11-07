"use server";

import { redirect } from "next/navigation";
import { requireRoles } from "@/server/auth/current-user";
import { confirmRepairBySchool } from "@/server/services/document-service";
import {
  deletePublishedItem,
  publishItem,
  reviseItem,
  setRepairBudget,
  withdrawItem,
} from "@/server/services/item-service";
import { publishRequest } from "@/server/services/request-service";
import { revalidateItemListing, revalidateOrderViews } from "@/server/revalidate";
import { itemFormSchema, repairBudgetFormSchema, requestFormSchema } from "@/lib/validators/item";

export type ItemFormValues = {
  title: string;
  description: string;
  categoryId: string;
  condition: string;
  quantity: string;
  year: string;
  price: string;
  repairBudget: string;
};

export type RequestFormValues = {
  title: string;
  description: string;
  categoryId: string;
  quantity: string;
};

export type CabinetFormState = {
  error?: string;
  fields?: Partial<
    Record<
      | "categoryId"
      | "title"
      | "description"
      | "condition"
      | "quantity"
      | "year"
      | "newUnitPriceKop"
      | "repairBudgetKop",
      string
    >
  >;
  item?: ItemFormValues;
  request?: RequestFormValues;
};

const fieldKeys = [
  "categoryId",
  "title",
  "description",
  "condition",
  "quantity",
  "year",
  "newUnitPriceKop",
  "repairBudgetKop",
] as const;

function fieldMessages(error: { issues: { path: PropertyKey[]; message: string }[] }) {
  const fields: CabinetFormState["fields"] = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "");
    if (fieldKeys.includes(key as (typeof fieldKeys)[number]) && !fields[key as keyof typeof fields]) {
      fields[key as keyof NonNullable<CabinetFormState["fields"]>] = issue.message;
    }
  }
  return fields;
}

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function readPhoto(formData: FormData): File | null {
  const value = formData.get("photo");
  if (!(value instanceof File) || value.size === 0) return null;
  return value;
}

function readItemValues(formData: FormData): ItemFormValues {
  return {
    categoryId: text(formData, "categoryId"),
    title: text(formData, "title"),
    description: text(formData, "description"),
    condition: text(formData, "condition"),
    quantity: text(formData, "quantity"),
    year: text(formData, "year"),
    price: text(formData, "price"),
    repairBudget: text(formData, "repairBudget"),
  };
}

function readRequestValues(formData: FormData): RequestFormValues {
  return {
    categoryId: text(formData, "categoryId"),
    title: text(formData, "title"),
    description: text(formData, "description"),
    quantity: text(formData, "quantity"),
  };
}

function readItem(formData: FormData) {
  const item = readItemValues(formData);
  return {
    item,
    parsed: itemFormSchema.safeParse({
      categoryId: item.categoryId,
      title: item.title,
      description: item.description,
      condition: item.condition,
      quantity: item.quantity,
      year: item.year,
      newUnitPriceKop: item.price,
      repairBudgetKop: item.repairBudget,
    }),
  };
}

export type RepairBudgetFormState = {
  error?: string;
  budget?: string;
};

export async function updateRepairBudgetAction(
  _state: RepairBudgetFormState,
  formData: FormData,
): Promise<RepairBudgetFormState> {
  const itemId = text(formData, "itemId");
  const budget = text(formData, "repairBudget");
  const maxKopRaw = text(formData, "maxKop");
  const maxKop = Number(maxKopRaw);
  const parsed = repairBudgetFormSchema.safeParse({
    repairBudgetKop: budget,
    maxKop: Number.isFinite(maxKop) && maxKop > 0 ? maxKop : 1,
  });
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Проверьте сумму";
    return { error: message, budget };
  }

  const actor = await requireRoles(["DONOR_STAFF"]);
  const result = await setRepairBudget(actor, itemId, parsed.data.repairBudgetKop);
  if (!result.ok) return { error: result.error, budget };
  revalidateItemListing(itemId);
  return { budget };
}

export async function publishItemAction(
  _state: CabinetFormState,
  formData: FormData,
): Promise<CabinetFormState> {
  const { item, parsed } = readItem(formData);
  if (!parsed.success) {
    return { error: "Проверьте поля карточки", fields: fieldMessages(parsed.error), item };
  }

  const actor = await requireRoles(["DONOR_STAFF"]);
  const result = await publishItem(actor, parsed.data, readPhoto(formData));
  if (!result.ok) return { error: result.error, item };
  revalidateItemListing(result.itemId);
  redirect(`/catalog/${result.itemId}`);
}

export async function reviseItemAction(
  _state: CabinetFormState,
  formData: FormData,
): Promise<CabinetFormState> {
  const itemId = text(formData, "itemId");
  const { item, parsed } = readItem(formData);
  if (!parsed.success) {
    return { error: "Проверьте поля карточки", fields: fieldMessages(parsed.error), item };
  }

  const actor = await requireRoles(["DONOR_STAFF"]);
  const result = await reviseItem(actor, itemId, parsed.data, readPhoto(formData));
  if (!result.ok) return { error: result.error, item };
  revalidateItemListing(result.itemId);
  redirect(`/catalog/${result.itemId}`);
}

export async function withdrawItemAction(
  _state: CabinetFormState,
  formData: FormData,
): Promise<CabinetFormState> {
  if (formData.get("confirm") !== "on") {
    return { error: "Отметьте, что карточку нужно снять" };
  }
  const actor = await requireRoles(["DONOR_STAFF"]);
  const itemId = text(formData, "itemId");
  const result = await withdrawItem(actor, itemId);
  if (!result.ok) return { error: result.error };
  revalidateItemListing(itemId);
  redirect("/cabinet");
}

export type DeleteItemState = { error?: string };

export async function deleteItemAction(
  _state: DeleteItemState,
  formData: FormData,
): Promise<DeleteItemState> {
  if (formData.get("confirm") !== "on") {
    return { error: "Отметьте подтверждение удаления" };
  }
  const actor = await requireRoles(["DONOR_STAFF"]);
  const itemId = text(formData, "itemId");
  const result = await deletePublishedItem(actor, itemId);
  if (!result.ok) return { error: result.error };
  revalidateItemListing(itemId);
  redirect("/cabinet");
}

export async function publishRequestAction(
  _state: CabinetFormState,
  formData: FormData,
): Promise<CabinetFormState> {
  const request = readRequestValues(formData);
  const parsed = requestFormSchema.safeParse(request);
  if (!parsed.success) {
    return { error: "Проверьте поля запроса", fields: fieldMessages(parsed.error), request };
  }

  const actor = await requireRoles(["DONOR_STAFF"]);
  const result = await publishRequest(actor, parsed.data);
  if (!result.ok) return { error: result.error, request };
  redirect("/cabinet#needs");
}

export type ConfirmRepairState = { error?: string };

export async function confirmRepairAction(
  _state: ConfirmRepairState,
  formData: FormData,
): Promise<ConfirmRepairState> {
  const actor = await requireRoles(["DONOR_STAFF"]);
  const itemId = text(formData, "itemId");
  const result = await confirmRepairBySchool(actor, itemId);
  if (!result.ok) return { error: result.error };
  // Без revalidate страница кабинета остаётся со старым RSC-снимком.
  revalidateOrderViews({ itemId });
  redirect("/cabinet");
}
