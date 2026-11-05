"use server";

import { redirect } from "next/navigation";
import { assumptionFormSchema } from "@/lib/validators/assumption";
import { requireRoles } from "@/server/auth/current-user";
import { saveAssumptionSet } from "@/server/services/economy-service";

export type AssumptionFormValues = {
  expectedListedPerYear: string;
  avgNewPrice: string;
  avgMaterials: string;
  defaultTransport: string;
  practiceConsumable: string;
  substitutionPercent: string;
  completionPercent: string;
  hostingAnnual: string;
  supportAnnual: string;
  illustrativeLaborHour: string;
  basisNote: string;
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
    avgNewPrice: text(formData, "avgNewPrice"),
    avgMaterials: text(formData, "avgMaterials"),
    defaultTransport: text(formData, "defaultTransport"),
    practiceConsumable: text(formData, "practiceConsumable"),
    substitutionPercent: text(formData, "substitutionPercent"),
    completionPercent: text(formData, "completionPercent"),
    hostingAnnual: text(formData, "hostingAnnual"),
    supportAnnual: text(formData, "supportAnnual"),
    illustrativeLaborHour: text(formData, "illustrativeLaborHour"),
    basisNote: text(formData, "basisNote"),
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
    avgNewPrice: values.avgNewPrice,
    avgMaterials: values.avgMaterials,
    defaultTransport: values.defaultTransport,
    practiceConsumable: values.practiceConsumable,
    substitutionPercent: values.substitutionPercent,
    completionPercent: values.completionPercent,
    hostingAnnual: values.hostingAnnual,
    supportAnnual: values.supportAnnual,
    illustrativeLaborHour: values.illustrativeLaborHour,
    basisNote: values.basisNote,
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
    avgMaterialsKop: data.avgMaterials,
    defaultTransportKop: data.defaultTransport,
    practiceConsumableKop: data.practiceConsumable,
    substitutionMilli: data.substitutionPercent * 10,
    completionMilli: data.completionPercent * 10,
    hostingKopAnnual: data.hostingAnnual,
    supportKopAnnual: data.supportAnnual,
    illustrativeLaborKopHour: data.illustrativeLaborHour,
    basisNote: data.basisNote,
  });

  if (!result.ok) return { error: result.error, values };
  redirect("/district/calculator");
}
