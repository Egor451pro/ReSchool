import { requireRoles } from "@/server/auth/current-user";

export const instant = false;

export default async function CatalogPage() {
  await requireRoles(["DONOR_STAFF", "WORKSHOP_MASTER", "DISTRICT_ANALYST", "PLATFORM_ADMIN"]);

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 px-6 py-8">
      <h1 className="text-2xl font-semibold text-ink">Каталог</h1>
      <p className="text-leaf">
        Список предметов с фильтрами по району, категории и состоянию откроется на
        следующем этапе. Сейчас раздел только проверяет, что учащийся сюда не попадает.
      </p>
    </main>
  );
}
