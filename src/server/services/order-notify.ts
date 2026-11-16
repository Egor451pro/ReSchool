import "server-only";

import { formatByn } from "@/domain/economy/money";
import { prisma } from "@/server/db";
import { listDonorStaffIds } from "@/server/repositories/user-repository";
import { publishChatMessage } from "@/server/services/chat-service";
import { notifyUsers } from "@/server/services/notification-service";

async function latestChatMessage(orderId: string) {
  return prisma.orderMessage.findFirst({
    where: { orderId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      body: true,
      createdAt: true,
      authorId: true,
      author: { select: { id: true, fullName: true, role: true } },
    },
  });
}

export async function publishLatestOrderChat(orderId: string) {
  const message = await latestChatMessage(orderId);
  if (!message) return;
  publishChatMessage(orderId, message);
}

export async function notifyPriceOffered(input: {
  orderId: string;
  itemId: string;
  institutionId: string;
  masterId: string;
  actorId: string;
  side: "SCHOOL" | "FREELANCER";
  amountKop: number;
}) {
  await publishLatestOrderChat(input.orderId);
  const amount = formatByn(input.amountKop);
  if (input.side === "FREELANCER") {
    const staff = await listDonorStaffIds(input.institutionId);
    await notifyUsers(
      staff.map((row) => row.id),
      {
        kind: "PRICE_OFFER",
        title: "Новое предложение цены",
        body: `Фрилансер предложил ${amount}`,
        href: `/cabinet/items/${input.itemId}`,
        exceptUserId: input.actorId,
      },
    );
  } else {
    await notifyUsers([input.masterId], {
      kind: "PRICE_OFFER",
      title: "Новое предложение цены",
      body: `Школа предложила ${amount}`,
      href: `/orders/${input.orderId}`,
      exceptUserId: input.actorId,
    });
  }
}

export async function notifyPriceAccepted(input: {
  orderId: string;
  masterId: string;
  actorId: string;
  amountKop: number;
}) {
  await publishLatestOrderChat(input.orderId);
  await notifyUsers([input.masterId], {
    kind: "PRICE_ACCEPTED",
    title: "Цена подтверждена",
    body: `Можно начинать ремонт · ${formatByn(input.amountKop)}`,
    href: `/orders/${input.orderId}`,
    exceptUserId: input.actorId,
  });
}

export async function notifyRepairAwaitingConfirm(input: {
  itemId: string;
  institutionId: string;
  actorId: string;
}) {
  const staff = await listDonorStaffIds(input.institutionId);
  await notifyUsers(
    staff.map((row) => row.id),
    {
      kind: "CONFIRM_NEEDED",
      title: "Ремонт завершён",
      body: "Подтвердите получение — тогда зафиксируется экономия и выплата",
      href: `/cabinet/items/${input.itemId}`,
      exceptUserId: input.actorId,
    },
  );
}

export async function notifyRepairConfirmed(input: {
  orderId: string;
  masterId: string;
  actorId: string;
}) {
  await notifyUsers([input.masterId], {
    kind: "REPAIR_DONE",
    title: "Ремонт подтверждён",
    body: "Выплата начислена в кошелёк",
    href: `/wallet`,
    exceptUserId: input.actorId,
  });
}
