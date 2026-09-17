import { notFound } from "next/navigation";
import Link from "next/link";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { generateQrDataUrl } from "@/lib/qr";
import DigitalTicketCard from "@/components/DigitalTicketCard";
import { ArrowLeft } from "lucide-react";

interface Props {
  params: Promise<{ ticketCode: string }>;
}

export const dynamic = "force-dynamic";

export default async function TicketPassPage({ params }: Props) {
  const { ticketCode } = await params;

  const ticket = await db.ticket.findUnique({
    where: { ticketCode },
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
    notFound();
  }

  // Get current origin for universal QR readability (works with native phone cameras and scanner)
  const headersList = await headers();
  const host = headersList.get("host") || "pandaaccess.com.ar";
  const protocol = host.includes("localhost") ? "http" : "https";
  const fullTicketUrl = `${protocol}://${host}/tickets/${ticket.ticketCode}`;

  // Generate QR code data URL server-side
  const qrDataUrl = await generateQrDataUrl(fullTicketUrl);

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 space-y-6 print:m-0 print:p-0 print:max-w-none print:space-y-0 relative">
      {/* Ambient concert neon aura */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[500px] h-[350px] bg-amber-500/15 rounded-full blur-[140px] pointer-events-none -z-10 animate-float-slow print:hidden" />
      <div className="absolute top-60 right-0 w-[300px] h-[300px] bg-emerald-500/10 rounded-full blur-[130px] pointer-events-none -z-10 animate-float-reverse print:hidden" />

      {/* Navigation */}
      <div className="flex items-center justify-between print:hidden">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#CEC1AD] hover:text-amber-300 transition-all hover:-translate-x-1"
        >
          <ArrowLeft className="w-4 h-4 text-amber-400" />
          Volver a la cartelera
        </Link>
        <span className="text-xs font-mono font-bold text-amber-400/90 bg-[#15130F] border border-[#2C261E] px-3 py-1.5 rounded-lg shadow-sm">
          ID: {ticket.ticketCode}
        </span>
      </div>

      {/* The Digital Ticket */}
      <DigitalTicketCard
        ticketCode={ticket.ticketCode}
        qrDataUrl={qrDataUrl}
        eventTitle={ticket.order.event.title}
        eventDate={ticket.order.event.date}
        doorsOpenTime={ticket.order.event.doorsOpenTime}
        venue={ticket.order.event.venue}
        address={ticket.order.event.address}
        city={ticket.order.event.city}
        tierName={ticket.tier.name}
        price={ticket.price}
        attendeeName={ticket.attendeeName}
        attendeeLastName={ticket.attendeeLastName}
        attendeeDni={ticket.attendeeDni}
        status={ticket.status}
        orderNumber={ticket.order.orderNumber}
      />
    </div>
  );
}
