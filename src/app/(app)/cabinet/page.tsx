import Link from "next/link";
import { ItemForm } from "@/components/item-form";
import { ItemTile } from "@/components/item-tile";
import { RequestForm } from "@/components/request-form";
import { compareCategorySlug, itemsCountLabel, requestStatusLabels } from "@/domain/items/labels";
import { requireRoles } from "@/server/auth/current-user";
import { listCategories, listInstitutionItems } from "@/server/repositories/item-repository";
import { listInstitutionRequests, listOpenRequests } from "@/server/repositories/request-repository";

export const instant = false;

export default async function CabinetPage() {
  const user = await requireRoles(["DONOR_STAFF", "PLATFORM_ADMIN"]);
  const categories = (await listCategories()).sort((left, right) =>
    compareCategorySlug(left.slug, right.slug),
  );

  if (!user.institutionId) {
    const requests = await listOpenRequests();
    return (
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold text-ink">Кабинет учреждения</h1>
          <p className="max-w-2xl text-leaf">
            Публикация идёт от имени школы, гимназии или лицея. Администратор смотрит каталог и
            открытые запросы, а опубликованную карточку может поправить из неё самой.
          </p>
        </div>
        <Link href="/catalog" className="text-sm font-medium text-leaf hover:text-ink">
          Открыть каталог
        </Link>
        <RequestList
          title="Открытые запросы"
          requests={requests}
          showInstitution
          empty="Открытых запросов нет."
        />
      </main>
    );
  }

  const [items, requests] = await Promise.all([
    listInstitutionItems(user.institutionId),
    listInstitutionRequests(user.institutionId),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-6 py-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-ink">Кабинет учреждения</h1>
        <p className="text-leaf">
          {user.institutionName}. В кабинете {itemsCountLabel(items.length)}.
        </p>
      </div>

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-ink">Мои предметы</h2>
          {items.length === 0 ? (
            <p className="text-leaf">Пока пусто. Первая карточка публикуется формой на этой странице.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {items.map((item) => (
                <ItemTile key={item.id} item={item} />
              ))}
            </div>
          )}
        </section>
        <section className="flex flex-col gap-4 rounded-xl border border-mint/70 p-4">
          <h2 className="text-lg font-semibold text-ink">Новый предмет</h2>
          <ItemForm categories={categories} />
        </section>
      </div>

      <div id="needs" className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <RequestList
          title="Нам нужно"
          requests={requests}
          empty="Запросов пока нет. Здесь учреждение отмечает, чего не хватает."
        />
        <section className="flex flex-col gap-4 rounded-xl border border-mint/70 p-4">
          <h2 className="text-lg font-semibold text-ink">Новый запрос</h2>
          <p className="text-sm text-leaf">
            Подбор вещи из каталога появится вместе с биржей заданий.
          </p>
          <RequestForm categories={categories} />
        </section>
      </div>
    </main>
  );
}

function RequestList({
  title,
  requests,
  empty,
  showInstitution,
}: {
  title: string;
  requests: {
    id: string;
    title: string;
    description: string;
    quantity: number;
    status: "OPEN" | "MATCHED" | "CLOSED";
    category: { name: string };
    institution: { name: string };
  }[];
  empty: string;
  showInstitution?: boolean;
}) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      {requests.length === 0 ? (
        <p className="text-leaf">{empty}</p>
      ) : (
        <ul className="flex flex-col divide-y divide-mint/60 rounded-xl border border-mint/70">
          {requests.map((request) => (
            <li key={request.id} className="flex flex-col gap-1 px-4 py-3">
              <span className="font-medium text-ink">{request.title}</span>
              <span className="text-sm text-leaf">
                {request.category.name} · {request.quantity} шт. · {requestStatusLabels[request.status]}
                {showInstitution ? ` · ${request.institution.name}` : ""}
              </span>
              <span className="text-sm text-leaf">{request.description}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
