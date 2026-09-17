import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SECRET = process.env.ADMIN_SESSION_SECRET || "panda-access-secret-key-2026-auth";

/**
 * Verifies admin session token using Web Crypto API (edge-compatible).
 * Checks both HMAC signature integrity AND timestamp expiration.
 */
async function verifyToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const parts = token.split(":");
  if (parts.length !== 2) return false;
  const [timestamp, signature] = parts;

  // Check expiration (7 days)
  const age = Date.now() - parseInt(timestamp, 10);
  const maxAge = 7 * 24 * 60 * 60 * 1000;
  if (isNaN(age) || age < 0 || age >= maxAge) return false;

  // Verify HMAC-SHA256 signature using Web Crypto API
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const sigBuffer = await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(`panda-admin:${timestamp}`)
    );
    const expectedSig = Array.from(new Uint8Array(sigBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // Constant-time-ish comparison (both are hex strings of same length)
    if (signature.length !== expectedSig.length) return false;
    let mismatch = 0;
    for (let i = 0; i < signature.length; i++) {
      mismatch |= signature.charCodeAt(i) ^ expectedSig.charCodeAt(i);
    }
    return mismatch === 0;
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("panda_admin_session")?.value;
  const authenticated = await verifyToken(token);

  // Protect API routes that require admin auth — return JSON 401
  if (pathname.startsWith("/api/admin") || pathname.startsWith("/api/scan")) {
    if (!authenticated) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }
    return NextResponse.next();
  }

  // Protect /admin UI routes (except /admin/login) — redirect to login
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    if (!authenticated) {
      const loginUrl = new URL("/admin/login", req.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // If already authenticated and visits /admin/login, redirect to /admin
  if (pathname === "/admin/login" && authenticated) {
    return NextResponse.redirect(new URL("/admin", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*", "/api/scan"],
};
