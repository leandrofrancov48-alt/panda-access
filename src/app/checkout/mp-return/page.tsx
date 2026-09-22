"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertCircle, Clock, Loader2 } from "lucide-react";

export default function MercadoPagoReturnPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-md mx-auto py-24 text-center space-y-4">
          <Loader2 className="w-10 h-10 text-amber-400 animate-spin mx-auto" />
          <p className="text-sm text-[#94A3B8]">Verificando estado del pago...</p>
        </div>
      }
    >
      <MercadoPagoReturnContent />
    </Suspense>
  );
}

function MercadoPagoReturnContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const orderNumber = searchParams.get("orderNumber");
  const mpStatus = searchParams.get("status") || searchParams.get("collection_status");

  const [orderState, setOrderState] = useState<string>("CHECKING");
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!orderNumber) {
      router.push("/");
      return;
    }

    let isMounted = true;
    let currentAttempts = 0;

    const stopPolling = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    async function checkStatus() {
      if (!isMounted) return;

      try {
        const res = await fetch(`/api/orders/${orderNumber}/status`);
        if (res.ok && isMounted) {
          const data = await res.json();
          const status = data.order?.status;

          if (status === "PAID") {
            stopPolling();
            setOrderState("PAID");
            // Clean any pending checkout session
            if (typeof window !== "undefined") {
              sessionStorage.removeItem("checkout_data");
            }
            router.push(`/confirmacion/${orderNumber}`);
            return;
          }

          if (status === "CANCELLED") {
            stopPolling();
            setOrderState("CANCELLED");
            return;
          }
        }
      } catch (err) {
        console.error("Status check error:", err);
      }

      currentAttempts++;

      if (currentAttempts >= 5 && isMounted) {
        stopPolling();
        // Fallback to query param if webhook is still in flight
        if (mpStatus === "success" || mpStatus === "approved") {
          setOrderState("PAID");
          router.push(`/confirmacion/${orderNumber}`);
        } else if (mpStatus === "pending") {
          setOrderState("PENDING");
        } else {
          setOrderState("FAILED");
        }
      }
    }

    // Check immediately, then poll
    checkStatus();
    intervalRef.current = setInterval(checkStatus, 2000);

    return () => {
      isMounted = false;
      stopPolling();
    };
  }, [orderNumber, mpStatus, router]);

  if (orderState === "CHECKING") {
    return (
      <div className="max-w-lg mx-auto py-20 px-4 text-center space-y-6">
        <div className="w-20 h-20 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(245,158,11,0.2)]">
          <Loader2 className="w-10 h-10 text-amber-400 animate-spin" />
        </div>
        <div className="space-y-2">
          <span className="text-xs font-black uppercase tracking-widest text-amber-400">
            Mercado Pago • Verificando
          </span>
          <h2 className="text-2xl font-black text-[#FAF6EE]">Confirmando Acreditación...</h2>
          <p className="text-sm text-[#94A3B8] leading-relaxed">
            Estamos sincronizando la transacción con los servidores de Mercado Pago para emitir tus entradas oficiales.
          </p>
        </div>
      </div>
    );
  }

  if (orderState === "PENDING") {
    return (
      <div className="max-w-lg mx-auto py-16 px-4 space-y-6 text-center">
        <div className="bg-[#14120E] border border-amber-500/30 rounded-3xl p-8 space-y-5 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
            <Clock className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <span className="text-xs font-black uppercase tracking-widest text-amber-400">
              Pago en Proceso de Acreditación
            </span>
            <h2 className="text-2xl font-black text-[#FAF6EE]">Orden #{orderNumber}</h2>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Tu pago fue registrado en Mercado Pago y se encuentra pendiente de acreditación (habitual en pagos en efectivo o transferencias diferidas).
            </p>
          </div>

          <div className="bg-[#100E0B] border border-[#2C261E] rounded-xl p-4 text-left text-xs text-[#C8BFB0] space-y-1.5">
            <p>• Apenas se acredite, recibirás el correo con tus entradas y códigos QR.</p>
            <p>• Tus entradas quedarán reservadas mientras se completa el cobro.</p>
          </div>

          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-sm transition-colors uppercase"
            >
              Volver al Inicio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto py-16 px-4 space-y-6 text-center">
      <div className="bg-[#14120E] border border-red-500/30 rounded-3xl p-8 space-y-5 shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto text-red-400">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <span className="text-xs font-black uppercase tracking-widest text-red-400">
            Pago Cancelado o Rechazado
          </span>
          <h2 className="text-2xl font-black text-[#FAF6EE]">No pudimos procesar el cobro</h2>
          <p className="text-xs text-[#94A3B8] leading-relaxed">
            La operación no fue completada en Mercado Pago o fue cancelada por el banco emisor. No se realizó ningún cargo en tu tarjeta.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/checkout"
            className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-sm transition-colors uppercase"
          >
            Reintentar Pago
          </Link>
          <Link
            href="/"
            className="px-6 py-3 rounded-xl bg-[#1C1813] hover:bg-[#252019] text-[#FAF6EE] font-bold text-sm transition-colors uppercase border border-[#3A3226]"
          >
            Ir a la Cartelera
          </Link>
        </div>
      </div>
    </div>
  );
}
