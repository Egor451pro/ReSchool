import "server-only";

import type { NotificationKind } from "@prisma/client";
import {
  createNotification,
  type NotificationRow,
} from "@/server/repositories/notification-repository";
import { publish, userChannel } from "@/server/realtime/bus";

export type NotifyInput = {
  userId: string;
  kind: NotificationKind;
  title: string;
  body: string;
  href: string;
  /** Не слать уведомление автору действия. */
  exceptUserId?: string | null;
};

export async function notifyUser(input: NotifyInput): Promise<NotificationRow | null> {
  if (input.exceptUserId && input.userId === input.exceptUserId) return null;

  const row = await createNotification({
    userId: input.userId,
    kind: input.kind,
    title: input.title,
    body: input.body,
    href: input.href,
  });

  publish(userChannel(input.userId), {
    type: "notification",
    notification: {
      id: row.id,
      kind: row.kind,
      title: row.title,
      body: row.body,
      href: row.href,
      createdAt: row.createdAt.toISOString(),
      readAt: null,
    },
  });

  return row;
}

export async function notifyUsers(
  userIds: string[],
  input: Omit<NotifyInput, "userId">,
) {
  const unique = [...new Set(userIds.filter(Boolean))];
  const results: NotificationRow[] = [];
  for (const userId of unique) {
    const row = await notifyUser({ ...input, userId });
    if (row) results.push(row);
  }
  return results;
}
