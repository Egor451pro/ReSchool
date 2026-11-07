import Link from "next/link";
import { FreelancerDisposalCard } from "@/components/freelancer-disposal-card";
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
import { loadFreelancerDisposalJobs } from "@/server/services/disposal-service";

export const instant = false;

export default async function OrdersPage() {
  const user = await requireRoles(["FREELANCER"]);
  const [active, history, disposalJobs] = await Promise.all([
    listMasterActiveOrders(user.id),
    listFreelancerRepairHistory(user.id),
    loadFreelancerDisposalJobs(user.id),
  ]);

  return (
    <PageShell>
      <PageHeader
        title="Заказы"
        description="Шаги: предложили цену → ждёте подтверждения завхоза → ремонт → закрыли заказ → ждёте выплаты."
      />

      {active.length === 0 && history.length === 0 && disposalJobs.length === 0 ? (
        <Surface className="border-dashed text-sm text-leaf">
          Заказов пока нет. Откройте{" "}
          <Link href="/workshop" className="font-medium text-leaf hover:text-ink">
            биржу
          </Link>{" "}
          и предложите цену.
        </Surface>
      ) : (
        <div className="flex flex-col gap-10">
          {disposalJobs.length > 0 ? (
            <section className="flex flex-col gap-3">
              <h2 className="text-lg font-semibold text-ink">
                Сдача в утиль · {disposalJobs.length}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {disposalJobs.map((job) => (
                  <FreelancerDisposalCard
                    key={job.id}
                    itemId={job.itemId}
                    title={job.item.title}
                    institutionName={job.item.institution.name}
                    pointName={job.point?.name ?? "Пункт не выбран"}
                    pointAddress={job.point?.address ?? ""}
                    feeKop={job.feeKop}
                    status={job.status}
                  />
                ))}
              </div>
            </section>
          ) : null}

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
                  const openFee = order.openOfferKop || order.agreedFeeKop;
                  const orderHint = waitingSchool
                    ? "Ждёт подтверждения закрытия завхозом"
                    : !order.schoolAcceptedAt && order.status === "ASSIGNED"
                      ? "Торг по цене — ждёт подтверждения завхоза"
                      : orderStatusLabels[order.status as OrderStatus];
                  return (
                    <OrderListItem
                      key={order.id}
                      href={`/orders/${order.id}`}
                      title={order.item.title}
                      subtitle={order.item.institution.name}
                      status={order.item.status}
                      meta={feeMeta(openFee)}
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
