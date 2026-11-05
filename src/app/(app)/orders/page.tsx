import Link from "next/link";
import { feeMeta, OrderListItem } from "@/components/order-list-item";
import { RepairHistoryPanel } from "@/components/repair-history-panel";
import { PageHeader } from "@/components/ui/page-header";
import { PageShell, Surface } from "@/components/ui/surface";
import type { CloseReason } from "@/domain/items/labels";
import { orderStatusLabels, type OrderStatus } from "@/domain/orders/labels";
import { requireRoles } from "@/server/auth/current-user";
import {
  listFreelancerRepairHistory,
  listMasterActiveOrders,
} from "@/server/repositories/order-repository";

export const instant = false;

export default async function OrdersPage() {
  const user = await requireRoles(["FREELANCER"]);
  const [active, history] = await Promise.all([
    listMasterActiveOrders(user.id),
    listFreelancerRepairHistory(user.id),
  ]);

  return (
    <PageShell>
      <PageHeader
        title="Заказы"
        description="Откройте заказ из списка — там чат и действия. После подтверждения завхозом заказ попадёт в историю."
      />

      {active.length === 0 && history.length === 0 ? (
        <Surface className="border-dashed text-sm text-leaf">
          Заказов пока нет. Откройте{" "}
          <Link href="/workshop" className="font-medium text-leaf hover:text-ink">
            биржу
          </Link>{" "}
          и предложите цену.
        </Surface>
      ) : (
        <div className="flex flex-col gap-10">
          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold text-ink">В работе · {active.length}</h2>
            {active.length === 0 ? (
              <Surface className="border-dashed px-4 py-6 text-sm text-leaf">
                Сейчас нет активных заказов.
              </Surface>
            ) : (
              <ul className="flex flex-col gap-2">
                {active.map((order) => {
                  const waitingSchool =
                    order.status === "COMPLETED" && order.item.status === "READY";
                  const orderHint = waitingSchool
                    ? "Ждёт подтверждения завхоза"
                    : !order.schoolAcceptedAt && order.status === "ASSIGNED"
                      ? "Ждёт принятия завхозом"
                      : orderStatusLabels[order.status as OrderStatus];
                  return (
                    <OrderListItem
                      key={order.id}
                      href={`/orders/${order.id}`}
                      title={order.item.title}
                      subtitle={order.item.institution.name}
                      status={order.item.status}
                      meta={feeMeta(order.agreedFeeKop)}
                      hint={orderHint}
                    />
                  );
                })}
              </ul>
            )}
          </section>

          <RepairHistoryPanel
            title="История заказов"
            emptyText="Здесь появятся заказы после подтверждения завхозом."
            items={history.map((order) => ({
              ...order.item,
              closeReason: (order.item.closeReason as CloseReason | null) ?? null,
              feeKop: order.agreedFeeKop,
            }))}
            showPlace
          />
        </div>
      )}
    </PageShell>
  );
}
