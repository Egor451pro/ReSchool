import Link from "next/link";
import { AcceptOrderButton } from "@/components/accept-order-button";
import { ConfirmRepairButton } from "@/components/confirm-repair-button";
import { DeleteItemButton } from "@/components/delete-item-button";
import { ItemForm } from "@/components/item-form";
import { ItemTile } from "@/components/item-tile";
import { OrderChat } from "@/components/order-chat";
import { RepairHistoryPanel } from "@/components/repair-history-panel";
import { PageHeader } from "@/components/ui/page-header";
import { PageShell, Surface } from "@/components/ui/surface";
import { formatByn } from "@/domain/economy/money";
import { compareCategorySlug, itemsCountLabel, type CloseReason } from "@/domain/items/labels";
import { requireRoles } from "@/server/auth/current-user";
import { listOrderMessages } from "@/server/repositories/chat-repository";
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

  const chatEntries = await Promise.all(
    active
      .map((item) => item.orders[0]?.id)
      .filter((id): id is string => Boolean(id))
      .map(async (orderId) => [orderId, await listOrderMessages(orderId)] as const),
  );
  const chatByOrder = new Map(chatEntries);

  return (
    <PageShell>
      <PageHeader
        title="Кабинет"
        description={`${user.institutionName}. Сейчас ${itemsCountLabel(active.length)} в работе.`}
        banner="Примите заказ фрилансера → обсудите детали в чате → после ремонта подтвердите выполнение."
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
                {active.map((item) => {
                  const order = item.orders[0];
                  const awaitingAccept =
                    item.status === "REQUESTED" &&
                    order?.status === "ASSIGNED" &&
                    !order.schoolAcceptedAt;
                  const inProgressWithChat =
                    Boolean(order) && item.status !== "LISTED" && item.status !== "CLOSED";
                  return (
                    <div key={item.id} className="flex flex-col gap-2">
                      <ItemTile item={item} />
                      {item.status === "LISTED" ? <DeleteItemButton itemId={item.id} /> : null}
                      {awaitingAccept && order ? (
                        <Surface className="border-transparent bg-deep p-3 text-cream shadow-[0_12px_28px_rgba(47,36,28,0.14)]">
                          <p className="text-sm text-cream/75">
                            Фрилансер предложил ремонт за{" "}
                            <span className="font-medium text-cream">
                              {formatByn(order.agreedFeeKop)}
                            </span>
                            . Примите заказ — у него появится «Начать ремонт».
                          </p>
                          <AcceptOrderButton orderId={order.id} />
                        </Surface>
                      ) : null}
                      {item.status === "READY" && order ? (
                        <Surface className="border-line-strong bg-gold/15 p-3 shadow-[0_8px_24px_rgba(47,36,28,0.05)]">
                          <p className="text-sm text-leaf">
                            Фрилансер завершил заказ. Подтвердите выполнение — карточка уйдёт в
                            историю, выплата начислится.
                          </p>
                          <ConfirmRepairButton itemId={item.id} />
                        </Surface>
                      ) : null}
                      {inProgressWithChat && order ? (
                        <OrderChat
                          orderId={order.id}
                          currentUserId={user.id}
                          messages={chatByOrder.get(order.id) ?? []}
                          title="Чат с фрилансером"
                        />
                      ) : null}
                      {item.status !== "LISTED" &&
                      item.status !== "READY" &&
                      !awaitingAccept ? (
                        <p className="px-1 text-xs text-leaf">Уже в работе — удалить нельзя.</p>
                      ) : null}
                    </div>
                  );
                })}
              </div>
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
