import { BackLink } from "@/components/back-link";
import { LoginForm } from "@/components/login-form";
import { RoleLoginPicker } from "@/components/role-login-picker";
import { SiteHeader } from "@/components/site-header";
import { PageHeader } from "@/components/ui/page-header";
import { PageShell, Surface } from "@/components/ui/surface";
import { isSeedDemoEmail } from "@/domain/access/saved-accounts";
import { loadPickerAccounts } from "@/lib/registered-accounts";
import { readRememberedProfile } from "@/server/auth/cookies";
import Link from "next/link";

export const instant = false;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; role?: string }>;
}) {
  const params = await searchParams;
  const next = params.next;
  const [remembered, accounts] = await Promise.all([
    readRememberedProfile(),
    loadPickerAccounts(),
  ]);
  const rememberedUserId =
    remembered && !isSeedDemoEmail(remembered.email) ? remembered.userId : null;

  return (
    <>
      <SiteHeader />
      <PageShell>
        <PageHeader
          back={<BackLink href="/">На главную</BackLink>}
          title="Вход"
          description="Выберите роль — покажем зарегистрированные аккаунты. Или войдите по почте и паролю."
        />

        <Surface className="max-w-3xl">
          <RoleLoginPicker
            next={next}
            title="Войти по роли"
            initialRole={params.role}
            rememberedUserId={rememberedUserId}
            accounts={accounts}
          />
        </Surface>

        <Surface className="max-w-md">
          <h2 className="mb-4 text-base font-semibold text-ink">Почта и пароль</h2>
          <LoginForm next={next} />
          <p className="mt-4 text-sm text-leaf">
            Нет учётки?{" "}
            <Link href="/register" className="font-medium text-leaf underline hover:text-ink">
              Зарегистрировать школу
            </Link>{" "}
            или{" "}
            <Link
              href="/register?role=freelancer"
              className="font-medium text-leaf underline hover:text-ink"
            >
              стать фрилансером
            </Link>
            .
          </p>
        </Surface>
      </PageShell>
    </>
  );
}
