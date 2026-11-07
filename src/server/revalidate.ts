import "server-only";

import { revalidatePath, refresh } from "next/cache";

function bump(...paths: string[]) {
  for (const path of paths) revalidatePath(path);
  refresh();
}

/** Каталог + кабинет после публикации / правки / снятия карточки. */
export function revalidateItemListing(itemId?: string | null) {
  const paths = ["/catalog", "/cabinet", "/workshop"];
  if (itemId) {
    paths.push(`/catalog/${itemId}`, `/cabinet/items/${itemId}`);
  }
  bump(...paths);
}

/** Заказ / торг / шаги ремонта. */
export function revalidateOrderViews(input?: {
  orderId?: string | null;
  itemId?: string | null;
}) {
  const paths = ["/orders", "/workshop", "/cabinet", "/catalog"];
  if (input?.orderId) paths.push(`/orders/${input.orderId}`);
  if (input?.itemId) {
    paths.push(`/catalog/${input.itemId}`, `/cabinet/items/${input.itemId}`);
  }
  bump(...paths);
}

/** Утилизация и подтверждение списания. */
export function revalidateDisposalViews(itemId?: string | null) {
  const paths = ["/cabinet", "/orders", "/catalog"];
  if (itemId) {
    paths.push(`/cabinet/items/${itemId}`, `/catalog/${itemId}`);
  }
  bump(...paths);
}

/** Кошелёк и выплаты. */
export function revalidateWalletViews() {
  bump("/wallet", "/orders", "/admin");
}

/** Дашборд района / админ-экономика. */
export function revalidateAdminViews() {
  bump("/admin");
}

/** @deprecated используйте точечные revalidate* */
export function revalidateAppViews() {
  bump("/cabinet", "/catalog", "/orders", "/workshop", "/wallet", "/admin");
}
