"use client";

import { RoleLoginPicker, type PickerAccount } from "@/components/role-login-picker";

export function HomeStartClient({
  next,
  title = "С чего начать",
  rememberedUserId,
  accounts = [],
}: {
  next?: string;
  title?: string;
  rememberedUserId?: string | null;
  accounts?: PickerAccount[];
}) {
  return (
    <RoleLoginPicker
      next={next}
      title={title}
      rememberedUserId={rememberedUserId}
      accounts={accounts}
    />
  );
}
