import { SignJWT, jwtVerify } from "jose";
import { isUserRole, type UserRole } from "@/domain/access/roles";

export const SESSION_COOKIE = "reschool_session";
export const PROFILE_COOKIE = "reschool_profile";
const SESSION_TTL = "7d";
const PROFILE_TTL = "30d";

export type SessionPayload = {
  userId: string;
  role: UserRole;
  fullName: string;
  email: string;
  institutionId: string | null;
  institutionName: string | null;
  institutionType: string | null;
  district: string | null;
};

export type RememberedProfile = {
  userId: string;
  role: UserRole;
  fullName: string;
  email: string;
};

function secretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET должен быть не короче 32 символов");
  }
  return new TextEncoder().encode(secret);
}

export async function encryptSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({
    userId: payload.userId,
    role: payload.role,
    fullName: payload.fullName,
    email: payload.email,
    institutionId: payload.institutionId,
    institutionName: payload.institutionName,
    institutionType: payload.institutionType,
    district: payload.district,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.userId)
    .setIssuedAt()
    .setExpirationTime(SESSION_TTL)
    .sign(secretKey());
}

function asNullableString(value: unknown): string | null {
  if (value == null) return null;
  return typeof value === "string" ? value : null;
}

export async function decryptSession(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
    if (typeof payload.userId !== "string" || !isUserRole(payload.role)) return null;
    if (typeof payload.fullName !== "string" || typeof payload.email !== "string") {
      // Старые cookie без claims — считаем недействительными, нужна повторная авторизация.
      return null;
    }
    return {
      userId: payload.userId,
      role: payload.role,
      fullName: payload.fullName,
      email: payload.email,
      institutionId: asNullableString(payload.institutionId),
      institutionName: asNullableString(payload.institutionName),
      institutionType: asNullableString(payload.institutionType),
      district: asNullableString(payload.district),
    };
  } catch {
    return null;
  }
}

export async function encryptRememberedProfile(profile: RememberedProfile): Promise<string> {
  return new SignJWT({
    userId: profile.userId,
    role: profile.role,
    fullName: profile.fullName,
    email: profile.email,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(profile.userId)
    .setIssuedAt()
    .setExpirationTime(PROFILE_TTL)
    .sign(secretKey());
}

export async function decryptRememberedProfile(
  token: string | undefined,
): Promise<RememberedProfile | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
    if (
      typeof payload.userId !== "string" ||
      !isUserRole(payload.role) ||
      typeof payload.fullName !== "string" ||
      typeof payload.email !== "string"
    ) {
      return null;
    }
    return {
      userId: payload.userId,
      role: payload.role,
      fullName: payload.fullName,
      email: payload.email,
    };
  } catch {
    return null;
  }
}
