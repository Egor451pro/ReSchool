import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ConfirmRepairButton } from "@/components/confirm-repair-button";
import { DocumentLinks } from "@/components/document-links";
import { OrderActions } from "@/components/order-actions";
import { OrderChat, OrderChatLocked } from "@/components/order-chat";
import { ConditionBadge, StatusBadge } from "@/components/status-badge";
import type { OrderStatus } from "@/domain/orders/labels";
import { formatByn } from "@/domain/economy/money";
import { itemManageState } from "@/domain/items/access";
import { mvpRoleLabel, type UserRole } from "@/domain/access/roles";
import {
  closeReasonLabels,
  statusLabels,
  type ItemStatus,
} from "@/domain/items/labels";
import { itemPhotoSrc } from "@/domain/items/photo";
import { requireRoles } from "@/server/auth/current-user";
import { listOrderMessages } from "@/server/repositories/chat-repository";
import { listDocumentsForItem } from "@/server/repositories/document-repository";
import { findItemCard } from "@/server/repositories/item-repository";

export const instant = false;

const when = new Intl.DateTimeFormat("ru-RU", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Europe/Minsk",
});

const card =
  "rounded-3xl border border-line bg-surface p-5 shadow-[var(--shadow-soft)] transition-colors duration-300";

function statusName(value: string): string {
  if (value in statusLabels) return statusLabels[value as ItemStatus];
  return "Нет карточки";
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-2xl bg-muted px-3.5 py-3 ring-1 ring-line transition-colors duration-300">
      <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-leaf">
        {label}
      </dt>
      <dd className="mt-1 truncate text-sm font-medium text-ink" title={value}>
        {value}
      </dd>
    </div>
  );
}

