import "server-only";

import type { NotificationKind, Prisma } from "@prisma/client";
import { prisma } from "@/server/db";

const notificationSelect = {
  id: true,
  userId: true,
  kind: true,
  title: true,
  body: true,
  href: true,
  readAt: true,
  createdAt: true,
} satisfies Prisma.NotificationSelect;

export type NotificationRow = Prisma.NotificationGetPayload<{
  select: typeof notificationSelect;
}>;

export function createNotification(input: {
  userId: string;
  kind: NotificationKind;
  title: string;
  body: string;
  href: string;
}) {
  return prisma.notification.create({
    data: {
      userId: input.userId,
      kind: input.kind,
      title: input.title,
      body: input.body,
      href: input.href,
    },
    select: notificationSelect,
  });
}

export function listRecentNotifications(userId: string, take = 20) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: Math.min(Math.max(take, 1), 50),
    select: notificationSelect,
  });
}

export function countUnreadNotifications(userId: string) {
  return prisma.notification.count({
    where: { userId, readAt: null },
  });
}

export function markNotificationRead(input: { id: string; userId: string }) {
  return prisma.notification.updateMany({
    where: { id: input.id, userId: input.userId, readAt: null },
    data: { readAt: new Date() },
  });
}

export function markAllNotificationsRead(userId: string) {
  return prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });
}

export function findNotificationForUser(id: string, userId: string) {
  return prisma.notification.findFirst({
    where: { id, userId },
    select: notificationSelect,
  });
}
