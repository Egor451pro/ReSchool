import "server-only";

import bcrypt from "bcryptjs";
import { roleForInstitutionType, type InstitutionType, type UserRole } from "@/domain/access/roles";
import { findInstitutionById } from "@/server/repositories/institution-repository";
import { createUser, findUserByEmail } from "@/server/repositories/user-repository";

export type AuthSuccess = { ok: true; userId: string; role: UserRole };
export type AuthFailure = { ok: false; error: string };

const INVALID_LOGIN = "Неверная почта или пароль";

export async function loginWithPassword(
  email: string,
  password: string,
): Promise<AuthSuccess | AuthFailure> {
  const user = await findUserByEmail(email.toLowerCase());
  if (!user) return { ok: false, error: INVALID_LOGIN };

  const matches = await bcrypt.compare(password, user.passwordHash);
  if (!matches) return { ok: false, error: INVALID_LOGIN };

  return { ok: true, userId: user.id, role: user.role };
}

export async function registerStaff(input: {
  fullName: string;
  email: string;
  password: string;
  institutionId: string;
}): Promise<AuthSuccess | AuthFailure> {
  const email = input.email.toLowerCase();
  const existing = await findUserByEmail(email);
  if (existing) {
    return { ok: false, error: "Учётная запись с этой почтой уже есть" };
  }

  const institution = await findInstitutionById(input.institutionId);
  if (!institution) return { ok: false, error: "Учреждение не найдено" };

  const role = roleForInstitutionType(institution.type as InstitutionType);
  if (!role) {
    return { ok: false, error: "В этот отдел нельзя зарегистрироваться самостоятельно" };
  }

  const passwordHash = await bcrypt.hash(input.password, 10);
  const user = await createUser({
    fullName: input.fullName.trim(),
    email,
    passwordHash,
    role,
    institutionId: institution.id,
  });

  return { ok: true, userId: user.id, role: user.role };
}
