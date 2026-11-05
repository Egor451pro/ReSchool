import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { detectPhotoKind, isStoredPhotoName, maxPhotoBytes } from "@/domain/items/image-file";

const uploadDir = path.join(process.cwd(), "data", "uploads");

export type StoredPhoto = { ok: true; name: string } | { ok: false; error: string };

export async function saveUploadedPhoto(file: File): Promise<StoredPhoto> {
  if (file.size === 0) return { ok: false, error: "Файл фотографии пустой" };
  if (file.size > maxPhotoBytes) return { ok: false, error: "Фото больше 5 МБ" };

  const bytes = new Uint8Array(await file.arrayBuffer());
  const kind = detectPhotoKind(bytes);
  if (!kind) return { ok: false, error: "Нужна фотография JPG, PNG или WebP" };

  const name = `${randomUUID()}.${kind}`;
  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, name), bytes);
  return { ok: true, name };
}

export function uploadedPhotoPath(name: string): string | null {
  if (!isStoredPhotoName(name)) return null;
  const filePath = path.join(uploadDir, name);
  if (path.dirname(filePath) !== uploadDir) return null;
  return filePath;
}

export async function removeUploadedPhoto(name: string): Promise<void> {
  const filePath = uploadedPhotoPath(name);
  if (!filePath) return;
  await unlink(filePath).catch(() => undefined);
}
