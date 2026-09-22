import { NextResponse } from "next/server";
import { db } from "@/lib/db";

interface Props {
  params: Promise<{ id: string }>;
}

export async function GET(req: Request, { params }: Props) {
  try {
    const { id } = await params;

    const event = await db.event.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      include: {
        tiers: {
          where: { status: { not: "HIDDEN" } },
          orderBy: { price: "asc" },
        },
      },
    });

    if (!event) {
      return NextResponse.json(
        { error: "Evento no encontrado." },
        { status: 404 }
      );
    }

    return NextResponse.json(event);
  } catch (error) {
    console.error("Get event error:", error);
    return NextResponse.json(
      { error: "Error al obtener evento." },
      { status: 500 }
    );
  }
}
