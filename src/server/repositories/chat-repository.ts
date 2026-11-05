import "server-only";

import { prisma } from "@/server/db";

export function listOrderMessages(orderId: string) {
  return prisma.orderMessage.findMany({
    where: { orderId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      body: true,
      createdAt: true,
      authorId: true,
      author: { select: { id: true, fullName: true, role: true } },
    },
  });
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
