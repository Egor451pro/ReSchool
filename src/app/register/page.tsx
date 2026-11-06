import { RegisterForm } from "@/components/register-form";
import { RegisterFreelancerForm } from "@/components/register-freelancer-form";
import { SiteHeader } from "@/components/site-header";
import { listSpecialties } from "@/server/repositories/user-repository";
import Link from "next/link";

export const instant = false;

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const params = await searchParams;
  const asFreelancer = params.role === "freelancer";
  const specialties = asFreelancer ? await listSpecialties() : [];

  return (
    <>
      <SiteHeader />
      <main className="page-shell page-shell-narrow gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold text-ink">
            {asFreelancer ? "Регистрация фрилансера" : "Регистрация завхоза"}
          </h1>
          <p className="text-sm leading-6 text-leaf">
            {asFreelancer
              ? "Создайте учётку исполнителя и берите заказы на бирже."
              : "Введите данные своей школы или учреждения — список выбирать не нужно."}
          </p>
        </div>

        <div className="flex gap-2 text-sm">
          <Link
            href="/register"
            className={
              asFreelancer ? "text-leaf underline" : "font-medium text-ink"
            }
          >
            Я завхоз
          </Link>
          <span className="text-leaf">·</span>
          <Link
            href="/register?role=freelancer"
            className={
              asFreelancer ? "font-medium text-ink" : "text-leaf underline"
            }
          >
            Я фрилансер
          </Link>
        </div>

        {asFreelancer ? (
          <RegisterFreelancerForm specialties={specialties} />
        ) : (
          <RegisterForm />
        )}

        <p className="text-sm text-leaf">
          Уже есть учётка?{" "}
          <Link href="/login" className="font-medium text-leaf">
            Войти
          </Link>
        </p>
      </main>
    </>
  );
}
