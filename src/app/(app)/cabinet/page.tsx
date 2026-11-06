import Link from "next/link";
import { feeMeta, OrderListItem } from "@/components/order-list-item";
import { ItemForm } from "@/components/item-form";
import { RepairHistoryPanel } from "@/components/repair-history-panel";
import { PageHeader } from "@/components/ui/page-header";
import { PageShell, Surface } from "@/components/ui/surface";
import { compareCategorySlug, itemsCountLabel, type CloseReason } from "@/domain/items/labels";
import { orderStatusLabels, type OrderStatus } from "@/domain/orders/labels";
import { requireRoles } from "@/server/auth/current-user";
import {
  listCategories,
  listInstitutionActiveItems,
  listInstitutionRepairHistory,
} from "@/server/repositories/item-repository";

export const instant = false;

export default async function CabinetPage() {
  const user = await requireRoles(["DONOR_STAFF"]);
  const categories = (await listCategories()).sort((left, right) =>
    compareCategorySlug(left.slug, right.slug),
  );

  if (!user.institutionId) {
    return (
      <PageShell>
        <PageHeader
          title="Кабинет"
          description="Публикация идёт от имени учреждения. Войдите как завхоз на экране входа."
          actions={
            <Link href="/catalog" className="btn-primary btn-sm">
              Каталог
            </Link>
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
        description={`${user.institutionName}. Сейчас ${itemsCountLabel(active.length)} в работе. Откройте пункт списка, чтобы принять заказ, подтвердить закрытие или написать в чат.`}
      />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,22rem)] lg:gap-8">
        <div className="flex min-w-0 flex-col gap-8 lg:gap-10">
          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold text-ink">Мои предметы · {active.length}</h2>
            {active.length === 0 ? (
              <Surface className="border-dashed text-sm text-leaf">
                Пока пусто. Добавьте первую карточку формой справа.
              </Surface>
            ) : (
              <ul className="flex flex-col gap-2">
                {active.map((item) => {
                  const order = item.orders[0];
                  const awaitingAccept =
                    item.status === "REQUESTED" &&
                    order?.status === "ASSIGNED" &&
                    !order.schoolAcceptedAt;
                  const waitingConfirm = item.status === "READY" && Boolean(order);
                  const hint = awaitingAccept
                    ? `Ждёт принятия · ${feeMeta(order!.agreedFeeKop)}`
                    : waitingConfirm
                      ? "Ждёт вашего подтверждения закрытия"
                      : order
                        ? `${orderStatusLabels[order.status as OrderStatus]}${
                            order.master?.fullName ? ` · ${order.master.fullName}` : ""
                          }`
                        : "Свободно в каталоге";
                  return (
                    <OrderListItem
                      key={item.id}
                      href={`/cabinet/items/${item.id}`}
                      title={item.title}
                      subtitle={item.category.name}
                      status={item.status}
                      meta={order ? feeMeta(order.agreedFeeKop) : undefined}
                      hint={hint}
                    />
                  );
                })}
              </ul>
            )}
          </section>

          <RepairHistoryPanel
            items={history.map((item) => ({
              ...item,
              closeReason: (item.closeReason as CloseReason | null) ?? null,
            }))}
          />
        </div>

        <Surface as="section" className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-ink">Новый предмет</h2>
          <ItemForm categories={categories} />
        </Surface>
      </div>
    </PageShell>
  );
}
