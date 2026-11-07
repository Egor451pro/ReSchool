import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { roleHome, type UserRole } from "@/domain/access/roles";
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

/** SSR/actions: роль и учреждение из JWT, без повторного запроса в БД. */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  // jose jwtVerify использует Date — нельзя на prerender.
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
