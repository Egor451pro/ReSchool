"use server";

import { redirect } from "next/navigation";
import { DEMO_PASSWORD } from "@/domain/access/demo-accounts";
import { roleHome, safeNextPath } from "@/domain/access/roles";
import {
  loginSchema,
  registerDonorSchema,
  registerFreelancerSchema,
} from "@/lib/validators/auth";
import { isSeedDemoEmail } from "@/domain/access/saved-accounts";
import {
  clearRememberedProfile,
  clearSession,
  readRememberedProfile,
  writeRememberedProfile,
  writeSession,
} from "@/server/auth/cookies";
import { findUserByEmail, findUserById } from "@/server/repositories/user-repository";
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

async function establishSession(result: {
  userId: string;
  role: import("@/domain/access/roles").UserRole;
  fullName: string;
  email: string;
}) {
  await writeSession({ userId: result.userId, role: result.role });
  // Сидовые .demo не запоминаем для быстрого входа — только сами регистрации пользователей.
  if (!isSeedDemoEmail(result.email)) {
    await writeRememberedProfile({
      userId: result.userId,
      role: result.role,
      fullName: result.fullName,
      email: result.email,
    });
  }
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

  await establishSession(result);
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

  await establishSession(result);
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

  await establishSession(result);
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

/** Однокликовый вход в сидовый профиль аналитика (*.demo). */
export async function demoAnalystLoginAction(formData: FormData): Promise<void> {
  const emailRaw = formData.get("email");
  const email = typeof emailRaw === "string" ? emailRaw.trim().toLowerCase() : "";
  if (!email || !isSeedDemoEmail(email)) {
    redirect("/login?role=analyst");
  }

  const user = await findUserByEmail(email);
  if (!user || user.role !== "DISTRICT_ANALYST") {
    redirect("/login?role=analyst");
  }

  const result = await loginWithPassword(email, DEMO_PASSWORD);
  if (!result.ok) {
    redirect("/login?role=analyst");
  }

  await establishSession(result);
  redirect(safeNextPath(readNext(formData), result.role));
}

/** Выход из сессии, но профиль для быстрого входа сохраняется. */
export async function logoutAction(): Promise<void> {
  await clearSession();
  redirect("/");
}

/** Смена аккаунта: очищает сессию и запомненный профиль. */
export async function switchAccountAction(): Promise<void> {
  await clearSession();
  await clearRememberedProfile();
  redirect("/login");
}

/** Восстановление сессии по запомненному профилю (один клик). */
export async function quickLoginAction(formData: FormData): Promise<void> {
  const remembered = await readRememberedProfile();
  if (!remembered || isSeedDemoEmail(remembered.email)) {
    if (remembered) await clearRememberedProfile();
    redirect("/login");
  }

  const user = await findUserById(remembered.userId);
  if (!user) {
    await clearRememberedProfile();
    redirect("/login");
  }

  await establishSession({
    userId: user.id,
    role: user.role,
    fullName: user.fullName,
    email: user.email,
  });

  const next = readNext(formData);
  redirect(safeNextPath(next, user.role));
}
