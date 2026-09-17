import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { validateAdminPassword, createSessionToken, SESSION_COOKIE } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { password } = await req.json();

    if (!password || !validateAdminPassword(password)) {
      return NextResponse.json(
        { error: "Contraseña incorrecta. Verificá los datos ingresados." },
        { status: 401 }
      );
    }

    const token = createSessionToken();
    const cookieStore = await cookies();

    cookieStore.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin login error:", error);
    return NextResponse.json({ error: "Error interno al iniciar sesión" }, { status: 500 });
  }
}
