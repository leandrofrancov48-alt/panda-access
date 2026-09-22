import crypto from "crypto";
import { cookies } from "next/headers";
import { db } from "@/lib/db";

export const USER_SESSION_COOKIE = "panda_user_session";
const SECRET = process.env.ADMIN_SESSION_SECRET || "panda-access-secret-key-2026-auth";

/**
 * Hashes a plaintext password using salt + scrypt
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

/**
 * Verifies a password against stored salt:hash
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [salt, key] = storedHash.split(":");
    if (!salt || !key) return false;
    const keyBuffer = Buffer.from(key, "hex");
    const derivedKey = crypto.scryptSync(password, salt, 64);
    return crypto.timingSafeEqual(keyBuffer, derivedKey);
  } catch {
    return false;
  }
}

/**
 * Creates a signed session token for a customer
 * Format: userId:timestamp:signature
 */
export function createUserToken(userId: string): string {
  const timestamp = Date.now().toString();
  const signature = crypto
    .createHmac("sha256", SECRET)
    .update(`panda-user:${userId}:${timestamp}`)
    .digest("hex");
  return `${userId}:${timestamp}:${signature}`;
}

/**
 * Verifies a user session token and returns the userId if valid
 */
export function verifyUserToken(token: string | undefined | null): string | null {
  if (!token) return null;
  const parts = token.split(":");
  if (parts.length !== 3) return null;

  const [userId, timestamp, signature] = parts;

  // Max age: 30 days
  const age = Date.now() - parseInt(timestamp, 10);
  const maxAge = 30 * 24 * 60 * 60 * 1000;
  if (isNaN(age) || age < 0 || age >= maxAge) return null;

  const expectedSignature = crypto
    .createHmac("sha256", SECRET)
    .update(`panda-user:${userId}:${timestamp}`)
    .digest("hex");

  if (signature !== expectedSignature) return null;
  return userId;
}

/**
 * Returns current authenticated user or null
 */
export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(USER_SESSION_COOKIE)?.value;
    const userId = verifyUserToken(token);
    if (!userId) return null;

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        lastName: true,
        dni: true,
        phone: true,
        birthDate: true,
        points: true,
        tier: true,
        createdAt: true,
      },
    });

    return user;
  } catch (err) {
    console.error("Error retrieving current user:", err);
    return null;
  }
}

/**
 * Calculates user fidelity level based on points
 */
export function calculateTier(points: number): string {
  if (points >= 1000) return "VIP";
  if (points >= 500) return "ORO";
  if (points >= 200) return "PLATA";
  return "BRONCE";
}

/**
 * Awards loyalty points to a user, logs reason, and updates tier
 */
export async function awardLoyaltyPoints(
  userId: string,
  points: number,
  reason: string,
  orderId?: string
) {
  if (points <= 0) return;
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { points: true },
    });
    if (!user) return;

    const newPoints = user.points + points;
    const newTier = calculateTier(newPoints);

    await db.$transaction([
      db.loyaltyLog.create({
        data: {
          userId,
          orderId: orderId || null,
          points,
          reason,
        },
      }),
      db.user.update({
        where: { id: userId },
        data: {
          points: newPoints,
          tier: newTier,
        },
      }),
    ]);
  } catch (err) {
    console.error("Error awarding loyalty points:", err);
  }
}

