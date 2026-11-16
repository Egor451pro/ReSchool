"use server";

import { requireFreshUser } from "@/server/auth/current-user";
import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/server/repositories/notification-repository";

export async function markNotificationReadAction(formData: FormData) {
  const user = await requireFreshUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await markNotificationRead({ id, userId: user.id });
}

export async function markAllNotificationsReadAction() {
  const user = await requireFreshUser();
  await markAllNotificationsRead(user.id);
}
