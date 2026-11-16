import { connection } from "next/server";
import { getCurrentUser } from "@/server/auth/current-user";
import { findOrderChatContext } from "@/server/repositories/chat-repository";
import { chatChannel } from "@/server/realtime/bus";
import { sseResponse } from "@/server/realtime/sse";

export const instant = false;

function canAccessOrderChat(
  actor: { id: string; role: string; institutionId: string | null },
  order: { masterId: string; item: { institutionId: string } },
): boolean {
  if (actor.role === "PLATFORM_ADMIN") return true;
  if (actor.role === "FREELANCER" && order.masterId === actor.id) return true;
  if (actor.role === "DONOR_STAFF" && actor.institutionId === order.item.institutionId) {
    return true;
  }
  return false;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ orderId: string }> },
) {
  await connection();
  const user = await getCurrentUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { orderId } = await context.params;
  const order = await findOrderChatContext(orderId);
  if (!order || !canAccessOrderChat(user, order)) {
    return new Response("Forbidden", { status: 403 });
  }

  return sseResponse(chatChannel(orderId));
}
