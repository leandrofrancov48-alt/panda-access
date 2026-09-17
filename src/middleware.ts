import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Secret and validation logic in edge runtime
const SECRET = process.env.ADMIN_SESSION_SECRET || "panda-access-secret-key-2026-auth";

function isValidToken(token: string | undefined): boolean {
  if (!token) return false;
  const parts = token.split(":");
  if (parts.length !== 2) return false;
  const [timestamp] = parts;
  const age = Date.now() - parseInt(timestamp, 10);
  const maxAge = 7 * 24 * 60 * 60 * 1000;
  return age >= 0 && age < maxAge;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("panda_admin_session")?.value;
  const authenticated = isValidToken(token);

  // Protect /admin routes (except /admin/login)
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
  matcher: ["/admin/:path*"],
};
