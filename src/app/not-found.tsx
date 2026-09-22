import Link from "next/link";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto border-2 border-amber-500/30">
          <AlertCircle className="w-10 h-10 text-amber-400" />
        </div>
        <h1 className="text-4xl font-black text-[#FAF6EE] uppercase tracking-tight">404</h1>
        <h2 className="text-xl font-bold text-[#FAF6EE] uppercase">Página no encontrada</h2>
        <p className="text-gray-400 text-sm">
          El link que seguiste puede estar roto, o la página pudo haber sido removida.
        </p>
        <Link 
          href="/"
          className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-black uppercase text-xs tracking-wider transition-colors"
        >
          Volver a la cartelera
        </Link>
      </div>
    </div>
  );
}
