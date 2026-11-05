"use server";

import { redirect } from "next/navigation";
import { safeNextPath } from "@/domain/access/roles";
import { loginSchema, registerSchema } from "@/lib/validators/auth";
import { clearSession, writeSession } from "@/server/auth/cookies";
import { loginWithPassword, registerStaff } from "@/server/services/auth-service";

export type AuthFormState = {
  error?: string;
  fields?: Partial<Record<"fullName" | "email" | "password" | "institutionId", string>>;
};

function fieldMessages(error: { issues: { path: PropertyKey[]; message: string }[] }) {
  const fields: AuthFormState["fields"] = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "");
    if (key === "fullName" || key === "email" || key === "password" || key === "institutionId") {
      if (!fields[key]) fields[key] = issue.message;
    }
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

export async function registerAction(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = registerSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
    institutionId: formData.get("institutionId"),
  });
  if (!parsed.success) {
    return { error: "Проверьте поля формы", fields: fieldMessages(parsed.error) };
  }

  const result = await registerStaff(parsed.data);
  if (!result.ok) return { error: result.error };

  await writeSession({ userId: result.userId, role: result.role });
  redirect(safeNextPath(null, result.role));
}

export async function demoLoginAction(formData: FormData): Promise<void> {
  await loginAction({}, formData);
}

export async function logoutAction(): Promise<void> {
  await clearSession();
  redirect("/");
}
