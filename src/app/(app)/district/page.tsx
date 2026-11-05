import { requireRoles } from "@/server/auth/current-user";
import { countDistrict } from "@/server/repositories/user-repository";

export const instant = false;

export default async function DistrictPage() {
  const user = await requireRoles(["DISTRICT_ANALYST", "PLATFORM_ADMIN"]);
  const [institutions, items, snapshots] = await countDistrict(user.district);

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 px-6 py-8">
      <h1 className="text-2xl font-semibold text-zinc-900">Район</h1>
      <p className="text-zinc-700">{user.district ?? "Все районы в базе"}.</p>
      <ul className="grid gap-3 sm:grid-cols-3">
        <li className="rounded-lg border border-zinc-200 px-4 py-3">
          <p className="text-2xl font-semibold text-zinc-900">{institutions}</p>
          <p className="text-sm text-zinc-600">учреждений</p>
        </li>
        <li className="rounded-lg border border-zinc-200 px-4 py-3">
          <p className="text-2xl font-semibold text-zinc-900">{items}</p>
          <p className="text-sm text-zinc-600">предметов</p>
        </li>
        <li className="rounded-lg border border-zinc-200 px-4 py-3">
          <p className="text-2xl font-semibold text-zinc-900">{snapshots}</p>
          <p className="text-sm text-zinc-600">снимков экономии</p>
        </li>
      </ul>
      <p className="text-zinc-600">
        Графики, сценарии и сумма в рублях появятся на этапе калькулятора.
      </p>
    </main>
  );
}
