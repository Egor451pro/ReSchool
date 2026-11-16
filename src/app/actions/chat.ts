"use server";

import { requireRoles } from "@/server/auth/current-user";
import {
  listOrderChatDtos,
  sendOrderChatMessage,
  type ChatMessageDto,
} from "@/server/services/chat-service";

export type ChatFormState = {
  error?: string;
  message?: ChatMessageDto;
};

/**
 * Чат живёт через SSE + polling — без revalidate/refresh на каждое сообщение,
 * иначе страница целиком пересобирается и ответ «висит» несколько секунд.
 */
export async function sendChatMessageAction(
  _state: ChatFormState,
  formData: FormData,
): Promise<ChatFormState> {
  const actor = await requireRoles(["DONOR_STAFF", "FREELANCER", "PLATFORM_ADMIN"]);
  const orderId = String(formData.get("orderId") ?? "");
  const body = String(formData.get("body") ?? "");
  const result = await sendOrderChatMessage(actor, orderId, body);
  if (!result.ok) return { error: result.error };
  return { message: result.message };
}

/** Лёгкий poll (~1.5 с) — страховка, если SSE и Action на разных копиях модуля. */
export async function listOrderChatMessagesAction(
  orderId: string,
): Promise<{ ok: true; messages: ChatMessageDto[] } | { ok: false; error: string }> {
  const actor = await requireRoles(["DONOR_STAFF", "FREELANCER", "PLATFORM_ADMIN"]);
  const messages = await listOrderChatDtos(actor, orderId);
  if (!messages) return { ok: false, error: "Чат недоступен" };
  return { ok: true, messages };
}
