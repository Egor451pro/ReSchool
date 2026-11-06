import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { BackLink } from "@/components/back-link";
import { DocumentLinks } from "@/components/document-links";
import { OrderActions } from "@/components/order-actions";
import { FreelancerOrderSteps } from "@/components/order-flow-steps";
import { OrderChat } from "@/components/order-chat";
import { StatusBadge } from "@/components/status-badge";
import { PageShell, Surface } from "@/components/ui/surface";
import { formatByn } from "@/domain/economy/money";
import { orderStatusLabels, type OrderStatus } from "@/domain/orders/labels";
import { requireRoles } from "@/server/auth/current-user";
import { listOrderMessages } from "@/server/repositories/chat-repository";
import { findOrderDetail } from "@/server/repositories/order-repository";

export const instant = false;

export default async function FreelancerOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireRoles(["FREELANCER", "PLATFORM_ADMIN"]);
  const order = await findOrderDetail(id);
  if (!order) notFound();

  if (user.role === "FREELANCER" && order.masterId !== user.id) {
    redirect("/orders");
  }

  const closed = order.item.status === "CLOSED";
  if (closed) {
    redirect("/orders");
  }

  const messages = await listOrderMessages(order.id);

  return (
    <PageShell>
      <BackLink href="/orders">К списку заказов</BackLink>

      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:items-start">
        <div className="flex flex-col gap-5">
          <header className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={order.item.status} />
              <span className="text-sm text-leaf">
                {orderStatusLabels[order.status as OrderStatus]}
              </span>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              {order.item.title}
            </h1>
            <p className="text-sm text-leaf">
              {order.item.institution.name}
              {order.item.category?.name ? ` · ${order.item.category.name}` : null}
            </p>
            <p className="text-base font-medium text-ink">
              Ваша цена {formatByn(order.agreedFeeKop)}
            </p>
            <Link href={`/catalog/${order.item.id}`} className="text-sm text-gold underline-offset-2 hover:underline">
              Карточка объекта в каталоге
            </Link>
          </header>

          {order.item.description ? (
            <Surface>
              <h2 className="text-sm font-semibold text-ink">Описание</h2>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-leaf">
                {order.item.description}
              </p>
            </Surface>
          ) : null}

          <Surface className="flex flex-col gap-4">
            <div>
              <h2 className="mb-3 text-sm font-semibold text-ink">Шаги заказа</h2>
              <FreelancerOrderSteps
                itemStatus={order.item.status}
                orderStatus={order.status as OrderStatus}
                schoolAccepted={Boolean(order.schoolAcceptedAt)}
                agreedFeeKop={order.agreedFeeKop}
              />
            </div>
            <OrderActions
              orderId={order.id}
              orderStatus={order.status}
              itemStatus={order.item.status}
              schoolAccepted={Boolean(order.schoolAcceptedAt)}
              agreedFeeKop={order.agreedFeeKop}
            />
          </Surface>

          {order.documents.length > 0 ? (
            <Surface>
              <h2 className="mb-2 text-sm font-semibold text-ink">Документы</h2>
              <DocumentLinks documents={order.documents} />
            </Surface>
          ) : null}
        </div>

        <OrderChat
          orderId={order.id}
          currentUserId={user.id}
          messages={messages}
          peerLabel="Завхоз"
          compact
        />
      </div>
    </PageShell>
  );
}
