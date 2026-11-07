import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { PageShell, Surface } from "@/components/ui/surface";
import { formatByn } from "@/domain/economy/money";
import { itemsCountLabel } from "@/domain/items/labels";
import { requireRoles } from "@/server/auth/current-user";
import { loadInstitutionEconomyBoard } from "@/server/services/expense-service";

export const instant = false;

export default async function ExpensesPage() {
  const user = await requireRoles(["DONOR_STAFF"]);
  const board = await loadInstitutionEconomyBoard(user);
  const expenses = board?.expenses ?? null;
  const savings = board?.savings ?? null;

  return (
    <PageShell>
      <PageHeader
        title="Экономия"
        description="Сколько школа сэкономила за счёт ремонта вместо покупки новых, и что уже оплачено."
      />

      {savings ? (
        <Surface
          tone="accent"
          as="section"
          className="shadow-[0_16px_40px_rgba(47,36,28,0.16)]"
        >
          <details className="group">
            <summary className="flex cursor-pointer list-none flex-col gap-2 [&::-webkit-details-marker]:hidden">
              <div className="flex items-start justify-between gap-3">
                <p className="panel-accent-muted text-sm">Теоретическая экономия</p>
                <span className="panel-accent-muted shrink-0 text-sm group-open:hidden">
                  Смотреть детали
                </span>
                <span className="panel-accent-muted hidden shrink-0 text-sm group-open:inline">
                  Скрыть детали
                </span>
              </div>
              <p className="text-3xl font-semibold tracking-tight">
                {formatByn(savings.netSavingKop)}
              </p>
              <p className="panel-accent-muted max-w-2xl text-sm leading-6">
                {savings.repairedCount > 0
                  ? `По ${itemsCountLabel(savings.repairedCount)} с подтверждённым ремонтом: вместо новых ${formatByn(savings.procurementSavingKop)} плюс избежанная утилизация → ${formatByn(savings.propertyBudgetKop)}${savings.disposalSpentKop > 0 ? `, минус сдача лома ${formatByn(savings.disposalSpentKop)}` : ""}. Нажмите, чтобы разобрать по позициям.`
                  : "Появится после того, как вы подтвердите первый выполненный ремонт."}
              </p>
            </summary>

            {savings.rows.length > 0 ? (
              <ul className="mt-4 flex flex-col gap-2 border-t border-white/15 pt-4">
                {savings.rows.map((row) => (
                  <li
                    key={row.id}
                    className="flex flex-col gap-2 rounded-2xl border border-white/15 bg-black/5 p-3 sm:p-3.5"
                  >
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <Link
                          href={`/catalog/${row.itemId}`}
                          className="truncate font-medium hover:underline"
                        >
                          {row.title}
                        </Link>
                        <p className="panel-accent-muted text-sm">
                          {row.quantity} шт. · {row.masterName} ·{" "}
                          {row.computedAt.toLocaleString("ru-BY")}
                        </p>
                      </div>
                      <p className="shrink-0 text-lg font-semibold tabular-nums">
                        {formatByn(row.propertyBudgetKop)}
                      </p>
                    </div>
                    <dl className="grid gap-1 text-sm sm:grid-cols-2">
                      <div className="flex justify-between gap-3 sm:block">
                        <dt className="panel-accent-muted">Купили бы новые</dt>
                        <dd className="tabular-nums">{formatByn(row.newPriceKop)}</dd>
                      </div>
                      <div className="flex justify-between gap-3 sm:block">
                        <dt className="panel-accent-muted">Стоимость ремонта</dt>
                        <dd className="tabular-nums">{formatByn(row.restorationKop)}</dd>
                      </div>
                      <div className="flex justify-between gap-3 sm:block">
                        <dt className="panel-accent-muted">Экономия на закупке</dt>
                        <dd className="tabular-nums">{formatByn(row.procurementSavingKop)}</dd>
                      </div>
                      <div className="flex justify-between gap-3 sm:block">
                        <dt className="panel-accent-muted">Избежали утилизации</dt>
                        <dd className="tabular-nums">{formatByn(row.avoidedDisposalKop)}</dd>
                      </div>
                    </dl>
                    <p className="panel-accent-muted text-xs leading-5">
                      Новые {formatByn(row.newPriceKop)} − ремонт {formatByn(row.restorationKop)} ={" "}
                      {formatByn(row.procurementSavingKop)}; плюс утилизация{" "}
                      {formatByn(row.avoidedDisposalKop)} → вклад{" "}
                      {formatByn(row.propertyBudgetKop)}.
                    </p>
                  </li>
                ))}
              </ul>
            ) : null}
          </details>
        </Surface>
      ) : null}

      <Surface className="flex flex-col gap-2">
        <p className="text-sm text-leaf">Всего оплачено</p>
        <p className="text-2xl font-semibold text-ink">{formatByn(expenses?.totalKop ?? 0)}</p>
        {expenses && (expenses.repairTotalKop > 0 || expenses.disposalTotalKop > 0) ? (
          <p className="text-sm text-leaf">
            Ремонт {formatByn(expenses.repairTotalKop)}
            {expenses.disposalTotalKop > 0
              ? ` · сдача в утиль ${formatByn(expenses.disposalTotalKop)}`
              : null}
          </p>
        ) : null}
      </Surface>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-ink">История оплат</h2>
        {!expenses || expenses.rows.length === 0 ? (
          <Surface className="border-dashed text-sm text-leaf">
            Пока нет оплат. Они появятся после подтверждённого ремонта или сдачи лома фрилансером.
          </Surface>
        ) : (
          <ul className="flex flex-col gap-2">
            {expenses.rows.map((row) => (
              <Surface
                key={row.id}
                as="li"
                className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
              >
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
                    {row.kind === "REPAIR"
                      ? `Ремонт · вместо нового (~${formatByn(row.newPriceKop)})`
                      : "Сдача в утиль фрилансером"}{" "}
                    · {row.computedAt.toLocaleString("ru-BY")}
                  </span>
                </div>
                <span className="shrink-0 text-lg font-semibold tabular-nums text-ink">
                  {formatByn(row.amountKop)}
                </span>
              </Surface>
            ))}
          </ul>
        )}
      </section>
    </PageShell>
  );
}
