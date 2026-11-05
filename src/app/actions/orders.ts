"use server";

import { redirect } from "next/navigation";
import { parseBynToKop } from "@/domain/economy/money";
import { requireRoles } from "@/server/auth/current-user";
import {
  acceptOrderProposal,
  advanceOrder,
  cancelOrder,
  claimListedItem,
  markOrderDelivered,
  markOrderUnrepairable,
} from "@/server/services/order-service";
import { closeDeliveredOrder } from "@/server/services/economy-service";
import { revalidateAppViews } from "@/server/revalidate";

export type OrderFormState = { error?: string };

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function claimItemAction(
  _state: OrderFormState,
  formData: FormData,
): Promise<OrderFormState> {
  const actor = await requireRoles(["FREELANCER"]);
  const feeRaw = text(formData, "feeByn");
  let agreedFeeKop = 0;
  try {
    agreedFeeKop = parseBynToKop(feeRaw);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Укажите цену в белорусских рублях",
    };
  }

  const result = await claimListedItem(actor, {
    itemId: text(formData, "itemId"),
    agreedFeeKop,
  });
  if (!result.ok) return { error: result.error };
  revalidateAppViews();
  redirect("/orders");
}

export async function acceptOrderAction(
  _state: OrderFormState,
  formData: FormData,
): Promise<OrderFormState> {
  const actor = await requireRoles(["DONOR_STAFF", "PLATFORM_ADMIN"]);
  const result = await acceptOrderProposal(actor, text(formData, "orderId"));
  if (!result.ok) return { error: result.error };
  revalidateAppViews();
  redirect("/cabinet");
}

export async function advanceOrderAction(
  _state: OrderFormState,
  formData: FormData,
): Promise<OrderFormState> {
  const actor = await requireRoles(["FREELANCER", "PLATFORM_ADMIN"]);
  const result = await advanceOrder(actor, text(formData, "orderId"));
  if (!result.ok) return { error: result.error };
  revalidateAppViews();
  redirect("/orders");
}

export async function cancelOrderAction(
  _state: OrderFormState,
  formData: FormData,
): Promise<OrderFormState> {
  const actor = await requireRoles(["FREELANCER", "PLATFORM_ADMIN"]);
  const result = await cancelOrder(actor, text(formData, "orderId"));
  if (!result.ok) return { error: result.error };
  revalidateAppViews();
  redirect("/orders");
}

export async function deliverOrderAction(
  _state: OrderFormState,
  formData: FormData,
): Promise<OrderFormState> {
  const actor = await requireRoles(["FREELANCER", "PLATFORM_ADMIN"]);
  const result = await markOrderDelivered(actor, text(formData, "orderId"));
  if (!result.ok) return { error: result.error };
  revalidateAppViews();
  redirect("/orders");
}

export async function unrepairableOrderAction(
  _state: OrderFormState,
  formData: FormData,
): Promise<OrderFormState> {
  const actor = await requireRoles(["FREELANCER", "PLATFORM_ADMIN"]);
  const result = await markOrderUnrepairable(actor, text(formData, "orderId"));
  if (!result.ok) return { error: result.error };
  revalidateAppViews();
  redirect("/orders");
}

export async function closeOrderAction(
  _state: OrderFormState,
  formData: FormData,
): Promise<OrderFormState> {
  const actor = await requireRoles(["FREELANCER", "PLATFORM_ADMIN"]);
  const result = await closeDeliveredOrder(actor, text(formData, "orderId"));
  if (!result.ok) return { error: result.error };
  revalidateAppViews();
  redirect("/orders");
}
