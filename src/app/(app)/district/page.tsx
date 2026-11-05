import Link from "next/link";
import { EconomyBars } from "@/components/economy-bars";
import { formatByn } from "@/domain/economy/money";
import { requireRoles } from "@/server/auth/current-user";
import { loadDistrictDashboard } from "@/server/services/economy-service";

export const instant = false;

function hoursFromMinutes(minutes: number): string {
  const hours = minutes / 60;
  return hours.toLocaleString("ru-BY", { maximumFractionDigits: 1 });
}

export default async function DistrictPage() {
  const user = await requireRoles(["DISTRICT_ANALYST", "PLATFORM_ADMIN"]);
  const dashboard = await loadDistrictDashboard(user.district);
  const shown = dashboard.scenarios.find((row) => row.shownOnDashboard) ?? dashboard.scenarios[1];

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold text-ink">Район</h1>
          <p className="max-w-2xl text-leaf">
            {dashboard.districtLabel}. Факт — сумма снимков закрытых заказов. Сценарии считаются
            заново из допущений и старые снимки не переписывают.
          </p>
        </div>
        <Link
          href="/district/calculator"
          className="inline-flex h-10 items-center justify-center rounded-lg bg-ink px-4 text-sm font-medium text-white hover:bg-leaf"
        >
          Калькулятор сценариев
        </Link>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric value={String(dashboard.overview.institutions)} label="учреждений" />
        <Metric value={String(dashboard.overview.items)} label="предметов в учёте" />
        <Metric value={String(dashboard.fact.orders)} label="снимков экономии" />
        <Metric
          value={hoursFromMinutes(dashboard.fact.minutes)}
          label="часов учебной практики"
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-ink">Факт по закрытым заказам</h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            <MoneyMetric
              value={dashboard.fact.propertyBudgetKop}
              label="бюджет имущества"
            />
            <MoneyMetric
              value={dashboard.fact.procurementSavingKop}
              label="экономия закупки"
            />
            <MoneyMetric
              value={dashboard.fact.avoidedDisposalKop}
              label="избегнутая утилизация"
            />
            <MoneyMetric
              value={dashboard.fact.practiceSavingKop}
              label="замещение заготовок"
            />
          </ul>
          <p className="text-sm text-leaf">
            Труд учащихся в сумму не входит. Закрыто с причиной «выполнено»:{" "}
            {dashboard.overview.completedClosed}. В работе сейчас:{" "}
            {dashboard.overview.activeOrders}.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-ink">
            Сценарий на дашборде
            {shown ? `: ${shown.title}` : ""}
          </h2>
          {shown ? (
            <>
              <ul className="grid gap-3 sm:grid-cols-2">
                <MoneyMetric
                  value={shown.projection.propertyBudgetKop}
                  label="прогноз бюджета имущества / год"
                />
                <MoneyMetric
                  value={shown.projection.practiceSavingKop}
                  label="прогноз замещения / год"
                />
                <MoneyMetric
                  value={shown.projection.platformCostKop}
                  label="затраты платформы / год"
                />
                <Metric
                  value={
                    shown.projection.paybackYears === null
                      ? "—"
                      : shown.projection.paybackYears.toLocaleString("ru-BY", {
                          maximumFractionDigits: 1,
                        })
                  }
                  label="окупаемость, лет"
                />
              </ul>
              <p className="text-sm text-leaf">
                До выдачи доходит около {shown.projection.completedOrders} заказов из{" "}
                допущений сценария. Окупаемость считает только экономию бюджета имущества.
              </p>
            </>
          ) : (
            <p className="text-leaf">Выберите сценарий в калькуляторе.</p>
          )}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-ink">Три сценария на год</h2>
          <EconomyBars
            rows={dashboard.scenarios.map((row) => ({
              key: row.kind,
              label: row.title,
              valueKop: row.projection.propertyBudgetKop,
              highlight: row.shownOnDashboard,
              hint: `${row.projection.completedOrders} заказов до выдачи · окупаемость ${
                row.projection.paybackYears === null
                  ? "н/д"
                  : `${row.projection.paybackYears.toLocaleString("ru-BY", {
                      maximumFractionDigits: 1,
                    })} лет`
              }`,
            }))}
          />
        </div>

        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-ink">Учреждения по факту экономии</h2>
          {dashboard.topInstitutions.length === 0 ? (
            <p className="text-leaf">Пока нет закрытых заказов со снимком.</p>
          ) : (
            <EconomyBars
              rows={dashboard.topInstitutions.map((row) => ({
                key: row.institutionId,
                label: row.name,
                valueKop: row.propertyBudgetKop,
                hint: `${row.orders} снимок(ов)`,
              }))}
            />
          )}
        </div>
      </section>
    </main>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl bg-mint/35 px-4 py-3">
      <p className="text-2xl font-semibold tabular-nums text-ink">{value}</p>
      <p className="text-sm text-leaf">{label}</p>
    </div>
  );
}

function MoneyMetric({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-xl border border-mint/70 bg-paper px-4 py-3">
      <p className="text-xl font-semibold tabular-nums text-ink">{formatByn(value)}</p>
      <p className="text-sm text-leaf">{label}</p>
    </div>
  );
}
