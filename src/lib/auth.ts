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

  // Max age: 30 days, allow up to 15 minutes clock skew backwards
  const age = Date.now() - parseInt(timestamp, 10);
  const maxAge = 30 * 24 * 60 * 60 * 1000;
  return age >= -15 * 60 * 1000 && age < maxAge;
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
 * Checks if current request has a valid admin (or staff) session.
 * Supports next/headers cookies() as well as raw Request Cookie headers.
 */
export async function isCurrentUserAdmin(req?: Request): Promise<boolean> {
  let adminToken: string | undefined | null = null;
  let scannerToken: string | undefined | null = null;

  try {
    const cookieStore = await cookies();
    adminToken = cookieStore.get(SESSION_COOKIE)?.value;
    scannerToken = cookieStore.get(SCANNER_COOKIE)?.value;
  } catch {
    // ignore
  }

  // Fallback to raw Request Cookie header if available
  if (req && (!adminToken || !scannerToken)) {
    const cookieHeader = req.headers.get("cookie") || "";
    if (!adminToken) {
      const mAdmin = cookieHeader.match(/(?:^|;\s*)panda_admin_session=([^;]*)/);
      if (mAdmin) adminToken = decodeURIComponent(mAdmin[1]);
    }
    if (!scannerToken) {
      const mScanner = cookieHeader.match(/(?:^|;\s*)panda_scanner_session=([^;]*)/);
      if (mScanner) scannerToken = decodeURIComponent(mScanner[1]);
    }
  }

  if (verifySessionToken(adminToken, "admin")) return true;
  if (verifySessionToken(scannerToken, "scanner")) return true;

  return false;
}

/**
 * Checks if current request has a valid scanner or admin session
 */
export async function isCurrentUserScanner(req?: Request): Promise<boolean> {
  return isCurrentUserAdmin(req);
}

export { SESSION_COOKIE, SCANNER_COOKIE };
