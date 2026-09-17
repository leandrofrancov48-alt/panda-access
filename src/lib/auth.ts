import crypto from "crypto";
import { cookies } from "next/headers";

const SESSION_COOKIE = "panda_admin_session";
const SECRET = process.env.ADMIN_SESSION_SECRET || "panda-access-secret-key-2026-auth";
const ADMIN_PASS = process.env.ADMIN_PASSWORD || "panda2026";

/**
 * Creates a signed session token
 */
export function createSessionToken(): string {
  const timestamp = Date.now().toString();
  const signature = crypto
    .createHmac("sha256", SECRET)
    .update(`panda-admin:${timestamp}`)
    .digest("hex");
  return `${timestamp}:${signature}`;
}

/**
 * Verifies a signed session token
 */
export function verifySessionToken(token: string | undefined | null): boolean {
  if (!token) return false;
  const parts = token.split(":");
  if (parts.length !== 2) return false;

  const [timestamp, signature] = parts;
  const expectedSignature = crypto
    .createHmac("sha256", SECRET)
    .update(`panda-admin:${timestamp}`)
    .digest("hex");

  if (signature !== expectedSignature) return false;

  // Max age: 7 days
  const age = Date.now() - parseInt(timestamp, 10);
  const maxAge = 7 * 24 * 60 * 60 * 1000;
  return age >= 0 && age < maxAge;
}

/**
 * Validates the admin password
 */
export function validateAdminPassword(password: string): boolean {
  return password === ADMIN_PASS;
}

/**
 * Checks if current request has a valid admin session (for Server Components)
 */
export async function isCurrentUserAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  return verifySessionToken(token);
}

export { SESSION_COOKIE };
