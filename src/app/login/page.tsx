import { DemoLogins } from "@/components/demo-logins";
import { LoginForm } from "@/components/login-form";
import Link from "next/link";

export const instant = false;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const next = (await searchParams).next;

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-6 py-8">
      <div className="flex max-w-md flex-col gap-2">
        <h1 className="text-2xl font-semibold text-ink">Вход</h1>
        <p className="text-leaf">
          После входа откроется раздел вашей роли. Чужие разделы скрыты.
        </p>
      </div>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,24rem)_1fr]">
        <div className="flex flex-col gap-4">
          <LoginForm next={next} />
          <p className="text-sm text-leaf">
            Сотрудник школы или мастерской может{" "}
            <Link href="/register" className="font-medium text-leaf">
              зарегистрироваться
            </Link>
            . Учащихся регистрирует учреждение, в демо они уже есть в сиде.
          </p>
        </div>
        <DemoLogins next={next} />
      </div>
    </main>
  );
}
