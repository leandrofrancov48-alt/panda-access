"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  User,
  Mail,
  Lock,
  Phone,
  CreditCard,
  Calendar,
  ArrowRight,
  Loader2,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-[#FFE600] animate-spin" />
        </div>
      }
    >
      <RegisterContent />
    </Suspense>
  );
}

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/perfil";

  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [dni, setDni] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (password.length < 6) {
      setErrorMessage("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          lastName,
          email,
          dni,
          birthDate: birthDate || null,
          phone,
          password,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Error al crear la cuenta.");
      }

      // Automatically logged in by API cookie
      router.push(redirectUrl);
      router.refresh();
    } catch (err: unknown) {
      setErrorMessage((err as Error).message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 sm:px-6 py-12">
      <div className="w-full max-w-lg space-y-6">
        {/* Back Link */}
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a la cartelera
          </Link>
        </div>

        {/* Card */}
        <div className="bg-[#0F121C] border border-[#1E253A] rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#FFE600]/10 rounded-full blur-[70px] pointer-events-none" />

          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-[#FFE600]/15 border border-[#FFE600]/30 flex items-center justify-center text-2xl mx-auto shadow-lg shadow-[#FFE600]/10">
              🐼
            </div>
            <h1 className="text-2xl font-black text-white uppercase tracking-tight">
              Creá tu Cuenta Panda Access
            </h1>
            <p className="text-xs text-[#94A3B8]">
              Registrate una sola vez para comprar entradas más rápido y tener tus accesos siempre a mano.
            </p>
          </div>

          {errorMessage && (
            <div className="bg-red-500/15 border border-red-500/30 text-red-300 text-xs p-3.5 rounded-xl font-medium text-center">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1">
                  Nombre *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Juan"
                    className="w-full pl-9 pr-3 py-2.5 bg-[#161B2B] border border-[#232B45] rounded-xl text-white text-xs focus:border-[#FFE600] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1">
                  Apellido *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Pérez"
                    className="w-full pl-9 pr-3 py-2.5 bg-[#161B2B] border border-[#232B45] rounded-xl text-white text-xs focus:border-[#FFE600] outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1">
                  DNI (Documento) *
                </label>
                <div className="relative">
                  <CreditCard className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={dni}
                    onChange={(e) => setDni(e.target.value.replace(/\D/g, ""))}
                    placeholder="38123456"
                    maxLength={9}
                    className="w-full pl-9 pr-3 py-2.5 bg-[#161B2B] border border-[#232B45] rounded-xl text-white text-xs focus:border-[#FFE600] outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1">
                  Fecha de Nacimiento *
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="date"
                    required
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-[#161B2B] border border-[#232B45] rounded-xl text-white text-xs focus:border-[#FFE600] outline-none font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1">
                  Teléfono / WhatsApp *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="11 2345 6789"
                    className="w-full pl-9 pr-3 py-2.5 bg-[#161B2B] border border-[#232B45] rounded-xl text-white text-xs focus:border-[#FFE600] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1">
                  Correo Electrónico *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                    className="w-full pl-9 pr-3 py-2.5 bg-[#161B2B] border border-[#232B45] rounded-xl text-white text-xs focus:border-[#FFE600] outline-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-300 block mb-1">
                Contraseña (mínimo 6 caracteres) *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 bg-[#161B2B] border border-[#232B45] rounded-xl text-white text-xs focus:border-[#FFE600] outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[#FFE600] hover:bg-[#FFF04D] text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#FFE600]/20 disabled:opacity-50 transition-all mt-3"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creando cuenta...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Crear Mi Cuenta
                </>
              )}
            </button>
          </form>

          {/* Login Prompt */}
          <div className="pt-4 border-t border-[#1C2237] text-center">
            <p className="text-xs text-gray-400">
              ¿Ya tenés cuenta?{" "}
              <Link
                href={`/login${redirectUrl ? `?redirect=${encodeURIComponent(redirectUrl)}` : ""}`}
                className="text-[#FFE600] font-bold hover:underline"
              >
                Iniciá sesión acá
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
