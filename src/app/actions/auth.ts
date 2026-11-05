"use server";

import { redirect } from "next/navigation";
import { safeNextPath } from "@/domain/access/roles";
import {
  loginSchema,
  registerDonorSchema,
  registerFreelancerSchema,
} from "@/lib/validators/auth";
import { clearSession, writeSession } from "@/server/auth/cookies";
import {
  loginWithPassword,
  registerDonorWithInstitution,
  registerFreelancer,
} from "@/server/services/auth-service";

export type AuthFormState = {
  error?: string;
  fields?: Partial<Record<string, string>>;
};

function fieldMessages(error: { issues: { path: PropertyKey[]; message: string }[] }) {
  const fields: AuthFormState["fields"] = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "");
    if (!fields[key]) fields[key] = issue.message;
  }
  return fields;
}

function readNext(formData: FormData): string | null {
  const value = formData.get("next");
  return typeof value === "string" ? value : null;
}

export async function loginAction(_state: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: "Проверьте почту и пароль", fields: fieldMessages(parsed.error) };
  }

  const result = await loginWithPassword(parsed.data.email, parsed.data.password);
  if (!result.ok) return { error: result.error };

  await writeSession({ userId: result.userId, role: result.role });
  redirect(safeNextPath(readNext(formData), result.role));
}

export async function registerDonorAction(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = registerDonorSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
    institutionName: formData.get("institutionName"),
    institutionType: formData.get("institutionType"),
    district: formData.get("district"),
    address: formData.get("address"),
    phone: formData.get("phone"),
    institutionEmail: formData.get("institutionEmail"),
  });
  if (!parsed.success) {
    return { error: "Проверьте поля формы", fields: fieldMessages(parsed.error) };
  }

  const result = await registerDonorWithInstitution(parsed.data);
  if (!result.ok) return { error: result.error };

  await writeSession({ userId: result.userId, role: result.role });
  redirect(safeNextPath(null, result.role));
}

export async function registerFreelancerAction(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const specialtyIds = formData
    .getAll("specialtyIds")
    .filter((value): value is string => typeof value === "string" && value.length > 0);

  const parsed = registerFreelancerSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
    specialtyIds,
  });
  if (!parsed.success) {
    return { error: "Проверьте поля формы", fields: fieldMessages(parsed.error) };
  }

  const result = await registerFreelancer(parsed.data);
  if (!result.ok) return { error: result.error };

  await writeSession({ userId: result.userId, role: result.role });
  redirect(safeNextPath(null, result.role));
}

/** @deprecated используйте registerDonorAction */
export async function registerAction(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  return registerDonorAction(_state, formData);
}

export async function demoLoginAction(formData: FormData): Promise<void> {
  await loginAction({}, formData);
}

export async function logoutAction(): Promise<void> {
  await clearSession();
  redirect("/");
}
