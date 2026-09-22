"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, KeyRound, ArrowRight, Loader2, QrCode, Eye, EyeOff } from "lucide-react";

export default function ScannerLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const cleanPassword = password.trim();

    if (!cleanPassword) {
      setError("Por favor ingresá la clave de acceso.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/scanner/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: cleanPassword }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Clave de acceso incorrecta.");
      }

      router.push("/scanner");
      router.refresh();
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0C0B09] flex flex-col justify-center items-center px-4 sm:px-6 relative overflow-hidden">
      {/* Background Neon Orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-md bg-gradient-to-b from-[#181511] via-[#14120E] to-[#0E0C09] border-2 border-amber-500/30 rounded-3xl p-8 sm:p-10 shadow-[0_0_50px_rgba(245,158,11,0.15)] relative space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 bg-gradient-to-tr from-amber-400 to-amber-500 rounded-2xl flex items-center justify-center mx-auto shadow-[0_0_25px_rgba(245,158,11,0.4)] text-black">
            <QrCode className="w-9 h-9" />
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-extrabold uppercase tracking-wider mb-2">
              <Shield className="w-3.5 h-3.5" />
              Acceso Staff de Puerta
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
              Control de Acceso
            </h1>
            <p className="text-xs text-[#CEC1AD] mt-1 font-medium">
              Ingresá la clave de acceso de puerta para habilitar el scanner de entradas.
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-xs p-3.5 rounded-xl font-medium text-center animate-fade-in">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-black text-amber-300 uppercase tracking-wider block">
              Clave de Puerta
            </label>
            <div className="relative">
              <KeyRound className="w-5 h-5 text-[#8F8270] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? "text" : "password"}
                required
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="puerta2026"
                className="w-full pl-11 pr-11 py-3.5 bg-[#12100D] border border-[#2E2820] rounded-xl text-white text-sm outline-none focus:border-amber-400 focus:shadow-[0_0_15px_rgba(245,158,11,0.2)] transition-all placeholder:text-[#5A5040]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8F8270] hover:text-amber-400 transition-colors cursor-pointer"
                title={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

          </div>

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-black text-sm uppercase tracking-wider transition-all duration-300 border border-amber-200 shadow-[0_0_20px_rgba(245,158,11,0.4)] hover:shadow-[0_0_30px_rgba(245,158,11,0.7)] hover:scale-102 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verificando...</span>
              </>
            ) : (
              <>
                <span>Habilitar Scanner</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="pt-2 border-t border-[#2C261E] text-center">
          <p className="text-[11px] text-[#8F8270]">
            🔒 Modo operador de acceso rápido. No expone datos de facturación ni panel de administración.
          </p>
        </div>
      </div>
    </div>
  );
}
