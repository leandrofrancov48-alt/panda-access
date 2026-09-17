import Link from "next/link";
import { Shield, Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-[#2C261E] bg-[#0C0B09] text-[#FAF6EE] relative">
      {/* Top glowing gradient border */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-400/40 to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Columna 1: Marca */}
          <div className="space-y-4 md:col-span-2">
            <div className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="Logo Panda DJ"
                className="w-12 h-12 shrink-0 object-contain"
              />
              <span className="text-xl font-black tracking-wider uppercase text-[#FAF6EE]">
                PANDA<span className="text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]">ACCESS</span>
              </span>
            </div>
            <p className="text-sm text-[#8F8270] max-w-md leading-relaxed font-medium">
              La plataforma oficial y directa de venta de entradas para los mejores eventos, recitales y fiestas. Acceso seguro, transferible y con validación QR en puerta sin demoras.
            </p>
            <div className="flex items-center gap-2 text-xs text-[#8F8270] font-semibold">
              <Shield className="w-4 h-4 text-emerald-400 drop-shadow-[0_0_6px_rgba(52,211,153,0.6)]" />
              <span>Transacciones seguras y tickets anti-fraude verificados.</span>
            </div>
          </div>

          {/* Columna 2: Acceso Rápido */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-widest text-amber-300">
              Plataforma
            </h4>
            <ul className="space-y-2 text-sm text-[#8F8270] font-medium">
              <li>
                <Link href="/" className="hover:text-amber-300 hover:drop-shadow-[0_0_6px_rgba(245,158,11,0.5)] transition-all">
                  Próximos Eventos
                </Link>
              </li>
              <li>
                <Link href="/admin/scanner" className="hover:text-amber-300 hover:drop-shadow-[0_0_6px_rgba(245,158,11,0.5)] transition-all">
                  Control de Acceso / Scanner
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-amber-300 hover:drop-shadow-[0_0_6px_rgba(245,158,11,0.5)] transition-all">
                  Panel de Organizadores
                </Link>
              </li>
              <li>
                <Link href="/admin/eventos/nuevo" className="hover:text-amber-300 hover:drop-shadow-[0_0_6px_rgba(245,158,11,0.5)] transition-all">
                  Crear Nuevo Evento
                </Link>
              </li>
            </ul>
          </div>

          {/* Columna 3: Información */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-widest text-amber-300">
              Soporte & Ayuda
            </h4>
            <ul className="space-y-2 text-sm text-[#8F8270] font-medium">
              <li>¿Cómo recibo mis entradas? (Por Email + QR)</li>
              <li>Ingreso con DNI y código QR</li>
              <li>Términos y Condiciones</li>
              <li>Contacto: soporte@pandaaccess.com</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-[#2C261E] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#8F8270] font-semibold">
          <p>© {new Date().getFullYear()} Panda Access. Todos los derechos reservados.</p>
          <p className="flex items-center gap-1.5">
            Hecho para la fiesta y el ritmo con <Heart className="w-3.5 h-3.5 text-pink-500 fill-pink-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.7)]" />
          </p>
        </div>
      </div>
    </footer>
  );
}
