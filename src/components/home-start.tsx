import { HomeStartClient } from "@/components/home-start-client";
import { isSeedDemoEmail } from "@/domain/access/saved-accounts";
import { loadPickerAccounts } from "@/lib/registered-accounts";
import { readRememberedProfile } from "@/server/auth/cookies";

export async function HomeStart({
  next,
  title,
}: {
  next?: string;
  title?: string;
}) {
  const [remembered, accounts] = await Promise.all([
    readRememberedProfile(),
    loadPickerAccounts(),
  ]);
  const rememberedUserId =
    remembered && !isSeedDemoEmail(remembered.email) ? remembered.userId : null;

  return (
    <HomeStartClient
      next={next}
      title={title}
      rememberedUserId={rememberedUserId}
      accounts={accounts}
    />
  );
}
