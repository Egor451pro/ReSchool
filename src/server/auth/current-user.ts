import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { roleHome, type UserRole } from "@/domain/access/roles";
import { clearSession } from "@/server/auth/cookies";
import { findUserById } from "@/server/repositories/user-repository";
import { decryptSession, SESSION_COOKIE } from "./session";

export type CurrentUser = {
  id: string;
  fullName: string;
  role: UserRole;
  email: string;
  institutionId: string | null;
  institutionName: string | null;
  institutionType: CurrentInstitutionType | null;
  district: string | null;
};

type CurrentInstitutionType =
  | "SCHOOL"
  | "GYMNASIUM"
  | "LYCEUM"
  | "COLLEGE"
  | "VOCATIONAL"
  | "DEPARTMENT";

function asInstitutionType(value: string | null): CurrentInstitutionType | null {
  if (
    value === "SCHOOL" ||
    value === "GYMNASIUM" ||
    value === "LYCEUM" ||
    value === "COLLEGE" ||
    value === "VOCATIONAL" ||
    value === "DEPARTMENT"
  ) {
    return value;
  }
  return null;
}

/**
 * Быстрый путь для SSR страниц: только JWT claims, без запроса в БД.
 * Мутации должны использовать requireFreshUser / requireRolesFresh.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  await connection();
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const session = await decryptSession(token);
  if (!session) return null;

  return {
    id: session.userId,
    fullName: session.fullName,
    role: session.role,
    email: session.email,
    institutionId: session.institutionId,
    institutionName: session.institutionName,
    institutionType: asInstitutionType(session.institutionType),
    district: session.district,
  };
});

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireRoles(roles: readonly UserRole[]): Promise<CurrentUser> {
  const user = await requireUser();
  if (!roles.includes(user.role)) redirect(roleHome(user.role));
  return user;
}

/**
 * Для Server Actions: JWT + сверка с БД (роль/учреждение актуальны).
 */
export async function requireFreshUser(): Promise<CurrentUser> {
  const sessionUser = await requireUser();
  const dbUser = await findUserById(sessionUser.id);
  if (!dbUser || (dbUser.role as UserRole) !== sessionUser.role) {
    await clearSession();
    redirect("/login");
  }

  return {
    id: dbUser.id,
    fullName: dbUser.fullName,
    role: dbUser.role as UserRole,
    email: dbUser.email,
    institutionId: dbUser.institutionId,
    institutionName: dbUser.institution?.name ?? null,
    institutionType: asInstitutionType(dbUser.institution?.type ?? null),
    district: dbUser.institution?.district ?? null,
  };
}

export async function requireRolesFresh(roles: readonly UserRole[]): Promise<CurrentUser> {
  const user = await requireFreshUser();
  if (!roles.includes(user.role)) redirect(roleHome(user.role));
  return user;
}
