"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Minus, Ticket, ShieldCheck, ArrowRight, Users } from "lucide-react";

export interface TierItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  serviceFee: number;
  capacity: number;
  sold: number;
  maxPerOrder: number;
  status: string;
}

interface TicketSelectorProps {
  eventId: string;
  eventTitle: string;
  tiers: TierItem[];
}

export default function TicketSelector({ eventId, eventTitle, tiers }: TicketSelectorProps) {
  const router = useRouter();
  const [liveTiers, setLiveTiers] = useState<TierItem[]>(tiers);
  const [quantities, setQuantities] = useState<Record<string, number>>(
    tiers.reduce((acc, tier) => ({ ...acc, [tier.id]: 0 }), {})
  );

  // Auto-refresh silencioso de stock y disponibilidad cada 15 segundos y al volver a la pestaña
  useEffect(() => {
    let isMounted = true;

    const refreshStock = async () => {
      try {
        const res = await fetch(`/api/events/${eventId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (!isMounted || !data?.tiers) return;

        setLiveTiers(data.tiers);

        // Si se redujo el stock de alguna tanda, ajustamos la selección del usuario
        setQuantities((prev) => {
          let hasChanges = false;
          const next = { ...prev };
          data.tiers.forEach((t: TierItem) => {
            const currentQty = next[t.id] || 0;
            const available = Math.max(0, t.capacity - t.sold);
            const limit = Math.min(t.maxPerOrder, available);
            if (currentQty > limit) {
              next[t.id] = limit;
              hasChanges = true;
            }
          });
          return hasChanges ? next : prev;
        });
      } catch {
        // Fallo silencioso en caso de microcorte de red
      }
    };

    const interval = setInterval(refreshStock, 15000);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        refreshStock();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      isMounted = false;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [eventId]);

  const handleIncrement = (tierId: string, max: number, available: number) => {
    setQuantities((prev) => {
      const current = prev[tierId] || 0;
      const limit = Math.min(max, available);
      if (current < limit) {
        return { ...prev, [tierId]: current + 1 };
      }
      return prev;
    });
  };

  const handleDecrement = (tierId: string) => {
    setQuantities((prev) => {
      const current = prev[tierId] || 0;
      if (current > 0) {
        return { ...prev, [tierId]: current - 1 };
      }
      return prev;
    });
  };

  // Calculate totals usando liveTiers
  const totalTickets = Object.values(quantities).reduce((a, b) => a + b, 0);

  const subtotal = liveTiers.reduce((acc, tier) => {
    const qty = quantities[tier.id] || 0;
    return acc + qty * tier.price;
  }, 0);

  const totalFee = liveTiers.reduce((acc, tier) => {
    const qty = quantities[tier.id] || 0;
    return acc + qty * tier.serviceFee;
  }, 0);

  const grandTotal = subtotal + totalFee;

  const handleCheckout = () => {
    if (totalTickets === 0) return;

    // Filter only tiers with qty > 0
    const selectedTiers = Object.entries(quantities)
      .filter(([_, qty]) => qty > 0)
      .map(([tierId, quantity]) => ({ tierId, quantity }));

    // Store in sessionStorage for clean transition to checkout
    if (typeof window !== "undefined") {
      sessionStorage.setItem(
        "checkout_data",
        JSON.stringify({
          eventId,
          eventTitle,
          selectedTiers,
        })
      );
    }

    router.push(`/checkout?eventId=${eventId}`);
  };

  return (
    <div className="bg-[#15130F] border border-[#2E2820] rounded-3xl p-5 sm:p-6 space-y-6 shadow-2xl relative overflow-hidden">
      {/* Ambient soft glow in corner */}
      <div className="absolute -top-10 -right-10 w-48 h-48 bg-amber-500/10 rounded-full blur-[70px] pointer-events-none" />

      <div className="flex items-center justify-between pb-4 border-b border-[#2C261E] relative z-10">
        <div>
          <h2 className="text-xl font-black text-[#FAF6EE] flex items-center gap-2">
            <Ticket className="w-5 h-5 text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
            Seleccioná tus entradas
          </h2>
          <p className="text-xs text-[#8F8270] mt-1 font-medium">
            Podés comprar hasta el límite permitido por tanda.
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-full shadow-[0_0_10px_rgba(52,211,153,0.15)]">
          <ShieldCheck className="w-4 h-4" />
          Compra Protegida
        </div>
      </div>

      {/* Tiers List */}
      <div className="space-y-4 relative z-10">
        {liveTiers.filter(t => t.status !== "HIDDEN").map((tier) => {
          const qty = quantities[tier.id] || 0;
          const available = tier.capacity - tier.sold;
          const isSoldOut = tier.status === "SOLD_OUT" || available <= 0;

          return (
            <div
              key={tier.id}
              className={`relative p-5 rounded-2xl border transition-all duration-200 ${
                qty > 0
                  ? "bg-[#1F1912] border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.25)]"
                  : isSoldOut
                  ? "bg-[#100E0C] border-[#221D17] opacity-60"
                  : "bg-[#12100D] border-[#2C261E] hover:border-amber-400/50 hover:shadow-lg"
              }`}
            >
              {/* Top: Name, Status & Description */}
              <div className="space-y-1.5">
                <div className="flex items-start justify-between gap-3">
                  <h4 className="font-extrabold text-base text-[#FAF6EE] leading-snug">
                    {tier.name}
                  </h4>
                  <div className="shrink-0">
                    {isSoldOut ? (
                      <span className="text-[10px] uppercase font-black tracking-wider px-2.5 py-1 rounded-full bg-red-500/15 text-red-400 border border-red-500/30">
                        Agotado
                      </span>
                    ) : (
                      <span className="text-[10px] uppercase font-black tracking-wider px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-[0_0_8px_rgba(52,211,153,0.2)]">
                        Disponible
                      </span>
                    )}
                  </div>
                </div>

                {tier.description && (
                  <p className="text-xs text-[#8F8270] leading-relaxed font-medium">
                    {tier.description}
                  </p>
                )}
              </div>

              {/* Bottom: Price, Fee, Limits and Stepper */}
              <div className="mt-4 pt-3 border-t border-[#2C261E] flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-baseline gap-1">
                    {tier.price === 0 ? (
                      <span className="text-xl font-black text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]">
                        GRATIS
                      </span>
                    ) : (
                      <>
                        <span className="text-xl font-black text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]">
                          ${tier.price.toLocaleString("es-AR")}
                        </span>
                        <span className="text-xs text-[#8F8270] font-medium">c/u</span>
                      </>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-2 text-[11px] text-[#786C5A] mt-0.5">
                    <span>Máx: {tier.maxPerOrder}</span>
                    {tier.serviceFee > 0 ? (
                      <span>• Cargo: ${tier.serviceFee.toLocaleString("es-AR")}</span>
                    ) : tier.price === 0 ? (
                      <span className="text-emerald-400 font-medium">• Sin costo</span>
                    ) : null}
                  </div>
                </div>

                {/* Quantity Controls */}
                {!isSoldOut ? (
                  <div className="flex items-center gap-1.5 bg-[#0C0B09] border border-[#2C261E] p-1 rounded-xl shrink-0">
                    <button
                      type="button"
                      onClick={() => handleDecrement(tier.id)}
                      disabled={qty === 0}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-[#8F8270] hover:text-white hover:bg-white/10 disabled:opacity-25 transition-colors cursor-pointer"
                      aria-label="Disminuir cantidad"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-7 text-center font-black text-sm text-[#FAF6EE]">
                      {qty}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleIncrement(tier.id, tier.maxPerOrder, available)
                      }
                      disabled={qty >= Math.min(tier.maxPerOrder, available)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-r from-amber-400 to-amber-500 text-black font-extrabold hover:shadow-[0_0_12px_rgba(245,158,11,0.6)] disabled:opacity-25 transition-all cursor-pointer"
                      aria-label="Aumentar cantidad"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <span className="text-xs text-[#786C5A] font-semibold italic">
                    Sin cupos
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Box */}
      {totalTickets > 0 && (
        <div className="pt-6 border-t border-[#2C261E] space-y-4 relative z-10">
          <div className="bg-[#1C1813] rounded-2xl p-4 space-y-2 text-sm border border-[#2E2820]">
            <div className="flex justify-between text-[#8F8270]">
              <span className="flex items-center gap-1.5 font-medium">
                <Users className="w-4 h-4 text-amber-400" />
                Cantidad de entradas
              </span>
              <span className="font-bold text-[#FAF6EE]">{totalTickets}</span>
            </div>
            <div className="flex justify-between text-[#8F8270]">
              <span className="font-medium">Subtotal</span>
              <span className="font-semibold text-[#FAF6EE]">
                {subtotal === 0 ? "GRATIS" : `$${subtotal.toLocaleString("es-AR")}`}
              </span>
            </div>
            {totalFee > 0 && (
              <div className="flex justify-between text-[#8F8270]">
                <span className="font-medium">Costo de servicio</span>
                <span className="font-semibold text-[#FAF6EE]">
                  ${totalFee.toLocaleString("es-AR")}
                </span>
              </div>
            )}
            <div className="pt-2 border-t border-[#2C261E] flex justify-between items-center text-base">
              <span className="font-black text-[#FAF6EE] uppercase tracking-wider">
                {grandTotal === 0 ? "Total" : "Total a pagar"}
              </span>
              <span className={`text-2xl font-black ${grandTotal === 0 ? "text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.6)]" : "text-amber-400 drop-shadow-[0_0_10px_rgba(245,158,11,0.6)]"}`}>
                {grandTotal === 0 ? "GRATIS" : `$${grandTotal.toLocaleString("es-AR")}`}
              </span>
            </div>
          </div>

          <button
            onClick={handleCheckout}
            className={`w-full py-4 rounded-xl font-black text-base tracking-wide uppercase transition-all duration-200 shadow-xl flex items-center justify-center gap-3 cursor-pointer ${
              grandTotal === 0
                ? "bg-emerald-400 hover:bg-emerald-300 text-black shadow-[0_0_25px_rgba(52,211,153,0.45)] hover:shadow-[0_0_35px_rgba(52,211,153,0.7)]"
                : "bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black shadow-[0_0_25px_rgba(245,158,11,0.45)] hover:shadow-[0_0_35px_rgba(245,158,11,0.7)] hover:scale-[1.01] border-2 border-amber-200"
            }`}
          >
            {grandTotal === 0 ? (
              <>
                Obtener Entradas Gratis ({totalTickets} {totalTickets === 1 ? "entrada" : "entradas"})
                <ArrowRight className="w-5 h-5" />
              </>
            ) : (
              <>
                Continuar con la compra ({totalTickets} {totalTickets === 1 ? "entrada" : "entradas"})
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
