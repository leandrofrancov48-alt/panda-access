import Link from "next/link";
import { Calendar, MapPin, Ticket, Flame } from "lucide-react";

interface EventCardProps {
  id: string;
  slug: string;
  title: string;
  subtitle?: string | null;
  date: Date | string;
  venue: string;
  city: string;
  coverImage: string;
  featured?: boolean;
  minPrice?: number;
  status?: string;
}

export default function EventCard({
  slug,
  title,
  subtitle,
  date,
  venue,
  city,
  coverImage,
  featured,
  minPrice = 0,
  status = "PUBLISHED",
}: EventCardProps) {
  const eventDate = new Date(date);
  const day = eventDate.getDate();
  const month = eventDate
    .toLocaleDateString("es-AR", { month: "short" })
    .toUpperCase()
    .replace(".", "");
  const hours = eventDate.getHours().toString().padStart(2, "0");
  const minutes = eventDate.getMinutes().toString().padStart(2, "0");
  const time = `${hours}:${minutes}`;

  return (
    <Link
      href={`/eventos/${slug}`}
      className="group relative flex flex-col bg-[#15130F] border border-[#2E2820] hover:border-amber-400/80 hover:shadow-[0_0_30px_rgba(245,158,11,0.28)] rounded-2xl overflow-hidden transition-all duration-300 ease-out hover:-translate-y-1.5 shadow-xl transform-gpu"
      style={{ willChange: "transform", transform: "translateZ(0)" }}
    >
      {/* Cover Image Container */}
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-t-2xl bg-[#15130F] isolate">
        <img
          src={coverImage}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105 transform-gpu will-change-transform"
          style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#15130F] via-[#15130F]/30 to-black/30 pointer-events-none" />
        {/* Seamless bottom seal to eliminate any subpixel gap or image edge flicker */}
        <div className="absolute -bottom-1 left-0 right-0 h-4 bg-gradient-to-t from-[#15130F] to-transparent pointer-events-none z-10" />

        {/* Date Pill Badge with Neon Amber Glow */}
        <div className="absolute top-3 left-3 bg-[#0C0B09]/90 backdrop-blur-md text-amber-300 border border-amber-400/50 rounded-xl px-3 py-1.5 flex flex-col items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.3)] transition-transform duration-300 group-hover:scale-105">
          <span className="text-[10px] font-black tracking-wider uppercase opacity-85">
            {month}
          </span>
          <span className="text-lg font-black leading-tight drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]">
            {day}
          </span>
        </div>

        {/* Featured / Status Pill */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          {minPrice === 0 && (
            <span className="inline-flex items-center gap-1 bg-emerald-400 text-black text-[11px] font-black uppercase px-2.5 py-1 rounded-full shadow-[0_0_15px_rgba(52,211,153,0.5)] border border-emerald-300">
              Gratis
            </span>
          )}
          {featured && (
            <span className="inline-flex items-center gap-1 bg-gradient-to-r from-amber-400 to-orange-500 text-black text-[11px] font-black uppercase px-2.5 py-1 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.5)] border border-amber-200">
              <Flame className="w-3 h-3 fill-current animate-flame-wiggle" />
              Destacado
            </span>
          )}
          {status === "SOLD_OUT" && (
            <span className="bg-[#1C1813] text-[#8F8270] text-[11px] font-black uppercase px-2.5 py-1 rounded-full border border-neutral-700">
              Agotado
            </span>
          )}
        </div>
      </div>

      {/* Details Container - Solid background with overlap to seal any gap */}
      <div className="p-5 flex flex-col flex-1 justify-between gap-4 bg-[#15130F] relative z-10 -mt-2 pt-6 rounded-b-2xl">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#8F8270]">
            <Calendar className="w-3.5 h-3.5 text-amber-400/70" />
            <span suppressHydrationWarning>
              {eventDate.toLocaleDateString("es-AR", {
                weekday: "short",
                day: "numeric",
                month: "long",
              })}{" "}
              • {time} hs
            </span>
          </div>

          <h3 className="text-lg font-black text-[#FAF6EE] group-hover:text-amber-300 transition-colors line-clamp-1">
            {title}
          </h3>

          {subtitle && (
            <p className="text-xs text-[#CEC1AD]/80 line-clamp-2 leading-relaxed font-medium">
              {subtitle}
            </p>
          )}

          <div className="flex items-center gap-1.5 text-xs text-[#8F8270] pt-1 font-medium">
            <MapPin className="w-3.5 h-3.5 text-amber-400/70 shrink-0" />
            <span className="truncate">
              {venue}, {city}
            </span>
          </div>
        </div>

        {/* Price & Action Row */}
        <div className="pt-3 border-t border-[#2C261E] flex items-center justify-between">
          <div>
            <span className="text-[11px] uppercase tracking-wider text-[#8F8270] block font-bold">
              {minPrice === 0 ? "Acceso" : "Entradas desde"}
            </span>
            {minPrice === 0 ? (
              <span className="text-lg font-black text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]">
                GRATIS
              </span>
            ) : (
              <span className="text-lg font-black text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]">
                ${minPrice.toLocaleString("es-AR")}
              </span>
            )}
          </div>

          <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-black font-black text-xs shadow-[0_0_15px_rgba(245,158,11,0.3)] group-hover:shadow-[0_0_25px_rgba(245,158,11,0.6)] group-hover:from-amber-300 group-hover:to-amber-400 transition-all border border-amber-200 cursor-pointer">
            <Ticket className="w-3.5 h-3.5" />
            {minPrice === 0 ? "Registrarse" : "Comprar"}
          </span>
        </div>
      </div>
    </Link>
  );
}
