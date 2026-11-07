import "server-only";

import { cookies } from "next/headers";
import { connection } from "next/server";
import {
  encryptRememberedProfile,
  encryptSession,
  PROFILE_COOKIE,
  SESSION_COOKIE,
  type RememberedProfile,
  type SessionPayload,
  decryptRememberedProfile,
} from "./session";

const SESSION_MAX_AGE = 60 * 60 * 24 * 7;
const PROFILE_MAX_AGE = 60 * 60 * 24 * 30;

export async function writeSession(payload: SessionPayload): Promise<void> {
  const token = await encryptSession(payload);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function writeRememberedProfile(profile: RememberedProfile): Promise<void> {
  const token = await encryptRememberedProfile(profile);
  const jar = await cookies();
  jar.set(PROFILE_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: PROFILE_MAX_AGE,
  });
}

export async function readRememberedProfile(): Promise<RememberedProfile | null> {
  // jose jwtVerify использует Date — нельзя на prerender.
  await connection();
  const jar = await cookies();
  return decryptRememberedProfile(jar.get(PROFILE_COOKIE)?.value);
}

export async function clearSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

export async function clearRememberedProfile(): Promise<void> {
  const jar = await cookies();
  jar.delete(PROFILE_COOKIE);
}
