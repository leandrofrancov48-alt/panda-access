import QrScanner from "@/components/QrScanner";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Scanner de Puerta • Panda Access Control de Acceso",
};

export default function ScannerPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al Panel Admin
        </Link>
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
          <ShieldCheck className="w-3.5 h-3.5" />
          Modo Control de Acceso Activo
        </div>
      </div>

      <QrScanner />
    </div>
  );
}
