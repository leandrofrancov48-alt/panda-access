import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isCurrentUserScanner } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const isScanner = await isCurrentUserScanner();
    if (!isScanner) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { code, eventId } = await req.json();

    if (!code) {
      return NextResponse.json(
        { status: "INVALID", message: "Código de entrada requerido." },
        { status: 400 }
      );
    }

    let cleanCode = code.trim();

    // If a full URL was scanned (e.g. https://cumbia-tickets.vercel.app/tickets/CT-TKT-1234), extract the code
    if (cleanCode.includes("/tickets/")) {
      const parts = cleanCode.split("/tickets/");
      cleanCode = parts[parts.length - 1].split("/")[0].split("?")[0].trim();
    }

    const upperCode = cleanCode.toUpperCase();

    const whereConditions = {
      OR: [
        { ticketCode: cleanCode },
        { ticketCode: upperCode },
        { attendeeDni: cleanCode },
      ],
      ...(eventId ? { order: { eventId } } : {}),
    };

    // Look for ticket by ticketCode (exact or uppercase) or DNI
    // Prioritize tickets with status: "VALID" when searching by DNI
    let ticket = await db.ticket.findFirst({
      where: {
        ...whereConditions,
        status: "VALID",
      },
      include: {
        tier: true,
        order: {
          include: {
            event: true,
          },
        },
      },
    });

    if (!ticket) {
      ticket = await db.ticket.findFirst({
        where: whereConditions,
        include: {
          tier: true,
          order: {
            include: {
              event: true,
            },
          },
        },
      });
    }

    if (!ticket) {
      return NextResponse.json({
        status: "INVALID",
        message: "Entrada no encontrada o no registrada en el sistema.",
      });
    }

    // Check if already used
    if (ticket.status === "USED") {
      // Log the duplicate attempt
      await db.checkInLog.create({
        data: {
          ticketId: ticket.id,
          status: "DUPLICATE",
          notes: "Intento de re-ingreso con entrada ya validada",
        },
      });

      return NextResponse.json({
        status: "ALREADY_USED",
        message: "¡Esta entrada ya fue utilizada!",
        ticket: {
          id: ticket.id,
          ticketCode: ticket.ticketCode,
          attendeeName: ticket.attendeeName,
          attendeeLastName: ticket.attendeeLastName,
          attendeeDni: ticket.attendeeDni,
          status: ticket.status,
          checkedInAt: ticket.checkedInAt,
          tier: {
            name: ticket.tier.name,
            price: ticket.tier.price,
          },
          order: {
            orderNumber: ticket.order.orderNumber,
          },
        },
        event: {
          title: ticket.order.event.title,
          venue: ticket.order.event.venue,
        },
      });
    }

    if (ticket.status === "CANCELLED") {
      return NextResponse.json({
        status: "INVALID",
        message: "Esta entrada fue cancelada por el organizador.",
      });
    }

    if (ticket.status === "PENDING") {
      return NextResponse.json({
        status: "INVALID",
        message: "Esta entrada tiene pago pendiente de acreditación. No se puede ingresar hasta que se confirme el pago.",
        ticket: {
          ticketCode: ticket.ticketCode,
          attendeeName: ticket.attendeeName,
          attendeeLastName: ticket.attendeeLastName,
          attendeeDni: ticket.attendeeDni,
          status: ticket.status,
          tier: { name: ticket.tier.name },
          order: { orderNumber: ticket.order.orderNumber },
        },
      });
    }

    // Valid ticket: Mark as used atomically (protects against concurrent dual scans)
    const checkedInAt = new Date();
    const updateResult = await db.ticket.updateMany({
      where: {
        id: ticket.id,
        status: "VALID",
      },
      data: {
        status: "USED",
        checkedInAt,
        checkedInBy: "Scanner Puerta Principal",
      },
    });

    // If count is 0, another door scanned this exact ticket in the same millisecond!
    if (updateResult.count === 0) {
      await db.checkInLog.create({
        data: {
          ticketId: ticket.id,
          status: "DUPLICATE",
          notes: "Colisión concurrente: entrada validada en otra puerta simultáneamente",
        },
      });

      return NextResponse.json({
        status: "ALREADY_USED",
        message: "¡Esta entrada ya fue utilizada!",
        ticket: {
          id: ticket.id,
          ticketCode: ticket.ticketCode,
          attendeeName: ticket.attendeeName,
          attendeeLastName: ticket.attendeeLastName,
          attendeeDni: ticket.attendeeDni,
          status: "USED",
          checkedInAt: ticket.checkedInAt || new Date(),
          tier: {
            name: ticket.tier.name,
            price: ticket.tier.price,
          },
          order: {
            orderNumber: ticket.order.orderNumber,
          },
        },
        event: {
          title: ticket.order.event.title,
          venue: ticket.order.event.venue,
        },
      });
    }

    // Log the successful entry
    await db.checkInLog.create({
      data: {
        ticketId: ticket.id,
        status: "SUCCESS",
        notes: "Ingreso autorizado en puerta",
      },
    });

    return NextResponse.json({
      status: "VALID",
      message: "¡Ingreso autorizado con éxito!",
      ticket: {
        id: ticket.id,
        ticketCode: ticket.ticketCode,
        attendeeName: ticket.attendeeName,
        attendeeLastName: ticket.attendeeLastName,
        attendeeDni: ticket.attendeeDni,
        status: "USED",
        checkedInAt,
        tier: {
          name: ticket.tier.name,
          price: ticket.tier.price,
        },
        order: {
          orderNumber: ticket.order.orderNumber,
        },
      },
      event: {
        title: ticket.order.event.title,
        venue: ticket.order.event.venue,
      },
    });
  } catch (error) {
    console.error("Scan API error:", error);
    return NextResponse.json(
      { status: "ERROR", message: "Error interno al validar entrada." },
      { status: 500 }
    );
  }
}
