import "server-only";

import { prisma } from "@/server/db";

const CHAT_TAKE = 100;

export async function listOrderMessages(
  orderId: string,
  options?: { take?: number },
) {
  const take = Math.min(Math.max(options?.take ?? CHAT_TAKE, 1), 200);
  const rows = await prisma.orderMessage.findMany({
    where: { orderId },
    orderBy: { createdAt: "desc" },
    take,
    select: {
      id: true,
      body: true,
      createdAt: true,
      authorId: true,
      author: { select: { id: true, fullName: true, role: true } },
    },
  });
  return rows.reverse();
}

export function createOrderMessage(input: {
  orderId: string;
  authorId: string;
  body: string;
}) {
  return prisma.orderMessage.create({
    data: {
      orderId: input.orderId,
      authorId: input.authorId,
      body: input.body,
    },
    select: { id: true },
  });
}

export function findOrderChatContext(orderId: string) {
  return prisma.repairOrder.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      masterId: true,
      status: true,
      item: {
        select: {
          id: true,
          title: true,
          institutionId: true,
        },
      },
    },
  });
}
