"use server";

import { redirect } from "next/navigation";
import { requireRoles } from "@/server/auth/current-user";
import {
  advanceOrder,
  cancelOrder,
  claimListedItem,
  markOrderDelivered,
  markOrderUnrepairable,
} from "@/server/services/order-service";

export type OrderFormState = { error?: string };

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function claimItemAction(
  _state: OrderFormState,
  formData: FormData,
): Promise<OrderFormState> {
  const actor = await requireRoles(["WORKSHOP_MASTER", "PLATFORM_ADMIN"]);
  const result = await claimListedItem(actor, {
    itemId: text(formData, "itemId"),
    groupId: text(formData, "groupId"),
  });
  if (!result.ok) return { error: result.error };
  redirect("/orders");
}

export async function advanceOrderAction(
  _state: OrderFormState,
  formData: FormData,
): Promise<OrderFormState> {
  const actor = await requireRoles(["WORKSHOP_MASTER", "PLATFORM_ADMIN"]);
  const result = await advanceOrder(actor, text(formData, "orderId"));
  if (!result.ok) return { error: result.error };
  redirect("/orders");
}

export async function cancelOrderAction(
  _state: OrderFormState,
  formData: FormData,
): Promise<OrderFormState> {
  const actor = await requireRoles(["WORKSHOP_MASTER", "PLATFORM_ADMIN"]);
  const result = await cancelOrder(actor, text(formData, "orderId"));
  if (!result.ok) return { error: result.error };
  redirect("/orders");
}

export async function deliverOrderAction(
  _state: OrderFormState,
  formData: FormData,
): Promise<OrderFormState> {
  const actor = await requireRoles(["WORKSHOP_MASTER", "PLATFORM_ADMIN"]);
  const result = await markOrderDelivered(actor, text(formData, "orderId"));
  if (!result.ok) return { error: result.error };
  redirect("/orders");
}

export async function unrepairableOrderAction(
  _state: OrderFormState,
  formData: FormData,
): Promise<OrderFormState> {
  const actor = await requireRoles(["WORKSHOP_MASTER", "PLATFORM_ADMIN"]);
  const result = await markOrderUnrepairable(actor, text(formData, "orderId"));
  if (!result.ok) return { error: result.error };
  redirect("/orders");
}
