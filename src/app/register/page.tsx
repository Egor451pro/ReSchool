import { RegisterForm } from "@/components/register-form";
import { institutionTypeLabels, type InstitutionType } from "@/domain/access/roles";
import { listJoinableInstitutions } from "@/server/repositories/institution-repository";
import Link from "next/link";

export const instant = false;

export default async function RegisterPage() {
  const institutions = await listJoinableInstitutions();

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-6 py-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-ink">Регистрация</h1>
        <p className="text-sm leading-6 text-leaf">
          Школа, гимназия и лицей получают роль сотрудника учреждения. Колледж и ПТУ —
          роль мастера. Учащийся, аналитик района и администратор самостоятельно не
          регистрируются: это допущение пилота, чтобы не собирать лишние данные детей.
        </p>
      </div>
      <RegisterForm
        institutions={institutions.map((institution) => ({
          id: institution.id,
          name: `${institutionTypeLabels[institution.type as InstitutionType]}. ${institution.name}`,
        }))}
      />
      <p className="text-sm text-leaf">
        Уже есть учётка?{" "}
        <Link href="/login" className="font-medium text-leaf">
          Войти
        </Link>
      </p>
    </main>
  );
}
