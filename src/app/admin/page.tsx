import Link from "next/link";
import { db } from "@/lib/db";
import {
  DollarSign,
  Ticket,
  Users,
  Calendar,
  Plus,
  QrCode,
  CheckCircle2,
  ShieldCheck,
  TrendingUp,
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
  const allTicketsCount = tickets.length;
  const checkedInCount = tickets.filter((t) => t.status === "USED").length;
  const checkInRate = allTicketsCount > 0 ? Math.round((checkedInCount / allTicketsCount) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
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
            Gestión integral de eventos, recaudación y control de acceso en puerta.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/scanner"
            className="px-4 py-2.5 rounded-xl bg-[#181511] hover:bg-[#201C16] border border-amber-400/50 text-amber-300 text-xs font-black flex items-center gap-2 transition-all shadow-[0_0_12px_rgba(245,158,11,0.2)] cursor-pointer"
          >
            <QrCode className="w-4 h-4 text-amber-400" />
            Scanner en Puerta
          </Link>
          <Link
            href="/admin/eventos/nuevo"
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black text-xs font-black flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(245,158,11,0.4)] hover:shadow-[0_0_30px_rgba(245,158,11,0.65)] hover:scale-105 border border-amber-200 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Crear Evento
          </Link>
        </div>
      </div>

      {/* KPI Cards Globales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Revenue */}
        <div className="bg-[#15130F] border border-[#2E2820] hover:border-amber-400/50 rounded-2xl p-5 space-y-2 shadow-lg transition-all">
          <div className="flex items-center justify-between text-amber-400">
            <span className="text-xs font-bold uppercase tracking-wider text-[#8F8270]">
              Recaudación Global
            </span>
            <DollarSign className="w-5 h-5 drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
          </div>
          <div className="text-2xl font-black text-[#FAF6EE]">
            ${totalRevenue.toLocaleString("es-AR")}
          </div>
          <div className="text-[11px] text-emerald-400 flex items-center gap-1 font-semibold">
            <TrendingUp className="w-3.5 h-3.5" />
            {orders.length} órdenes confirmadas
          </div>
        </div>

        {/* Tickets Sold */}
        <div className="bg-[#15130F] border border-[#2E2820] hover:border-cyan-400/50 rounded-2xl p-5 space-y-2 shadow-lg transition-all">
          <div className="flex items-center justify-between text-cyan-400">
            <span className="text-xs font-bold uppercase tracking-wider text-[#8F8270]">
              Total Entradas Emitidas
            </span>
            <Ticket className="w-5 h-5 drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]" />
          </div>
          <div className="text-2xl font-black text-[#FAF6EE]">
            {allTicketsCount}
          </div>
          <div className="text-[11px] text-[#8F8270] font-medium">
            En {events.length} eventos registrados
          </div>
        </div>

        {/* Checked In */}
        <div className="bg-[#15130F] border border-[#2E2820] hover:border-emerald-400/50 rounded-2xl p-5 space-y-2 shadow-lg transition-all">
          <div className="flex items-center justify-between text-emerald-400">
            <span className="text-xs font-bold uppercase tracking-wider text-[#8F8270]">
              Total Ingresos en Puerta
            </span>
            <CheckCircle2 className="w-5 h-5 drop-shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
          </div>
          <div className="text-2xl font-black text-[#FAF6EE]">
            {checkedInCount}{" "}
            <span className="text-xs text-[#8F8270] font-normal">
              / {allTicketsCount}
            </span>
          </div>
          <div className="text-[11px] text-emerald-400 font-semibold">
            {checkInRate}% de asistencia total
          </div>
        </div>

        {/* Active Events */}
        <div className="bg-[#15130F] border border-[#2E2820] hover:border-pink-400/50 rounded-2xl p-5 space-y-2 shadow-lg transition-all">
          <div className="flex items-center justify-between text-pink-400">
            <span className="text-xs font-bold uppercase tracking-wider text-[#8F8270]">
              Eventos en Cartelera
            </span>
            <Calendar className="w-5 h-5 drop-shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
          </div>
          <div className="text-2xl font-black text-[#FAF6EE]">
            {events.length}
          </div>
          <div className="text-[11px] text-[#8F8270] font-medium">
            Activos en plataforma
          </div>
        </div>
      </div>

      {/* Gestor interactivo por evento, stock y lista de asistentes */}
      <AdminEventsManager
        events={events}
        tickets={tickets}
      />
    </div>
  );
}
