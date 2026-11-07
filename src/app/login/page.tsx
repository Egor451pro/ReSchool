import { LoginForm } from "@/components/login-form";
import { RoleLoginPicker } from "@/components/role-login-picker";
import { SiteHeader } from "@/components/site-header";
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
      <main className="page-shell gap-8 text-ink sm:gap-12 sm:pt-12">
        <div className="flex max-w-3xl flex-col gap-3 sm:gap-4">
          <h1 className="text-[1.75rem] font-semibold leading-tight tracking-tight sm:text-4xl">
            Школьное имущество снова в деле
          </h1>
          <p className="text-base leading-7 text-leaf sm:text-lg sm:leading-8">
            Завхоз публикует то, что можно починить. Фрилансер берёт ремонт на бирже. Вещь
            возвращается — бюджет экономит на закупках.
          </p>
        </div>

        <section
          aria-labelledby="login-heading"
          className="rounded-[1.75rem] border-2 border-line-strong bg-surface p-4 shadow-[0_16px_40px_rgba(47,36,28,0.08)] sm:rounded-[2rem] sm:p-6"
        >
          <div className="mb-4 flex flex-col gap-1 sm:mb-5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold">
              Для участников
            </p>
            <h2 id="login-heading" className="text-xl font-semibold text-ink sm:text-2xl">
              Вход в кабинет
            </h2>
            <p className="text-sm leading-6 text-leaf">
              Выберите роль и войдите в уже созданный аккаунт — или зарегистрируйтесь.
            </p>
          </div>
          <RoleLoginPicker
            next={next}
            title="Кто вы?"
            initialRole={params.role}
            rememberedUserId={rememberedUserId}
            accounts={accounts}
          />
        </section>

        <section
          aria-labelledby="login-email-heading"
          className="rounded-[1.75rem] border border-dashed border-line bg-muted/35 p-4 sm:rounded-[2rem] sm:p-6"
        >
          <div className="mb-4 flex flex-col gap-1 sm:mb-5">
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-leaf">
              Вручную
            </p>
            <h2 id="login-email-heading" className="text-lg font-semibold text-ink">
              Почта и пароль
            </h2>
            <p className="max-w-2xl text-sm leading-6 text-leaf">
              Если аккаунта нет в списке выше — войдите по почте.
            </p>
          </div>
          <div className="max-w-md">
            <LoginForm next={next} />
            <p className="mt-4 text-sm text-leaf">
              Нет учётки?{" "}
              <Link href="/register" className="font-medium text-ink underline decoration-line underline-offset-2 hover:text-leaf">
                Зарегистрировать школу
              </Link>{" "}
              или{" "}
              <Link
                href="/register?role=freelancer"
                className="font-medium text-ink underline decoration-line underline-offset-2 hover:text-leaf"
              >
                стать фрилансером
              </Link>
              .
            </p>
          </div>
        </section>
      </main>
    </>
  );
}
