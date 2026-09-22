import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { hashPassword, createUserToken, USER_SESSION_COOKIE } from "@/lib/user-auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, lastName, email, password, dni, phone, birthDate } = body;

    // 1. Basic validations
    if (!name || !lastName || !email || !password || !dni) {
      return NextResponse.json(
        { error: "Por favor completá todos los campos obligatorios." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 6 caracteres." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanDni = dni.trim().replace(/\D/g, "");

    if (cleanDni.length < 7 || cleanDni.length > 9) {
      return NextResponse.json(
        { error: "El DNI ingresado no es válido." },
        { status: 400 }
      );
    }

    // 2. Check if email or DNI already registered
    const existingUser = await db.user.findFirst({
      where: {
        OR: [{ email: cleanEmail }, { dni: cleanDni }],
      },
    });

    if (existingUser) {
      if (existingUser.email === cleanEmail) {
        return NextResponse.json(
          { error: "Ya existe una cuenta con este correo electrónico." },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: "Ya existe una cuenta registrada con este DNI." },
        { status: 409 }
      );
    }

    // 3. Hash password
    const passwordHash = await hashPassword(password);

    // 4. Create user
    const parsedBirthDate = birthDate ? new Date(birthDate) : null;

    const user = await db.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: cleanEmail,
          passwordHash,
          name: name.trim(),
          lastName: lastName.trim(),
          dni: cleanDni,
          phone: (phone || "").trim(),
          birthDate: parsedBirthDate,
          points: 0,
          tier: "BRONCE",
        },
      });

      // Link any past guest orders matching this email
      await tx.order.updateMany({
        where: {
          buyerEmail: cleanEmail,
          userId: null,
        },
        data: {
          userId: newUser.id,
        },
      });

      return newUser;
    });

    // 5. Create session cookie
    const token = createUserToken(user.id);
    const cookieStore = await cookies();
    cookieStore.set(USER_SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        lastName: user.lastName,
        email: user.email,
        dni: user.dni,
        phone: user.phone,
        birthDate: user.birthDate,
        points: user.points,
        tier: user.tier,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Error interno al crear la cuenta. Intentá nuevamente." },
      { status: 500 }
    );
  }
}
