import Link from "next/link";
import { notFound } from "next/navigation";
import { DocumentLinks } from "@/components/document-links";
import { StatusBadge } from "@/components/status-badge";
import { formatByn } from "@/domain/economy/money";
import { itemManageState } from "@/domain/items/access";
import {
  closeReasonLabels,
  conditionLabels,
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

function statusName(value: string): string {
  if (value in statusLabels) return statusLabels[value as ItemStatus];
  return "Нет карточки";
}

export default async function ItemCardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireRoles([
    "DONOR_STAFF",
    "WORKSHOP_MASTER",
    "DISTRICT_ANALYST",
    "PLATFORM_ADMIN",
  ]);
  const item = await findItemCard(id);
  if (!item) notFound();
  const documents = await listDocumentsForItem(item.id);

  const manage = itemManageState(user, item);
  const lineTotal = item.newUnitPriceKop * item.quantity;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-8">
      <Link href="/catalog" className="text-sm font-medium text-leaf hover:text-ink">
        К каталогу
      </Link>
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-3">
          {item.photos.map((photo) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={photo.id}
              src={itemPhotoSrc(photo)}
              alt=""
              className="aspect-[4/3] w-full rounded-xl bg-mint/20 object-cover"
            />
          ))}
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={item.status} />
            <span className="text-sm text-leaf">{conditionLabels[item.condition]}</span>
            {item.closeReason ? (
              <span className="text-sm text-leaf">{closeReasonLabels[item.closeReason]}</span>
            ) : null}
          </div>
          <h1 className="text-2xl font-semibold text-ink">{item.title}</h1>
          <p className="text-leaf">{item.institution.name}</p>
          <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-leaf">Район</dt>
              <dd className="text-ink">{item.institution.district}</dd>
            </div>
            <div>
              <dt className="text-leaf">Адрес</dt>
              <dd className="text-ink">{item.institution.address}</dd>
            </div>
            <div>
              <dt className="text-leaf">Категория</dt>
              <dd className="text-ink">{item.category.name}</dd>
            </div>
            <div>
              <dt className="text-leaf">Год выпуска</dt>
              <dd className="text-ink">{item.year ?? "не указан"}</dd>
            </div>
            <div>
              <dt className="text-leaf">Количество</dt>
              <dd className="text-ink">{item.quantity} шт.</dd>
            </div>
            <div>
              <dt className="text-leaf">Цена новой за штуку</dt>
              <dd className="text-ink">{formatByn(item.newUnitPriceKop)}</dd>
            </div>
            <div>
              <dt className="text-leaf">Оценка партии</dt>
              <dd className="text-ink">{formatByn(lineTotal)}</dd>
            </div>
            <div>
              <dt className="text-leaf">Опубликовал</dt>
              <dd className="text-ink">{item.listedBy.fullName}</dd>
            </div>
          </dl>
          <p className="text-sm text-leaf">
            Цена — оценка учреждения, допущение, а не нормативная стоимость.
          </p>
          {item.condition === "SCRAP" ? (
            <p className="text-sm text-leaf">Лом в учебный ремонт не передаём, карточка нужна для учёта.</p>
          ) : null}
          {manage === "edit" ? (
            <Link
              href={`/cabinet/items/${item.id}/edit`}
              className="inline-flex h-11 items-center justify-center rounded-lg bg-ink px-4 text-sm font-medium text-white hover:bg-leaf"
            >
              Править карточку
            </Link>
          ) : null}
          {manage === "locked" ? (
            <p className="text-sm text-leaf">
              Править карточку можно, пока она опубликована. Сейчас статус — {statusLabels[item.status]}.
            </p>
          ) : null}
          {manage === "foreign" && user.role === "WORKSHOP_MASTER" ? (
            <Link
              href="/workshop"
              className="inline-flex h-11 items-center justify-center rounded-lg border border-ink px-4 text-sm font-medium text-ink hover:bg-mint/30"
            >
              К бирже заданий
            </Link>
          ) : null}
        </div>
      </div>

      <section className="flex max-w-3xl flex-col gap-2">
        <h2 className="text-lg font-semibold text-ink">Описание</h2>
        <p className="whitespace-pre-wrap leading-7 text-ink">{item.description}</p>
      </section>

      {documents.length > 0 ? (
        <section className="flex max-w-3xl flex-col gap-3">
          <h2 className="text-lg font-semibold text-ink">Черновики актов</h2>
          <DocumentLinks documents={documents} />
        </section>
      ) : null}

      <section className="flex max-w-3xl flex-col gap-3">
        <h2 className="text-lg font-semibold text-ink">История статусов</h2>
        <ol className="flex flex-col gap-3">
          {item.events.map((event) => (
            <li key={event.id} className="rounded-xl border border-mint/70 px-4 py-3">
              <p className="text-sm text-leaf">
                {when.format(event.createdAt)} · {event.actor.fullName}
              </p>
              <p className="font-medium text-ink">
                {event.fromStatus === "NONE"
                  ? statusLabels.LISTED
                  : `${statusName(event.fromStatus)} → ${statusName(event.toStatus)}`}
              </p>
              {event.comment ? <p className="text-sm text-leaf">{event.comment}</p> : null}
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
