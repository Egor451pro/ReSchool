import { requireRoles } from "@/server/auth/current-user";

export const instant = false;

export default async function OrdersPage() {
  await requireRoles(["WORKSHOP_MASTER", "PLATFORM_ADMIN"]);

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 px-6 py-8">
      <h1 className="text-2xl font-semibold text-zinc-900">Заказы</h1>
      <p className="text-zinc-600">
        Канбан и переходы статусов подключатся вместе с биржей. Мастер видит этот
        раздел, завхоз и учащийся — нет.
      </p>
    </main>
  );
}
