import { requireRoles } from "@/server/auth/current-user";
import { countWorkshopOrders, listLedGroups } from "@/server/repositories/user-repository";

export const instant = false;

export default async function WorkshopPage() {
  const user = await requireRoles(["WORKSHOP_MASTER", "PLATFORM_ADMIN"]);
  const [groups, orderCount] = await Promise.all([
    listLedGroups(user.id),
    user.institutionId ? countWorkshopOrders(user.institutionId) : Promise.resolve(0),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 px-6 py-8">
      <h1 className="text-2xl font-semibold text-ink">Биржа заданий</h1>
      <p className="text-leaf">
        {user.institutionName ?? "Платформа"}. Заказов мастерской: {orderCount}.
      </p>
      {groups.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {groups.map((group) => (
            <li key={group.id} className="rounded-lg border border-mint/60 px-4 py-3">
              <p className="font-medium text-ink">
                {group.name} · {group.specialty.name}
              </p>
              <p className="text-sm text-leaf">
                Учащихся в группе: {group.students.length}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-leaf">За этим входом нет учебных групп.</p>
      )}
      <p className="text-leaf">
        Кнопка «взять в работу» и канбан статусов появятся на этапе биржи.
      </p>
    </main>
  );
}
