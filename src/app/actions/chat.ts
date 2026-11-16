"use server";

import { requireRolesFresh } from "@/server/auth/current-user";
import { revalidateOrderViews } from "@/server/revalidate";
import {
  sendOrderChatMessage,
  type ChatMessageDto,
} from "@/server/services/chat-service";

export type ChatFormState = {
  error?: string;
  message?: ChatMessageDto;
};

export async function sendChatMessageAction(
  _state: ChatFormState,
  formData: FormData,
): Promise<ChatFormState> {
  const actor = await requireRolesFresh(["DONOR_STAFF", "FREELANCER", "PLATFORM_ADMIN"]);
  const orderId = String(formData.get("orderId") ?? "");
  const body = String(formData.get("body") ?? "");
  const result = await sendOrderChatMessage(actor, orderId, body);
  if (!result.ok) return { error: result.error };
  revalidateOrderViews({ orderId, itemId: result.itemId });
  return { message: result.message };
}
