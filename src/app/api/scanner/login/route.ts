import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  createScannerSessionToken,
  validateScannerPassword,
  SCANNER_COOKIE,
} from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { password } = await req.json();

    if (!password || !validateScannerPassword(password)) {
      return NextResponse.json(
        { success: false, error: "Clave de acceso de puerta incorrecta." },
        { status: 401 }
      );
    }

    const token = createScannerSessionToken();
    const cookieStore = await cookies();

    cookieStore.set(SCANNER_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 2, // 2 days for door staff shift
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Scanner login error:", error);
    return NextResponse.json(
      { success: false, error: "Error interno al iniciar sesión de puerta." },
      { status: 500 }
    );
  }
}
