"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, ArrowRight, Loader2, Sparkles, ArrowLeft } from "lucide-react";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-[#FFE600] animate-spin" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/perfil";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Credenciales incorrectas.");
      }

      // Successful login
      router.push(redirectUrl);
      router.refresh();
    } catch (err: unknown) {
      setErrorMessage((err as Error).message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 sm:px-6 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Back Link */}
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al inicio
          </Link>
        </div>

        {/* Card */}
        <div className="bg-[#0F121C] border border-[#1E253A] rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-[#FFE600]/10 rounded-full blur-[60px] pointer-events-none" />

          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-[#FFE600]/15 border border-[#FFE600]/30 flex items-center justify-center text-2xl mx-auto shadow-lg shadow-[#FFE600]/10">
              🐼
            </div>
            <h1 className="text-2xl font-black text-white uppercase tracking-tight">
              Ingresá a tu Cuenta
            </h1>
            <p className="text-xs text-[#94A3B8]">
              Accedé a tus entradas compradas y tus Panda Points.
            </p>
          </div>

          {errorMessage && (
            <div className="bg-red-500/15 border border-red-500/30 text-red-300 text-xs p-3.5 rounded-xl font-medium text-center">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-300 block mb-1.5">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#161B2B] border border-[#232B45] rounded-xl text-white text-sm focus:border-[#FFE600] outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-300 block mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#161B2B] border border-[#232B45] rounded-xl text-white text-sm focus:border-[#FFE600] outline-none transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[#FFE600] hover:bg-[#FFF04D] text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#FFE600]/20 disabled:opacity-50 transition-all mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Iniciando Sesión...
                </>
              ) : (
                <>
                  Ingresar
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Register Prompt */}
          <div className="pt-4 border-t border-[#1C2237] text-center space-y-3">
            <div className="flex items-center justify-center gap-1.5 text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 py-2 px-3 rounded-xl">
              <Sparkles className="w-3.5 h-3.5" />
              <span>¡Registrate y ganá <strong>50 Panda Points</strong> de bienvenida!</span>
            </div>
            <p className="text-xs text-gray-400">
              ¿Todavía no tenés cuenta?{" "}
              <Link
                href={`/registro${redirectUrl ? `?redirect=${encodeURIComponent(redirectUrl)}` : ""}`}
                className="text-[#FFE600] font-bold hover:underline"
              >
                Crear cuenta gratis
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
