import "server-only";

import { canPublishItems, type ItemActor } from "@/domain/items/access";
import type { RequestFormInput } from "@/lib/validators/item";
import { findCategoryById } from "@/server/repositories/item-repository";
import { createOpenRequest } from "@/server/repositories/request-repository";

export async function publishRequest(
  actor: ItemActor,
  input: RequestFormInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!canPublishItems(actor) || !actor.institutionId) {
    return { ok: false, error: "Запрос создаёт сотрудник учреждения" };
  }

  const category = await findCategoryById(input.categoryId);
  if (!category) return { ok: false, error: "Категория не найдена" };

  await createOpenRequest({
    institutionId: actor.institutionId,
    categoryId: category.id,
    title: input.title,
    description: input.description,
    quantity: input.quantity,
  });
  return { ok: true };
}
