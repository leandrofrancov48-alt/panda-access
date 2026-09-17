"use client";

import { Ticket, ChevronDown } from "lucide-react";

export default function ExploreButton() {
  const handleScroll = (e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById("eventos");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      window.location.hash = "#eventos";
    }
  };

  return (
    <button
      type="button"
      onClick={handleScroll}
      className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-black font-black text-base uppercase tracking-wider transition-all duration-300 border-2 border-amber-200 shadow-[0_0_25px_rgba(245,158,11,0.45)] hover:shadow-[0_0_40px_rgba(245,158,11,0.7)] hover:scale-105 active:scale-95 flex items-center justify-center gap-2.5 cursor-pointer group"
      aria-label="Explorar cartelera de eventos"
    >
      <Ticket className="w-5 h-5 transition-transform duration-300 group-hover:rotate-12" />
      <span>Explorar Cartelera</span>
      <ChevronDown className="w-4 h-4 text-black/80 transition-transform duration-300 group-hover:translate-y-1 animate-bounce" />
    </button>
  );
}
