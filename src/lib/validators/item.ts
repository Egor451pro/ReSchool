import { z } from "zod";

export const itemConditionSchema = z.enum(["WORKING", "REPAIRABLE", "SCRAP"]);

export const createItemSchema = z.object({
  institutionId: z.string().min(1),
  categoryId: z.string().min(1),
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().min(3).max(2000),
  condition: itemConditionSchema,
  quantity: z.number().int().positive(),
  year: z.number().int().min(1980).max(2100).optional(),
  newUnitPriceKop: z.number().int().nonnegative(),
});

export type CreateItemInput = z.infer<typeof createItemSchema>;
