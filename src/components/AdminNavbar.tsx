"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, QrCode, PlusCircle, LogOut, ArrowLeft, ShieldCheck } from "lucide-react";

export default function AdminNavbar() {
  const pathname = usePathname();
  const router = useRouter();

  // Do not render admin navbar on login page
  if (pathname === "/admin/login") {
    return null;
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
      window.location.href = "/admin/login";
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#100E0B]/95 backdrop-blur-md border-b border-[#2C261E] mb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand / Staff Badge */}
        <div className="flex items-center gap-4">
          <Link href="/admin" className="flex items-center gap-2.5 group">
            <img src="/logo.png" alt="Logo Panda" className="w-8 h-8 object-contain" />
            <span className="font-black text-sm text-[#FAF6EE] uppercase tracking-wider hidden sm:inline">
              Panda<span className="text-amber-400">Admin</span>
            </span>
          </Link>

          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-black uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Staff Activo
          </span>
        </div>

        {/* Quick Nav Links */}
        <nav className="flex items-center gap-2 sm:gap-4 text-xs font-black">
          <Link
            href="/admin"
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
              pathname === "/admin"
                ? "bg-amber-400/15 text-amber-300 border border-amber-400/40"
                : "text-[#CEC1AD] hover:text-white"
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">Dashboard</span>
          </Link>

          <Link
            href="/scanner"
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
              pathname === "/scanner" || pathname === "/admin/scanner"
                ? "bg-amber-400/15 text-amber-300 border border-amber-400/40"
                : "text-[#CEC1AD] hover:text-white"
            }`}
          >
            <QrCode className="w-3.5 h-3.5 text-amber-400" />
            <span>Scanner</span>
          </Link>

          <Link
            href="/admin/eventos/nuevo"
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
              pathname === "/admin/eventos/nuevo"
                ? "bg-amber-400/15 text-amber-300 border border-amber-400/40"
                : "text-[#CEC1AD] hover:text-white"
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Nuevo Show</span>
          </Link>

          <div className="h-4 w-[1px] bg-[#2C261E] mx-1 hidden sm:block" />

          <Link
            href="/"
            className="px-2.5 py-1.5 text-[#8F8270] hover:text-[#FAF6EE] transition-colors hidden lg:inline-flex items-center gap-1 text-[11px]"
            title="Ver sitio público de compradores"
          >
            Ver Web Pública ↗
          </Link>

          <button
            onClick={handleLogout}
            className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
            title="Cerrar sesión de administrador"
          >
            <LogOut className="w-3.5 h-3.5 text-red-400" />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </nav>
      </div>
    </header>
  );
}
