import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AcceptOrderButton } from "@/components/accept-order-button";
import { BackLink } from "@/components/back-link";
import { ConfirmRepairButton } from "@/components/confirm-repair-button";
import { DeleteItemButton } from "@/components/delete-item-button";
import { DocumentLinks } from "@/components/document-links";
import { OrderChat } from "@/components/order-chat";
import { StatusBadge } from "@/components/status-badge";
import { PageShell, Surface } from "@/components/ui/surface";
import { formatByn } from "@/domain/economy/money";
import { statusLabels } from "@/domain/items/labels";
import { orderStatusLabels, type OrderStatus } from "@/domain/orders/labels";
import { requireRoles } from "@/server/auth/current-user";
import { listOrderMessages } from "@/server/repositories/chat-repository";
import { findItemCard } from "@/server/repositories/item-repository";

export const instant = false;

export default async function CabinetItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireRoles(["DONOR_STAFF"]);
  const item = await findItemCard(id);
  if (!item) notFound();

  if (!user.institutionId || item.institutionId !== user.institutionId) {
    redirect("/cabinet");
  }

  if (item.status === "CLOSED") {
    redirect("/cabinet");
  }

  const order = item.orders[0] ?? null;
  const awaitingAccept =
    item.status === "REQUESTED" &&
    order?.status === "ASSIGNED" &&
    !order.schoolAcceptedAt;
  const waitingConfirm = item.status === "READY" && Boolean(order);
  const showChat = Boolean(order) && item.status !== "LISTED";
  const messages = order && showChat ? await listOrderMessages(order.id) : [];

  return (
    <PageShell>
      <BackLink href="/cabinet">К кабинету</BackLink>

      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:items-start">
        <div className="flex flex-col gap-5">
          <header className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={item.status} />
              {order ? (
                <span className="text-sm text-leaf">
                  {orderStatusLabels[order.status as OrderStatus]}
                </span>
              ) : (
                <span className="text-sm text-leaf">{statusLabels[item.status]}</span>
              )}
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              {item.title}
            </h1>
            <p className="text-sm text-leaf">
              {item.category.name} · {item.quantity} шт. · {formatByn(item.newUnitPriceKop)} за
              штуку
            </p>
            {order?.master ? (
              <p className="text-sm text-leaf">Фрилансер: {order.master.fullName}</p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <Link href={`/catalog/${item.id}`} className="btn-ghost btn-sm">
                В каталоге
              </Link>
              {item.status === "LISTED" ? (
                <Link href={`/cabinet/items/${item.id}/edit`} className="btn-ghost btn-sm">
                  Править
                </Link>
              ) : null}
            </div>
          </header>

          {item.description ? (
            <Surface>
              <h2 className="text-sm font-semibold text-ink">Описание</h2>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-leaf">
                {item.description}
              </p>
            </Surface>
          ) : null}

          {item.status === "LISTED" ? (
            <Surface className="flex flex-col gap-3">
              <p className="text-sm text-leaf">
                Объявление свободно. Можно удалить карточку, пока её не взяли в работу.
              </p>
              <DeleteItemButton itemId={item.id} />
            </Surface>
          ) : null}

          {awaitingAccept && order ? (
            <Surface tone="accent" className="p-4">
              <p className="text-sm leading-6">
                Фрилансер предложил ремонт за{" "}
                <span className="font-semibold">{formatByn(order.agreedFeeKop)}</span>. Примите
                заказ — у него появится «Начать ремонт».
              </p>
              <AcceptOrderButton orderId={order.id} />
            </Surface>
          ) : null}

          {waitingConfirm && order ? (
            <Surface tone="accent" className="p-4">
              <p className="text-sm leading-6">
                Фрилансер закрыл заказ. Подтвердите закрытие — карточка уйдёт в историю, выплата
                начислится.
              </p>
              <ConfirmRepairButton itemId={item.id} />
            </Surface>
          ) : null}

          {order?.documents && order.documents.length > 0 ? (
            <Surface>
              <h2 className="mb-2 text-sm font-semibold text-ink">Документы</h2>
              <DocumentLinks documents={order.documents} />
            </Surface>
          ) : null}
        </div>

        {showChat && order ? (
          <OrderChat
            orderId={order.id}
            currentUserId={user.id}
            messages={messages}
            title="Чат с фрилансером"
            peerLabel={order.master?.fullName.split(/\s+/)[0] ?? "Фрилансер"}
            compact
          />
        ) : (
          <Surface className="border-dashed text-sm text-leaf">
            Чат появится, когда фрилансер возьмёт объект в работу.
          </Surface>
        )}
      </div>
    </PageShell>
  );
}
