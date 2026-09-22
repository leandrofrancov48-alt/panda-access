import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { verifyUserToken, USER_SESSION_COOKIE } from "@/lib/user-auth";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(USER_SESSION_COOKIE)?.value;
    const userId = verifyUserToken(token);

    if (!userId) {
      return NextResponse.json({ authenticated: false, user: null });
    }

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
        orders: {
          orderBy: { createdAt: "desc" },
          include: {
            event: {
              select: {
                id: true,
                slug: true,
                title: true,
                venue: true,
                city: true,
                date: true,
                coverImage: true,
                status: true,
              },
            },
            tickets: {
              include: {
                tier: {
                  select: {
                    name: true,
                    price: true,
                  },
                },
              },
            },
          },
        },
        loyaltyLogs: {
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    });

    if (!user) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    return NextResponse.json({
      authenticated: true,
      user,
    });
  } catch (error) {
    console.error("Auth me error:", error);
    return NextResponse.json(
      { error: "Error al verificar sesión de usuario." },
      { status: 500 }
    );
  }
}
