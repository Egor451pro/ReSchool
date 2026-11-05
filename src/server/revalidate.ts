import "server-only";

import { revalidatePath, refresh } from "next/cache";

/** Сбросить кэш экранов после мутации, чтобы кабинет/каталог сразу отразили статус. */
export function revalidateAppViews() {
  revalidatePath("/cabinet");
  revalidatePath("/catalog");
  revalidatePath("/orders");
  revalidatePath("/workshop");
  revalidatePath("/wallet");
  revalidatePath("/admin");
  refresh();
}
