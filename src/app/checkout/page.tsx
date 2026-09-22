"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Ticket,
  ArrowLeft,
  ShieldCheck,
  CreditCard,
  Building2,
  CheckCircle2,
  AlertCircle,
  Users,
  Loader2,
  Sparkles,
} from "lucide-react";

interface CheckoutStorageData {
  eventId: string;
  eventTitle: string;
  selectedTiers: Array<{ tierId: string; quantity: number }>;
}

interface TierDetail {
  id: string;
  name: string;
  price: number;
  serviceFee: number;
}

interface EventData {
  id: string;
  slug: string;
  title: string;
  date: string;
  venue: string;
  city: string;
  tiers: TierDetail[];
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-4xl mx-auto py-24 text-center space-y-4">
          <Loader2 className="w-8 h-8 text-[#FFE600] animate-spin mx-auto" />
          <p className="text-sm text-gray-400">Cargando checkout...</p>
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventIdParam = searchParams.get("eventId");

  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<EventData | null>(null);
  const [selectedItems, setSelectedItems] = useState<Array<{ tier: TierDetail; quantity: number }>>([]);

  // Buyer Info
  const [buyerName, setBuyerName] = useState("");
  const [buyerLastName, setBuyerLastName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [buyerDni, setBuyerDni] = useState("");
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    name: string;
    lastName: string;
    email: string;
    phone: string;
    dni: string;
    points: number;
    tier: string;
  } | null>(null);

  // Attendees Info
  const [attendees, setAttendees] = useState<
    Array<{ tierId: string; tierName: string; name: string; lastName: string; dni: string }>
  >([]);

