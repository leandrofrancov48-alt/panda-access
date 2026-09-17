import Link from "next/link";
import { db } from "@/lib/db";
import EventCard from "@/components/EventCard";
import ExploreButton from "@/components/ExploreButton";
import { Sparkles, Flame, Shield, QrCode, Ticket, ArrowRight, Zap, Music } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const events = await db.event.findMany({
    where: { status: { not: "DRAFT" } },
    include: {
      tiers: {
        orderBy: { price: "asc" },
      },
    },
    orderBy: { date: "asc" },
  });

  const featuredEvents = events.filter((e) => e.featured);
  const otherEvents = events.filter((e) => !e.featured);

  return (
    <div className="space-y-16 relative">
      {/* Ambient Neon Glow Orbs (Nightclub & Concert Aura with Floating Animation) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-amber-500/15 rounded-full blur-[140px] pointer-events-none -z-10 animate-float-slow" />
      <div className="absolute top-40 left-10 w-[350px] h-[300px] bg-pink-500/10 rounded-full blur-[130px] pointer-events-none -z-10 animate-float-reverse" />
      <div className="absolute top-48 right-10 w-[350px] h-[300px] bg-cyan-500/10 rounded-full blur-[130px] pointer-events-none -z-10 animate-float-slow" />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-6 pb-12 sm:pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-6">
          {/* Tag Pill with Animated Soundwave Equalizer */}
          <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-[#181511] border border-amber-400/40 shadow-[0_0_20px_rgba(245,158,11,0.25)] text-xs font-black text-amber-300 animate-fade-in-up">
            <div className="flex items-end gap-0.5 h-3.5">
              <span className="w-1 bg-amber-400 rounded-full soundwave-bar-1" />
              <span className="w-1 bg-amber-300 rounded-full soundwave-bar-2" />
              <span className="w-1 bg-amber-400 rounded-full soundwave-bar-3" />
              <span className="w-1 bg-amber-500 rounded-full soundwave-bar-4" />
            </div>
            <span className="tracking-wider">LA PLATAFORMA DE TICKETS PARA LA COMUNIDAD CUMBIERA</span>
            <div className="flex items-end gap-0.5 h-3.5">
              <span className="w-1 bg-amber-500 rounded-full soundwave-bar-4" />
              <span className="w-1 bg-amber-400 rounded-full soundwave-bar-3" />
              <span className="w-1 bg-amber-300 rounded-full soundwave-bar-2" />
              <span className="w-1 bg-amber-400 rounded-full soundwave-bar-1" />
            </div>
          </div>

          {/* Main Hero Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-[#FAF6EE] uppercase max-w-4xl mx-auto leading-[0.95] flex flex-col items-center animate-fade-in-up animation-delay-100">
            <span className="block mb-2 drop-shadow-[0_0_25px_rgba(245,158,11,0.35)]">
              LOS MEJORES EVENTOS
            </span>
            <span className="whitespace-nowrap relative inline-block bg-[#0A0907] text-amber-300 text-2xl sm:text-4xl lg:text-5xl px-5 py-2.5 sm:px-8 sm:py-3.5 -rotate-1 border-[2px] border-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.45)]">
              VIVÍ, BAILÁ, DISFRUTÁ
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-[#CEC1AD] max-w-2xl mx-auto font-medium leading-relaxed animate-fade-in-up animation-delay-200">
            Tus entradas oficiales para los mejores shows y fiestas de cumbia directo en tu celular. Código QR único e ingreso en segundos por puerta.
          </p>

          {/* CTA Button */}
          <div className="flex items-center justify-center pt-4 animate-fade-in-up animation-delay-300">
            <ExploreButton />
          </div>

          {/* Live Trust Badges with Neon Borders */}
          <div className="pt-10 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto text-left animate-fade-in-up animation-delay-400">
            <div className="bg-[#15130F] border border-[#2E2820] hover:border-amber-400/60 p-4 rounded-xl shadow-lg hover:shadow-[0_0_20px_rgba(245,158,11,0.2)] transition-all group">
              <Zap className="w-4 h-4 text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)] mb-2" />
              <div className="text-xs font-black text-[#FAF6EE] group-hover:text-amber-300 transition-colors">Entrega Inmediata</div>
              <div className="text-[11px] text-[#8F8270] font-medium">Mail + QR al instante</div>
            </div>
            <div className="bg-[#15130F] border border-[#2E2820] hover:border-emerald-400/60 p-4 rounded-xl shadow-lg hover:shadow-[0_0_20px_rgba(52,211,153,0.2)] transition-all group">
              <Shield className="w-4 h-4 text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)] mb-2" />
              <div className="text-xs font-black text-[#FAF6EE] group-hover:text-emerald-300 transition-colors">Anti-Fraude</div>
              <div className="text-[11px] text-[#8F8270] font-medium">QR dinámico único</div>
            </div>
            <div className="bg-[#15130F] border border-[#2E2820] hover:border-pink-400/60 p-4 rounded-xl shadow-lg hover:shadow-[0_0_20px_rgba(244,63,94,0.2)] transition-all group">
              <Flame className="w-4 h-4 text-pink-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.8)] mb-2" />
              <div className="text-xs font-black text-[#FAF6EE] group-hover:text-pink-300 transition-colors">Artistas en Vivo</div>
              <div className="text-[11px] text-[#8F8270] font-medium">Líderes de la escena</div>
            </div>
            <div className="bg-[#15130F] border border-[#2E2820] hover:border-cyan-400/60 p-4 rounded-xl shadow-lg hover:shadow-[0_0_20px_rgba(6,182,212,0.2)] transition-all group">
              <QrCode className="w-4 h-4 text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)] mb-2" />
              <div className="text-xs font-black text-[#FAF6EE] group-hover:text-cyan-300 transition-colors">Ingreso Ágil</div>
              <div className="text-[11px] text-[#8F8270] font-medium">Validación en 1 segundo</div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Neon Marquee / Ticker Tape */}
      <div className="relative py-3.5 border-y border-amber-500/25 bg-[#100E0B]/90 backdrop-blur-md overflow-hidden shadow-[0_0_25px_rgba(245,158,11,0.1)]">
        <div className="animate-marquee whitespace-nowrap flex items-center gap-8 text-xs font-black tracking-widest uppercase">
          <span className="flex items-center gap-2 text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]">
            <Flame className="w-4 h-4 fill-amber-400 animate-pulse" /> TICKETS 100% OFICIALES
          </span>
          <span className="text-neutral-600">•</span>
          <span className="flex items-center gap-2 text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.6)]">
            <Shield className="w-4 h-4" /> QR DINÁMICO ANTI-FRAUDE
          </span>
          <span className="text-neutral-600">•</span>
          <span className="flex items-center gap-2 text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]">
            <Zap className="w-4 h-4" /> INGRESO EN 1 SEGUNDO POR PUERTA
          </span>
          <span className="text-neutral-600">•</span>
          <span className="flex items-center gap-2 text-pink-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.6)]">
            <Music className="w-4 h-4" /> LOS MEJORES SHOWS Y FESTIVALES
          </span>
          <span className="text-neutral-600">•</span>
          <span className="flex items-center gap-2 text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]">
            <Flame className="w-4 h-4 fill-amber-400 animate-pulse" /> TICKETS 100% OFICIALES
          </span>
          <span className="text-neutral-600">•</span>
          <span className="flex items-center gap-2 text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.6)]">
            <Shield className="w-4 h-4" /> QR DINÁMICO ANTI-FRAUDE
          </span>
          <span className="text-neutral-600">•</span>
          <span className="flex items-center gap-2 text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]">
            <Zap className="w-4 h-4" /> INGRESO EN 1 SEGUNDO POR PUERTA
          </span>
          <span className="text-neutral-600">•</span>
          <span className="flex items-center gap-2 text-pink-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.6)]">
            <Music className="w-4 h-4" /> LOS MEJORES SHOWS Y FESTIVALES
          </span>
        </div>
      </div>

      {/* Featured Events Section */}
      {featuredEvents.length > 0 && (
        <section id="destacados" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-28">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#2C261E]">
            <div className="flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.9)]" />
              </span>
              <h2 className="text-2xl font-black uppercase text-[#FAF6EE] tracking-wide">
                Eventos Destacados
              </h2>
            </div>
            <span className="text-xs font-black text-amber-300 uppercase tracking-wider bg-[#181511] border border-amber-400/40 px-3 py-1 rounded-full shadow-[0_0_12px_rgba(245,158,11,0.25)]">
              Los Más Esperados
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {featuredEvents.map((evt) => (
              <EventCard
                key={evt.id}
                id={evt.id}
                slug={evt.slug}
                title={evt.title}
                subtitle={evt.subtitle}
                date={evt.date}
                venue={evt.venue}
                city={evt.city}
                coverImage={evt.coverImage}
                featured={evt.featured}
                minPrice={evt.tiers[0]?.price || 0}
                status={evt.status}
              />
            ))}
          </div>
        </section>
      )}

      {/* Full Events Catalog Section */}
      <section id="eventos" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-28">
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#2C261E]">
          <div className="flex items-center gap-2.5">
            <Ticket className="w-5 h-5 text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
            <h2 className="text-2xl font-black uppercase text-[#FAF6EE] tracking-wide">
              Próximos Recitales & Fiestas
            </h2>
          </div>
          <span className="text-xs text-amber-300/90 font-black uppercase bg-[#181511] border border-[#332B21] px-3 py-1 rounded-full">
            {events.length} {events.length === 1 ? "evento disponible" : "eventos disponibles"}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((evt) => (
            <EventCard
              key={evt.id}
              id={evt.id}
              slug={evt.slug}
              title={evt.title}
              subtitle={evt.subtitle}
              date={evt.date}
              venue={evt.venue}
              city={evt.city}
              coverImage={evt.coverImage}
              featured={evt.featured}
              minPrice={evt.tiers[0]?.price || 0}
              status={evt.status}
            />
          ))}
        </div>
      </section>

      {/* Scanner & Admin Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#1A1610] via-[#12100C] to-[#0A0907] border-2 border-amber-500/40 p-8 md:p-12 shadow-[0_0_40px_rgba(245,158,11,0.18)]">
          {/* Subtle neon glow in corner */}
          <div className="absolute top-0 right-0 w-[250px] h-[250px] bg-amber-500/10 rounded-full blur-[90px] pointer-events-none" />

          <div className="max-w-2xl space-y-4 relative z-10">
            <span className="px-3 py-1 rounded-full bg-amber-400/15 text-amber-300 border border-amber-400/30 text-xs font-black uppercase tracking-wider inline-block shadow-[0_0_12px_rgba(245,158,11,0.2)]">
              Para Productores & Personal de Puerta
            </span>
            <h3 className="text-3xl sm:text-4xl font-black text-[#FAF6EE] uppercase leading-tight">
              Control de acceso en tiempo real sin equipamiento caro
            </h3>
            <p className="text-sm text-[#CEC1AD] leading-relaxed font-medium">
              Escaneá los códigos QR desde cualquier celular conectado a internet. El sistema avisa si la entrada es original, evita reutilización por capturas de pantalla y lleva la cuenta de ingresados al instante.
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-4">
              <Link
                href="/admin/scanner"
                className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-black font-black text-xs uppercase tracking-wider transition-all duration-200 shadow-[0_0_20px_rgba(245,158,11,0.4)] hover:shadow-[0_0_30px_rgba(245,158,11,0.7)] hover:scale-105 border border-amber-200 flex items-center gap-2 cursor-pointer"
              >
                <QrCode className="w-4 h-4" />
                Abrir Escáner de Puerta
              </Link>
              <Link
                href="/admin"
                className="px-6 py-3.5 rounded-xl bg-[#181511] text-[#FAF6EE] font-black text-xs hover:text-amber-300 transition-all border border-[#332B21] hover:border-amber-400/60 shadow-md flex items-center gap-2 cursor-pointer"
              >
                Panel de Administración
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
