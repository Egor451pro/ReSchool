import { z } from "zod";
import { parseBynToKop } from "@/domain/economy/money";

export const scenarioKinds = ["CONSERVATIVE", "BASE", "OPTIMISTIC"] as const;

export const assumptionSetSchema = z.object({
  kind: z.enum(scenarioKinds),
  title: z.string().min(1),
  shownOnDashboard: z.boolean(),
  expectedListedPerYear: z.number().int().nonnegative(),
  avgNewPriceKop: z.number().int().nonnegative(),
  avgMaterialsKop: z.number().int().nonnegative(),
  avgDisposalKop: z.number().int().nonnegative(),
  defaultTransportKop: z.number().int().nonnegative(),
  practiceConsumableKop: z.number().int().nonnegative(),
  substitutionMilli: z.number().int().min(0).max(1000),
  completionMilli: z.number().int().min(0).max(1000),
  hostingKopAnnual: z.number().int().nonnegative(),
  supportKopAnnual: z.number().int().nonnegative(),
  illustrativeLaborKopHour: z.number().int().nonnegative(),
  slesarAnnualSalaryKop: z.number().int().nonnegative().default(0),
  zavhozBonusShareMilli: z.number().int().min(0).max(1000).default(0),
  freelancerAvgFeeKop: z.number().int().nonnegative().default(0),
  basisNote: z.string().min(10),
});

export type AssumptionSetInput = z.infer<typeof assumptionSetSchema>;

const bynField = z
  .string()
  .trim()
  .superRefine((value, ctx) => {
    try {
      parseBynToKop(value);
    } catch (error) {
      ctx.addIssue({
        code: "custom",
        message: error instanceof Error ? error.message : "Укажите сумму в рублях",
      });
    }
  })
  .transform((value) => parseBynToKop(value));

const intField = (label: string, max = 1_000_000) =>
  z
    .string()
    .trim()
    .regex(/^\d+$/, `${label} — целое число`)
    .transform((value) => Number(value))
    .refine((value) => value >= 0 && value <= max, `${label}: недопустимое значение`);

const percentField = (label: string) =>
  z
    .string()
    .trim()
    .regex(/^\d+$/, `${label} — целое число`)
    .transform((value) => Number(value))
    .refine((value) => value >= 0 && value <= 100, `${label} от 0 до 100`);

/** Форма калькулятора: рубли и проценты, внутри — копейки и milli. */
export const assumptionFormSchema = z.object({
  kind: z.enum(scenarioKinds),
  shownOnDashboard: z
    .enum(["true", "false", "on", ""])
    .optional()
    .transform((value) => value === "true" || value === "on"),
  expectedListedPerYear: intField("Карточек в год", 10_000),
  avgNewPrice: bynField,
  avgMaterials: bynField,
  defaultTransport: bynField,
  practiceConsumable: bynField,
  substitutionPercent: percentField("Замещение"),
  completionPercent: percentField("Доля до выдачи"),
  hostingAnnual: bynField,
  supportAnnual: bynField,
  illustrativeLaborHour: bynField,
  basisNote: z.string().trim().min(10, "Кратко опишите основу допущений"),
});

export type AssumptionFormInput = z.infer<typeof assumptionFormSchema>;
