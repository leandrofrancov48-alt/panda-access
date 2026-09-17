import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import {
  CheckCircle2,
  Mail,
  Ticket,
  Calendar,
  MapPin,
  ArrowRight,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import ConfettiTrigger from "@/components/ConfettiTrigger";

interface Props {
  params: Promise<{ orderNumber: string }>;
}

export const dynamic = "force-dynamic";

export default async function OrderConfirmationPage({ params }: Props) {
  const { orderNumber } = await params;

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
    notFound();
  }

  const eventDate = new Date(order.event.date).toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
      {/* Confetti canvas effect on mount */}
      <ConfettiTrigger />

      {/* Hero Success Box */}
      <div className="bg-[#0F121C] border border-[#1E253A] rounded-3xl p-8 sm:p-12 text-center space-y-4 shadow-2xl relative overflow-hidden">
        <div className="w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-black uppercase tracking-widest text-emerald-400">
            ¡Pago Confirmado!
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-white uppercase">
            ¡Ya tenés tus entradas!
          </h1>
          <p className="text-sm text-[#94A3B8] max-w-md mx-auto">
            Orden <span className="font-mono text-white font-bold">#{order.orderNumber}</span> confirmada exitosamente para{" "}
            <span className="text-white font-bold">{order.buyerName} {order.buyerLastName}</span>.
          </p>
        </div>

        <div className="pt-2 flex items-center justify-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 py-2 px-4 rounded-full w-fit mx-auto">
          <Mail className="w-4 h-4" />
          <span>Confirmación enviada a {order.buyerEmail}</span>
        </div>
      </div>

      {/* Event Details Summary */}
      <div className="bg-[#0F121C] border border-[#1E253A] rounded-2xl p-6 sm:p-8 space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-[#FFE600] flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          Detalles del Show
        </h3>
        <h2 className="text-2xl font-black text-white">{order.event.title}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-gray-300 pt-2">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#FFE600]" />
            <span className="capitalize">{eventDate} • {order.event.doorsOpenTime || "22:00"} hs</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#FF2E4C]" />
            <span>{order.event.venue} ({order.event.address})</span>
          </div>
        </div>
      </div>

      {/* Tickets List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-white uppercase flex items-center gap-2">
            <Ticket className="w-5 h-5 text-[#FFE600]" />
            Tus Entradas ({order.tickets.length})
          </h3>
          <span className="text-xs text-[#94A3B8]">
            Hacé clic en cada entrada para abrir su QR
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {order.tickets.map((tkt, idx) => (
            <div
              key={tkt.id}
              className="bg-[#121626] border border-[#212840] hover:border-[#FFE600]/50 rounded-2xl p-5 space-y-4 transition-all duration-200"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#38BDF8] bg-[#38BDF8]/10 px-2 py-0.5 rounded border border-[#38BDF8]/20">
                    {tkt.tier.name}
                  </span>
                  <h4 className="text-base font-extrabold text-white mt-1">
                    {tkt.attendeeName} {tkt.attendeeLastName}
                  </h4>
                  <p className="text-xs font-mono text-gray-400">
                    DNI: {tkt.attendeeDni}
                  </p>
                </div>
                <span className="text-xs font-mono text-[#FFE600] font-bold">
                  #{idx + 1}
                </span>
              </div>

              <div className="pt-2 border-t border-[#1D2338] flex items-center justify-between">
                <span className="text-[11px] font-mono text-[#64748B]">
                  {tkt.ticketCode}
                </span>
                <Link
                  href={`/tickets/${tkt.ticketCode}`}
                  className="px-3.5 py-1.5 rounded-lg bg-[#FFE600] hover:bg-[#FFF04D] text-black font-extrabold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  Ver Ticket Digital
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Next Actions */}
      <div className="flex items-center justify-center pt-6 border-t border-[#1C2236]">
        <Link
          href="/"
          className="text-xs font-bold text-gray-400 hover:text-white transition-colors"
        >
          ← Volver a la cartelera
        </Link>
      </div>
    </div>
  );
}
