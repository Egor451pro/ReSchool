import { requireRoles } from "@/server/auth/current-user";
import { countDistrict } from "@/server/repositories/user-repository";

export const instant = false;

export default async function DistrictPage() {
  const user = await requireRoles(["DISTRICT_ANALYST", "PLATFORM_ADMIN"]);
  const [institutions, items, snapshots] = await countDistrict(user.district);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-6 py-8">
      <h1 className="text-2xl font-semibold text-ink">Район</h1>
      <p className="text-leaf">{user.district ?? "Все районы в базе"}.</p>
      <ul className="grid gap-3 sm:grid-cols-3">
        <li className="rounded-lg bg-mint/40 px-4 py-3">
          <p className="text-2xl font-semibold text-ink">{institutions}</p>
          <p className="text-sm text-leaf">учреждений</p>
        </li>
        <li className="rounded-lg bg-mint/40 px-4 py-3">
          <p className="text-2xl font-semibold text-ink">{items}</p>
          <p className="text-sm text-leaf">предметов</p>
        </li>
        <li className="rounded-lg bg-mint/40 px-4 py-3">
          <p className="text-2xl font-semibold text-ink">{snapshots}</p>
          <p className="text-sm text-leaf">снимков экономии</p>
        </li>
      </ul>
      <p className="text-leaf">
        Графики, сценарии и сумма в рублях появятся на этапе калькулятора.
      </p>
    </main>
  );
}
