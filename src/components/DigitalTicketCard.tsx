"use client";

import { useEffect, useState } from "react";
import { Calendar, MapPin, ShieldCheck, Download, Printer, CheckCircle2, AlertTriangle, Sparkles } from "lucide-react";

interface DigitalTicketProps {
  ticketCode: string;
  qrDataUrl: string;
  eventTitle: string;
  eventDate: Date | string;
  doorsOpenTime?: string | null;
  venue: string;
  address: string;
  city: string;
  tierName: string;
  price: number;
  attendeeName: string;
  attendeeLastName: string;
  attendeeDni: string;
  status: string;
  orderNumber: string;
}

export default function DigitalTicketCard({
  ticketCode,
  qrDataUrl,
  eventTitle,
  eventDate,
  doorsOpenTime = "22:00",
  venue,
  address,
  city,
  tierName,
  price,
  attendeeName,
  attendeeLastName,
  attendeeDni,
  status,
  orderNumber,
}: DigitalTicketProps) {
  // Live anti-screenshot clock
  const [liveTime, setLiveTime] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setLiveTime(now.toLocaleTimeString("es-AR", { hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const formattedDate = new Date(eventDate).toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-md mx-auto print:m-0 print:max-w-none">
      {/* Action bar for user */}
      <div className="flex items-center justify-between gap-3 mb-4 print:hidden">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#CEC1AD]">
          <Sparkles className="w-4 h-4 text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
          <span>Presentá este QR en puerta</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl bg-[#181511] hover:bg-[#221C15] text-[#FAF6EE] hover:text-amber-300 text-xs font-black uppercase tracking-wider flex items-center gap-2 border border-amber-400/40 hover:border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)] hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] active:scale-95 transition-all cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-amber-400" />
            Imprimir / PDF
          </button>
        </div>
      </div>

      {/* Main Ticket Box */}
      <div className="ticket-sweep printable-ticket relative bg-gradient-to-b from-[#181511] via-[#14120E] to-[#0E0C09] border-2 border-amber-500/35 rounded-3xl overflow-hidden shadow-[0_0_40px_rgba(245,158,11,0.18)]">
        {/* Screen Anti-fraud live bar (Fixed: no white border, sleek seamless integration) */}
        <div className="bg-[#100E0B] border-b border-[#2C261E] px-5 py-2.5 flex items-center justify-between text-[11px] font-mono print:hidden">
          {status === "VALID" ? (
            <span className="text-emerald-400 font-black flex items-center gap-2 tracking-wider">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.9)]" />
              </span>
              TICKET OFICIAL ACTIVO
            </span>
          ) : status === "USED" ? (
            <span className="text-amber-400 font-black flex items-center gap-2 tracking-wider">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.9)]" />
              </span>
              TICKET YA INGRESADO
            </span>
          ) : (
            <span className="text-red-400 font-black flex items-center gap-2 tracking-wider">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.9)]" />
              </span>
              TICKET NO VÁLIDO
            </span>
          )}
          <span className="text-amber-400 font-black tracking-widest text-xs drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]">
            {liveTime || "00:00:00"}
          </span>
        </div>

        {/* Print Header Bar */}
        <div className="hidden print:flex printable-header-bar items-center justify-between text-xs font-bold font-mono">
          <span>PANDA ACCESS • ENTRADA OFICIAL</span>
          <span>ORDEN #{orderNumber}</span>
        </div>

        {/* Header Event Info */}
        <div className="p-6 sm:p-7 pb-4 print:p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="px-3 py-1 rounded-full bg-amber-400/15 border border-amber-400/40 text-amber-300 text-[11px] font-black tracking-wider uppercase inline-block shadow-[0_0_12px_rgba(245,158,11,0.25)] mb-3">
                {tierName}
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-[#FAF6EE] uppercase leading-tight tracking-wide drop-shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                {eventTitle}
              </h2>
            </div>
          </div>

          <div className="mt-4 space-y-2 text-xs font-semibold text-[#CEC1AD]">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-400 drop-shadow-[0_0_6px_rgba(245,158,11,0.6)] print:text-black shrink-0" />
              <span className="capitalize">{formattedDate}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-400 drop-shadow-[0_0_6px_rgba(245,158,11,0.6)] print:text-black shrink-0" />
              <span>
                {venue} — {address}, {city}
              </span>
            </div>
          </div>
        </div>

        {/* Serrated divider / Notches */}
        <div className="relative py-2 flex items-center">
          <div className="ticket-notch-left print:hidden" />
          <div className="ticket-notch-right print:hidden" />
          <div className="w-full border-t-2 border-dashed border-amber-500/30 print:border-black" />
        </div>

        {/* QR & Attendee Details */}
        <div className="p-6 sm:p-7 pt-2 print:p-4 text-center flex flex-col items-center">
          {/* Status Badge */}
          <div className="mb-4 print:mb-2">
            {status === "VALID" && (
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/15 print:bg-gray-100 border border-emerald-400/50 print:border-black text-emerald-300 print:text-black text-xs font-black tracking-wider uppercase shadow-[0_0_20px_rgba(16,185,129,0.25)]">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.8)] print:text-black" />
                Válido para Ingreso
              </span>
            )}
            {status === "USED" && (
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/15 print:bg-gray-100 border border-amber-400/50 print:border-black text-amber-300 print:text-black text-xs font-black tracking-wider uppercase shadow-[0_0_20px_rgba(245,158,11,0.25)]">
                <AlertTriangle className="w-4 h-4 text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)] print:text-black" />
                Ingreso Ya Registrado
              </span>
            )}
            {status === "CANCELLED" && (
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-500/15 border border-rose-400/50 text-rose-300 text-xs font-black tracking-wider uppercase shadow-[0_0_20px_rgba(244,63,94,0.25)]">
                Cancelado
              </span>
            )}
          </div>

          {/* QR Container */}
          <div className="p-4 bg-white rounded-2xl shadow-[0_0_35px_rgba(245,158,11,0.25)] border-2 border-amber-400/70 inline-block">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={`QR Ticket ${ticketCode}`}
                className="w-52 h-52 print:w-44 print:h-44 object-contain block mx-auto"
              />
            ) : (
              <div className="w-52 h-52 flex items-center justify-center text-black font-mono text-xs">
                Generando QR...
              </div>
            )}
          </div>

          {/* Ticket Security Code */}
          <div className="mt-3.5 font-mono text-xs text-amber-300 font-extrabold tracking-widest bg-[#181511] border border-[#2C261E] px-4 py-1.5 rounded-lg shadow-sm">
            {ticketCode}
          </div>

          {/* Attendee Info Card */}
          <div className="mt-6 print:mt-3 w-full bg-[#100E0B] printable-attendee-box rounded-2xl p-5 border border-[#2C261E] text-left grid grid-cols-2 gap-4 text-xs shadow-inner">
            <div>
              <span className="text-[#8F8270] print:text-gray-600 block font-bold uppercase text-[10px] tracking-wider">
                Titular
              </span>
              <span className="font-black text-[#FAF6EE] print:text-black text-sm truncate block tracking-wide">
                {attendeeName} {attendeeLastName}
              </span>
            </div>
            <div>
              <span className="text-[#8F8270] print:text-gray-600 block font-bold uppercase text-[10px] tracking-wider">
                DNI / Pasaporte
              </span>
              <span className="font-black text-amber-300 print:text-black text-sm block font-mono tracking-wider">
                {attendeeDni}
              </span>
            </div>
            <div>
              <span className="text-[#8F8270] print:text-gray-600 block font-bold uppercase text-[10px] tracking-wider">
                Apertura Puertas
              </span>
              <span className="font-bold text-[#CEC1AD] print:text-black block">
                {doorsOpenTime} hs
              </span>
            </div>
            <div>
              <span className="text-[#8F8270] print:text-gray-600 block font-bold uppercase text-[10px] tracking-wider">
                Orden
              </span>
              <span className="font-black text-amber-400 print:text-black block font-mono">
                #{orderNumber}
              </span>
            </div>
          </div>

          <p className="text-[11px] text-[#8F8270] print:text-gray-600 mt-4 print:mt-2 leading-relaxed font-medium">
            Ingreso intransferible con DNI. Una vez validado en el lector, el código queda inhabilitado automáticamente.
          </p>
        </div>
      </div>
    </div>
  );
}
