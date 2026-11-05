import Link from "next/link";
import { DocumentLinks } from "@/components/document-links";
import { OrderActions } from "@/components/order-actions";
import { OrderChat } from "@/components/order-chat";
import { StatusBadge } from "@/components/status-badge";
import { PageHeader } from "@/components/ui/page-header";
import { PageShell, Surface } from "@/components/ui/surface";
import { formatByn } from "@/domain/economy/money";
import { requireRoles } from "@/server/auth/current-user";
import { listOrderMessages } from "@/server/repositories/chat-repository";
import { listMasterOrders } from "@/server/repositories/order-repository";

export const instant = false;

const activeStatuses = new Set(["ASSIGNED", "IN_PROGRESS", "QUALITY_CHECK"]);

export default async function OrdersPage() {
  const user = await requireRoles(["FREELANCER"]);
  const orders = await listMasterOrders(user.id);

  const active = orders.filter((order) => activeStatuses.has(order.status));
  const done = orders.filter((order) => order.status === "COMPLETED");

  const chatByOrder = new Map(
    await Promise.all(
      orders.map(async (order) => [order.id, await listOrderMessages(order.id)] as const),
    ),
  );

  return (
    <PageShell>
      <PageHeader
        title="Заказы"
        description="После принятия завхозом — начните и завершите ремонт. Детали обсуждайте в чате."
      />

      {orders.length === 0 ? (
        <Surface className="border-dashed text-sm text-leaf">
          Заказов пока нет. Откройте{" "}
          <Link href="/workshop" className="font-medium text-leaf hover:text-ink">
            биржу
          </Link>{" "}
          и предложите цену.
        </Surface>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <BoardColumn
            title={`В работе · ${active.length}`}
            orders={active}
            currentUserId={user.id}
            chatByOrder={chatByOrder}
          />
          <BoardColumn
            title={`Готово · ${done.length}`}
            orders={done}
            currentUserId={user.id}
            chatByOrder={chatByOrder}
          />
        </div>
      )}
    </PageShell>
  );
}

function BoardColumn({
  title,
  orders,
  currentUserId,
  chatByOrder,
}: {
  title: string;
  orders: Awaited<ReturnType<typeof listMasterOrders>>;
  currentUserId: string;
  chatByOrder: Map<string, Awaited<ReturnType<typeof listOrderMessages>>>;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      {orders.length === 0 ? (
        <Surface className="border-dashed px-4 py-6 text-sm text-leaf">Пока пусто</Surface>
      ) : (
        <ul className="flex flex-col gap-3">
          {orders.map((order) => (
            <Surface key={order.id} as="li" className="flex flex-col gap-3">
              <div className="flex flex-col gap-2">
                <Link
                  href={`/catalog/${order.item.id}`}
                  className="font-medium text-ink hover:text-leaf"
                >
                  {order.item.title}
                </Link>
                <p className="text-sm text-ink">{order.item.institution.name}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={order.item.status} />
                  <span className="text-sm text-leaf">
                    Ваша цена {formatByn(order.agreedFeeKop)}
                  </span>
                </div>
              </div>
              <OrderActions
                orderId={order.id}
                orderStatus={order.status}
                itemStatus={order.item.status}
                schoolAccepted={Boolean(order.schoolAcceptedAt)}
              />
              <OrderChat
                orderId={order.id}
                currentUserId={currentUserId}
                messages={chatByOrder.get(order.id) ?? []}
              />
              <DocumentLinks documents={order.documents} compact />
            </Surface>
          ))}
        </ul>
      )}
    </section>
  );
}
