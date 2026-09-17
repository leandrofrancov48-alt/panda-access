import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      title,
      subtitle,
      description,
      date,
      doorsOpenTime,
      venue,
      address,
      city,
      coverImage,
      bannerImage,
      ageRestriction,
      lineup,
      tiers,
    } = body;

    if (!title || !venue || !date || !coverImage) {
      return NextResponse.json(
        { error: "Faltan campos requeridos (Título, Lugar, Fecha, Imagen)." },
        { status: 400 }
      );
    }

    // Generate slug
    const baseSlug = title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const slug = `${baseSlug}-${Math.floor(100 + Math.random() * 900)}`;

    const event = await db.event.create({
      data: {
        slug,
        title,
        subtitle,
        description: description || "Gran noche de cumbia en vivo.",
        date: new Date(date),
        doorsOpenTime: doorsOpenTime || "22:00",
        venue,
        address: address || venue,
        city: city || "Buenos Aires",
        coverImage,
        bannerImage: bannerImage || coverImage,
        ageRestriction: ageRestriction || "+18 años",
        lineup: lineup ? JSON.stringify(lineup) : null,
        tiers: {
          create: (tiers || []).map((t: { name: string; description?: string; price: number; capacity: number; serviceFee?: number }) => ({
            name: t.name,
            description: t.description || null,
            price: Number(t.price),
            serviceFee: Number(t.serviceFee ?? (t.price * 0.1)),
            capacity: Number(t.capacity || 200),
            sold: 0,
            status: "AVAILABLE",
          })),
        },
      },
      include: {
        tiers: true,
      },
    });

    return NextResponse.json({ success: true, event });
  } catch (error) {
    console.error("Create event error:", error);
    return NextResponse.json(
      { error: "Error al crear el evento." },
      { status: 500 }
    );
  }
}
