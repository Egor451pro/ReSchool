import Link from "next/link";
import { SimpleCalculator } from "@/components/simple-calculator";
import { formatBynAmount } from "@/domain/economy/money";
import { requireRoles } from "@/server/auth/current-user";
import { listEditableAssumptions } from "@/server/services/economy-service";

export const instant = false;

export default async function DistrictCalculatorPage() {
  await requireRoles(["DISTRICT_ANALYST", "PLATFORM_ADMIN"]);
  const assumptions = await listEditableAssumptions();

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-8">
      <div className="flex flex-col gap-2">
        <Link href="/district" className="text-sm font-medium text-leaf hover:text-ink">
          ← К дашборду района
        </Link>
        <h1 className="text-2xl font-semibold text-ink">Калькулятор</h1>
        <p className="max-w-2xl text-leaf">
          Выберите сценарий, подставьте несколько чисел — справа сразу виден прогноз экономии и
          окупаемости.
        </p>
      </div>

      <SimpleCalculator
        scenarios={assumptions.map((set) => ({
          kind: set.kind,
          title: set.title,
          shownOnDashboard: set.shownOnDashboard,
          expectedListedPerYear: String(set.expectedListedPerYear),
          completionPercent: String(Math.round(set.completionMilli / 10)),
          avgNewPrice: formatBynAmount(set.avgNewPriceKop),
          avgRepair: formatBynAmount(set.avgMaterialsKop + set.defaultTransportKop),
          platformAnnual: formatBynAmount(set.hostingKopAnnual + set.supportKopAnnual),
          avgDisposalKop: set.avgDisposalKop,
          freelancerAvgFeeKop: set.freelancerAvgFeeKop,
        }))}
      />
    </main>
  );
}
