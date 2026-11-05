import { PageHeader } from "@/components/ui/page-header";
import { PageShell, Surface } from "@/components/ui/surface";
import { institutionTypeLabels, mvpRoleLabel, type InstitutionType } from "@/domain/access/roles";
import { requireRoles } from "@/server/auth/current-user";
import { listUsers } from "@/server/repositories/user-repository";

export const instant = false;

export default async function AdminPage() {
  await requireRoles(["PLATFORM_ADMIN"]);
  const users = await listUsers();

  return (
    <PageShell>
      <PageHeader
        title="Участники"
        description="Список демо-учёток. Для входа используйте профили на экране входа."
      />
      <Surface className="p-0">
        <ul className="flex flex-col divide-y divide-mint/60">
          {users.map((person) => (
            <li
              key={person.id}
              className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <span>
                <span className="block font-medium text-ink">{person.fullName}</span>
                <span className="block text-sm text-leaf">
                  {mvpRoleLabel(person.role)}
                  {person.institution
                    ? ` · ${institutionTypeLabels[person.institution.type as InstitutionType]}`
                    : ""}
                </span>
              </span>
              <span className="font-mono text-sm text-leaf">{person.email}</span>
            </li>
          ))}
        </ul>
      </Surface>
    </PageShell>
  );
}
