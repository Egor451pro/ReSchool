import { connection } from "next/server";
import { requireRoles } from "@/server/auth/current-user";
import { loadActPdfBytes } from "@/server/services/document-service";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  await connection();
  const user = await requireRoles([
    "DONOR_STAFF",
    "FREELANCER",
    "DISTRICT_ANALYST",
    "PLATFORM_ADMIN",
  ]);
  const { id } = await context.params;
  const file = await loadActPdfBytes(user, id);
  if (!file) return new Response("Не найдено", { status: 404 });

  return new Response(Buffer.from(file.bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(file.filename)}`,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, no-store",
    },
  });
}
