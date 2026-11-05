import { z } from "zod";
import { DRAFT_WATERMARK, documentTypes } from "@/domain/documents";

export const transferActPayloadSchema = z.object({
  watermark: z.literal(DRAFT_WATERMARK),
  title: z.string().trim().min(1),
  quantity: z.number().int().positive(),
  materialsKop: z.number().int().nonnegative(),
  transportKop: z.number().int().nonnegative(),
  // Старые сиды могли быть без имён учреждений.
  fromName: z.string().trim().min(1).optional().default("не указано"),
  toName: z.string().trim().min(1).optional().default("не указано"),
  synthetic: z.boolean(),
});

export const writeOffPayloadSchema = z.object({
  watermark: z.literal(DRAFT_WATERMARK),
  title: z.string().trim().min(1),
  reason: z.string().trim().min(1),
  synthetic: z.boolean(),
});

export const actPayloadSchema = z.union([transferActPayloadSchema, writeOffPayloadSchema]);

export const documentTypeSchema = z.enum(documentTypes);

export function parseDocumentPayload(raw: string) {
  return actPayloadSchema.parse(JSON.parse(raw));
}
