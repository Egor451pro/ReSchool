import Link from "next/link";
import { BackLink } from "@/components/back-link";
import { formatByn } from "@/domain/economy/money";
import { requireRoles } from "@/server/auth/current-user";
import { loadDistrictDashboard } from "@/server/services/economy-service";

export const instant = false;

/** Упрощённый 3-летний прогноз поверх допущений дашборда. */
export default async function ForecastPage() {
  const user = await requireRoles(["DISTRICT_ANALYST", "PLATFORM_ADMIN"]);
  const dashboard = await loadDistrictDashboard(user.district);
  const base =
    dashboard.scenarios.find((row) => row.kind === "BASE") ?? dashboard.scenarios[0];
  const conservative = dashboard.scenarios.find((row) => row.kind === "CONSERVATIVE");
  const optimistic = dashboard.scenarios.find((row) => row.kind === "OPTIMISTIC");

  const rows = [
    { year: "Y1", mult: 1 },
    { year: "Y2", mult: 3 },
    { year: "Y3", mult: 8 },
  ] as const;

  return (
    <main className="page-shell">
      <BackLink href="/district">К дашборду района</BackLink>
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-ink">Прогноз</h1>
        <p className="max-w-2xl text-sm leading-6 text-leaf">
          Иллюстративный масштаб поверх текущих допущений сценариев. Не является финансовой
          моделью для инвесторов. Подробный план СНГ — в документации репозитория
          (`docs/scaling-cis.md`).
        </p>
      </div>

      {!base ? (
        <p className="text-sm text-leaf">Нет допущений для расчёта.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-line">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-muted/50 text-leaf">
              <tr>
                <th className="px-4 py-3 font-medium">Год</th>
                <th className="px-4 py-3 font-medium">Консервативный</th>
                <th className="px-4 py-3 font-medium">Базовый</th>
                <th className="px-4 py-3 font-medium">Оптимистичный</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.year} className="border-t border-line">
                  <td className="px-4 py-3 font-medium text-ink">{row.year}</td>
                  <td className="px-4 py-3 text-leaf">
                    {conservative
                      ? formatByn(
                          Math.round(conservative.projection.propertyBudgetKop * row.mult),
                        )
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-ink">
                    {formatByn(Math.round(base.projection.propertyBudgetKop * row.mult))}
                  </td>
                  <td className="px-4 py-3 text-leaf">
                    {optimistic
                      ? formatByn(
                          Math.round(optimistic.projection.propertyBudgetKop * row.mult),
                        )
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-sm text-leaf">
        Править допущения:{" "}
        <Link href="/district/calculator" className="font-medium text-ink underline decoration-line underline-offset-2">
          калькулятор
        </Link>
        .
      </p>
    </main>
  );
}
