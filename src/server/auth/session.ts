import { SignJWT, jwtVerify } from "jose";
import { isUserRole, type UserRole } from "@/domain/access/roles";

export const SESSION_COOKIE = "reschool_session";
const SESSION_TTL = "7d";

export type SessionPayload = {
  userId: string;
  role: UserRole;
};

function secretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET должен быть не короче 32 символов");
  }
  return new TextEncoder().encode(secret);
}

export async function encryptSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ userId: payload.userId, role: payload.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.userId)
    .setIssuedAt()
    .setExpirationTime(SESSION_TTL)
    .sign(secretKey());
}

export async function decryptSession(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
    if (typeof payload.userId !== "string" || !isUserRole(payload.role)) return null;
    return { userId: payload.userId, role: payload.role };
  } catch {
    return null;
  }
}
