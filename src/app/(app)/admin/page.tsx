import { institutionTypeLabels, roleLabels, type InstitutionType } from "@/domain/access/roles";
import { requireRoles } from "@/server/auth/current-user";
import { listUsers } from "@/server/repositories/user-repository";

export const instant = false;

export default async function AdminPage() {
  await requireRoles(["PLATFORM_ADMIN"]);
  const users = await listUsers();

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 px-6 py-8">
      <h1 className="text-2xl font-semibold text-ink">Участники</h1>
      <p className="text-leaf">
        Список видит только администратор. Почты здесь нужны для демо-входа, это
        синтетические адреса.
      </p>
      <ul className="flex flex-col divide-y divide-mint/60 rounded-lg border border-mint/60">
        {users.map((person) => (
          <li key={person.id} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <span>
              <span className="block font-medium text-ink">{person.fullName}</span>
              <span className="block text-sm text-leaf">
                {roleLabels[person.role]}
                {person.institution
                  ? ` · ${institutionTypeLabels[person.institution.type as InstitutionType]}`
                  : ""}
              </span>
            </span>
            <span className="font-mono text-sm text-leaf">{person.email}</span>
          </li>
        ))}
      </ul>
    </main>
  );
}
