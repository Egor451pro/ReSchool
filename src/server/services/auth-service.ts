import "server-only";

import bcrypt from "bcryptjs";
import {
  isDonorInstitutionType,
  type DonorInstitutionType,
  type UserRole,
} from "@/domain/access/roles";
import { CONSENT_VERSION } from "@/domain/legal/consent";
import {
  createDonorWithInstitution,
  createFreelancer,
  findUserByEmail,
} from "@/server/repositories/user-repository";
import { geocodeAddress } from "@/server/services/geocode-service";

export type AuthSuccess = {
  ok: true;
  userId: string;
  role: UserRole;
  fullName: string;
  email: string;
  institutionId: string | null;
  institutionName: string | null;
  institutionType: string | null;
  district: string | null;
};
export type AuthFailure = { ok: false; error: string };

const INVALID_LOGIN = "Неверная почта или пароль";

async function loginDelay(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 250 + Math.floor(Math.random() * 200)));
}

function sessionFields(user: {
  id: string;
  role: UserRole;
  fullName: string;
  email: string;
  institutionId: string | null;
  institution: { name: string; type: string; district: string } | null;
}): AuthSuccess {
  return {
    ok: true,
    userId: user.id,
    role: user.role,
    fullName: user.fullName,
    email: user.email,
    institutionId: user.institutionId,
    institutionName: user.institution?.name ?? null,
    institutionType: user.institution?.type ?? null,
    district: user.institution?.district ?? null,
  };
}

export async function loginWithPassword(
  email: string,
  password: string,
): Promise<AuthSuccess | AuthFailure> {
  const user = await findUserByEmail(email.toLowerCase());
  if (!user) {
    await loginDelay();
    return { ok: false, error: INVALID_LOGIN };
  }

  const matches = await bcrypt.compare(password, user.passwordHash);
  if (!matches) {
    await loginDelay();
    return { ok: false, error: INVALID_LOGIN };
  }

  return sessionFields(user);
}

export async function registerDonorWithInstitution(input: {
  fullName: string;
  email: string;
  password: string;
  institutionName: string;
  institutionType: string;
  district: string;
  address: string;
  phone: string;
  institutionEmail: string;
}): Promise<AuthSuccess | AuthFailure> {
  const email = input.email.toLowerCase();
  const existing = await findUserByEmail(email);
  if (existing) {
    return { ok: false, error: "Учётная запись с этой почтой уже есть" };
  }

  if (!isDonorInstitutionType(input.institutionType)) {
    return { ok: false, error: "Выберите тип учреждения" };
  }

  const passwordHash = await bcrypt.hash(input.password, 10);
  const user = await createDonorWithInstitution({
    fullName: input.fullName.trim(),
    email,
    passwordHash,
    consentAt: new Date(),
    consentVersion: CONSENT_VERSION,
    institution: {
      name: input.institutionName.trim(),
      type: input.institutionType as DonorInstitutionType,
      district: input.district.trim(),
      address: input.address.trim(),
      phone: input.phone.trim(),
      email: input.institutionEmail.trim().toLowerCase(),
    },
  });

  return sessionFields(user);
}

export async function registerFreelancer(input: {
  fullName: string;
  email: string;
  password: string;
  specialtyIds: string[];
  address?: string;
}): Promise<AuthSuccess | AuthFailure> {
  const email = input.email.toLowerCase();
  const existing = await findUserByEmail(email);
  if (existing) {
    return { ok: false, error: "Учётная запись с этой почтой уже есть" };
  }

  const address = input.address?.trim() || null;
  const geo = address ? await geocodeAddress(address) : null;
  const passwordHash = await bcrypt.hash(input.password, 10);
  const user = await createFreelancer({
    fullName: input.fullName.trim(),
    email,
    passwordHash,
    specialtyIds: input.specialtyIds,
    address,
    lat: geo?.lat ?? null,
    lng: geo?.lng ?? null,
    consentAt: new Date(),
    consentVersion: CONSENT_VERSION,
  });

  return sessionFields(user);
}
