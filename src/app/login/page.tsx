import { DemoLogins } from "@/components/demo-logins";
import { LoginForm } from "@/components/login-form";
import { SiteHeader } from "@/components/site-header";
import { PageHeader } from "@/components/ui/page-header";
import { PageShell, Surface } from "@/components/ui/surface";

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
          description="Войдите как завхоз, исполнитель или администратор."
        />
        <DemoLogins next={next} />
        <Surface className="max-w-md">
          <details className="group">
            <summary className="cursor-pointer list-none text-sm font-medium text-leaf hover:text-ink">
              Войти по почте
            </summary>
            <div className="mt-4">
              <LoginForm next={next} />
            </div>
          </details>
        </Surface>
      </PageShell>
    </>
  );
}
