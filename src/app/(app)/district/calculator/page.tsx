import Link from "next/link";
import { AssumptionForm } from "@/components/assumption-form";
import { formatBynAmount } from "@/domain/economy/money";
import { projectYear } from "@/domain/economy";
import { requireRoles } from "@/server/auth/current-user";
import { listEditableAssumptions } from "@/server/services/economy-service";

export const instant = false;

export default async function DistrictCalculatorPage() {
  await requireRoles(["DISTRICT_ANALYST", "PLATFORM_ADMIN"]);
  const assumptions = await listEditableAssumptions();

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-8">
      <div className="flex flex-col gap-2">
        <Link href="/district" className="text-sm font-medium text-leaf hover:text-ink">
          ← К дашборду района
        </Link>
        <h1 className="text-2xl font-semibold text-ink">Калькулятор сценариев</h1>
        <p className="max-w-3xl text-leaf">
          Три набора допущений. Пересчёт прогноза не меняет уже записанные снимки закрытых
          заказов. Ставки утилизации по категориям общие и здесь не правятся.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {assumptions.map((set) => {
          const projection = projectYear({
            expectedListedPerYear: set.expectedListedPerYear,
            avgNewPriceKop: set.avgNewPriceKop,
            avgMaterialsKop: set.avgMaterialsKop,
            avgDisposalKop: set.avgDisposalKop,
            defaultTransportKop: set.defaultTransportKop,
            practiceConsumableKop: set.practiceConsumableKop,
            substitutionMilli: set.substitutionMilli,
            completionMilli: set.completionMilli,
            hostingKopAnnual: set.hostingKopAnnual,
            supportKopAnnual: set.supportKopAnnual,
          });

          return (
            <div key={set.id} className="flex flex-col gap-3">
              <AssumptionForm
                kind={set.kind}
                title={set.title}
                values={{
                  expectedListedPerYear: String(set.expectedListedPerYear),
                  avgNewPrice: formatBynAmount(set.avgNewPriceKop),
                  avgMaterials: formatBynAmount(set.avgMaterialsKop),
                  defaultTransport: formatBynAmount(set.defaultTransportKop),
                  practiceConsumable: formatBynAmount(set.practiceConsumableKop),
                  substitutionPercent: String(Math.round(set.substitutionMilli / 10)),
                  completionPercent: String(Math.round(set.completionMilli / 10)),
                  hostingAnnual: formatBynAmount(set.hostingKopAnnual),
                  supportAnnual: formatBynAmount(set.supportKopAnnual),
                  illustrativeLaborHour: formatBynAmount(set.illustrativeLaborKopHour),
                  basisNote: set.basisNote,
                  shownOnDashboard: set.shownOnDashboard,
                }}
              />
              <p className="px-1 text-sm text-leaf">
                Сейчас: {projection.completedOrders} заказов · бюджет имущества{" "}
                {formatBynAmount(projection.propertyBudgetKop)} BYN · окупаемость{" "}
                {projection.paybackYears === null
                  ? "н/д"
                  : `${projection.paybackYears.toLocaleString("ru-BY", {
                      maximumFractionDigits: 1,
                    })} лет`}
                .
              </p>
            </div>
          );
        })}
      </div>
    </main>
  );
}
