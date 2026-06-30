import { createHmac, timingSafeEqual } from "node:crypto";

export const COOKIE_NAME = "fgdev_admin";
export const COOKIE_MAX_AGE = 60 * 60 * 8; // 8 horas

export function signSession(secret: string): string {
  const payload = "authenticated";
  const sig = createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function verifySession(cookie: string | undefined, secret: string): boolean {
  if (!cookie || !secret) return false;
  const expected = signSession(secret);
  try {
    return timingSafeEqual(Buffer.from(cookie), Buffer.from(expected));
  } catch {
    return false;
  }
}
