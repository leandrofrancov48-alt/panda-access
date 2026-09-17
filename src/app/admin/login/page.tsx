"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, Eye, EyeOff, ShieldCheck, ArrowRight, Loader2, Sparkles } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Contraseña inválida.");
      }

      // Successful login
      window.location.href = "/admin";
    } catch (err: any) {
      setErrorMessage(err.message || "Error al iniciar sesión.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 relative">
      {/* Background glow orbs */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-gradient-to-b from-[#181511] via-[#14120E] to-[#0E0C09] border-2 border-amber-500/30 rounded-3xl p-8 sm:p-10 shadow-[0_0_50px_rgba(245,158,11,0.15)] relative space-y-6">
        {/* Header with Logo */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-[#100E0B] border border-amber-400/50 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(245,158,11,0.25)]">
            <img src="/logo.png" alt="Logo Panda" className="w-11 h-11 object-contain" />
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-[10px] font-black uppercase tracking-wider mb-2">
              <Lock className="w-3 h-3 text-amber-400" />
              Acceso Exclusivo Staff
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#FAF6EE] uppercase tracking-tight">
              Panda Access
            </h1>
            <p className="text-xs text-[#8F8270] mt-1 font-medium">
              Ingresá tu contraseña de organizador para acceder al panel de control y lector de entradas.
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="bg-red-500/10 border border-red-500/40 rounded-xl p-3.5 text-xs font-bold text-red-300 text-center">
            {errorMessage}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="text-xs font-bold text-[#CEC1AD] block mb-2 uppercase tracking-wider">
              Contraseña de Administrador
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingresá la contraseña"
                className="w-full px-4 py-3.5 pr-12 bg-[#100E0B] border border-[#2E2820] rounded-xl text-[#FAF6EE] text-sm focus:border-amber-400 focus:shadow-[0_0_15px_rgba(245,158,11,0.2)] outline-none transition-all placeholder:text-[#5C5346]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8F8270] hover:text-amber-300 transition-colors p-1"
                aria-label="Toggle password"
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
                Ingresando...
              </>
            ) : (
              <>
                Ingresar al Panel
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="pt-2 text-center">
          <Link
            href="/"
            className="text-xs text-[#8F8270] hover:text-amber-300 font-bold transition-colors inline-flex items-center gap-1"
          >
            ← Volver a la cartelera pública
          </Link>
        </div>
      </div>
    </div>
  );
}
