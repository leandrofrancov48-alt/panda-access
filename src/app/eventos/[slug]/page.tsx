import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import TicketSelector from "@/components/TicketSelector";
import {
  Calendar,
  MapPin,
  Clock,
  ShieldAlert,
  ArrowLeft,
  ArrowRight,
  Music,
  Share2,
  ExternalLink,
} from "lucide-react";

interface Props {
  params: Promise<{ slug: string }>;
}

export const dynamic = "force-dynamic";

export default async function EventDetailPage({ params }: Props) {
  const { slug } = await params;

  const event = await db.event.findUnique({
    where: { slug },
    include: {
      tiers: {
        orderBy: { price: "asc" },
      },
    },
  });

  if (!event) {
    notFound();
  }

  // Parse lineup
  let lineup: Array<{ name: string; time: string; highlight?: boolean }> = [];
  if (event.lineup) {
    try {
      lineup = JSON.parse(event.lineup);
    } catch {
      lineup = [];
    }
  }

  const eventDate = new Date(event.date);
  const formattedDate = eventDate.toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const mapQuery = [event.venue, event.address, event.city].filter(Boolean).join(", ");
  const mapsEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
  const mapsSearchUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`;
  const mapsDirectionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(mapQuery)}`;

  return (
    <div className="space-y-10">
      {/* Back button & Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a la cartelera
        </Link>
      </div>

      {/* Banner / Poster Header */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative aspect-[21/9] min-h-[280px] w-full rounded-3xl overflow-hidden bg-[#161B2B] border border-[#21273C] shadow-2xl">
          <img
            src={event.bannerImage || event.coverImage}
            alt={event.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#07080C] via-[#07080C]/60 to-transparent" />

          {/* Banner bottom info */}
          <div className="absolute bottom-6 left-6 right-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-[#FFE600] text-black text-xs font-black uppercase tracking-wider">
                  {event.city}
                </span>
                {event.ageRestriction && (
                  <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold">
                    {event.ageRestriction}
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white uppercase tracking-tight leading-tight">
                {event.title}
              </h1>
              {event.subtitle && (
                <p className="text-sm sm:text-base text-gray-300 font-medium">
                  {event.subtitle}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Event details (7 cols) */}
          <div className="lg:col-span-7 space-y-8">
            {/* Quick Metadata Box */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-[#0F121C] border border-[#1E253A] rounded-2xl p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#171B2B] flex items-center justify-center text-[#FFE600] shrink-0">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-400 block">
                    Fecha
                  </span>
                  <span className="text-xs font-extrabold text-white capitalize block">
                    {formattedDate}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#171B2B] flex items-center justify-center text-[#38BDF8] shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-400 block">
                    Puertas
                  </span>
                  <span className="text-xs font-extrabold text-white block">
                    {event.doorsOpenTime || "22:00"} hs
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#171B2B] flex items-center justify-center text-[#FF2E4C] shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-400 block">
                    Lugar
                  </span>
                  <span className="text-xs font-extrabold text-white block truncate max-w-[140px]">
                    {event.venue}
                  </span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-[#0F121C] border border-[#1E253A] rounded-2xl p-6 sm:p-8 space-y-4">
              <h3 className="text-lg font-black uppercase text-white tracking-wide">
                Sobre el evento
              </h3>
              <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">
                {event.description}
              </p>
            </div>

            {/* Line-up section */}
            {lineup.length > 0 && (
              <div className="bg-[#0F121C] border border-[#1E253A] rounded-2xl p-6 sm:p-8 space-y-4">
                <div className="flex items-center gap-2">
                  <Music className="w-5 h-5 text-[#FFE600]" />
                  <h3 className="text-lg font-black uppercase text-white tracking-wide">
                    Line Up / Artistas
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {lineup.map((artist, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-xl border flex items-center justify-between ${
                        artist.highlight
                          ? "bg-[#181C2E] border-[#FFE600]/40 text-white"
                          : "bg-[#121624] border-[#1E253A] text-gray-300"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-2 h-2 rounded-full bg-[#FFE600]" />
                        <span className="text-sm font-extrabold">{artist.name}</span>
                      </div>
                      <span className="text-xs font-mono text-[#94A3B8]">
                        {artist.time}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Location Box with Interactive Map */}
            <div className="bg-[#0F121C] border border-[#1E253A] rounded-2xl p-6 sm:p-8 space-y-4">
              <div>
                <span className="text-[10px] font-black uppercase text-amber-400 tracking-widest block mb-1">
                  UBICACIÓN
                </span>
                <h3 className="text-xl sm:text-2xl font-black uppercase text-white tracking-wide">
                  {event.venue}
                </h3>
              </div>

              {/* Map Preview Container */}
              <div className="relative rounded-2xl overflow-hidden border border-[#232B45] bg-[#141828] shadow-lg group">
                {/* Floating "Abrir en Maps" Button */}
                <a
                  href={mapsSearchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute top-3 left-3 z-10 px-3.5 py-1.5 rounded-xl bg-[#0F121C]/90 hover:bg-black text-white text-xs font-bold border border-white/20 shadow-xl backdrop-blur-md flex items-center gap-1.5 transition-all hover:scale-105 cursor-pointer"
                >
                  <span>Abrir en Maps</span>
                  <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                </a>

                <iframe
                  src={mapsEmbedUrl}
                  className="w-full h-56 sm:h-72 border-0 rounded-2xl filter contrast-[1.03] brightness-95"
                  loading="lazy"
                  allowFullScreen={false}
                  referrerPolicy="no-referrer-when-downgrade"
                  title={`Ubicación de ${event.venue}`}
                />
              </div>

              {/* Venue details and directions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-sm font-bold text-white block">{event.venue}</span>
                    <span className="text-xs text-gray-400 block">{event.address}, {event.city}</span>
                  </div>
                </div>

                <a
                  href={mapsDirectionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-black text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors w-fit shrink-0 py-1"
                >
                  Cómo llegar
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Rules & Requirements */}
            <div className="bg-[#0F121C] border border-[#1E253A] rounded-2xl p-6 sm:p-8 space-y-3">
              <div className="flex items-center gap-2 text-[#FF2E4C]">
                <ShieldAlert className="w-5 h-5" />
                <h4 className="text-sm font-black uppercase tracking-wider">
                  Normas de Ingreso
                </h4>
              </div>
              <ul className="text-xs text-[#94A3B8] space-y-2 list-disc list-inside leading-relaxed">
                <li>Presentar DNI físico o digital en la app Mi Argentina.</li>
                <li>Ingreso exclusivo para mayores de 18 años con documento en mano.</li>
                <li>Prohibido el ingreso con alimentos, bebidas o elementos punzantes.</li>
                <li>Cada ticket es nominal e intransferible tras ser validado en el lector de puerta.</li>
              </ul>
            </div>
          </div>

          {/* Right Column: Ticket Selector (Sticky on desktop, 5 cols) */}
          <div className="lg:col-span-5 lg:sticky lg:top-24">
            <TicketSelector
              eventId={event.id}
              eventTitle={event.title}
              tiers={event.tiers}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
