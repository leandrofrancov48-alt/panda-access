import Link from "next/link";
import { db } from "@/lib/db";
import {
  Plus,
  QrCode,
  ShieldCheck,
} from "lucide-react";
import AdminEventsManager from "@/components/AdminEventsManager";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  // Fetch stats and data
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#2C261E]">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-amber-400 drop-shadow-[0_0_10px_rgba(245,158,11,0.6)]" />
            <h1 className="text-2xl sm:text-3xl font-black text-[#FAF6EE] uppercase tracking-tight">
              Panel del Productor / Admin
            </h1>
          </div>
          <p className="text-xs text-[#8F8270] mt-1 font-medium">
            Gestión integral de eventos, recaudación y control de acceso en puerta en tiempo real.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/scanner"
            className="px-4 py-2.5 rounded-xl bg-[#181511] hover:bg-[#201C16] border border-amber-400/50 text-amber-300 text-xs font-black flex items-center gap-2 transition-all shadow-[0_0_12px_rgba(245,158,11,0.2)] cursor-pointer"
          >
            <QrCode className="w-4 h-4 text-amber-400" />
            Scanner en Puerta
          </Link>
          <Link
            href="/panda-control-2026/eventos/nuevo"
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black text-xs font-black flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(245,158,11,0.4)] hover:shadow-[0_0_30px_rgba(245,158,11,0.65)] hover:scale-105 border border-amber-200 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Crear Evento
          </Link>
        </div>
      </div>

      {/* Gestor interactivo en tiempo real por evento, stock, KPI cards y lista de asistentes */}
      <AdminEventsManager
        events={events}
        tickets={tickets}
        initialRevenue={totalRevenue}
        initialOrdersCount={orders.length}
      />
    </div>
  );
}
