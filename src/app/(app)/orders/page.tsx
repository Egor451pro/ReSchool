import Link from "next/link";
import { OrderActions } from "@/components/order-actions";
import { StatusBadge } from "@/components/status-badge";
import { formatByn } from "@/domain/economy/money";
import { kanbanColumns, orderStatusLabels } from "@/domain/orders/labels";
import { itemPhotoSrc } from "@/domain/items/photo";
import { requireRoles } from "@/server/auth/current-user";
import { listMasterOrders, listWorkshopOrders } from "@/server/repositories/order-repository";

export const instant = false;

export default async function OrdersPage() {
  const user = await requireRoles(["WORKSHOP_MASTER", "PLATFORM_ADMIN"]);
  const orders =
    user.role === "WORKSHOP_MASTER"
      ? await listMasterOrders(user.id)
      : user.institutionId
        ? await listWorkshopOrders(user.institutionId)
        : await listMasterOrders(user.id);

  const byStatus = Object.fromEntries(
    kanbanColumns.map((status) => [status, orders.filter((order) => order.status === status)]),
  ) as Record<(typeof kanbanColumns)[number], typeof orders>;
  const cancelled = orders.filter((order) => order.status === "CANCELLED");

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-ink">Заказы</h1>
        <p className="max-w-3xl text-leaf">
          Канбан мастерской. Каждый шаг пишет историю предмета. Отмена до проверки качества
          возвращает карточку в каталог.
        </p>
      </div>

      {orders.length === 0 ? (
        <p className="text-leaf">
          Заказов пока нет. Откройте{" "}
          <Link href="/workshop" className="font-medium text-leaf hover:text-ink">
            биржу
          </Link>
          .
        </p>
      ) : (
        <div className="grid gap-4 xl:grid-cols-4">
          {kanbanColumns.map((status) => (
            <section key={status} className="flex flex-col gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-leaf">
                {orderStatusLabels[status]} · {byStatus[status].length}
              </h2>
              <ul className="flex flex-col gap-3">
                {byStatus[status].map((order) => {
                  const photo = order.item.photos[0];
                  return (
                    <li
                      key={order.id}
                      className="flex flex-col gap-3 rounded-xl border border-mint/70 bg-paper p-3"
                    >
                      <div className="aspect-[4/3] overflow-hidden rounded-lg bg-mint/20">
                        {photo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={itemPhotoSrc(photo)}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : null}
                      </div>
                      <div className="flex flex-col gap-1">
                        <Link
                          href={`/catalog/${order.item.id}`}
                          className="font-medium leading-5 text-ink hover:text-leaf"
                        >
                          {order.item.title}
                        </Link>
                        <p className="text-xs text-leaf">
                          {order.group.name} · {order.specialty.name}
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusBadge status={order.item.status} />
                          <span className="text-xs text-leaf">
                            план {formatByn(order.plannedMaterialsKop)} · {order.plannedMinutes} мин
                          </span>
                        </div>
                      </div>
                      <OrderActions
                        orderId={order.id}
                        orderStatus={order.status}
                        itemStatus={order.item.status}
                      />
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}

      {cancelled.length > 0 ? (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-leaf">
            Отменённые · {cancelled.length}
          </h2>
          <ul className="flex flex-col divide-y divide-mint/60 rounded-xl border border-mint/70">
            {cancelled.map((order) => (
              <li key={order.id} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:justify-between">
                <Link href={`/catalog/${order.item.id}`} className="font-medium text-ink hover:text-leaf">
                  {order.item.title}
                </Link>
                <span className="text-sm text-leaf">
                  {order.group.name} · предмет: {order.item.status === "LISTED" ? "снова в каталоге" : order.item.status}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}