function InfoAlert({ children }: { children: ReactNode }) {
  return (
    <div className="flex gap-3 rounded-2xl border border-line-strong bg-muted px-4 py-3 text-sm leading-6 text-ink/80 transition-colors duration-300">
      <span
        aria-hidden
        className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold/20 text-xs font-bold text-gold"
      >
        i
      </span>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function PhotoPlaceholder() {
  return (
    <div className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-3 rounded-3xl bg-placeholder text-gold shadow-[var(--shadow-soft)] ring-1 ring-line transition-colors duration-300">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="h-12 w-12 opacity-80"
        aria-hidden
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 8l-9-4.5L3 8m18 0v8l-9 4.5M21 8l-9 4.5M3 8v8l9 4.5m0-8V21"
        />
      </svg>
    </div>
  );
}

export default async function ItemCardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireRoles([
    "DONOR_STAFF",
    "FREELANCER",
    "DISTRICT_ANALYST",
    "PLATFORM_ADMIN",
  ]);
  const item = await findItemCard(id);
  if (!item) notFound();
  const documents = await listDocumentsForItem(item.id);

  const manage = itemManageState(user, item);
  const lineTotal = item.newUnitPriceKop * item.quantity;
  const photos = item.photos;
  const order = item.orders[0] ?? null;

  const canChat =
    Boolean(order) &&
    (user.role === "PLATFORM_ADMIN" ||
      (user.role === "FREELANCER" && order?.masterId === user.id) ||
      (user.role === "DONOR_STAFF" && user.institutionId === item.institutionId));

  const messages = order && canChat ? await listOrderMessages(order.id) : [];
  const peerLabel =
    user.role === "FREELANCER"
      ? "Завхоз"
      : user.role === "DONOR_STAFF"
        ? order?.master
          ? `Фрилансер · ${order.master.fullName.split(/\s+/)[0]}`
          : "Фрилансер"
        : "Участники";

  return (
    <div className="item-card-theme flex flex-1 flex-col">
      <main className="page-shell page-shell-wide gap-6">
        <Link
          href="/catalog"
          className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-leaf transition hover:text-ink"
        >
          <span aria-hidden>←</span>
          К каталогу
        </Link>

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] xl:grid-cols-[minmax(0,22rem)_minmax(0,1fr)_minmax(0,22rem)]">
          <aside className="flex flex-col gap-5 lg:sticky lg:top-24">
            <div className="overflow-hidden rounded-3xl">
              {photos.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={itemPhotoSrc(photos[0])}
                    alt=""
                    className="aspect-[4/3] w-full rounded-3xl bg-placeholder object-cover shadow-[var(--shadow-soft)] ring-1 ring-line"
                  />
                  {photos.length > 1 ? (
                    <div className="grid grid-cols-3 gap-2">
                      {photos.slice(1, 4).map((photo) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          key={photo.id}
                          src={itemPhotoSrc(photo)}
                          alt=""
                          className="aspect-square w-full rounded-2xl bg-placeholder object-cover ring-1 ring-line"
                        />
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : (
                <PhotoPlaceholder />
              )}
            </div>

            <section className={card}>
              <h2 className="text-sm font-semibold text-ink">Описание</h2>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-leaf">
                {item.description || "Описание не указано."}
              </p>
            </section>
          </aside>

          <div className="flex min-w-0 flex-col gap-6">
            <header className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={item.status} />
                <ConditionBadge condition={item.condition} />
                {item.closeReason ? (
                  <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-ink ring-1 ring-line-strong">
                    {closeReasonLabels[item.closeReason]}
                  </span>
                ) : null}
              </div>

              <div className="flex flex-col gap-2">
                <h1 className="text-balance text-3xl font-bold tracking-tight text-ink">
                  {item.title}
                </h1>
                <p className="text-sm text-leaf">{item.institution.name}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                {manage === "edit" ? (
                  <Link href={`/cabinet/items/${item.id}/edit`} className="btn-primary">
                    Править карточку
                  </Link>
                ) : null}
                {manage === "foreign" && user.role === "FREELANCER" && !order ? (
                  <Link href="/workshop" className="btn-ghost">
                    К бирже заданий
                  </Link>
                ) : null}
              </div>

              {order && user.role === "FREELANCER" && order.masterId === user.id ? (
                <div className={`${card} max-w-md`}>
                  <h2 className="mb-3 text-sm font-semibold text-ink">Действия по заказу</h2>
                  <OrderActions
                    orderId={order.id}
                    orderStatus={order.status as OrderStatus}
                    itemStatus={item.status}
                    schoolAccepted={Boolean(order.schoolAcceptedAt)}
                  />
                </div>
              ) : null}

              {item.status === "READY" &&
              order &&
              user.role === "DONOR_STAFF" &&
              user.institutionId === item.institutionId ? (
                <div className="panel-accent max-w-md rounded-3xl border p-4 shadow-[0_12px_28px_rgba(47,36,28,0.14)]">
                  <p className="panel-accent-muted text-sm">
                    Фрилансер закрыл заказ. Подтвердите закрытие, чтобы завершить работу и
                    начислить выплату.
                  </p>
                  <ConfirmRepairButton itemId={item.id} />
                </div>
              ) : null}
            </header>

            <section className="flex flex-col gap-3">
              <h2 className="text-sm font-semibold text-ink">Характеристики</h2>
              <dl className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <Spec label="Район" value={item.institution.district} />
                <Spec label="Адрес" value={item.institution.address} />
                <Spec label="Категория" value={item.category.name} />
                <Spec label="Год выпуска" value={item.year ? String(item.year) : "не указан"} />
                <Spec label="Количество" value={`${item.quantity} шт.`} />
                <Spec
                  label="Кто опубликовал"
                  value={mvpRoleLabel(item.listedBy.role as UserRole)}
                />
              </dl>
            </section>

            <section className="rounded-3xl border border-line bg-muted p-5 shadow-[var(--shadow-soft)] transition-colors duration-300">
              <h2 className="text-sm font-semibold text-ink">Оценка стоимости</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-leaf">
                    Цена новой за штуку
                  </p>
                  <p className="mt-1 text-2xl font-bold tracking-tight text-ink">
                    {formatByn(item.newUnitPriceKop)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-leaf">
                    Оценка партии
                  </p>
                  <p className="mt-1 text-2xl font-bold tracking-tight text-ink">
                    {formatByn(lineTotal)}
                  </p>
                </div>
              </div>
            </section>

            <div className="flex flex-col gap-3">
              <InfoAlert>
                Цена — оценка завхоза, допущение для расчёта экономии, а не нормативная стоимость
                закупки.
              </InfoAlert>
              {item.condition === "SCRAP" ? (
                <InfoAlert>
                  Лом в ремонт не передаём: карточка нужна для учёта списания.
                </InfoAlert>
              ) : null}
              {manage === "locked" ? (
                <InfoAlert>
                  Править карточку можно, пока она опубликована. Сейчас статус —{" "}
                  <span className="font-semibold text-ink">{statusLabels[item.status]}</span>.
                </InfoAlert>
              ) : null}
            </div>

            {documents.length > 0 ? (
              <section className={card}>
                <h2 className="text-sm font-semibold text-ink">Черновики актов</h2>
                <div className="mt-3">
                  <DocumentLinks documents={documents} />
                </div>
              </section>
            ) : null}

            <section className={card}>
              <h2 className="text-sm font-semibold text-ink">История статусов</h2>
              {item.events.length === 0 ? (
                <p className="mt-3 text-sm text-leaf">Событий пока нет.</p>
              ) : (
                <ol className="relative mt-5 space-y-0 border-l border-line pl-5">
                  {item.events.map((event, index) => (
                    <li key={event.id} className="relative pb-5 last:pb-0">
                      <span
                        aria-hidden
                        className={`absolute -left-[1.41rem] top-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-paper ${
                          index === item.events.length - 1 ? "bg-gold" : "bg-mint"
                        }`}
                      />
                      <p className="text-xs font-medium text-leaf">
                        {when.format(event.createdAt)} ·{" "}
                        {mvpRoleLabel(event.actor.role as UserRole)}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-ink">
                        {event.fromStatus === "NONE"
                          ? statusLabels.LISTED
                          : `${statusName(event.fromStatus)} → ${statusName(event.toStatus)}`}
                      </p>
                      {event.comment ? (
                        <p className="mt-1 text-sm leading-6 text-leaf">{event.comment}</p>
                      ) : null}
                    </li>
                  ))}
                </ol>
              )}
            </section>

            {/* Чат под контентом на экранах без третьей колонки */}
            <div className="xl:hidden">
              {order && canChat ? (
                <OrderChat
                  orderId={order.id}
                  currentUserId={user.id}
                  messages={messages}
                  peerLabel={peerLabel}
                />
              ) : (
                <OrderChatLocked
                  reason={
                    order
                      ? "Чат доступен завхозу учреждения и фрилансеру, взявшему заказ."
                      : "Чат откроется, когда фрилансер возьмёт объект в работу."
                  }
                />
              )}
            </div>
          </div>

          <aside className="hidden xl:sticky xl:top-24 xl:flex xl:flex-col">
            {order && canChat ? (
              <OrderChat
                orderId={order.id}
                currentUserId={user.id}
                messages={messages}
                peerLabel={peerLabel}
                compact
              />
            ) : (
              <OrderChatLocked
                reason={
                  order
                    ? "Чат доступен завхозу учреждения и фрилансеру, взявшему заказ."
                    : "Чат откроется, когда фрилансер возьмёт объект в работу."
                }
              />
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}
