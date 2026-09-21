import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SECRET = process.env.ADMIN_SESSION_SECRET || "panda-access-secret-key-2026-auth";

/**
 * Verifies session token using Web Crypto API (edge-compatible).
 * Checks both HMAC signature integrity AND timestamp expiration.
 */
async function verifyToken(
  token: string | undefined,
  prefix: "panda-admin" | "panda-scanner" = "panda-admin"
): Promise<boolean> {
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
      encoder.encode(`${prefix}:${timestamp}`)
    );
    const expectedSig = Array.from(new Uint8Array(sigBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // Constant-time comparison
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

  const adminToken = req.cookies.get("panda_admin_session")?.value;
  const scannerToken = req.cookies.get("panda_scanner_session")?.value;

  const adminAuthenticated = await verifyToken(adminToken, "panda-admin");
  const scannerAuthenticated = await verifyToken(scannerToken, "panda-scanner");
  const canScan = scannerAuthenticated || adminAuthenticated;

  // 1. API: Scan endpoint (accepts either admin or scanner staff)
  if (pathname.startsWith("/api/scan")) {
    if (!canScan) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    return NextResponse.next();
  }

  // 2. API: Admin endpoints (strictly requires admin session)
  const isProtectedAdminApi =
    pathname.startsWith("/api/admin") &&
    pathname !== "/api/admin/login" &&
    pathname !== "/api/admin/logout";

  if (isProtectedAdminApi) {
    if (!adminAuthenticated) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    return NextResponse.next();
  }

  // 3. UI: Dedicated /scanner routes
  if (pathname.startsWith("/scanner")) {
    // Scanner login page
    if (pathname === "/scanner/login") {
      if (scannerAuthenticated) {
        return NextResponse.redirect(new URL("/scanner", req.url));
      }
      return NextResponse.next();
    }

    // Protected /scanner views
    if (!scannerAuthenticated) {
      const loginUrl = new URL("/scanner/login", req.url);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // 4. UI: Admin routes (strictly requires admin session)
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    if (!adminAuthenticated) {
      const loginUrl = new URL("/admin/login", req.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // If already admin authenticated and visits /admin/login, redirect to /admin
  if (pathname === "/admin/login" && adminAuthenticated) {
    return NextResponse.redirect(new URL("/admin", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*",
    "/scanner/:path*",
    "/scanner",
    "/api/scan",
  ],
};
