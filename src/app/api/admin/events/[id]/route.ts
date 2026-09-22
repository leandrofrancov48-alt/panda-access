import { NextResponse } from "next/server";
import { db } from "@/lib/db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/admin/events/[id] - Obtener evento con sus tandas
export async function GET(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    const event = await db.event.findUnique({
      where: { id },
      include: {
        tiers: {
          orderBy: { price: "asc" },
        },
        _count: {
          select: {
            orders: true,
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json(
        { error: "Evento no encontrado." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, event });
  } catch (error) {
    console.error("Error fetching event:", error);
    return NextResponse.json(
      { error: "Error al obtener el evento." },
      { status: 500 }
    );
  }
}

// PUT /api/admin/events/[id] - Actualizar evento y sus tandas de entradas
export async function PUT(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
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
      status,
      featured,
      lineup,
      tiers,
    } = body;

    if (!title || !venue || !date || !coverImage) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios (Título, Lugar, Fecha, Imagen)." },
        { status: 400 }
      );
    }

    // Verificar que el evento exista
    const existingEvent = await db.event.findUnique({
      where: { id },
      include: { tiers: true },
    });

    if (!existingEvent) {
      return NextResponse.json(
        { error: "El evento no existe." },
        { status: 404 }
      );
    }

    // Actualizar evento y sincronizar tandas en una transacción
    const updatedEvent = await db.$transaction(async (tx) => {
      // 1. Actualizar datos generales del evento
      const updated = await tx.event.update({
        where: { id },
        data: {
          title,
          subtitle: subtitle || null,
          description: description || "",
          date: new Date(date),
          doorsOpenTime: doorsOpenTime || "22:00",
          venue,
          address: address || venue,
          city: city || "Buenos Aires",
          coverImage,
          bannerImage: bannerImage || coverImage,
          ageRestriction: ageRestriction || "+18 años",
          status: status || "PUBLISHED",
          featured: Boolean(featured),
          lineup: lineup ? (typeof lineup === "string" ? lineup : JSON.stringify(lineup)) : null,
        },
      });

      // 2. Manejar tandas (si se proporcionaron)
      if (Array.isArray(tiers)) {
        const incomingTierIds = tiers
          .map((t: { id?: string }) => t.id)
          .filter(Boolean) as string[];

        // Eliminar tandas que se hayan quitado en el formulario (solo si tienen 0 vendidas)
        for (const existingTier of existingEvent.tiers) {
          if (!incomingTierIds.includes(existingTier.id)) {
            if (existingTier.sold === 0) {
              await tx.ticketTier.delete({ where: { id: existingTier.id } });
            } else {
              // Si ya tiene ventas, en lugar de borrarla la marcamos como HIDDEN o SOLD_OUT
              await tx.ticketTier.update({
                where: { id: existingTier.id },
                data: { status: "HIDDEN" },
              });
            }
          }
        }

        // Actualizar o crear tandas
        for (const tierData of tiers) {
          if (tierData.id) {
            // Actualizar tanda existente
            await tx.ticketTier.update({
              where: { id: tierData.id },
              data: {
                name: tierData.name,
                description: tierData.description || null,
                price: Number(tierData.price),
                serviceFee: Number(tierData.serviceFee ?? tierData.price * 0.1),
                capacity: Number(tierData.capacity),
                maxPerOrder: Number(tierData.maxPerOrder || 6),
                status: tierData.status || "AVAILABLE",
              },
            });
          } else {
            // Crear nueva tanda
            await tx.ticketTier.create({
              data: {
                eventId: id,
                name: tierData.name,
                description: tierData.description || null,
                price: Number(tierData.price),
                serviceFee: Number(tierData.serviceFee ?? tierData.price * 0.1),
                capacity: Number(tierData.capacity || 100),
                maxPerOrder: Number(tierData.maxPerOrder || 6),
                sold: 0,
                status: tierData.status || "AVAILABLE",
              },
            });
          }
        }
      }

      return tx.event.findUnique({
        where: { id },
        include: { tiers: true },
      });
    });

    return NextResponse.json({ success: true, event: updatedEvent });
  } catch (error) {
    console.error("Error updating event:", error);
    return NextResponse.json(
      { error: "Error al actualizar el evento." },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/events/[id] - Eliminar evento y dependencias en cascada
export async function DELETE(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    const event = await db.event.findUnique({
      where: { id },
      include: {
        _count: {
          select: { orders: true },
        },
      },
    });

    if (!event) {
      return NextResponse.json(
        { error: "El evento que intentas eliminar no existe." },
        { status: 404 }
      );
    }

    // Eliminación transaccional segura en cascada
    await db.$transaction(async (tx) => {
      // 1. Obtener IDs de todas las órdenes asociadas al evento
      const orders = await tx.order.findMany({
        where: { eventId: id },
        select: { id: true },
      });
      const orderIds = orders.map((o) => o.id);

      // 2. Obtener IDs de todos los tickets asociados a esas órdenes
      const tickets = await tx.ticket.findMany({
        where: { orderId: { in: orderIds } },
        select: { id: true },
      });
      const ticketIds = tickets.map((t) => t.id);

      // 3. Eliminar logs de escaneo
      if (ticketIds.length > 0) {
        await tx.checkInLog.deleteMany({
          where: { ticketId: { in: ticketIds } },
        });
      }

      // 4. Eliminar tickets individuales
      if (orderIds.length > 0) {
        await tx.ticket.deleteMany({
          where: { orderId: { in: orderIds } },
        });
      }

      // 5. Eliminar órdenes de compra
      await tx.order.deleteMany({
        where: { eventId: id },
      });

      // 6. Eliminar tandas de entradas del evento
      await tx.ticketTier.deleteMany({
        where: { eventId: id },
      });

      // 7. Eliminar el evento
      await tx.event.delete({
        where: { id },
      });
    });

    return NextResponse.json({
      success: true,
      message: `El evento "${event.title}" fue eliminado exitosamente.`,
    });
  } catch (error) {
    console.error("Error deleting event:", error);
    return NextResponse.json(
      { error: "Error al eliminar el evento de la base de datos." },
      { status: 500 }
    );
  }
}
