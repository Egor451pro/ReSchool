import { RoleLoginPicker } from "@/components/role-login-picker";
import { isSeedDemoEmail } from "@/domain/access/saved-accounts";
import { loadPickerAccounts } from "@/lib/registered-accounts";
import { readRememberedProfile } from "@/server/auth/cookies";

export async function DemoLogins({ next }: { next?: string }) {
  const [remembered, accounts] = await Promise.all([
    readRememberedProfile(),
    loadPickerAccounts(),
  ]);
  const rememberedUserId =
    remembered && !isSeedDemoEmail(remembered.email) ? remembered.userId : null;

  return (
    <RoleLoginPicker
      title="Выберите роль"
      next={next}
      rememberedUserId={rememberedUserId}
      accounts={accounts}
    />
  );
}
