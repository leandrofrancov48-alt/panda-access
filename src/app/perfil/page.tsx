"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Ticket,
  Award,
  User,
  LogOut,
  Calendar,
  MapPin,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  ChevronRight,
  Loader2,
  AlertCircle,
  Copy,
  Check,
} from "lucide-react";

interface TicketData {
  id: string;
  ticketCode: string;
  attendeeName: string;
  attendeeLastName: string;
  attendeeDni: string;
  price: number;
  status: string;
  tier: {
    name: string;
    price: number;
  };
}

interface OrderData {
  id: string;
  orderNumber: string;
  total: number;
  status: string;
  createdAt: string;
  event: {
    id: string;
    slug: string;
    title: string;
    venue: string;
    city: string;
    date: string;
    coverImage: string;
    status: string;
  };
  tickets: TicketData[];
}

interface LoyaltyLogData {
  id: string;
  points: number;
  reason: string;
  createdAt: string;
}

interface UserProfile {
  id: string;
  name: string;
  lastName: string;
  email: string;
  dni: string;
  phone: string;
  birthDate: string | null;
  points: number;
  tier: string;
  createdAt: string;
  orders: OrderData[];
  loyaltyLogs: LoyaltyLogData[];
}

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<"tickets" | "club" | "profile">("tickets");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) {
          router.push("/login?redirect=/perfil");
          return;
        }

        const data = await res.json();
        if (!data.authenticated || !data.user) {
          router.push("/login?redirect=/perfil");
          return;
        }

        setUser(data.user);
      } catch (err) {
        console.error(err);
        router.push("/login?redirect=/perfil");
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/");
      router.refresh();
    } catch (err) {
      console.error(err);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 text-[#FFE600] animate-spin" />
        <p className="text-xs text-gray-400">Cargando tu cuenta...</p>
      </div>
    );
  }

  if (!user) return null;

  // Flatten tickets
  const allTickets = (user.orders || []).flatMap((order) =>
    (order.tickets || []).map((t) => ({
      ...t,
      orderNumber: order.orderNumber,
      orderStatus: order.status,
      event: order.event,
    }))
  );

  // Loyalty calculation
  const getNextTier = (tier: string) => {
    if (tier === "BRONCE") return { name: "PLATA", target: 200 };
    if (tier === "PLATA") return { name: "ORO", target: 500 };
    if (tier === "ORO") return { name: "VIP", target: 1000 };
    return { name: "NIVEL MÁXIMO", target: 1000 };
  };

  const nextTier = getNextTier(user.tier);
  const progressPercent = Math.min(100, Math.round((user.points / nextTier.target) * 100));

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Profile Bar */}
      <div className="bg-[#0F121C] border border-[#1E253A] rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-56 h-56 bg-[#FFE600]/10 rounded-full blur-[80px] pointer-events-none" />

        <div className="flex items-center gap-4 relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#FFE600]/20 to-[#FFE600]/40 border border-[#FFE600]/50 flex items-center justify-center text-3xl shadow-lg shadow-[#FFE600]/15">
            🐼
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white">
                {user.name} {user.lastName}
              </h1>
              <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                ⭐ {user.tier}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">{user.email} • DNI {user.dni}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <div className="bg-[#161B2B] border border-[#232B45] px-4 py-2 rounded-2xl text-right">
            <span className="text-[10px] uppercase font-bold text-gray-400 block">Puntos Panda</span>
            <span className="text-lg font-black text-[#FFE600]">{user.points} pts</span>
          </div>

          <button
            onClick={handleLogout}
            className="px-4 py-2.5 rounded-2xl bg-[#161B2B] hover:bg-red-500/15 border border-[#232B45] hover:border-red-500/30 text-gray-400 hover:text-red-400 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
            title="Cerrar sesión"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Cerrar Sesión</span>
          </button>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex items-center gap-2 border-b border-[#1E253A] pb-3">
        <button
          onClick={() => setActiveTab("tickets")}
          className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === "tickets"
              ? "bg-[#FFE600] text-black shadow-lg shadow-[#FFE600]/20"
              : "text-gray-400 hover:text-white hover:bg-[#161B2B]"
          }`}
        >
          <Ticket className="w-4 h-4" />
          Mis Entradas ({allTickets.length})
        </button>

        <button
          onClick={() => setActiveTab("club")}
          className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === "club"
              ? "bg-[#FFE600] text-black shadow-lg shadow-[#FFE600]/20"
              : "text-gray-400 hover:text-white hover:bg-[#161B2B]"
          }`}
        >
          <Award className="w-4 h-4" />
          Club Panda ({user.points} pts)
        </button>

        <button
          onClick={() => setActiveTab("profile")}
          className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === "profile"
              ? "bg-[#FFE600] text-black shadow-lg shadow-[#FFE600]/20"
              : "text-gray-400 hover:text-white hover:bg-[#161B2B]"
          }`}
        >
          <User className="w-4 h-4" />
          Mis Datos
        </button>
      </div>

      {/* TAB 1: MIS ENTRADAS */}
      {activeTab === "tickets" && (
        <div className="space-y-6">
          {allTickets.length === 0 ? (
            <div className="bg-[#0F121C] border border-[#1E253A] rounded-3xl p-12 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-[#161B2B] text-gray-500 flex items-center justify-center mx-auto">
                <Ticket className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-white">No tenés entradas activas todavía</h3>
              <p className="text-xs text-gray-400 max-w-sm mx-auto">
                Explorá la cartelera de fiestas y eventos de cumbia para conseguir tus accesos.
              </p>
              <Link
                href="/"
                className="inline-block px-6 py-2.5 rounded-xl bg-[#FFE600] text-black text-xs font-black uppercase tracking-wider hover:bg-[#FFF04D] transition-colors"
              >
                Ver Cartelera
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {allTickets.map((t) => {
                const eventDate = new Date(t.event.date).toLocaleDateString("es-AR", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                });

                return (
                  <div
                    key={t.id}
                    className="bg-[#0F121C] border border-[#1E253A] hover:border-amber-400/40 rounded-2xl p-5 space-y-4 transition-all relative overflow-hidden flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <span className="text-[10px] uppercase font-bold text-gray-400 block">
                            Orden #{t.orderNumber}
                          </span>
                          <h4 className="font-black text-base text-white leading-tight">
                            {t.event.title}
                          </h4>
                        </div>
                        <span
                          className={`text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full border ${
                            t.status === "VALID"
                              ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                              : t.status === "USED"
                              ? "bg-blue-500/15 text-blue-400 border-blue-500/30"
                              : "bg-red-500/15 text-red-400 border-red-500/30"
                          }`}
                        >
                          {t.status === "VALID" ? "Válida" : t.status === "USED" ? "Ingresada" : "Cancelada"}
                        </span>
                      </div>

                      <div className="space-y-1 text-xs text-gray-300">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-[#FFE600]" />
                          <span className="capitalize">{eventDate}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-red-400" />
                          <span>{t.event.venue}, {t.event.city}</span>
                        </div>
                      </div>

                      <div className="bg-[#141828] p-3 rounded-xl border border-[#232B45] text-xs space-y-1">
                        <div className="flex justify-between text-gray-300">
                          <span>Sector:</span>
                          <strong className="text-white font-bold">{t.tier.name}</strong>
                        </div>
                        <div className="flex justify-between text-gray-300">
                          <span>Titular:</span>
                          <span className="text-white">{t.attendeeName} {t.attendeeLastName} (DNI {t.attendeeDni})</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[#1C2237] flex items-center justify-between gap-2">
                      <button
                        onClick={() => copyToClipboard(t.ticketCode)}
                        className="text-[11px] text-gray-400 hover:text-white flex items-center gap-1 cursor-pointer font-mono"
                      >
                        {copiedCode === t.ticketCode ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Copiado</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>{t.ticketCode}</span>
                          </>
                        )}
                      </button>

                      <Link
                        href={`/tickets/${t.ticketCode}`}
                        className="px-4 py-2 rounded-xl bg-[#FFE600] hover:bg-[#FFF04D] text-black text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-colors"
                      >
                        Ver QR de Entrada
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CLUB PANDA */}
      {activeTab === "club" && (
        <div className="space-y-8">
          {/* Card Hero */}
          <div className="bg-gradient-to-br from-[#161B2B] via-[#0F121C] to-[#141828] border border-amber-500/30 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs uppercase font-extrabold text-amber-400 tracking-widest block mb-1">
                  Programa Oficial de Fidelidad
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-white uppercase">
                  Club Panda
                </h2>
              </div>
              <div className="px-4 py-2 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-sm font-black uppercase tracking-wider w-fit">
                ⭐ Categoría {user.tier}
              </div>
            </div>

            {/* Points balance and progress bar */}
            <div className="space-y-3 bg-[#0A0D16] p-5 rounded-2xl border border-[#1E253A]">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-xs text-gray-400 block font-medium">Saldo Actual</span>
                  <span className="text-3xl font-black text-[#FFE600]">{user.points} Panda Points</span>
                </div>
                {user.tier !== "VIP" && (
                  <div className="text-right">
                    <span className="text-xs text-gray-400 block font-medium">Próximo Nivel: {nextTier.name}</span>
                    <span className="text-xs font-bold text-white">{nextTier.target - user.points} pts restantes</span>
                  </div>
                )}
              </div>

              {user.tier !== "VIP" && (
                <div className="space-y-1">
                  <div className="w-full h-3 rounded-full bg-[#161B2B] overflow-hidden p-0.5 border border-[#232B45]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-500 to-[#FFE600] transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-500 font-mono">
                    <span>{user.tier}</span>
                    <span>{progressPercent}%</span>
                    <span>{nextTier.name} ({nextTier.target} pts)</span>
                  </div>
                </div>
              )}
            </div>

            {/* How to earn */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="bg-[#121624] p-4 rounded-xl border border-[#232B45] space-y-1">
                <span className="text-xs font-bold text-white block">🎟️ Compras de Entradas</span>
                <p className="text-[11px] text-gray-400">Sumás +10 pts por cada $1.000 consumidos en tus órdenes.</p>
              </div>
              <div className="bg-[#121624] p-4 rounded-xl border border-[#232B45] space-y-1">
                <span className="text-xs font-bold text-white block">🎁 Eventos Gratuitos</span>
                <p className="text-[11px] text-gray-400">Sumás +25 pts cada vez que te anotás a un evento libre.</p>
              </div>
              <div className="bg-[#121624] p-4 rounded-xl border border-[#232B45] space-y-1">
                <span className="text-xs font-bold text-white block">🎂 Beneficios Exclusivos</span>
                <p className="text-[11px] text-gray-400">Preventas anticipadas, sorteos y regalos de cumpleaños.</p>
              </div>
            </div>
          </div>

          {/* Activity Log */}
          <div className="bg-[#0F121C] border border-[#1E253A] rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-black text-white uppercase flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#FFE600]" />
              Historial de Puntos Acumulados
            </h3>

            {(!user.loyaltyLogs || user.loyaltyLogs.length === 0) ? (
              <p className="text-xs text-gray-400 py-4 text-center">
                Aún no tenés movimientos de puntos registrados.
              </p>
            ) : (
              <div className="space-y-2">
                {user.loyaltyLogs.map((log) => {
                  const logDate = new Date(log.createdAt).toLocaleDateString("es-AR", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <div
                      key={log.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-[#141828] border border-[#21273C] text-xs"
                    >
                      <div className="space-y-0.5">
                        <span className="font-bold text-white block">{log.reason}</span>
                        <span className="text-[10px] text-gray-500 font-mono">{logDate}</span>
                      </div>
                      <span className="text-xs font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-1 rounded-lg shrink-0">
                        +{log.points} pts
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: MIS DATOS */}
      {activeTab === "profile" && (
        <div className="bg-[#0F121C] border border-[#1E253A] rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="border-b border-[#1E253A] pb-4">
            <h3 className="text-lg font-black text-white uppercase">
              Datos Personales
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Esta información se utiliza para autocompletar tus compras y validar tu identidad en la puerta.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-[#141828] p-4 rounded-xl border border-[#21273C]">
              <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Nombre Completo</span>
              <span className="text-sm font-bold text-white">{user.name} {user.lastName}</span>
            </div>

            <div className="bg-[#141828] p-4 rounded-xl border border-[#21273C]">
              <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">DNI / Documento</span>
              <span className="text-sm font-bold text-white font-mono">{user.dni}</span>
            </div>

            <div className="bg-[#141828] p-4 rounded-xl border border-[#21273C]">
              <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Fecha de Nacimiento</span>
              <span className="text-sm font-bold text-white">
                {user.birthDate ? new Date(user.birthDate).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" }) : "No especificada"}
              </span>
            </div>

            <div className="bg-[#141828] p-4 rounded-xl border border-[#21273C]">
              <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Teléfono / WhatsApp</span>
              <span className="text-sm font-bold text-white">{user.phone || "No especificado"}</span>
            </div>

            <div className="bg-[#141828] p-4 rounded-xl border border-[#21273C] sm:col-span-2">
              <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Correo Electrónico</span>
              <span className="text-sm font-bold text-white">{user.email}</span>
            </div>
          </div>

          <div className="pt-4 border-t border-[#1C2237] flex justify-between items-center text-xs text-gray-500">
            <span>Miembro desde {new Date(user.createdAt).toLocaleDateString("es-AR")}</span>
            <button
              onClick={handleLogout}
              className="text-red-400 hover:text-red-300 font-bold underline cursor-pointer"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
