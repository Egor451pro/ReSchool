import "server-only";

import type { UserRole } from "@/domain/access/roles";
import {
  createOrderMessage,
  findOrderChatContext,
  listOrderMessages,
} from "@/server/repositories/chat-repository";
import { listDonorStaffIds } from "@/server/repositories/user-repository";
import { chatChannel, publish } from "@/server/realtime/bus";
import { notifyUsers } from "@/server/services/notification-service";

export type ChatActor = {
  id: string;
  role: UserRole;
  institutionId: string | null;
};

export type ChatMessageDto = {
  id: string;
  body: string;
  createdAt: string;
  authorId: string;
  author: { id: string; fullName: string; role: string };
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

function toDto(message: {
  id: string;
  body: string;
  createdAt: Date;
  authorId: string;
  author: { id: string; fullName: string; role: string };
}): ChatMessageDto {
  return {
    id: message.id,
    body: message.body,
    createdAt: message.createdAt.toISOString(),
    authorId: message.authorId,
    author: message.author,
  };
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
): Promise<
  | { ok: true; itemId: string; message: ChatMessageDto }
  | { ok: false; error: string }
> {
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

  const created = await createOrderMessage({
    orderId,
    authorId: actor.id,
    body: trimmed,
  });
  const message = toDto(created);

  publish(chatChannel(orderId), { type: "chat", message });

  const preview = trimmed.length > 120 ? `${trimmed.slice(0, 117)}…` : trimmed;
  const schoolHref = `/cabinet/items/${order.item.id}`;
  const freelancerHref = `/orders/${orderId}`;

  if (actor.role === "FREELANCER" || actor.id === order.masterId) {
    const staff = await listDonorStaffIds(order.item.institutionId);
    await notifyUsers(
      staff.map((row) => row.id),
      {
        kind: "CHAT_MESSAGE",
        title: "Новое сообщение по заказу",
        body: preview,
        href: schoolHref,
        exceptUserId: actor.id,
      },
    );
  } else {
    await notifyUsers([order.masterId], {
      kind: "CHAT_MESSAGE",
      title: "Новое сообщение по заказу",
      body: preview,
      href: freelancerHref,
      exceptUserId: actor.id,
    });
  }

  return { ok: true, itemId: order.item.id, message };
}

/** Публикует уже сохранённое системное сообщение (торг о цене) в SSE. */
export function publishChatMessage(
  orderId: string,
  message: {
    id: string;
    body: string;
    createdAt: Date;
    authorId: string;
    author: { id: string; fullName: string; role: string };
  },
) {
  publish(chatChannel(orderId), { type: "chat", message: toDto(message) });
}
