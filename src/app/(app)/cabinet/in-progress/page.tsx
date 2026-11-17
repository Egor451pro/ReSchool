import Link from "next/link";
import { feeMeta, OrderListItem } from "@/components/order-list-item";
import { PageHeader } from "@/components/ui/page-header";
import { PageShell, Surface } from "@/components/ui/surface";
import { orderStatusLabels, type OrderStatus } from "@/domain/orders/labels";
import { requireRoles } from "@/server/auth/current-user";
import { listInstitutionActiveItems } from "@/server/repositories/item-repository";

export const instant = false;

const IN_PROGRESS_STATUSES = new Set([
  "REQUESTED",
  "IN_REPAIR",
  "READY",
  "DISPOSAL_PENDING",
]);

export default async function CabinetInProgressPage() {
  const user = await requireRoles(["DONOR_STAFF"]);

  if (!user.institutionId) {
    return (
      <PageShell>
        <PageHeader
          title="В работе"
          description="Публикация идёт от имени учреждения. Войдите как завхоз на экране входа."
          actions={
            <Link href="/cabinet" className="btn-primary btn-sm">
              Кабинет
            </Link>
          }
        />
      </PageShell>
    );
  }

  const active = await listInstitutionActiveItems(user.institutionId);
  const inProgress = active.filter((item) => IN_PROGRESS_STATUSES.has(item.status));

  return (
    <PageShell>
      <PageHeader
        title="В работе"
        description={`${user.institutionName}. Торг, ремонт и подтверждение закрытия — без свободных объявлений.`}
        actions={
          <Link href="/cabinet" className="btn-ghost btn-sm">
            Кабинет
          </Link>
        }
      />

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-ink">
          Активные · {inProgress.length}
        </h2>
        {inProgress.length === 0 ? (
          <Surface className="border-dashed text-sm text-leaf">
            Нет заказов в работе.{" "}
            <Link href="/cabinet" className="text-gold underline-offset-2 hover:underline">
              Опубликуйте предмет в кабинете
            </Link>
            , когда появится отклик — он будет здесь.
          </Surface>
        ) : (
          <ul className="flex flex-col gap-2">
            {inProgress.map((item) => {
              const order = item.orders[0];
              const awaitingAccept =
                item.status === "REQUESTED" &&
                order?.status === "ASSIGNED" &&
                !order.schoolAcceptedAt;
              const waitingConfirm = item.status === "READY" && Boolean(order);
              const openFee = order ? order.openOfferKop || order.agreedFeeKop : 0;
              const hint = awaitingAccept
                ? `Торг по цене · ${feeMeta(openFee)}`
                : waitingConfirm
                  ? "Ждёт вашего подтверждения закрытия"
                  : order
                    ? `${orderStatusLabels[order.status as OrderStatus]}${
                        order.master?.fullName ? ` · ${order.master.fullName}` : ""
                      }`
                    : "В работе";
              return (
                <OrderListItem
                  key={item.id}
                  href={`/cabinet/items/${item.id}`}
                  title={item.title}
                  subtitle={item.category.name}
                  status={item.status}
                  meta={order ? feeMeta(openFee) : undefined}
                  hint={hint}
                />
              );
            })}
          </ul>
        )}
      </section>
    </PageShell>
  );
}
