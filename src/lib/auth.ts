import crypto from "crypto";
import { cookies } from "next/headers";

const SESSION_COOKIE = "panda_admin_session";
const SCANNER_COOKIE = "panda_scanner_session";
const SECRET = process.env.ADMIN_SESSION_SECRET || "panda-access-secret-key-2026-auth";
const ADMIN_PASS = process.env.ADMIN_PASSWORD || "panda2026";
const SCANNER_PASS = process.env.SCANNER_PASSWORD || "puerta2026";

/**
 * Creates a signed session token for admin
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
 * Creates a signed session token for door scanner staff
 */
export function createScannerSessionToken(): string {
  const timestamp = Date.now().toString();
  const signature = crypto
    .createHmac("sha256", SECRET)
    .update(`panda-scanner:${timestamp}`)
    .digest("hex");
  return `${timestamp}:${signature}`;
}

/**
 * Verifies a signed session token (admin or scanner)
 */
export function verifySessionToken(
  token: string | undefined | null,
  role: "admin" | "scanner" = "admin"
): boolean {
  if (!token) return false;
  const parts = token.split(":");
  if (parts.length !== 2) return false;

  const [timestamp, signature] = parts;
  const prefix = role === "admin" ? "panda-admin" : "panda-scanner";
  const expectedSignature = crypto
    .createHmac("sha256", SECRET)
    .update(`${prefix}:${timestamp}`)
    .digest("hex");

  if (signature.length !== expectedSignature.length) return false;
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) return false;

  // Max age: 7 days
  const age = Date.now() - parseInt(timestamp, 10);
  const maxAge = 7 * 24 * 60 * 60 * 1000;
  return age >= 0 && age < maxAge;
}

/**
 * Validates the admin password
 */
export function validateAdminPassword(password: string): boolean {
  const p = (password || "").trim();
  const adminPass = (process.env.ADMIN_PASSWORD || "panda2026").trim();
  if (!p || !adminPass) return false;

  const pLower = Buffer.from(p.toLowerCase());
  const adminLower = Buffer.from(adminPass.toLowerCase());
  if (pLower.length !== adminLower.length) return false;
  return crypto.timingSafeEqual(pLower, adminLower);
}

/**
 * Validates the scanner / door staff password
 * Allows dedicated SCANNER_PASSWORD (defaults to "puerta2026") or the ADMIN_PASSWORD
 */
export function validateScannerPassword(password: string): boolean {
  const p = (password || "").trim();
  if (!p) return false;

  const scannerPass = (process.env.SCANNER_PASSWORD || "puerta2026").trim();
  const adminPass = (process.env.ADMIN_PASSWORD || "panda2026").trim();

  const pLower = Buffer.from(p.toLowerCase());
  const scannerLower = Buffer.from(scannerPass.toLowerCase());
  const adminLower = Buffer.from(adminPass.toLowerCase());

  const matchesScanner =
    pLower.length === scannerLower.length && crypto.timingSafeEqual(pLower, scannerLower);
  const matchesAdmin =
    pLower.length === adminLower.length && crypto.timingSafeEqual(pLower, adminLower);

  return matchesScanner || matchesAdmin;
}

/**
 * Checks if current request has a valid admin session (for Server Components)
 */
export async function isCurrentUserAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  return verifySessionToken(token, "admin");
}

/**
 * Checks if current request has a valid scanner or admin session
 */
export async function isCurrentUserScanner(): Promise<boolean> {
  const cookieStore = await cookies();
  const adminToken = cookieStore.get(SESSION_COOKIE)?.value;
  if (verifySessionToken(adminToken, "admin")) return true;

  const scannerToken = cookieStore.get(SCANNER_COOKIE)?.value;
  return verifySessionToken(scannerToken, "scanner");
}

export { SESSION_COOKIE, SCANNER_COOKIE };
