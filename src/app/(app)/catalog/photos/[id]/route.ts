import { readFile } from "node:fs/promises";
import { connection } from "next/server";
import { photoMediaType, type PhotoKind } from "@/domain/items/image-file";
import { findPhotoFile } from "@/server/repositories/item-repository";
import { uploadedPhotoPath } from "@/server/storage/item-photos";

function kindOf(name: string): PhotoKind | null {
  if (name.endsWith(".jpg")) return "jpg";
  if (name.endsWith(".png")) return "png";
  if (name.endsWith(".webp")) return "webp";
  return null;
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await context.params;
  const photo = await findPhotoFile(id);
  if (!photo) return new Response("Не найдено", { status: 404 });

  if (/^\/placeholders\/[a-z0-9-]+\.svg$/.test(photo.path)) {
    return Response.redirect(new URL(photo.path, request.url));
  }

  const kind = kindOf(photo.path);
  const filePath = uploadedPhotoPath(photo.path);
  if (!kind || !filePath) return new Response("Не найдено", { status: 404 });

  try {
    const bytes = await readFile(filePath);
    return new Response(new Uint8Array(bytes), {
      headers: {
        "Content-Type": photoMediaType(kind),
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return new Response("Не найдено", { status: 404 });
  }
}
