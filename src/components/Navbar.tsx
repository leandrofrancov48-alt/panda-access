"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Ticket, QrCode, ShieldCheck, Menu, X, Flame, User, Sparkles } from "lucide-react";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<{ name: string; points: number; tier: string } | null>(null);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && data.user) {
            setUser({
              name: data.user.name,
              points: data.user.points,
              tier: data.user.tier,
            });
          }
        }
      } catch {
        // guest mode
      }
    }
    checkAuth();
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-header">
      {/* Bottom glowing neon gradient line */}
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-400/50 to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <img
            src="/logo.png"
            alt="Logo Panda DJ"
            className="w-12 h-12 shrink-0 object-contain group-hover:scale-105 transition-transform duration-300"
          />
          <span className="text-xl sm:text-2xl font-black tracking-wider uppercase text-[#FAF6EE] flex items-center gap-1.5 leading-none">
            PANDA<span className="text-amber-400 drop-shadow-[0_0_10px_rgba(245,158,11,0.6)]">ACCESS</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-7">
          <a
            href="/#eventos"
            onClick={(e) => {
              if (window.location.pathname === "/") {
                e.preventDefault();
                document.getElementById("eventos")?.scrollIntoView({ behavior: "smooth", block: "start" });
              }
            }}
            className="text-sm font-black text-[#CEC1AD] hover:text-amber-300 hover:drop-shadow-[0_0_8px_rgba(245,158,11,0.6)] transition-all cursor-pointer"
          >
            Próximos Shows
          </a>
          <a
            href="/#destacados"
            onClick={(e) => {
              if (window.location.pathname === "/") {
                e.preventDefault();
                document.getElementById("destacados")?.scrollIntoView({ behavior: "smooth", block: "start" });
              }
            }}
            className="text-sm font-black text-[#CEC1AD] hover:text-amber-300 hover:drop-shadow-[0_0_8px_rgba(245,158,11,0.6)] flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Flame className="w-4 h-4 text-amber-400 fill-amber-400/30" />
            Destacados
          </a>
        </nav>

        {/* Action Buttons */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <Link
              href="/perfil"
              className="px-4 py-2 rounded-xl bg-[#191510] hover:bg-[#241E17] border border-amber-400/40 text-xs font-black text-white hover:text-amber-300 flex items-center gap-2 transition-all shadow-md shadow-amber-500/10 cursor-pointer"
            >
              <span className="w-6 h-6 rounded-lg bg-amber-400/20 text-amber-400 flex items-center justify-center text-xs">
                🐼
              </span>
              <span>{user.name}</span>
              <span className="text-[10px] text-gray-400 font-bold">
                Mi Cuenta
              </span>
            </Link>
          ) : (
            <Link
              href="/login"
              className="px-4 py-2 rounded-xl bg-[#14120F] hover:bg-[#1E1B15] border border-[#2D271E] text-xs font-black text-[#CEC1AD] hover:text-amber-300 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <User className="w-3.5 h-3.5" />
              Ingresar
            </Link>
          )}

          <a
            href="/#eventos"
            onClick={(e) => {
              if (window.location.pathname === "/") {
                e.preventDefault();
                document.getElementById("eventos")?.scrollIntoView({ behavior: "smooth", block: "start" });
              }
            }}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-black font-black text-sm tracking-wide transition-all duration-300 border border-amber-200 shadow-[0_0_20px_rgba(245,158,11,0.4)] hover:shadow-[0_0_30px_rgba(245,158,11,0.7)] hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer"
          >
            <Ticket className="w-4 h-4" />
            Sacar Entradas
          </a>
        </div>

        {/* Mobile menu trigger */}
        <div className="md:hidden flex items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2.5 rounded-xl border border-amber-400/40 bg-[#181511] text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.25)] active:scale-95 transition-transform"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#15130F] border-b border-amber-400/30 px-4 pt-4 pb-6 space-y-3 shadow-2xl">
          <a
            href="/#eventos"
            onClick={(e) => {
              setMobileMenuOpen(false);
              if (window.location.pathname === "/") {
                e.preventDefault();
                document.getElementById("eventos")?.scrollIntoView({ behavior: "smooth", block: "start" });
              }
            }}
            className="block py-2 text-base font-black text-[#FAF6EE] hover:text-amber-400 transition-colors"
          >
            Próximos Shows
          </a>
          <a
            href="/#destacados"
            onClick={(e) => {
              setMobileMenuOpen(false);
              if (window.location.pathname === "/") {
                e.preventDefault();
                document.getElementById("destacados")?.scrollIntoView({ behavior: "smooth", block: "start" });
              }
            }}
            className="flex items-center gap-2 py-2 text-base font-black text-[#FAF6EE] hover:text-amber-400 transition-colors"
          >
            <Flame className="w-4 h-4 text-amber-400 fill-amber-400/30" />
            Shows Destacados
          </a>
          {/* Mobile User Profile / Login */}
          <div className="pt-2 border-t border-[#231E17]">
            {user ? (
              <Link
                href="/perfil"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-[#191510] border border-amber-400/40 text-white"
              >
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-amber-400/20 text-amber-400 flex items-center justify-center text-sm">
                    🐼
                  </span>
                  <div className="text-left">
                    <span className="text-xs font-black block">{user.name}</span>
                    <span className="text-[10px] text-gray-400 font-bold block">Mi Cuenta</span>
                  </div>
                </div>
                <span className="text-xs font-bold text-amber-400">
                  Ver perfil →
                </span>
              </Link>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2.5 rounded-xl bg-[#181511] border border-[#2D271E] text-center text-xs font-bold text-[#CEC1AD] hover:text-white"
                >
                  Iniciar Sesión
                </Link>
                <Link
                  href="/registro"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-center text-xs font-bold text-amber-300 hover:text-white"
                >
                  Registrarme
                </Link>
              </div>
            )}
          </div>

          <div className="pt-1">
            <a
              href="/#eventos"
              onClick={(e) => {
                setMobileMenuOpen(false);
                if (window.location.pathname === "/") {
                  e.preventDefault();
                  document.getElementById("eventos")?.scrollIntoView({ behavior: "smooth", block: "start" });
                }
              }}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-black border border-amber-200 shadow-[0_0_20px_rgba(245,158,11,0.45)] font-black text-sm active:scale-95 transition-transform cursor-pointer"
            >
              <Ticket className="w-4 h-4" />
              Ver Próximos Shows
            </a>
          </div>
        </div>
      )}
    </header>
  );
}

