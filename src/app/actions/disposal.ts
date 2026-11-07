"use server";

import { redirect } from "next/navigation";
import { requireRoles } from "@/server/auth/current-user";
import { revalidateDisposalViews } from "@/server/revalidate";
import {
  markDisposalDeliveredByFreelancer,
  markItemDisposedBySchool,
  startDisposalFreelancer,
  startDisposalSelf,
} from "@/server/services/disposal-service";

export type DisposalFormState = { error?: string };

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function chooseSelfDisposalAction(
  _state: DisposalFormState,
  formData: FormData,
): Promise<DisposalFormState> {
  const actor = await requireRoles(["DONOR_STAFF"]);
  const itemId = text(formData, "itemId");
  const result = await startDisposalSelf(actor, {
    itemId,
    pointId: text(formData, "pointId"),
  });
  if (!result.ok) return { error: result.error };
  revalidateDisposalViews(itemId);
  redirect(`/cabinet/items/${itemId}`);
}

export async function chooseFreelancerDisposalAction(
  _state: DisposalFormState,
  formData: FormData,
): Promise<DisposalFormState> {
  const actor = await requireRoles(["DONOR_STAFF"]);
  const itemId = text(formData, "itemId");
  const result = await startDisposalFreelancer(actor, {
    itemId,
    pointId: text(formData, "pointId"),
    feeByn: text(formData, "feeByn"),
  });
  if (!result.ok) return { error: result.error };
  revalidateDisposalViews(itemId);
  redirect(`/cabinet/items/${itemId}`);
}

export async function confirmDisposalAction(
  _state: DisposalFormState,
  formData: FormData,
): Promise<DisposalFormState> {
  const actor = await requireRoles(["DONOR_STAFF"]);
  const itemId = text(formData, "itemId");
  const result = await markItemDisposedBySchool(actor, itemId);
  if (!result.ok) return { error: result.error };
  revalidateDisposalViews(itemId);
  redirect("/cabinet");
}

export async function deliverDisposalAction(
  _state: DisposalFormState,
  formData: FormData,
): Promise<DisposalFormState> {
  const actor = await requireRoles(["FREELANCER"]);
  const itemId = text(formData, "itemId");
  const result = await markDisposalDeliveredByFreelancer(actor, itemId);
  if (!result.ok) return { error: result.error };
  revalidateDisposalViews(itemId);
  redirect("/orders");
}
