import { DemoLogins } from "@/components/demo-logins";
import { LoginForm } from "@/components/login-form";
import { SiteHeader } from "@/components/site-header";
import { PageHeader } from "@/components/ui/page-header";
import { PageShell, Surface } from "@/components/ui/surface";
import Link from "next/link";

export const instant = false;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const next = (await searchParams).next;

  return (
    <>
      <SiteHeader />
      <PageShell>
        <PageHeader
          title="Вход"
          description="Войдите по почте и паролю или выберите демо-роль ниже."
        />
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
        <DemoLogins next={next} />
      </PageShell>
    </>
  );
}
