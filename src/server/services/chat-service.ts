import "server-only";

import type { UserRole } from "@/domain/access/roles";
import {
  createOrderMessage,
  findOrderChatContext,
  listOrderMessages,
} from "@/server/repositories/chat-repository";

export type ChatActor = {
  id: string;
  role: UserRole;
  institutionId: string | null;
};

function canAccessOrderChat(
  actor: ChatActor,
  order: { masterId: string; item: { institutionId: string } },
): boolean {
  if (actor.role === "PLATFORM_ADMIN") return true;
  if (actor.role === "FREELANCER" && order.masterId === actor.id) return true;
  if (
    actor.role === "DONOR_STAFF" &&
    actor.institutionId === order.item.institutionId
  ) {
    return true;
  }
  return false;
}

export async function loadOrderChat(actor: ChatActor, orderId: string) {
  const order = await findOrderChatContext(orderId);
  if (!order || !canAccessOrderChat(actor, order)) return null;
  const messages = await listOrderMessages(orderId);
  return { order, messages };
}

export async function sendOrderChatMessage(
  actor: ChatActor,
  orderId: string,
  body: string,
): Promise<{ ok: true; itemId: string } | { ok: false; error: string }> {
  const trimmed = body.trim();
  if (trimmed.length < 1) return { ok: false, error: "Напишите сообщение" };
  if (trimmed.length > 2000) return { ok: false, error: "Сообщение слишком длинное" };

  const order = await findOrderChatContext(orderId);
  if (!order || !canAccessOrderChat(actor, order)) {
    return { ok: false, error: "Чат недоступен" };
  }
  if (order.status === "CANCELLED") {
    return { ok: false, error: "Заказ отменён — чат закрыт" };
  }

  await createOrderMessage({
    orderId,
    authorId: actor.id,
    body: trimmed,
  });
  return { ok: true, itemId: order.item.id };
}
