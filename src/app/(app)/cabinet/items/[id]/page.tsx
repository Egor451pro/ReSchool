import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { BackLink } from "@/components/back-link";
import { ConfirmRepairButton } from "@/components/confirm-repair-button";
import { DeleteItemButton } from "@/components/delete-item-button";
import { DisposalPanel } from "@/components/disposal-panel";
import { DocumentLinks } from "@/components/document-links";
import { OrderChat } from "@/components/order-chat";
import { SchoolOrderSteps } from "@/components/order-flow-steps";
import { PriceDealPanel } from "@/components/price-deal-panel";
import { RepairBudgetForm } from "@/components/repair-budget-form";
import { StatusBadge } from "@/components/status-badge";
import { PageShell, Surface } from "@/components/ui/surface";
import { formatByn } from "@/domain/economy/money";
import { canUpdateRepairBudget } from "@/domain/items/access";
import { statusLabels } from "@/domain/items/labels";
import { orderStatusLabels, type OrderStatus } from "@/domain/orders/labels";
import type { PriceOfferSide } from "@/domain/orders/price-deal";
import { requireRoles } from "@/server/auth/current-user";
import { listOrderMessages } from "@/server/repositories/chat-repository";
import { findItemCard } from "@/server/repositories/item-repository";
import {
  loadDisposalJob,
  loadRecyclingPointsForItem,
} from "@/server/services/disposal-service";
import { prisma } from "@/server/db";

export const instant = false;

export default async function CabinetItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireRoles(["DONOR_STAFF"]);
  const item = await findItemCard(id);
  if (!item) notFound();

  if (!user.institutionId || item.institutionId !== user.institutionId) {
    redirect("/cabinet");
  }

  if (item.status === "CLOSED" || item.status === "DISPOSED") {
    redirect("/cabinet");
  }

  const order = item.orders[0] ?? null;
  const awaitingAccept =
    item.status === "REQUESTED" &&
    order?.status === "ASSIGNED" &&
    !order.schoolAcceptedAt;
  const waitingConfirm = item.status === "READY" && Boolean(order);
  const disposalPending = item.status === "DISPOSAL_PENDING";
  const showChat = Boolean(order) && item.status !== "LISTED" && !disposalPending;
  const messages = order && showChat ? await listOrderMessages(order.id) : [];
  const canEditBudget = canUpdateRepairBudget(user, item);
  const maxBudgetKop = item.newUnitPriceKop * item.quantity;
  const disposalJob = disposalPending ? await loadDisposalJob(item.id) : null;
  const recyclingPoints = disposalPending
    ? await loadRecyclingPointsForItem(item.category.slug)
    : [];
  const lastMaster = disposalPending
    ? await prisma.repairOrder.findFirst({
        where: { itemId: item.id },
        orderBy: { createdAt: "desc" },
        select: { master: { select: { fullName: true } } },
      })
    : null;

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
              {item.category.name} · {item.quantity} шт. · новое {formatByn(item.newUnitPriceKop)} ·
              ремонт {formatByn(item.repairBudgetKop)}
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

          {!disposalPending ? (
            <Surface>
              <h2 className="mb-3 text-sm font-semibold text-ink">Шаги заказа</h2>
              <SchoolOrderSteps
                itemStatus={item.status}
                orderStatus={order ? (order.status as OrderStatus) : null}
                schoolAccepted={Boolean(order?.schoolAcceptedAt)}
                agreedFeeKop={
                  order
                    ? order.openOfferKop || order.agreedFeeKop
                    : null
                }
              />
            </Surface>
          ) : null}

          {canEditBudget ? (
            <Surface>
              <RepairBudgetForm
                itemId={item.id}
                repairBudgetKop={item.repairBudgetKop}
                maxKop={maxBudgetKop}
                agreedFeeKop={order?.agreedFeeKop}
              />
            </Surface>
          ) : null}

          {awaitingAccept && order ? (
            <PriceDealPanel
              orderId={order.id}
              role="DONOR_STAFF"
              schoolBudgetKop={item.repairBudgetKop}
              openOfferKop={order.openOfferKop}
              openOfferSide={(order.openOfferSide as PriceOfferSide | null) ?? null}
              offers={order.priceOffers.map((offer) => ({
                id: offer.id,
                amountKop: offer.amountKop,
                side: offer.side as PriceOfferSide,
                status: offer.status,
                createdAt: offer.createdAt,
              }))}
              maxKop={maxBudgetKop}
            />
          ) : null}

          {waitingConfirm && order ? (
            <Surface tone="accent" className="p-4">
              <p className="text-sm leading-6">
                Фрилансер закрыл заказ за {formatByn(order.agreedFeeKop)}. Подтвердите закрытие —
                карточка уйдёт в историю, выплата начислится.
              </p>
              <ConfirmRepairButton itemId={item.id} />
            </Surface>
          ) : null}

          {disposalPending ? (
            <Surface>
              <DisposalPanel
                itemId={item.id}
                points={recyclingPoints}
                job={disposalJob}
                freelancerName={
                  disposalJob?.freelancer?.fullName ?? lastMaster?.master.fullName ?? null
                }
              />
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
