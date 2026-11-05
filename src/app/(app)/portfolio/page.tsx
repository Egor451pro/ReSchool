import { requireRoles } from "@/server/auth/current-user";
import { listLedGroups, listOwnPortfolio } from "@/server/repositories/user-repository";

export const instant = false;

export default async function PortfolioPage() {
  const user = await requireRoles(["STUDENT", "WORKSHOP_MASTER", "PLATFORM_ADMIN"]);

  if (user.role === "STUDENT") {
    const entries = await listOwnPortfolio(user.id);
    return (
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 px-6 py-8">
        <h1 className="text-2xl font-semibold text-zinc-900">Моё портфолио</h1>
        <p className="text-zinc-600">
          {user.fullName}. Здесь только ваши работы. Чужие записи не показываются.
        </p>
        {entries.length === 0 ? (
          <p className="text-zinc-600">Пока нет закрытых работ.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {entries.map((entry) => (
              <li key={entry.id} className="rounded-lg border border-zinc-200 px-4 py-3">
                <p className="font-medium text-zinc-900">{entry.order.item.title}</p>
                <p className="text-sm text-zinc-700">{entry.skills}</p>
                <p className="text-sm text-zinc-500">
                  Оценка {entry.grade}, {entry.minutes} мин.
                </p>
              </li>
            ))}
          </ul>
        )}
      </main>
    );
  }

  const groups = await listLedGroups(user.id);

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 px-6 py-8">
      <h1 className="text-2xl font-semibold text-zinc-900">Учащиеся групп</h1>
      <p className="text-zinc-600">
        Мастер видит имена своей группы. Оценки конкретной работы учащийся открывает
        под своим входом.
      </p>
      {groups.length === 0 ? (
        <p className="text-zinc-600">У этой учётки нет закреплённых групп.</p>
      ) : (
        groups.map((group) => (
          <section key={group.id} className="flex flex-col gap-2">
            <h2 className="font-medium text-zinc-900">
              {group.name} · {group.specialty.name}
            </h2>
            <ul className="flex flex-col divide-y divide-zinc-200 rounded-lg border border-zinc-200">
              {group.students.map((student) => (
                <li key={student.id} className="px-4 py-2 text-zinc-800">
                  {student.fullName}
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </main>
  );
}
