import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DocumentLinks } from "@/components/document-links";
import { ConditionBadge, StatusBadge } from "@/components/status-badge";
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
import { listDocumentsForItem } from "@/server/repositories/document-repository";
import { findItemCard } from "@/server/repositories/item-repository";

export const instant = false;

const when = new Intl.DateTimeFormat("ru-RU", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Europe/Minsk",
});

const card =
  "rounded-3xl border border-line/90 bg-surface p-5 shadow-[var(--shadow-soft)] transition-colors duration-300";

function statusName(value: string): string {
  if (value in statusLabels) return statusLabels[value as ItemStatus];
  return "Нет карточки";
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-2xl bg-muted/80 px-3.5 py-3 ring-1 ring-line transition-colors duration-300">
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
    <div className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-3 rounded-3xl bg-placeholder text-leaf shadow-[var(--shadow-soft)] ring-1 ring-line transition-colors duration-300">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="h-12 w-12 opacity-70"
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

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-8">
      <Link
        href="/catalog"
        className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-leaf transition hover:text-ink"
      >
        <span aria-hidden>←</span>
        К каталогу
      </Link>

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] xl:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
        <aside className="flex flex-col gap-5 lg:sticky lg:top-6">
          <div className="overflow-hidden rounded-3xl">
            {photos.length > 0 ? (
              <div className="flex flex-col gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={itemPhotoSrc(photos[0])}
                  alt=""
                  className="aspect-[4/3] w-full rounded-3xl object-cover shadow-[var(--shadow-soft)] ring-1 ring-line"
                />
                {photos.length > 1 ? (
                  <div className="grid grid-cols-3 gap-2">
                    {photos.slice(1, 4).map((photo) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={photo.id}
                        src={itemPhotoSrc(photo)}
                        alt=""
                        className="aspect-square w-full rounded-2xl object-cover ring-1 ring-line"
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
              {manage === "foreign" && user.role === "FREELANCER" ? (
                <Link href="/workshop" className="btn-ghost">
                  К бирже заданий
                </Link>
              ) : null}
            </div>
          </header>

          <section className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-ink">Характеристики</h2>
            <dl className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
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

          <section className="rounded-3xl bg-deep p-5 text-cream shadow-[0_16px_40px_rgba(47,36,28,0.16)] transition-colors duration-300">
            <h2 className="text-sm font-semibold text-cream/90">Оценка стоимости</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-cream/55">
                  Цена новой за штуку
                </p>
                <p className="mt-1 text-2xl font-bold tracking-tight text-cream">
                  {formatByn(item.newUnitPriceKop)}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-cream/55">
                  Оценка партии
                </p>
                <p className="mt-1 text-2xl font-bold tracking-tight text-cream">
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
                      className={`absolute -left-[1.41rem] top-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-surface ${
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
        </div>
      </div>
    </main>
  );
}
