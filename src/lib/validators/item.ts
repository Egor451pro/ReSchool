import { z } from "zod";
import { parseBynToKop } from "@/domain/economy/money";
import { itemConditions } from "@/domain/items/labels";

export const itemConditionSchema = z.enum(itemConditions);

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

const quantityField = z
  .string()
  .trim()
  .regex(/^\d+$/, "Количество — целое число")
  .transform((value) => Number(value))
  .refine((value) => value >= 1 && value <= 10_000, "Количество от 1 до 10 000");

const yearField = z
  .string()
  .trim()
  .refine((value) => value === "" || /^\d{4}$/.test(value), "Год выпуска — четыре цифры")
  .transform((value) => (value === "" ? undefined : Number(value)))
  .refine((value) => value === undefined || (value >= 1980 && value <= 2100), "Год с 1980 по 2100");

const priceField = z
  .string()
  .trim()
  .superRefine((value, ctx) => {
    try {
      parseBynToKop(value);
    } catch (error) {
      ctx.addIssue({
        code: "custom",
        message: error instanceof Error ? error.message : "Укажите цену в рублях",
      });
    }
  })
  .transform((value) => parseBynToKop(value));

export const itemFormSchema = z
  .object({
    categoryId: z.string().trim().min(1, "Выберите категорию"),
    title: z.string().trim().min(3, "Название — хотя бы 3 символа").max(160, "Название длиннее 160 символов"),
    description: z
      .string()
      .trim()
      .min(3, "Описание — хотя бы 3 символа")
      .max(2000, "Описание длиннее 2000 символов"),
    condition: z.enum(itemConditions, { error: "Выберите состояние" }),
    quantity: quantityField,
    year: yearField,
    newUnitPriceKop: priceField,
    repairBudgetKop: priceField,
  })
  .superRefine((value, ctx) => {
    if (value.repairBudgetKop <= 0) {
      ctx.addIssue({
        code: "custom",
        path: ["repairBudgetKop"],
        message: "Укажите, сколько готовы заплатить за ремонт",
      });
      return;
    }
    const maxKop = value.newUnitPriceKop * value.quantity;
    if (value.repairBudgetKop > maxKop) {
      ctx.addIssue({
        code: "custom",
        path: ["repairBudgetKop"],
        message: "Бюджет ремонта не выше стоимости новых вещей",
      });
    }
  });

export type ItemFormInput = z.infer<typeof itemFormSchema>;

export const repairBudgetFormSchema = z
  .object({
    repairBudgetKop: priceField,
    maxKop: z.number().int().positive(),
  })
  .superRefine((value, ctx) => {
    if (value.repairBudgetKop <= 0) {
      ctx.addIssue({
        code: "custom",
        path: ["repairBudgetKop"],
        message: "Укажите сумму больше нуля",
      });
      return;
    }
    if (value.repairBudgetKop > value.maxKop) {
      ctx.addIssue({
        code: "custom",
        path: ["repairBudgetKop"],
        message: "Не выше стоимости новых вещей",
      });
    }
  });

export const requestFormSchema = z.object({
  categoryId: z.string().trim().min(1, "Выберите категорию"),
  title: z.string().trim().min(3, "Название — хотя бы 3 символа").max(160, "Название длиннее 160 символов"),
  description: z
    .string()
    .trim()
    .min(3, "Опишите, что нужно")
    .max(2000, "Описание длиннее 2000 символов"),
  quantity: quantityField,
});

export type RequestFormInput = z.infer<typeof requestFormSchema>;
