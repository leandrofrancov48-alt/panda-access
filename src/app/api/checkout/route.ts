import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendTicketConfirmationEmail } from "@/lib/email";
import { createMercadoPagoPreference, isMercadoPagoConfigured } from "@/lib/mercadopago";
import { getCurrentUser, awardLoyaltyPoints } from "@/lib/user-auth";
import crypto from "crypto";

interface AttendeeInfo {
  tierId: string;
  name: string;
  lastName: string;
  dni: string;
}

interface CheckoutBody {
  eventId: string;
  buyerName: string;
  buyerLastName: string;
  buyerEmail: string;
  buyerPhone: string;
  buyerDni: string;
  paymentMethod?: string;
  attendees: AttendeeInfo[];
}

export async function POST(req: Request) {
  try {
    const body: CheckoutBody = await req.json();
    const {
      eventId,
      buyerName,
      buyerLastName,
      buyerEmail,
      buyerPhone,
      buyerDni,
      paymentMethod = "SIMULATED",
      attendees,
    } = body;

    if (!eventId || !buyerEmail || !buyerDni || !attendees || attendees.length === 0) {
      return NextResponse.json(
        { error: "Faltan datos obligatorios para procesar la compra." },
        { status: 400 }
      );
    }

    const isMercadoPago = paymentMethod === "MERCADOPAGO";

    if (isMercadoPago && !isMercadoPagoConfigured()) {
      return NextResponse.json(
        {
          error: "Mercado Pago no está configurado aún en el servidor. Por favor cargá la credencial MP_ACCESS_TOKEN en tu archivo .env o en el panel de Vercel.",
          code: "MP_NOT_CONFIGURED",
        },
        { status: 400 }
      );
    }

    // Get event and tiers
    const event = await db.event.findUnique({
      where: { id: eventId },
      include: { tiers: true },
    });

    if (!event) {
      return NextResponse.json(
        { error: "Evento no encontrado." },
        { status: 404 }
      );
    }

    // Calculate subtotal and fee based on tiers
    let subtotal = 0;
    let serviceFee = 0;

    for (const att of attendees) {
      const tier = event.tiers.find((t) => t.id === att.tierId);
      if (!tier) {
        return NextResponse.json(
          { error: `Tanda de entrada ${att.tierId} no válida.` },
          { status: 400 }
        );
      }
      subtotal += tier.price;
      serviceFee += tier.serviceFee;
    }

    const total = subtotal + serviceFee;
    const orderNumber = `CT-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

    // Create tickets list
    const ticketsToCreate = attendees.map((att) => {
      const tier = event.tiers.find((t) => t.id === att.tierId)!;
      const uniqueSuffix = crypto.randomBytes(3).toString("hex").toUpperCase();
      const ticketCode = `CT-TKT-${uniqueSuffix}`;

      return {
        ticketCode,
        tierId: att.tierId,
        attendeeName: att.name,
        attendeeLastName: att.lastName,
        attendeeDni: att.dni,
        attendeeEmail: buyerEmail,
        price: tier.price,
        status: isMercadoPago ? "PENDING" : "VALID",
      };
    });

    // Count required tickets per tier
    const tierCountMap = new Map<string, number>();
    for (const att of attendees) {
      tierCountMap.set(att.tierId, (tierCountMap.get(att.tierId) || 0) + 1);
    }

    // Validate maxPerOrder for each tier
    for (const [tierId, count] of tierCountMap.entries()) {
      const tier = event.tiers.find((t) => t.id === tierId);
      if (tier && tier.maxPerOrder && count > tier.maxPerOrder) {
        return NextResponse.json(
          {
            error: `El límite máximo para la tanda "${tier.name}" es de ${tier.maxPerOrder} entradas por compra (solicitaste ${count}).`,
            code: "MAX_PER_ORDER_EXCEEDED",
          },
          { status: 400 }
        );
      }
    }

    // Resolve user session if available
    let checkoutUserId: string | null = null;
    try {
      const loggedUser = await getCurrentUser();
      if (loggedUser) {
        checkoutUserId = loggedUser.id;
      } else if (buyerEmail) {
        const foundUser = await db.user.findUnique({
          where: { email: buyerEmail.toLowerCase().trim() },
          select: { id: true },
        });
        if (foundUser) {
          checkoutUserId = foundUser.id;
        }
      }
    } catch {
      // Non-blocking fallback
    }

    // Atomic Transaction: 
    // 1. Lock and decrement available stock with strict capacity condition.
    // 2. If any tier exceeds capacity, PostgreSQL rolls back immediately.
    // 3. Create order and tickets.
    const newOrder = await db.$transaction(async (tx) => {
      // Step 1: Atomic stock deduction with row-level locking
      for (const [tierId, count] of tierCountMap.entries()) {
        const tier = event.tiers.find((t) => t.id === tierId);
        const tierName = tier ? tier.name : "seleccionada";

        const affected = await tx.$executeRaw`
          UPDATE "TicketTier"
          SET "sold" = "sold" + ${count},
              "status" = CASE WHEN "sold" + ${count} >= "capacity" THEN 'SOLD_OUT' ELSE "status" END
          WHERE "id" = ${tierId} 
            AND ("sold" + ${count}) <= "capacity"
            AND "status" != 'SOLD_OUT'
        `;

        if (affected === 0) {
          throw new Error(`TIER_SOLD_OUT:${tierName}`);
        }
      }

      // Step 2: Create Order and Tickets
      const order = await tx.order.create({
        data: {
          orderNumber,
          eventId,
          buyerName,
          buyerLastName,
          buyerEmail,
          buyerPhone,
          buyerDni,
          userId: checkoutUserId,
          subtotal,
          serviceFee,
          total,
          status: isMercadoPago ? "PENDING" : "PAID",
          paymentMethod,
          tickets: {
            create: ticketsToCreate,
          },
        },
        include: {
          tickets: {
            include: {
              tier: true,
            },
          },
        },
      });

      return order;
    });

    // Determine base URL for ticket links
    const host = req.headers.get("host") || "pandaaccess.com.ar";
    const protocol = host.includes("localhost") ? "http" : "https";
    const origin = req.headers.get("origin") || `${protocol}://${host}`;

    // Case 1: Mercado Pago Checkout Pro
    if (isMercadoPago) {
      const mpItems = Array.from(tierCountMap.entries()).map(([tierId, count]) => {
        const tier = event.tiers.find((t) => t.id === tierId)!;
        const unitPriceWithFee = tier.price + tier.serviceFee;
        return {
          id: tier.id,
          title: `${event.title} - ${tier.name}`,
          description: `Acceso oficial Panda Access para ${event.title}`,
          quantity: count,
          unit_price: unitPriceWithFee,
        };
      });

      const preference = await createMercadoPagoPreference({
        orderNumber: newOrder.orderNumber,
        eventName: event.title,
        items: mpItems,
        buyer: {
          name: buyerName,
          lastName: buyerLastName,
          email: buyerEmail,
          phone: buyerPhone,
          dni: buyerDni,
        },
        origin,
      });

      return NextResponse.json({
        success: true,
        paymentMethod: "MERCADOPAGO",
        initPoint: preference.initPoint,
        sandboxInitPoint: preference.sandboxInitPoint,
        order: {
          id: newOrder.id,
          orderNumber: newOrder.orderNumber,
          total: newOrder.total,
        },
      });
    }

    // Case 2: Immediate Payment (Simulated / Free / Direct)
    // Send confirmation email (must be awaited in serverless environments to prevent container freeze)
    const emailTickets = newOrder.tickets.map((t) => ({
      ticketCode: t.ticketCode,
      tierName: t.tier.name,
      attendeeName: `${t.attendeeName} ${t.attendeeLastName}`,
      attendeeDni: t.attendeeDni,
      ticketUrl: `${origin}/tickets/${t.ticketCode}`,
    }));

    try {
      await sendTicketConfirmationEmail({
        orderNumber: newOrder.orderNumber,
        buyerName: `${buyerName} ${buyerLastName}`,
        buyerEmail,
        eventName: event.title,
        eventDate: new Date(event.date).toLocaleDateString("es-AR", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
        eventVenue: event.venue,
        eventAddress: event.address,
        doorsOpenTime: event.doorsOpenTime || "22:00",
        total,
        tickets: emailTickets,
      });
    } catch (err) {
      console.error("Email send error during checkout:", err);
    }

    // Award loyalty points if associated with a user
    if (checkoutUserId) {
      try {
        const earnedPoints = total === 0 ? 25 : Math.max(10, Math.floor(total / 1000) * 10);
        await awardLoyaltyPoints(
          checkoutUserId,
          earnedPoints,
          `Compra de entradas para ${event.title} (Orden #${newOrder.orderNumber})`,
          newOrder.id
        );
      } catch (loyaltyErr) {
        console.error("Error awarding checkout loyalty points:", loyaltyErr);
      }
    }

    return NextResponse.json({
      success: true,
      order: {
        id: newOrder.id,
        orderNumber: newOrder.orderNumber,
        total: newOrder.total,
        tickets: newOrder.tickets,
      },
    });
  } catch (error: any) {
    console.error("Checkout API error:", error);

    if (error?.message?.startsWith("TIER_SOLD_OUT:")) {
      const tierName = error.message.replace("TIER_SOLD_OUT:", "");
      return NextResponse.json(
        {
          error: `¡Lo sentimos! La tanda "${tierName}" acaba de agotarse o no cuenta con cupo suficiente debido a la alta demanda.`,
          code: "TIER_SOLD_OUT",
        },
        { status: 409 }
      );
    }

    if (error?.code === "P2034" || error?.message?.includes("chk_tier_capacity")) {
      return NextResponse.json(
        {
          error: "¡Lo sentimos! Las entradas solicitadas ya no están disponibles debido a la alta demanda en este momento.",
          code: "TIER_SOLD_OUT",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Ocurrió un error al procesar la compra. Por favor, intentá nuevamente." },
      { status: 500 }
    );
  }
}
