import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isCurrentUserAdmin } from "@/lib/auth";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAdmin = await isCurrentUserAdmin();
    if (!isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { id } = await params;

    // Look up by ID or orderNumber
    const order = await db.order.findFirst({
      where: {
        OR: [
          { id },
          { orderNumber: id },
        ],
      },
      include: {
        tickets: true,
        event: { select: { title: true } },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Orden no encontrada." },
        { status: 404 }
      );
    }

    // Perform atomic deletion and restore stock
    await db.$transaction(async (tx) => {
      // 1. Group tickets by tierId to decrement sold count
      const tierCounts: Record<string, number> = {};
      if (order.status === "PAID") {
        for (const t of order.tickets) {
          tierCounts[t.tierId] = (tierCounts[t.tierId] || 0) + 1;
        }
      }

      // 2. Decrement sold stock and restore AVAILABLE status if it was SOLD_OUT
      for (const [tierId, count] of Object.entries(tierCounts)) {
        await tx.$executeRaw`
          UPDATE "TicketTier"
          SET "sold" = GREATEST(0, "sold" - ${count}),
              "status" = CASE WHEN "status" = 'SOLD_OUT' THEN 'AVAILABLE' ELSE "status" END
          WHERE "id" = ${tierId}
        `;
      }

      // 3. Delete checkin logs for all tickets of this order
      const ticketIds = order.tickets.map((t) => t.id);
      if (ticketIds.length > 0) {
        await tx.checkInLog.deleteMany({
          where: { ticketId: { in: ticketIds } },
        });
      }

      // 4. Delete tickets
      if (ticketIds.length > 0) {
        await tx.ticket.deleteMany({
          where: { id: { in: ticketIds } },
        });
      }

      // 5. Delete order
      await tx.order.delete({
        where: { id: order.id },
      });
    });

    return NextResponse.json({
      success: true,
      message: `Orden #${order.orderNumber} eliminada correctamente. Se descontaron los ingresos y se restauraron los cupos.`,
    });
  } catch (error) {
    console.error("Error deleting order:", error);
    return NextResponse.json(
      { error: "Error al eliminar la orden de la base de datos." },
      { status: 500 }
    );
  }
}
