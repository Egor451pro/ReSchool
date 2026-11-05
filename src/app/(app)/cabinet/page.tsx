import Link from "next/link";
import { ConfirmRepairButton } from "@/components/confirm-repair-button";
import { ItemForm } from "@/components/item-form";
import { ItemTile } from "@/components/item-tile";
import { PageHeader } from "@/components/ui/page-header";
import { PageShell, Surface } from "@/components/ui/surface";
import {
  closeReasonLabels,
  compareCategorySlug,
  itemsCountLabel,
  type CloseReason,
} from "@/domain/items/labels";
import { requireRoles } from "@/server/auth/current-user";
import {
  listCategories,
  listInstitutionActiveItems,
  listInstitutionRepairHistory,
} from "@/server/repositories/item-repository";

export const instant = false;

export default async function CabinetPage() {
  const user = await requireRoles(["DONOR_STAFF", "PLATFORM_ADMIN"]);
  const categories = (await listCategories()).sort((left, right) =>
    compareCategorySlug(left.slug, right.slug),
  );

  if (!user.institutionId) {
    return (
      <PageShell>
        <PageHeader
          title="Кабинет"
          description="Публикация идёт от имени школы. Перейдите в каталог или к участникам."
          actions={
            <div className="flex flex-wrap gap-2">
              <Link href="/catalog" className="btn-primary btn-sm">
                Каталог
              </Link>
              <Link href="/admin" className="btn-ghost btn-sm">
                Участники
              </Link>
            </div>
          }
        />
      </PageShell>
    );
  }

  const [active, history] = await Promise.all([
    listInstitutionActiveItems(user.institutionId),
    listInstitutionRepairHistory(user.institutionId),
  ]);

  return (
    <PageShell>
      <PageHeader
        title="Кабинет"
        description={`${user.institutionName}. Сейчас ${itemsCountLabel(active.length)} в работе.`}
        banner="Опубликуйте вещь, которую можно починить. Когда мастерская закончит ремонт — подтвердите получение здесь."
      />

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex flex-col gap-10">
          <section className="flex flex-col gap-4">
            <h2 className="text-lg font-semibold text-ink">Мои предметы</h2>
            {active.length === 0 ? (
              <Surface className="border-dashed text-sm text-leaf">
                Пока пусто. Добавьте первую карточку формой справа.
              </Surface>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {active.map((item) => (
                  <div key={item.id} className="flex flex-col">
                    <ItemTile item={item} />
                    {item.status === "READY" ? (
                      <Surface className="mt-2 border-leaf/40 bg-mint/10 p-3">
                        <p className="text-sm text-leaf">
                          Ремонт завершён. Подтвердите получение — карточка уйдёт в историю.
                        </p>
                        <ConfirmRepairButton itemId={item.id} />
                      </Surface>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </section>

          <section id="history" className="flex scroll-mt-24 flex-col gap-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-lg font-semibold text-ink">История ремонтов</h2>
              {history.length > 0 ? (
                <p className="text-sm text-leaf">{itemsCountLabel(history.length)}</p>
              ) : null}
            </div>
            {history.length === 0 ? (
              <Surface className="border-dashed text-sm text-leaf">
                Здесь появятся подтверждённые и закрытые карточки.
              </Surface>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {history.map((item) => (
                  <div key={item.id} className="flex flex-col gap-2">
                    <ItemTile item={item} />
                    <p className="px-1 text-xs text-leaf">
                      {item.closeReason
                        ? closeReasonLabels[item.closeReason as CloseReason]
                        : "Закрыто"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <Surface as="section" className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-ink">Новый предмет</h2>
          <ItemForm categories={categories} />
        </Surface>
      </div>
    </PageShell>
  );
}