  // Payment
  const [paymentMethod, setPaymentMethod] = useState("SIMULATED");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load checkout data
  useEffect(() => {
    async function loadData() {
      try {
        let storedData: CheckoutStorageData | null = null;
        if (typeof window !== "undefined") {
          const raw = sessionStorage.getItem("checkout_data");
          if (raw) storedData = JSON.parse(raw);
        }

        const targetEventId = eventIdParam || storedData?.eventId;
        if (!targetEventId) {
          router.push("/");
          return;
        }

        // Fetch event info and tiers
        const res = await fetch(`/api/events/${targetEventId}`);
        if (!res.ok) {
          // fallback search by id or query
          router.push("/");
          return;
        }

        const eventData: EventData = await res.json();
        setEvent(eventData);

        // Map selected tiers
        const items: Array<{ tier: TierDetail; quantity: number }> = [];
        const initialAttendees: Array<{
          tierId: string;
          tierName: string;
          name: string;
          lastName: string;
          dni: string;
        }> = [];

        if (storedData && storedData.selectedTiers) {
          storedData.selectedTiers.forEach((st) => {
            const tier = eventData.tiers.find((t) => t.id === st.tierId);
            if (tier && st.quantity > 0) {
              items.push({ tier, quantity: st.quantity });
              for (let i = 0; i < st.quantity; i++) {
                initialAttendees.push({
                  tierId: tier.id,
                  tierName: tier.name,
                  name: "",
                  lastName: "",
                  dni: "",
                });
              }
            }
          });
        } else if (eventData.tiers.length > 0) {
          // Default 1 ticket of first tier if directly accessed
          const firstTier = eventData.tiers[0];
          items.push({ tier: firstTier, quantity: 1 });
          initialAttendees.push({
            tierId: firstTier.id,
            tierName: firstTier.name,
            name: "",
            lastName: "",
            dni: "",
          });
        }

        setSelectedItems(items);
        setAttendees(initialAttendees);

        // Fetch authenticated user if available to autocompile
        try {
          const authRes = await fetch("/api/auth/me");
          if (authRes.ok) {
            const authData = await authRes.json();
            if (authData.user) {
              setCurrentUser(authData.user);
              setBuyerName((prev) => prev || authData.user.name || "");
              setBuyerLastName((prev) => prev || authData.user.lastName || "");
              setBuyerEmail((prev) => prev || authData.user.email || "");
              setBuyerPhone((prev) => prev || authData.user.phone || "");
              setBuyerDni((prev) => prev || authData.user.dni || "");
            }
          }
        } catch {
          // guest mode fallback
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [eventIdParam, router]);

  // Sync first attendee with buyer data when checkbox checked or buyer inputs change
  const [sameAsBuyer, setSameAsBuyer] = useState(true);

  useEffect(() => {
    if (sameAsBuyer && attendees.length > 0) {
      setAttendees((prev) => {
        const copy = [...prev];
        copy[0] = {
          ...copy[0],
          name: buyerName,
          lastName: buyerLastName,
          dni: buyerDni,
        };
        return copy;
      });
    }
  }, [buyerName, buyerLastName, buyerDni, sameAsBuyer]);

  const handleAttendeeChange = (index: number, field: string, value: string) => {
    setAttendees((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  // Calculations
  const subtotal = selectedItems.reduce(
    (acc, item) => acc + item.tier.price * item.quantity,
    0
  );
  const serviceFee = selectedItems.reduce(
    (acc, item) => acc + item.tier.serviceFee * item.quantity,
    0
  );
  const total = subtotal + serviceFee;

  // Submit Order
  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validate inputs
    if (!buyerName || !buyerLastName || !buyerEmail || !buyerDni) {
      setErrorMessage("Por favor completá todos los datos del comprador.");
      return;
    }

    for (let i = 0; i < attendees.length; i++) {
      const att = attendees[i];
      if (!att.name || !att.lastName || !att.dni) {
        setErrorMessage(
          `Por favor completá los datos (Nombre, Apellido y DNI) de la entrada #${i + 1} (${att.tierName}).`
        );
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const payload = {
        eventId: event!.id,
        buyerName,
        buyerLastName,
        buyerEmail,
        buyerPhone,
        buyerDni,
        paymentMethod: total === 0 ? "FREE" : paymentMethod,
        attendees: attendees.map((a) => ({
          tierId: a.tierId,
          name: a.name,
          lastName: a.lastName,
          dni: a.dni,
        })),
      };

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Error al generar la orden de compra.");
      }

      // If Mercado Pago returns an initPoint, redirect to official Mercado Pago Checkout
      if (data.initPoint) {
        window.location.href = data.initPoint;
        return;
      }

      // Clear session storage
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("checkout_data");
      }

      // Redirect to confirmation page
      router.push(`/confirmacion/${data.order.orderNumber}`);
    } catch (err: unknown) {
      console.error("Order error:", err);
      setErrorMessage((err as Error).message || "Ocurrió un error al procesar el pago.");
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-24 text-center space-y-4">
        <Loader2 className="w-8 h-8 text-[#FFE600] animate-spin mx-auto" />
        <p className="text-sm text-gray-400">Cargando datos de compra...</p>
      </div>
    );
  }

  if (!event || selectedItems.length === 0) {
    return (
      <div className="max-w-md mx-auto py-24 text-center space-y-4">
        <Ticket className="w-12 h-12 text-[#FFE600] mx-auto" />
        <h2 className="text-xl font-bold text-white">No seleccionaste ninguna entrada</h2>
        <Link
          href="/"
          className="inline-block px-6 py-3 rounded-xl bg-[#FFE600] text-black font-extrabold text-sm"
        >
          Volver a la cartelera
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Breadcrumb */}
      <div>
        <Link
          href={`/eventos/${event.slug}`}
          className="inline-flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al evento
        </Link>
      </div>

      <div className="flex items-center justify-between pb-4 border-b border-[#1E243A]">
        <div>
          <span className="text-xs font-extrabold text-[#FFE600] tracking-widest uppercase">
            Paso 2 de 2 • Finalizar Compra
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white uppercase">
            Datos de los Asistentes y Pago
          </h1>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full">
          <ShieldCheck className="w-4 h-4" />
          Checkout Seguro
        </div>
      </div>

      {errorMessage && (
        <div className="bg-gradient-to-r from-red-500/15 via-[#181212] to-red-500/10 border border-red-500/40 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-red-200 text-sm shadow-xl">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-[#FF2E4C] shrink-0" />
            <span className="font-semibold leading-relaxed">{errorMessage}</span>
          </div>
          {(errorMessage.includes("agotarse") || errorMessage.includes("cupo")) && (
            <Link
              href={`/eventos/${event.slug}`}
              className="shrink-0 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs transition-colors uppercase"
            >
              Cambiar Sector
            </Link>
          )}
        </div>
      )}

      {/* User Session / Fidelity Banner */}
      {currentUser ? (
        <div className="bg-gradient-to-r from-amber-500/10 via-[#181510] to-[#0F121C] border border-amber-500/30 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-black text-lg shrink-0">
              🐼
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold text-white">¡Hola, {currentUser.name}!</span>
                <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  Nivel {currentUser.tier} • {currentUser.points} pts
                </span>
              </div>
              <p className="text-xs text-[#A89C8B] mt-0.5">
                Tus datos fueron cargados automáticamente. Con esta compra acumularás{" "}
                <strong className="text-amber-400 font-bold">
                  +{total === 0 ? 25 : Math.max(10, Math.floor(total / 1000) * 10)} Panda Points
                </strong>.
              </p>
            </div>
          </div>
          <Link
            href="/perfil"
            className="text-xs font-bold text-amber-400 hover:text-amber-300 underline shrink-0"
          >
            Ver Mi Cuenta
          </Link>
        </div>
      ) : (
        <div className="bg-[#101420] border border-[#232B45] rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-gray-300">
            <Sparkles className="w-4 h-4 text-[#FFE600] shrink-0" />
            <span>
              ¿Ya tenés cuenta en Panda Access? <strong className="text-white">Iniciá sesión</strong> para autocompletar tus datos y sumar Panda Points.
            </span>
          </div>
          <Link
            href={`/login?redirect=/checkout?eventId=${event.id}`}
            className="shrink-0 px-3.5 py-1.5 rounded-lg bg-[#FFE600]/15 hover:bg-[#FFE600]/25 text-[#FFE600] font-bold border border-[#FFE600]/30 transition-colors"
          >
            Iniciar Sesión
          </Link>
        </div>
      )}

      <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Forms (7 cols) */}
        <div className="lg:col-span-7 space-y-8">
          {/* Section 1: Buyer Information */}
          <div className="bg-[#0F121C] border border-[#1E253A] rounded-2xl p-6 sm:p-8 space-y-5">
            <h3 className="text-lg font-black text-white uppercase flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#FFE600] text-black text-xs font-black flex items-center justify-center">
                1
              </span>
              Datos del Comprador (Titular de Pago)
            </h3>
            <p className="text-xs text-[#94A3B8]">
              A este correo electrónico te enviaremos la confirmación oficial y los códigos QR de las entradas.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1.5">
                  Nombre *
                </label>
                <input
                  type="text"
                  required
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  placeholder="Ej: Martín"
                  className="w-full px-4 py-2.5 bg-[#161B2B] border border-[#242D45] rounded-xl text-white text-sm focus:border-[#FFE600] outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1.5">
                  Apellido *
                </label>
                <input
                  type="text"
                  required
                  value={buyerLastName}
                  onChange={(e) => setBuyerLastName(e.target.value)}
                  placeholder="Ej: González"
                  className="w-full px-4 py-2.5 bg-[#161B2B] border border-[#242D45] rounded-xl text-white text-sm focus:border-[#FFE600] outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-gray-300 block mb-1.5">
                  Correo Electrónico (para recibir las entradas) *
                </label>
                <input
                  type="email"
                  required
                  value={buyerEmail}
                  onChange={(e) => setBuyerEmail(e.target.value)}
                  placeholder="tuemail@ejemplo.com"
                  className="w-full px-4 py-2.5 bg-[#161B2B] border border-[#242D45] rounded-xl text-white text-sm focus:border-[#FFE600] outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1.5">
                  DNI / Pasaporte *
                </label>
                <input
                  type="text"
                  required
                  value={buyerDni}
                  onChange={(e) => setBuyerDni(e.target.value)}
                  placeholder="Ej: 38920112"
                  className="w-full px-4 py-2.5 bg-[#161B2B] border border-[#242D45] rounded-xl text-white text-sm focus:border-[#FFE600] outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1.5">
                  Teléfono / WhatsApp *
                </label>
                <input
                  type="tel"
                  required
                  value={buyerPhone}
                  onChange={(e) => setBuyerPhone(e.target.value)}
                  placeholder="Ej: 11 5544 3322"
                  className="w-full px-4 py-2.5 bg-[#161B2B] border border-[#242D45] rounded-xl text-white text-sm focus:border-[#FFE600] outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Nominal Attendees Assignment */}
          <div className="bg-[#0F121C] border border-[#1E253A] rounded-2xl p-6 sm:p-8 space-y-5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-lg font-black text-white uppercase flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#FFE600] text-black text-xs font-black flex items-center justify-center">
                  2
                </span>
                Nominación de Entradas ({attendees.length})
              </h3>
            </div>
            <p className="text-xs text-[#94A3B8]">
              Por motivos de seguridad, cada entrada debe tener el nombre y DNI de la persona que ingresará.
            </p>

            {attendees.length > 0 && (
              <label className="flex items-center gap-2.5 text-xs text-gray-300 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={sameAsBuyer}
                  onChange={(e) => setSameAsBuyer(e.target.checked)}
                  className="w-4 h-4 accent-[#FFE600] rounded"
                />
                <span>Usar mis datos para la primera entrada (Entrada #1)</span>
              </label>
            )}

            <div className="space-y-4 pt-2">
              {attendees.map((att, idx) => (
                <div
                  key={idx}
                  className="bg-[#141828] border border-[#21273C] rounded-2xl p-4 sm:p-5 space-y-3"
                >
                  <div className="flex items-center justify-between text-xs pb-2 border-b border-[#21273C]">
                    <span className="font-extrabold text-white flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-[#FFE600]" />
                      Entrada #{idx + 1}
                      {idx === 0 && sameAsBuyer && (
                        <span className="text-[10px] text-[#FFE600] bg-[#FFE600]/10 border border-[#FFE600]/20 px-2 py-0.5 rounded font-semibold ml-1">
                          Titular
                        </span>
                      )}
                    </span>
                    <span className="font-bold text-[#38BDF8]">
                      {att.tierName}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 block mb-1">
                        Nombre *
                      </label>
                      <input
                        type="text"
                        required
                        disabled={idx === 0 && sameAsBuyer}
                        value={att.name}
                        onChange={(e) => handleAttendeeChange(idx, "name", e.target.value)}
                        placeholder="Nombre"
                        className="w-full px-3 py-2.5 bg-[#0F121C] border border-[#252D45] rounded-xl text-white text-xs disabled:opacity-60 focus:border-[#FFE600] outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 block mb-1">
                        Apellido *
                      </label>
                      <input
                        type="text"
                        required
                        disabled={idx === 0 && sameAsBuyer}
                        value={att.lastName}
                        onChange={(e) => handleAttendeeChange(idx, "lastName", e.target.value)}
                        placeholder="Apellido"
                        className="w-full px-3 py-2.5 bg-[#0F121C] border border-[#252D45] rounded-xl text-white text-xs disabled:opacity-60 focus:border-[#FFE600] outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 block mb-1">
                        DNI / Pasaporte *
                      </label>
                      <input
                        type="text"
                        required
                        disabled={idx === 0 && sameAsBuyer}
                        value={att.dni}
                        onChange={(e) => handleAttendeeChange(idx, "dni", e.target.value)}
                        placeholder="DNI"
                        className="w-full px-3 py-2.5 bg-[#0F121C] border border-[#252D45] rounded-xl text-white text-xs disabled:opacity-60 focus:border-[#FFE600] outline-none font-mono"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Payment Method */}
          <div className="bg-[#0F121C] border border-[#1E253A] rounded-2xl p-6 sm:p-8 space-y-4">
            <h3 className="text-lg font-black text-white uppercase flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#FFE600] text-black text-xs font-black flex items-center justify-center">
                3
              </span>
              {total === 0 ? "Acceso al Evento" : "Método de Pago"}
            </h3>

            {total === 0 ? (
              <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-2xl p-5 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-extrabold text-sm">
                  <Sparkles className="w-4 h-4" />
                  <span>¡Evento Gratuito • No se requiere pago!</span>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed">
                  Este evento es de acceso libre y gratuito. Solo registramos los datos para emitir los códigos QR individuales nominados y enviártelos a tu email para el control de capacidad e ingreso en puerta.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Option 1: Simulated Instant Checkout */}
                <label
                  className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                    paymentMethod === "SIMULATED"
                      ? "bg-[#181C2E] border-[#FFE600]"
                      : "bg-[#121624] border-[#1F263D]"
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="SIMULATED"
                    checked={paymentMethod === "SIMULATED"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="mt-1 accent-[#FFE600]"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-extrabold text-white">
                        ⚡ Simulación Inmediata (Modo Prueba / Demo)
                      </span>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded">
                        Recomendado en Local
                      </span>
                    </div>
                    <p className="text-xs text-[#94A3B8] mt-1 leading-relaxed">
                      Confirma la compra al instante, genera los códigos QR de prueba reales y emite el email de confirmación.
                    </p>
                  </div>
                </label>

                {/* Option 2: Transferencia Bancaria */}
                <label
                  className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                    paymentMethod === "TRANSFERENCIA"
                      ? "bg-[#181C2E] border-[#FFE600]"
                      : "bg-[#121624] border-[#1F263D]"
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="TRANSFERENCIA"
                    checked={paymentMethod === "TRANSFERENCIA"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="mt-1 accent-[#FFE600]"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-extrabold text-white">
                        🏦 Transferencia Bancaria (CBU / Alias)
                      </span>
                    </div>
                    <p className="text-xs text-[#94A3B8] mt-1 leading-relaxed">
                      Alias: <strong>CUMBIA.TICKETS.OFICIAL</strong> • CBU: 0000003100049281729102.
                    </p>
                  </div>
                </label>

                {/* Option 3: Mercado Pago Checkout Pro */}
                <label
                  className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                    paymentMethod === "MERCADOPAGO"
                      ? "bg-[#181C2E] border-[#FFE600]"
                      : "bg-[#121624] border-[#1F263D]"
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="MERCADOPAGO"
                    checked={paymentMethod === "MERCADOPAGO"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="mt-1 accent-[#FFE600]"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-extrabold text-white">
                        💳 Mercado Pago (Tarjetas / Dinero en cuenta)
                      </span>
                      <span className="text-[10px] bg-blue-500/20 text-[#38BDF8] font-bold px-2 py-0.5 rounded">
                        En producción
                      </span>
                    </div>
                    <p className="text-xs text-[#94A3B8] mt-1 leading-relaxed">
                      Integración lista con SDK oficial de Mercado Pago Argentina.
                    </p>
                  </div>
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Order Summary (5 cols) */}
        <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-4">
          <div className="bg-[#0F121C] border border-[#1E253A] rounded-2xl p-6 space-y-5">
            <h3 className="text-base font-black text-white uppercase pb-3 border-b border-[#1E243A]">
              Resumen de la Orden
            </h3>

            {/* Event Name */}
            <div>
              <span className="text-[10px] uppercase font-bold text-[#64748B] block">
                Evento
              </span>
              <h4 className="text-sm font-black text-white mt-0.5">
                {event.title}
              </h4>
              <p className="text-xs text-[#94A3B8] mt-0.5">
                {event.venue}, {event.city}
              </p>
            </div>

            {/* Breakdown */}
            <div className="space-y-3 pt-3 border-t border-[#1C2236]">
              {selectedItems.map((item) => (
                <div
                  key={item.tier.id}
                  className="flex justify-between items-start text-xs text-gray-300"
                >
                  <div>
                    <span className="font-bold text-white block">
                      {item.quantity}x {item.tier.name}
                    </span>
                    <span className="text-[11px] text-gray-400">
                      {item.tier.price === 0
                        ? "GRATIS"
                        : `$${item.tier.price.toLocaleString("es-AR")} c/u`}
                    </span>
                  </div>
                  <span className={`font-extrabold ${item.tier.price === 0 ? "text-emerald-400" : "text-white"}`}>
                    {item.tier.price === 0
                      ? "GRATIS"
                      : `$${(item.tier.price * item.quantity).toLocaleString("es-AR")}`}
                  </span>
                </div>
              ))}

              <div className="pt-3 border-t border-[#1C2236] space-y-1.5 text-xs text-[#94A3B8]">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-white">
                    {subtotal === 0 ? "GRATIS" : `$${subtotal.toLocaleString("es-AR")}`}
                  </span>
                </div>
                {serviceFee > 0 && (
                  <div className="flex justify-between">
                    <span>Cargo por servicio</span>
                    <span className="font-semibold text-white">
                      ${serviceFee.toLocaleString("es-AR")}
                    </span>
                  </div>
                )}
                <div className="pt-3 border-t border-[#232A42] flex justify-between items-center text-base">
                  <span className="font-black text-white uppercase">
                    {total === 0 ? "Total" : "Total a pagar"}
                  </span>
                  <span className={`text-2xl font-black ${total === 0 ? "text-emerald-400" : "text-[#FFE600]"}`}>
                    {total === 0 ? "GRATIS" : `$${total.toLocaleString("es-AR")}`}
                  </span>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-4 rounded-xl disabled:opacity-50 text-black font-black text-base uppercase tracking-wider transition-all duration-200 shadow-xl flex items-center justify-center gap-2 cursor-pointer ${
                total === 0
                  ? "bg-emerald-500 hover:bg-emerald-400 shadow-emerald-500/20"
                  : "bg-[#FFE600] hover:bg-[#FFF04D] shadow-[#FFE600]/20"
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {paymentMethod === "MERCADOPAGO" ? "Conectando con Mercado Pago..." : "Emitiendo Entradas..."}
                </>
              ) : total === 0 ? (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  Confirmar Registro y Recibir Entradas
                </>
              ) : paymentMethod === "MERCADOPAGO" ? (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  Pagar con Mercado Pago
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  Pagar y Emitir Entradas
                </>
              )}
            </button>

            <div className="text-[11px] text-[#64748B] text-center leading-relaxed">
              Al confirmar, recibirás los códigos QR por correo electrónico y podrás abrirlos de inmediato en tu pantalla.
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
