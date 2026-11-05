import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { roleHome, type UserRole } from "@/domain/access/roles";
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

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const session = await decryptSession(token);
  if (!session) return null;

  const user = await findUserById(session.userId);
  if (!user) return null;

  return {
    id: user.id,
    fullName: user.fullName,
    role: user.role,
    email: user.email,
    institutionId: user.institutionId,
    institutionName: user.institution?.name ?? null,
    institutionType: user.institution?.type ?? null,
    district: user.institution?.district ?? null,
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
