import { roleLabels } from "@/domain/access/roles";
import { requireRoles } from "@/server/auth/current-user";
import { countInstitutionItems } from "@/server/repositories/user-repository";

export const instant = false;

export default async function CabinetPage() {
  const user = await requireRoles(["DONOR_STAFF", "PLATFORM_ADMIN"]);
  const itemCount = user.institutionId ? await countInstitutionItems(user.institutionId) : 0;

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 px-6 py-8">
      <h1 className="text-2xl font-semibold text-ink">Кабинет учреждения</h1>
      <p className="text-leaf">
        {user.fullName}, {roleLabels[user.role].toLowerCase()}
        {user.institutionName ? ` · ${user.institutionName}` : ""}.
      </p>
      <p className="text-leaf">
        В базе у учреждения {itemCount} предметов. Публикация, фильтры и карточка
        появятся на следующем этапе.
      </p>
    </main>
  );
}
