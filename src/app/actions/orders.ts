"use server";

import { redirect } from "next/navigation";
import { parseBynToKop } from "@/domain/economy/money";
import { requireRoles } from "@/server/auth/current-user";
import {
  acceptOrderProposal,
  advanceOrder,
  cancelOrder,
  claimListedItem,
  markOrderUnrepairable,
  proposeOrderPrice,
} from "@/server/services/order-service";
import { revalidateOrderViews } from "@/server/revalidate";

export type OrderFormState = { error?: string };

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function parseFee(formData: FormData, key = "feeByn"): { ok: true; kop: number } | { ok: false; error: string } {
  try {
    return { ok: true, kop: parseBynToKop(text(formData, key)) };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Укажите цену в белорусских рублях",
    };
  }
}

export async function claimItemAction(
  _state: OrderFormState,
  formData: FormData,
): Promise<OrderFormState> {
  const actor = await requireRoles(["FREELANCER"]);
  const fee = parseFee(formData);
  if (!fee.ok) return { error: fee.error };

  const result = await claimListedItem(actor, {
    itemId: text(formData, "itemId"),
    agreedFeeKop: fee.kop,
  });
  if (!result.ok) return { error: result.error };
  revalidateOrderViews({ orderId: result.orderId, itemId: result.itemId });
  redirect(result.orderId ? `/orders/${result.orderId}` : "/orders");
}

export async function proposePriceAction(
  _state: OrderFormState,
  formData: FormData,
): Promise<OrderFormState> {
  const actor = await requireRoles(["FREELANCER", "DONOR_STAFF", "PLATFORM_ADMIN"]);
  const fee = parseFee(formData);
  if (!fee.ok) return { error: fee.error };

  const orderId = text(formData, "orderId");
  const result = await proposeOrderPrice(actor, { orderId, amountKop: fee.kop });
  if (!result.ok) return { error: result.error };
  revalidateOrderViews({ orderId, itemId: result.itemId });
  if (actor.role === "DONOR_STAFF" && result.itemId) {
    redirect(`/cabinet/items/${result.itemId}`);
  }
  redirect(`/orders/${orderId}`);
}

export async function acceptOrderAction(
  _state: OrderFormState,
  formData: FormData,
): Promise<OrderFormState> {
  const actor = await requireRoles(["DONOR_STAFF", "PLATFORM_ADMIN"]);
  const result = await acceptOrderProposal(actor, text(formData, "orderId"));
  if (!result.ok) return { error: result.error };
  revalidateOrderViews({ orderId: result.orderId, itemId: result.itemId });
  redirect(result.itemId ? `/cabinet/items/${result.itemId}` : "/cabinet");
}

export async function advanceOrderAction(
  _state: OrderFormState,
  formData: FormData,
): Promise<OrderFormState> {
  const actor = await requireRoles(["FREELANCER", "PLATFORM_ADMIN"]);
  const orderId = text(formData, "orderId");
  const result = await advanceOrder(actor, orderId);
  if (!result.ok) return { error: result.error };
  revalidateOrderViews({ orderId, itemId: result.itemId });
  redirect(`/orders/${orderId}`);
}

export async function cancelOrderAction(
  _state: OrderFormState,
  formData: FormData,
): Promise<OrderFormState> {
  const actor = await requireRoles(["FREELANCER", "PLATFORM_ADMIN"]);
  const result = await cancelOrder(actor, text(formData, "orderId"));
  if (!result.ok) return { error: result.error };
  revalidateOrderViews({ orderId: result.orderId, itemId: result.itemId });
  redirect("/orders");
}

export async function unrepairableOrderAction(
  _state: OrderFormState,
  formData: FormData,
): Promise<OrderFormState> {
  const actor = await requireRoles(["FREELANCER", "PLATFORM_ADMIN"]);
  const result = await markOrderUnrepairable(actor, text(formData, "orderId"));
  if (!result.ok) return { error: result.error };
  revalidateOrderViews({ orderId: result.orderId, itemId: result.itemId });
  redirect("/orders");
}
