import { z } from "zod";

export const assumptionSetSchema = z.object({
  kind: z.enum(["CONSERVATIVE", "BASE", "OPTIMISTIC"]),
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
  basisNote: z.string().min(10),
});

export type AssumptionSetInput = z.infer<typeof assumptionSetSchema>;
