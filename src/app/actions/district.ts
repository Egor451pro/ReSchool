"use server";

import { redirect } from "next/navigation";
import { assumptionFormSchema } from "@/lib/validators/assumption";
import { requireRoles } from "@/server/auth/current-user";
import { saveAssumptionSet } from "@/server/services/economy-service";

export type AssumptionFormValues = {
  expectedListedPerYear: string;
  completionPercent: string;
  avgNewPrice: string;
  avgRepair: string;
  platformAnnual: string;
  shownOnDashboard: boolean;
};

export type AssumptionFormState = {
  error?: string;
  values?: AssumptionFormValues;
};

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function valuesFromForm(formData: FormData): AssumptionFormValues {
  return {
    expectedListedPerYear: text(formData, "expectedListedPerYear"),
    completionPercent: text(formData, "completionPercent"),
    avgNewPrice: text(formData, "avgNewPrice"),
    avgRepair: text(formData, "avgRepair"),
    platformAnnual: text(formData, "platformAnnual"),
    shownOnDashboard: formData.get("shownOnDashboard") === "on",
  };
}

export async function updateAssumptionAction(
  _state: AssumptionFormState,
  formData: FormData,
): Promise<AssumptionFormState> {
  const actor = await requireRoles(["DISTRICT_ANALYST", "PLATFORM_ADMIN"]);
  const values = valuesFromForm(formData);
  const parsed = assumptionFormSchema.safeParse({
    kind: text(formData, "kind"),
    shownOnDashboard: formData.get("shownOnDashboard") === "on" ? "on" : "",
    expectedListedPerYear: values.expectedListedPerYear,
    completionPercent: values.completionPercent,
    avgNewPrice: values.avgNewPrice,
    avgRepair: values.avgRepair,
    platformAnnual: values.platformAnnual,
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Проверьте поля сценария",
      values,
    };
  }

  const data = parsed.data;
  const result = await saveAssumptionSet(actor, {
    kind: data.kind,
    shownOnDashboard: data.shownOnDashboard,
    expectedListedPerYear: data.expectedListedPerYear,
    avgNewPriceKop: data.avgNewPrice,
    avgMaterialsKop: data.avgRepair,
    defaultTransportKop: 0,
    completionMilli: data.completionPercent * 10,
    hostingKopAnnual: data.platformAnnual,
    supportKopAnnual: 0,
  });

  if (!result.ok) return { error: result.error, values };
  redirect("/district/calculator");
}
