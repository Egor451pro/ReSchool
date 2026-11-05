"use server";

import { revalidatePath } from "next/cache";
import { requireRoles } from "@/server/auth/current-user";
import { sendOrderChatMessage } from "@/server/services/chat-service";

export type ChatFormState = { error?: string };

export async function sendChatMessageAction(
  _state: ChatFormState,
  formData: FormData,
): Promise<ChatFormState> {
  const actor = await requireRoles(["DONOR_STAFF", "FREELANCER", "PLATFORM_ADMIN"]);
  const orderId = String(formData.get("orderId") ?? "");
  const body = String(formData.get("body") ?? "");
  const result = await sendOrderChatMessage(actor, orderId, body);
  if (!result.ok) return { error: result.error };
  revalidatePath("/orders");
  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/cabinet");
  if (result.itemId) {
    revalidatePath(`/catalog/${result.itemId}`);
    revalidatePath(`/cabinet/items/${result.itemId}`);
  }
  return {};
}
