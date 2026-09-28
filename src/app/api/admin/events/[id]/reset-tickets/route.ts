import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isCurrentUserAdmin } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/admin/events/[id]/reset-tickets
// Borra todas las entradas, órdenes y logs de un evento,
// y restablece los cupos de las tandas a 0 vendidas para reutilizar el evento semanalmente.
export async function POST(req: Request, { params }: RouteParams) {
  try {
    const isAdmin = await isCurrentUserAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;

    const event = await db.event.findUnique({
      where: { id },
      include: {
        tiers: true,
        _count: {
          select: { orders: true },
        },
      },
    });

    if (!event) {
      return NextResponse.json(
        { error: "El evento que intentas reiniciar no existe." },
        { status: 404 }
      );
    }

    const result = await db.$transaction(async (tx) => {
      // 1. Obtener todas las órdenes asociadas al evento
      const orders = await tx.order.findMany({
        where: { eventId: id },
        select: { id: true },
      });
      const orderIds = orders.map((o) => o.id);

      // 2. Obtener todos los tickets de esas órdenes
      const tickets = await tx.ticket.findMany({
        where: { orderId: { in: orderIds } },
        select: { id: true },
      });
      const ticketIds = tickets.map((t) => t.id);

      // 3. Eliminar logs de escaneo/check-in
      let deletedLogsCount = 0;
      if (ticketIds.length > 0) {
        const logsRes = await tx.checkInLog.deleteMany({
          where: { ticketId: { in: ticketIds } },
        });
        deletedLogsCount = logsRes.count;
      }

      // 4. Eliminar tickets individuales
      let deletedTicketsCount = 0;
      if (orderIds.length > 0) {
        const tktsRes = await tx.ticket.deleteMany({
          where: { orderId: { in: orderIds } },
        });
        deletedTicketsCount = tktsRes.count;
      }

      // 5. Eliminar logs de fidelidad asociados a las órdenes
      if (orderIds.length > 0) {
        await tx.loyaltyLog.deleteMany({
          where: { orderId: { in: orderIds } },
        });
      }

      // 6. Eliminar todas las órdenes del evento
      const ordersRes = await tx.order.deleteMany({
        where: { eventId: id },
      });

      // 7. Restablecer cupos de todas las tandas del evento a 0 vendidas
      // Las tandas que estaban en SOLD_OUT vuelven a AVAILABLE
      await tx.ticketTier.updateMany({
        where: {
          eventId: id,
          status: "SOLD_OUT",
        },
        data: {
          sold: 0,
          status: "AVAILABLE",
        },
      });

      // Para las demás tandas (AVAILABLE o HIDDEN), resetear solo sold = 0
      await tx.ticketTier.updateMany({
        where: {
          eventId: id,
          status: { not: "SOLD_OUT" },
        },
        data: {
          sold: 0,
        },
      });

      // 8. Si el evento estaba en SOLD_OUT, reactivarlo a PUBLISHED
      if (event.status === "SOLD_OUT") {
        await tx.event.update({
          where: { id },
          data: { status: "PUBLISHED" },
        });
      }

      return {
        deletedOrdersCount: ordersRes.count,
        deletedTicketsCount,
        deletedLogsCount,
      };
    });

    return NextResponse.json({
      success: true,
      message: `Se eliminaron ${result.deletedTicketsCount} entrada(s) y ${result.deletedOrdersCount} orden(es). Los cupos del evento fueron restablecidos a 0 para una nueva fecha.`,
      stats: result,
    });
  } catch (error) {
    console.error("Error resetting event tickets:", error);
    return NextResponse.json(
      { error: "Error al reiniciar las entradas del evento en la base de datos." },
      { status: 500 }
    );
  }
}
