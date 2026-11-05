import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { PageShell, Surface } from "@/components/ui/surface";
import { institutionTypeLabels, mvpRoleLabel, type InstitutionType } from "@/domain/access/roles";
import { formatByn } from "@/domain/economy/money";
import { requireRoles } from "@/server/auth/current-user";
import { loadAdminEconomyOverview } from "@/server/services/economy-service";
import { listUsers } from "@/server/repositories/user-repository";

export const instant = false;

const when = new Intl.DateTimeFormat("ru-RU", {
  dateStyle: "medium",
  timeZone: "Europe/Minsk",
});

function MetricCard({
  value,
  label,
  hint,
}: {
  value: string;
  label: string;
  hint?: string;
}) {
  return (
    <Surface className="flex flex-col gap-2">
      <p className="text-sm text-leaf">{label}</p>
      <p className="text-2xl font-semibold tracking-tight text-ink">{value}</p>
      {hint ? <p className="text-xs leading-5 text-leaf">{hint}</p> : null}
    </Surface>
  );
}

export default async function AdminPage() {
  await requireRoles(["PLATFORM_ADMIN"]);
  const [overview, users] = await Promise.all([loadAdminEconomyOverview(), listUsers()]);

  return (
    <PageShell>
      <PageHeader
        title="Кабинет администратора"
        description="Факт по подтверждённым школой ремонтам: что починили и сколько это сэкономило району."
        banner="Стоимость новых вещей — сколько пришлось бы заплатить, если бы вместо ремонта покупали новое. Экономия = эта сумма минус затраты на ремонт."
      />

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          value={String(overview.repairedCount)}
          label="Отремонтировано"
          hint="карточек с подтверждённым ремонтом"
        />
        <MetricCard
          value={formatByn(overview.savingTotalKop)}
          label="Потенциальная экономия"
          hint="новые − материалы и транспорт"
        />
        <MetricCard
          value={formatByn(overview.costsTotalKop)}
          label="Общие затраты"
          hint="материалы и транспорт по всем ремонтам"
        />
        <MetricCard
          value={formatByn(overview.newPriceTotalKop)}
          label="Стоимость новых вещей"
          hint="сколько можно было бы потратить без ремонта"
        />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-ink">Отремонтированные вещи</h2>
        {overview.items.length === 0 ? (
          <Surface className="border-dashed text-sm text-leaf">
            Пока нет подтверждённых ремонтов. Когда школа подтвердит получение, строка появится
            здесь вместе со снимком экономии.
          </Surface>
        ) : (
          <Surface className="overflow-x-auto p-0">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-mint/60 text-leaf">
                <tr>
                  <th className="px-4 py-3 font-medium">Предмет</th>
                  <th className="px-4 py-3 font-medium">Школа</th>
                  <th className="px-4 py-3 font-medium">Новые</th>
                  <th className="px-4 py-3 font-medium">Затраты</th>
                  <th className="px-4 py-3 font-medium">Экономия</th>
                  <th className="px-4 py-3 font-medium">Дата</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-mint/50">
                {overview.items.map((item) => (
                  <tr key={`${item.itemId}-${item.computedAt.toISOString()}`}>
                    <td className="px-4 py-3">
                      <Link
                        href={`/catalog/${item.itemId}`}
                        className="font-medium text-ink hover:text-leaf"
                      >
                        {item.title}
                      </Link>
                      <span className="mt-0.5 block text-xs text-leaf">
                        {item.quantity} шт.
                      </span>
                    </td>
                    <td className="px-4 py-3 text-leaf">
                      <span className="block text-ink">{item.institutionName}</span>
                      <span className="text-xs">{item.district}</span>
                    </td>
                    <td className="px-4 py-3 text-ink">{formatByn(item.newPriceKop)}</td>
                    <td className="px-4 py-3 text-ink">{formatByn(item.costsKop)}</td>
                    <td className="px-4 py-3 font-medium text-ink">
                      {formatByn(item.savingKop)}
                    </td>
                    <td className="px-4 py-3 text-leaf">{when.format(item.computedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Surface>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-ink">Участники</h2>
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
      </section>
    </PageShell>
  );
}
