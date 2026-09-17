import { NextResponse } from "next/server";
import { db } from "@/lib/db";

interface Props {
  params: Promise<{ orderNumber: string }>;
}

export async function GET(req: Request, { params }: Props) {
  try {
    const { orderNumber } = await params;

    const order = await db.order.findUnique({
      where: { orderNumber },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        total: true,
        paymentMethod: true,
        paymentId: true,
        buyerEmail: true,
        createdAt: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
    }

    return NextResponse.json({ success: true, order });
  } catch (error) {
    console.error("Order status API error:", error);
    return NextResponse.json({ error: "Error al consultar orden" }, { status: 500 });
  }
}
