import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { PageShell, Surface } from "@/components/ui/surface";
import { formatByn } from "@/domain/economy/money";
import { requireRoles } from "@/server/auth/current-user";
import { loadInstitutionExpenses } from "@/server/services/expense-service";

export const instant = false;

export default async function ExpensesPage() {
  const user = await requireRoles(["DONOR_STAFF"]);
  const expenses = await loadInstitutionExpenses(user);

  return (
    <PageShell>
      <PageHeader
        title="Расходы"
        description="Все затраты школы на подтверждённые ремонты: материалы, транспорт и гонорар исполнителя."
      />

      <Surface tone="accent" className="flex flex-col gap-2 shadow-[0_16px_40px_rgba(47,36,28,0.16)]">
        <p className="panel-accent-muted text-sm">Всего расходов</p>
        <p className="text-3xl font-semibold">{formatByn(expenses?.totalKop ?? 0)}</p>
      </Surface>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-ink">История расходов</h2>
        {!expenses || expenses.rows.length === 0 ? (
          <Surface className="border-dashed text-sm text-leaf">
            Пока нет расходов. Они появятся после того, как вы подтвердите выполненный ремонт.
          </Surface>
        ) : (
          <ul className="flex flex-col gap-2">
            {expenses.rows.map((row) => (
              <Surface key={row.id} as="li" className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 flex-col gap-1">
                  <Link
                    href={`/catalog/${row.itemId}`}
                    className="truncate font-medium text-ink hover:text-leaf"
                  >
                    {row.title}
                  </Link>
                  <span className="text-sm text-leaf">
                    {row.quantity} шт. · {row.masterName}
                  </span>
                  <span className="text-xs text-leaf">
                    Материалы {formatByn(row.materialsKop)} · транспорт{" "}
                    {formatByn(row.transportKop)} · гонорар {formatByn(row.freelancerFeeKop)}
                  </span>
                  <span className="text-xs text-leaf">
                    Вместо нового (~{formatByn(row.newPriceKop)}) ·{" "}
                    {row.computedAt.toLocaleString("ru-BY")}
                  </span>
                </div>
                <span className="shrink-0 text-lg font-semibold tabular-nums text-ink">
                  {formatByn(row.totalKop)}
                </span>
              </Surface>
            ))}
          </ul>
        )}
      </section>
    </PageShell>
  );
}
