"use client";

import { useEffect } from "react";
import { upsertSavedAccount } from "@/domain/access/saved-accounts";
import type { UserRole } from "@/domain/access/roles";

/** После входа/регистрации кладёт учётку в localStorage для быстрого выбора по роли. */
export function AccountHistorySync({
  user,
}: {
  user: { userId: string; email: string; fullName: string; role: UserRole } | null;
}) {
  useEffect(() => {
    if (!user) return;
    upsertSavedAccount({
      userId: user.userId,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    });
  }, [user]);

  return null;
}
