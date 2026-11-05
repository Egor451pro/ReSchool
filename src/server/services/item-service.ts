import "server-only";

import { canPublishItems, itemManageState, type ItemActor } from "@/domain/items/access";
import { categoryPlaceholderPath } from "@/domain/items/photo";
import { assertItemTransition } from "@/domain/workflow/item-lifecycle";
import type { ItemFormInput } from "@/lib/validators/item";
import { findCategoryById } from "@/server/repositories/item-repository";
import {
  createListedItem,
  findItemForEdit,
  updateListedItem,
  withdrawListedItem,
} from "@/server/repositories/item-repository";
import { removeUploadedPhoto, saveUploadedPhoto } from "@/server/storage/item-photos";

export type ServiceResult = { ok: true; itemId: string } | { ok: false; error: string };

async function photoPathFor(file: File | null, categorySlug: string): Promise<
  { ok: true; path: string; uploaded: string | null } | { ok: false; error: string }
> {
  if (!file) return { ok: true, path: categoryPlaceholderPath(categorySlug), uploaded: null };
  const saved = await saveUploadedPhoto(file);
  if (!saved.ok) return saved;
  return { ok: true, path: saved.name, uploaded: saved.name };
}

export async function publishItem(
  actor: ItemActor,
  input: ItemFormInput,
  file: File | null,
): Promise<ServiceResult> {
  if (!canPublishItems(actor) || !actor.institutionId) {
    return { ok: false, error: "Публиковать карточку может сотрудник учреждения" };
  }

  const category = await findCategoryById(input.categoryId);
  if (!category) return { ok: false, error: "Категория не найдена" };

  const photo = await photoPathFor(file, category.slug);
  if (!photo.ok) return photo;

  try {
    const item = await createListedItem({
      institutionId: actor.institutionId,
      categoryId: category.id,
      title: input.title,
      description: input.description,
      condition: input.condition,
      quantity: input.quantity,
      year: input.year,
      newUnitPriceKop: input.newUnitPriceKop,
      listedById: actor.id,
      photoPath: photo.path,
    });
    return { ok: true, itemId: item.id };
  } catch {
    if (photo.uploaded) await removeUploadedPhoto(photo.uploaded);
    return { ok: false, error: "Не удалось сохранить карточку" };
  }
}

export async function reviseItem(
  actor: ItemActor,
  itemId: string,
  input: ItemFormInput,
  file: File | null,
): Promise<ServiceResult> {
  const item = await findItemForEdit(itemId);
  if (!item) return { ok: false, error: "Карточка не найдена" };
  if (itemManageState(actor, item) !== "edit") {
    return { ok: false, error: "Эту карточку сейчас нельзя править" };
  }

  const category = await findCategoryById(input.categoryId);
  if (!category) return { ok: false, error: "Категория не найдена" };

  const photo = await photoPathFor(file, category.slug);
  if (!photo.ok) return photo;

  try {
    const result = await updateListedItem({
      id: item.id,
      categoryId: category.id,
      title: input.title,
      description: input.description,
      condition: input.condition,
      quantity: input.quantity,
      year: input.year ?? null,
      newUnitPriceKop: input.newUnitPriceKop,
      nextPhotoPath: photo.uploaded ?? undefined,
      placeholderPath: photo.uploaded ? undefined : categoryPlaceholderPath(category.slug),
    });
    if (!result.updated) {
      if (photo.uploaded) await removeUploadedPhoto(photo.uploaded);
      return { ok: false, error: "Карточку уже взяли в работу" };
    }
    for (const oldPath of result.removedPhotoPaths) {
      if (!oldPath.startsWith("/placeholders/")) await removeUploadedPhoto(oldPath);
    }
    return { ok: true, itemId: item.id };
  } catch {
    if (photo.uploaded) await removeUploadedPhoto(photo.uploaded);
    return { ok: false, error: "Не удалось сохранить карточку" };
  }
}

export async function withdrawItem(actor: ItemActor, itemId: string): Promise<ServiceResult> {
  const item = await findItemForEdit(itemId);
  if (!item) return { ok: false, error: "Карточка не найдена" };
  if (itemManageState(actor, item) !== "edit") {
    return { ok: false, error: "Снять можно только свою опубликованную карточку" };
  }

  assertItemTransition("LISTED", "CLOSED", "WITHDRAWN");
  const outcome = await withdrawListedItem({ id: item.id, actorId: actor.id });
  if (outcome === "has-order") {
    return { ok: false, error: "У предмета есть заказ, снять публикацию нельзя" };
  }
  if (outcome === "locked") return { ok: false, error: "Карточку уже взяли в работу" };
  return { ok: true, itemId: item.id };
}
