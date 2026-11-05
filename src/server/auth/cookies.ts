import "server-only";

import { cookies } from "next/headers";
import { encryptSession, SESSION_COOKIE, type SessionPayload } from "./session";

const MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export async function writeSession(payload: SessionPayload): Promise<void> {
  const token = await encryptSession(payload);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function clearSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}
