"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Image as ImageIcon,
  Plus,
  Trash2,
  Ticket,
  Music,
  CheckCircle2,
  Loader2,
} from "lucide-react";

export default function NewEventPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [doorsOpenTime, setDoorsOpenTime] = useState("22:00");
  const [venue, setVenue] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("Buenos Aires");
  const [coverImage, setCoverImage] = useState(
    "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=1200&auto=format&fit=crop"
  );
  const [ageRestriction, setAgeRestriction] = useState("+18 años");

  // Lineup
  const [lineup, setLineup] = useState<Array<{ name: string; time: string; highlight: boolean }>>([
    { name: "Banda Principal", time: "02:00", highlight: true },
    { name: "DJ Residente", time: "Warm Up", highlight: false },
  ]);

  // Tiers
  const [tiers, setTiers] = useState<
    Array<{ name: string; description: string; price: number; capacity: number }>
  >([
    {
      name: "Entrada General - Fase 1",
      description: "Acceso general a precio promocional anticipado.",
      price: 10000,
      capacity: 300,
    },
    {
      name: "Campo VIP",
      description: "Sector preferencial cerca del escenario con barra exclusiva.",
      price: 20000,
      capacity: 100,
    },
  ]);

  const addLineupItem = () => {
    setLineup([...lineup, { name: "", time: "", highlight: false }]);
  };

  const removeLineupItem = (index: number) => {
    setLineup(lineup.filter((_, i) => i !== index));
  };

  const addTier = () => {
    setTiers([
      ...tiers,
      { name: "Nueva Tanda", description: "", price: 15000, capacity: 150 },
    ]);
  };

  const removeTier = (index: number) => {
    if (tiers.length > 1) {
      setTiers(tiers.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!title || !venue || !date || !coverImage) {
      setErrorMessage("Por favor completá los campos obligatorios (*).");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/admin/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          subtitle,
          description,
          date,
          doorsOpenTime,
          venue,
          address,
          city,
          coverImage,
          ageRestriction,
          lineup,
          tiers,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Error al crear el evento.");
      }

      router.push("/admin");
    } catch (err: unknown) {
      console.error(err);
      setErrorMessage((err as Error).message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      <div>
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al Panel Admin
        </Link>
      </div>

      <div className="pb-4 border-b border-[#1E253A]">
        <h1 className="text-2xl sm:text-3xl font-black text-white uppercase">
          Crear Nuevo Evento / Fiesta
        </h1>
        <p className="text-xs text-[#94A3B8] mt-1">
          Configurá los detalles del show, artistas y tandas de precios de entradas.
        </p>
      </div>

      {errorMessage && (
        <div className="bg-[#FF2E4C]/15 border border-[#FF2E4C]/40 p-4 rounded-xl text-red-200 text-xs">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Info básica */}
        <div className="bg-[#0F121C] border border-[#1E253A] rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-black uppercase text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#FFE600]" />
            Información General
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-gray-300 block mb-1">
                Nombre del Evento *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej: LA NOCHE DE LA CUMBIA • Edición Especial"
                className="w-full px-4 py-2.5 bg-[#161B2B] border border-[#232B45] rounded-xl text-white text-sm focus:border-[#FFE600] outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-gray-300 block mb-1">
                Subtítulo / Bajada
              </label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="Ej: En vivo: Los Mejores Grupos Tropicales"
                className="w-full px-4 py-2.5 bg-[#161B2B] border border-[#232B45] rounded-xl text-white text-sm focus:border-[#FFE600] outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-gray-300 block mb-1">
                Descripción del Evento
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explicá de qué trata la fiesta, promociones de barra, horarios..."
                className="w-full px-4 py-2.5 bg-[#161B2B] border border-[#232B45] rounded-xl text-white text-sm focus:border-[#FFE600] outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-300 block mb-1">
                Fecha del Evento *
              </label>
              <input
                type="datetime-local"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#161B2B] border border-[#232B45] rounded-xl text-white text-sm focus:border-[#FFE600] outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-300 block mb-1">
                Horario Apertura de Puertas
              </label>
              <input
                type="text"
                value={doorsOpenTime}
                onChange={(e) => setDoorsOpenTime(e.target.value)}
                placeholder="22:00"
                className="w-full px-4 py-2.5 bg-[#161B2B] border border-[#232B45] rounded-xl text-white text-sm focus:border-[#FFE600] outline-none"
              />
            </div>
          </div>
        </div>

        {/* Lugar y Ubicación */}
        <div className="bg-[#0F121C] border border-[#1E253A] rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-black uppercase text-white flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#FF2E4C]" />
            Ubicación del Show
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-300 block mb-1">
                Nombre del Local / Predio *
              </label>
              <input
                type="text"
                required
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="Ej: Groove / Estadio Obras"
                className="w-full px-4 py-2.5 bg-[#161B2B] border border-[#232B45] rounded-xl text-white text-sm focus:border-[#FFE600] outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-300 block mb-1">
                Dirección
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Av. Santa Fe 4389"
                className="w-full px-4 py-2.5 bg-[#161B2B] border border-[#232B45] rounded-xl text-white text-sm focus:border-[#FFE600] outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-300 block mb-1">
                Ciudad
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Buenos Aires"
                className="w-full px-4 py-2.5 bg-[#161B2B] border border-[#232B45] rounded-xl text-white text-sm focus:border-[#FFE600] outline-none"
              />
            </div>
          </div>
        </div>

        {/* Imagen de Portada */}
        <div className="bg-[#0F121C] border border-[#1E253A] rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-black uppercase text-white flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-[#38BDF8]" />
            Imagen de Portada (Afiche)
          </h3>

          <div>
            <label className="text-xs font-bold text-gray-300 block mb-1">
              URL de la Imagen *
            </label>
            <input
              type="url"
              required
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full px-4 py-2.5 bg-[#161B2B] border border-[#232B45] rounded-xl text-white text-sm focus:border-[#FFE600] outline-none"
            />
          </div>

          {coverImage && (
            <div className="aspect-[21/9] max-h-48 rounded-xl overflow-hidden bg-black border border-[#232B45]">
              <img
                src={coverImage}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>

        {/* Tandas y Precios de Entradas */}
        <div className="bg-[#0F121C] border border-[#1E253A] rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black uppercase text-white flex items-center gap-2">
              <Ticket className="w-4 h-4 text-[#FFE600]" />
              Tandas de Entradas & Precios
            </h3>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setTiers([
                    {
                      name: "Entrada General (Registro Libre)",
                      description: "Acceso libre y gratuito previa inscripción con DNI",
                      price: 0,
                      capacity: 500,
                    },
                  ]);
                }}
                className="text-xs font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                title="Configurar el evento como 100% gratuito"
              >
                🎁 Configurar como Evento Gratuito ($0)
              </button>
              <button
                type="button"
                onClick={addTier}
                className="text-xs font-bold text-[#FFE600] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Agregar otra tanda
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {tiers.map((tier, idx) => (
              <div
                key={idx}
                className="p-4 bg-[#141828] border border-[#21273C] rounded-xl space-y-3"
              >
                <div className="flex justify-between items-center text-xs font-bold text-white">
                  <div className="flex items-center gap-2">
                    <span>Tanda #{idx + 1}</span>
                    {tier.price === 0 && (
                      <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        🟢 Gratuita ($0)
                      </span>
                    )}
                  </div>
                  {tiers.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTier(idx)}
                      className="text-red-400 hover:text-red-300 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">
                      Nombre de la entrada
                    </label>
                    <input
                      type="text"
                      required
                      value={tier.name}
                      onChange={(e) => {
                        const copy = [...tiers];
                        copy[idx].name = e.target.value;
                        setTiers(copy);
                      }}
                      className="w-full px-3 py-2 bg-[#0F121C] border border-[#232B45] rounded-lg text-white text-xs"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10px] uppercase font-bold text-gray-400">
                        Precio ($ ARS)
                      </label>
                      {tier.price > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            const copy = [...tiers];
                            copy[idx].price = 0;
                            setTiers(copy);
                          }}
                          className="text-[10px] text-emerald-400 hover:underline cursor-pointer"
                        >
                          Gratis ($0)
                        </button>
                      )}
                    </div>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      required
                      value={tier.price}
                      onChange={(e) => {
                        const copy = [...tiers];
                        copy[idx].price = Number(e.target.value);
                        setTiers(copy);
                      }}
                      className="w-full px-3 py-2 bg-[#0F121C] border border-[#232B45] rounded-lg text-white text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">
                      Capacidad / Stock
                    </label>
                    <input
                      type="number"
                      required
                      value={tier.capacity}
                      onChange={(e) => {
                        const copy = [...tiers];
                        copy[idx].capacity = Number(e.target.value);
                        setTiers(copy);
                      }}
                      className="w-full px-3 py-2 bg-[#0F121C] border border-[#232B45] rounded-lg text-white text-xs font-mono"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="pt-4 flex justify-end gap-3">
          <Link
            href="/admin"
            className="px-5 py-3 rounded-xl bg-[#181C2E] text-gray-300 text-xs font-bold hover:bg-[#202740] transition-colors"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-8 py-3 rounded-xl bg-[#FFE600] hover:bg-[#FFF04D] text-black text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-[#FFE600]/20 flex items-center gap-2 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Publicando Evento...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Publicar Evento en Cartelera
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
