import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getPaymentInfo } from "@/lib/mercadopago";
import { sendTicketConfirmationEmail } from "@/lib/email";
import { awardLoyaltyPoints } from "@/lib/user-auth";

// Health check / verification by Mercado Pago
export async function GET() {
  return NextResponse.json({ status: "ok", service: "Panda Access Mercado Pago Webhook" });
}

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const searchParams = url.searchParams;

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // Body might be empty in some IPN callbacks
    }

    // Mercado Pago can send payment ID via query string or JSON body
    const paymentId =
      body.data?.id ||
      body.id ||
      searchParams.get("data.id") ||
      searchParams.get("id");

    const topic =
      body.type ||
      body.topic ||
      searchParams.get("type") ||
      searchParams.get("topic");

    console.log("[Mercado Pago Webhook] Received notification:", { paymentId, topic, action: body.action });

    // Only process payment notifications
    if (!paymentId || (topic && topic !== "payment")) {
      return NextResponse.json({ received: true, ignored: true });
    }

    // Query payment details securely from Mercado Pago servers
    const payment = await getPaymentInfo(paymentId);
    if (!payment) {
      console.warn("[Mercado Pago Webhook] Could not retrieve payment info for ID:", paymentId);
      return NextResponse.json({ received: true, error: "Payment not found" });
    }

    const orderNumber = payment.external_reference;
    if (!orderNumber) {
      console.warn("[Mercado Pago Webhook] Payment has no external_reference (orderNumber):", paymentId);
      return NextResponse.json({ received: true });
    }

    // Find corresponding order in database
    const order = await db.order.findUnique({
      where: { orderNumber },
      include: {
        event: true,
        tickets: {
          include: {
            tier: true,
          },
        },
      },
    });

    if (!order) {
      console.warn("[Mercado Pago Webhook] Order not found for orderNumber:", orderNumber);
      return NextResponse.json({ received: true });
    }

    const paymentStatus = payment.status;
    console.log(`[Mercado Pago Webhook] Order ${orderNumber} status: ${order.status} -> MP status: ${paymentStatus}`);

    // 1. APPROVED PAYMENT
    if (paymentStatus === "approved") {
      if (order.status !== "PAID") {
        // Mark Order as PAID and update paymentId
        await db.$transaction(async (tx) => {
          await tx.order.update({
            where: { id: order.id },
            data: {
              status: "PAID",
              paymentId: String(payment.id),
              paymentMethod: "MERCADOPAGO",
            },
          });

          // Activate all tickets to VALID
          await tx.ticket.updateMany({
            where: { orderId: order.id },
            data: { status: "VALID" },
          });
        });

        // Determine origin for ticket URLs
        const origin = process.env.NEXT_PUBLIC_APP_URL || "https://pandaaccess.com.ar";

        const emailTickets = order.tickets.map((t) => ({
          ticketCode: t.ticketCode,
          tierName: t.tier.name,
          attendeeName: `${t.attendeeName} ${t.attendeeLastName}`,
          attendeeDni: t.attendeeDni,
          ticketUrl: `${origin}/tickets/${t.ticketCode}`,
        }));

        try {
          await sendTicketConfirmationEmail({
            orderNumber: order.orderNumber,
            buyerName: `${order.buyerName} ${order.buyerLastName}`,
            buyerEmail: order.buyerEmail,
            eventName: order.event.title,
            eventDate: new Date(order.event.date).toLocaleDateString("es-AR", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            }),
            eventVenue: order.event.venue,
            eventAddress: order.event.address,
            doorsOpenTime: order.event.doorsOpenTime || "22:00",
            total: order.total,
            tickets: emailTickets,
          });
          console.log(`[Mercado Pago Webhook] Confirmation email sent to ${order.buyerEmail}`);
        } catch (emailErr) {
          console.error("[Mercado Pago Webhook] Email dispatch error:", emailErr);
        }

        // Award loyalty points to user
        try {
          let targetUserId = order.userId;
          if (!targetUserId && order.buyerEmail) {
            const existingUser = await db.user.findUnique({
              where: { email: order.buyerEmail.toLowerCase().trim() },
              select: { id: true },
            });
            if (existingUser) {
              targetUserId = existingUser.id;
              await db.order.update({
                where: { id: order.id },
                data: { userId: existingUser.id },
              });
            }
          }

          if (targetUserId) {
            const earnedPoints = Math.max(10, Math.floor(order.total / 1000) * 10);
            await awardLoyaltyPoints(
              targetUserId,
              earnedPoints,
              `Compra de entradas para ${order.event.title} (Orden #${order.orderNumber})`,
              order.id
            );
            console.log(`[Mercado Pago Webhook] Awarded ${earnedPoints} points to user ${targetUserId}`);
          }
        } catch (loyaltyErr) {
          console.error("[Mercado Pago Webhook] Error awarding points:", loyaltyErr);
        }
      }
    }

    // 2. CANCELLED / REJECTED PAYMENT -> Release reserved stock
    if (paymentStatus === "cancelled" || paymentStatus === "rejected") {
      if (order.status === "PENDING") {
        await db.$transaction(async (tx) => {
          // Cancel order & tickets
          await tx.order.update({
            where: { id: order.id },
            data: {
              status: "CANCELLED",
              paymentId: String(payment.id),
            },
          });

          await tx.ticket.updateMany({
            where: { orderId: order.id },
            data: { status: "CANCELLED" },
          });

          // Release stock on each tier
          const tierCountMap = new Map<string, number>();
          for (const t of order.tickets) {
            tierCountMap.set(t.tierId, (tierCountMap.get(t.tierId) || 0) + 1);
          }

          for (const [tierId, count] of tierCountMap.entries()) {
            await tx.$executeRaw`
              UPDATE "TicketTier"
              SET "sold" = GREATEST(0, "sold" - ${count}),
                  "status" = 'AVAILABLE'
              WHERE "id" = ${tierId}
            `;
          }
        });

        console.log(`[Mercado Pago Webhook] Order ${orderNumber} cancelled and stock released successfully.`);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Mercado Pago Webhook Error]:", error);
    // Return 200 to prevent infinite retry storms from MP on unhandled code exceptions
    return NextResponse.json({ received: true, error: "Internal processing error" }, { status: 200 });
  }
}
