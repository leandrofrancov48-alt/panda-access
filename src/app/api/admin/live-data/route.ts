import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [events, orders, tickets] = await Promise.all([
      db.event.findMany({
        include: {
          tiers: {
            orderBy: { price: "asc" },
          },
        },
        orderBy: { date: "asc" },
      }),
      db.order.findMany({
        where: { status: "PAID" },
        select: { id: true, total: true },
      }),
      db.ticket.findMany({
        include: {
          tier: true,
          order: {
            include: {
              event: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const totalRevenue = orders.reduce((acc, o) => acc + o.total, 0);
    const allTicketsCount = tickets.length;
    const checkedInCount = tickets.filter((t) => t.status === "USED").length;
    const checkInRate = allTicketsCount > 0 ? Math.round((checkedInCount / allTicketsCount) * 100) : 0;

    return NextResponse.json({
      success: true,
      timestamp: Date.now(),
      events,
      tickets,
      stats: {
        totalRevenue,
        paidOrdersCount: orders.length,
        allTicketsCount,
        checkedInCount,
        checkInRate,
        eventsCount: events.length,
      },
    });
  } catch (error) {
    console.error("Live data error:", error);
    return NextResponse.json(
      { error: "Error al obtener datos en vivo." },
      { status: 500 }
    );
  }
}
