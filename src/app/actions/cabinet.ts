"use server";

import { redirect } from "next/navigation";
import { requireRoles } from "@/server/auth/current-user";
import { confirmRepairBySchool } from "@/server/services/document-service";
import {
  deletePublishedItem,
  publishItem,
  reviseItem,
  withdrawItem,
} from "@/server/services/item-service";
import { publishRequest } from "@/server/services/request-service";
import { revalidateAppViews } from "@/server/revalidate";
import { itemFormSchema, requestFormSchema } from "@/lib/validators/item";

export type ItemFormValues = {
  title: string;
  description: string;
  categoryId: string;
  condition: string;
  quantity: string;
  year: string;
  price: string;
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
      | "newUnitPriceKop",
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
    }),
  };
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
  revalidateAppViews();
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
  revalidateAppViews();
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
  const result = await withdrawItem(actor, text(formData, "itemId"));
  if (!result.ok) return { error: result.error };
  revalidateAppViews();
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
  const result = await deletePublishedItem(actor, text(formData, "itemId"));
  if (!result.ok) return { error: result.error };
  revalidateAppViews();
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
  const result = await confirmRepairBySchool(actor, text(formData, "itemId"));
  if (!result.ok) return { error: result.error };
  // Без revalidate страница кабинета остаётся со старым RSC-снимком.
  revalidateAppViews();
  redirect("/cabinet");
}
