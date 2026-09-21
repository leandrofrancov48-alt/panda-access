"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, QrCode, ShieldCheck, Loader2 } from "lucide-react";

export default function ScannerHeader() {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/scanner/logout", { method: "POST" });
      router.push("/scanner/login");
      router.refresh();
    } catch {
      router.push("/scanner/login");
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <header className="bg-[#100E0B]/90 backdrop-blur-md border-b border-[#2C261E] sticky top-0 z-40">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand & Mode */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-400 text-black flex items-center justify-center font-black shadow-[0_0_15px_rgba(245,158,11,0.4)]">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-sm tracking-wider uppercase text-white">
                PANDA<span className="text-amber-400">ACCESS</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Puerta Activa
              </span>
            </div>
            <p className="text-[10px] text-[#8F8270] font-medium hidden sm:block">
              Validador de entradas QR oficial en tiempo real
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-[#8F8270] font-semibold bg-[#181511] border border-[#2E2820] px-3 py-1.5 rounded-xl">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Turno Seguro</span>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1A1612] hover:bg-[#25201A] border border-[#332B21] text-xs font-bold text-[#CEC1AD] hover:text-red-400 transition-colors cursor-pointer"
            title="Cerrar turno de escaneo"
          >
            {loggingOut ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <LogOut className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">Cerrar Turno</span>
            <span className="sm:hidden">Salir</span>
          </button>
        </div>
      </div>
    </header>
  );
}
