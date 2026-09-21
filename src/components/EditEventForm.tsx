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
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import ImageUpload from "@/components/ImageUpload";

export interface EventDataForEdit {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string;
  date: string | Date;
  doorsOpenTime: string | null;
  venue: string;
  address: string;
  city: string;
  coverImage: string;
  bannerImage: string | null;
  ageRestriction: string | null;
  status: string;
  featured: boolean;
  lineup: string | null;
  tiers: Array<{
    id: string;
    name: string;
    description: string | null;
    price: number;
    capacity: number;
    sold: number;
    serviceFee: number;
    status: string;
  }>;
}

export default function EditEventForm({ event }: { event: EventDataForEdit }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Formatear fecha para datetime-local
  const formatDatetimeForInput = (d: string | Date) => {
    try {
      const dateObj = new Date(d);
      const tzOffset = dateObj.getTimezoneOffset() * 60000;
      const localISOTime = new Date(dateObj.getTime() - tzOffset).toISOString().slice(0, 16);
      return localISOTime;
    } catch {
      return "";
    }
  };

  // Form states
  const [title, setTitle] = useState(event.title || "");
  const [subtitle, setSubtitle] = useState(event.subtitle || "");
  const [description, setDescription] = useState(event.description || "");
  const [date, setDate] = useState(formatDatetimeForInput(event.date));
  const [doorsOpenTime, setDoorsOpenTime] = useState(event.doorsOpenTime || "22:00");
  const [venue, setVenue] = useState(event.venue || "");
  const [address, setAddress] = useState(event.address || "");
  const [city, setCity] = useState(event.city || "Buenos Aires");
  const [coverImage, setCoverImage] = useState(event.coverImage || "");
  const [bannerImage, setBannerImage] = useState(event.bannerImage || event.coverImage || "");
  const [ageRestriction, setAgeRestriction] = useState(event.ageRestriction || "+18 años");
  const [status, setStatus] = useState(event.status || "PUBLISHED");
  const [featured, setFeatured] = useState(event.featured || false);

  // Parsear Lineup
  const initialLineup = () => {
    if (!event.lineup) return [{ name: "", time: "", highlight: false }];
    try {
      const parsed = JSON.parse(event.lineup);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      return [{ name: "", time: "", highlight: false }];
    } catch {
      return [{ name: "", time: "", highlight: false }];
    }
  };
  const [lineup, setLineup] = useState<Array<{ name: string; time: string; highlight: boolean }>>(initialLineup());

  // Tiers
  const [tiers, setTiers] = useState<
    Array<{
      id?: string;
      name: string;
      description: string;
      price: number;
      capacity: number;
      sold: number;
      status: string;
    }>
  >(
    event.tiers.map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description || "",
      price: t.price,
      capacity: t.capacity,
      sold: t.sold,
      status: t.status,
    }))
  );

  const addLineupItem = () => {
    setLineup([...lineup, { name: "", time: "", highlight: false }]);
  };

  const removeLineupItem = (index: number) => {
    setLineup(lineup.filter((_, i) => i !== index));
  };

  const addTier = () => {
    setTiers([
      ...tiers,
      {
        name: "Nueva Tanda",
        description: "",
        price: 15000,
        capacity: 100,
        sold: 0,
        status: "AVAILABLE",
      },
    ]);
  };

  const removeTier = (index: number) => {
    const tierToRemove = tiers[index];
    if (tierToRemove.sold > 0) {
      alert(`No podés eliminar la tanda "${tierToRemove.name}" porque ya tiene ${tierToRemove.sold} entradas vendidas.`);
      return;
    }
    setTiers(tiers.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!title || !venue || !date || !coverImage) {
      setErrorMessage("Por favor completá los campos obligatorios (*).");
      return;
    }

    if (tiers.length === 0) {
      setErrorMessage("El evento debe tener al menos una tanda de entradas.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/admin/events/${event.id}`, {
        method: "PUT",
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
          bannerImage,
          ageRestriction,
          status,
          featured,
          lineup: lineup.filter((l) => l.name.trim() !== ""),
          tiers: tiers.map((t) => ({
            id: t.id,
            name: t.name,
            description: t.description,
            price: Number(t.price),
            capacity: Number(t.capacity),
            status: t.status,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Error al guardar los cambios.");
      }

      setSuccessMessage("¡Evento actualizado exitosamente!");
      setTimeout(() => {
        router.push("/panda-control-2026");
        router.refresh();
      }, 800);
    } catch (err: unknown) {
      console.error(err);
      setErrorMessage((err as Error).message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header & Back link */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/panda-control-2026"
            className="inline-flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al Panel Admin
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-white uppercase mt-2">
            Editar Evento
          </h1>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            Modificá información, afiche, tandas de precios y estado en cartelera.
          </p>
        </div>

        <Link
          href={`/eventos/${event.slug}`}
          target="_blank"
          className="px-4 py-2 rounded-xl bg-[#161B2B] hover:bg-[#20273D] border border-[#2A3554] text-xs font-bold text-[#FFE600] flex items-center gap-1.5 w-fit transition-colors"
        >
          Ver Show en Vivo
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      {errorMessage && (
        <div className="bg-[#FF2E4C]/15 border border-[#FF2E4C]/40 p-4 rounded-xl text-red-200 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-[#FF2E4C]" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="bg-emerald-500/15 border border-emerald-500/40 p-4 rounded-xl text-emerald-200 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* 1. Información Básica */}
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
                Fecha y Hora del Evento *
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

        {/* 2. Lugar y Ubicación */}
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
                placeholder="Ej: Av. Santa Fe 4389"
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

        {/* 3. Imágenes y Estado */}
        <div className="bg-[#0F121C] border border-[#1E253A] rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-black uppercase text-white flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-[#38BDF8]" />
            Afiche y Configuración
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <ImageUpload
                value={coverImage}
                onChange={setCoverImage}
                label="1. Afiche / Portada (Cartelera)"
                aspectRatio="vertical"
                helperText="Imagen tipo flyer que aparece en las tarjetas de la cartelera principal (vertical o cuadrada)."
                required
              />
            </div>

            <div className="sm:col-span-2 border-t border-[#1C2237] pt-4">
              <ImageUpload
                value={bannerImage}
                onChange={setBannerImage}
                label="2. Banner Horizontal de Cabecera (Detalle del Evento)"
                aspectRatio="horizontal"
                helperText="Imagen panorámica/apaisada que se muestra arriba en la página del evento (exactamente la que se ve en la cabecera del show). Si la dejás vacía, se usará el afiche."
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-300 block mb-1">
                Estado del Evento
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#161B2B] border border-[#232B45] rounded-xl text-white text-sm focus:border-[#FFE600] outline-none font-bold"
              >
                <option value="PUBLISHED">🟢 Publicado (Visible en Cartelera)</option>
                <option value="DRAFT">🟡 Borrador (Oculto del público)</option>
                <option value="SOLD_OUT">🔴 Agotado (No permite comprar)</option>
                <option value="CANCELLED">⚫ Cancelado</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-300 block mb-1">
                Restricción de Edad
              </label>
              <input
                type="text"
                value={ageRestriction}
                onChange={(e) => setAgeRestriction(e.target.value)}
                placeholder="+18 años"
                className="w-full px-4 py-2.5 bg-[#161B2B] border border-[#232B45] rounded-xl text-white text-sm focus:border-[#FFE600] outline-none"
              />
            </div>

            <div className="sm:col-span-2 pt-2">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="w-4 h-4 rounded text-[#FFE600] focus:ring-0 focus:outline-none accent-[#FFE600]"
                />
                <span className="text-xs font-bold text-white">
                  🔥 Destacar en portada de inicio (Aparece con insignia de Destacado)
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* 4. Artistas / Lineup */}
        <div className="bg-[#0F121C] border border-[#1E253A] rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black uppercase text-white flex items-center gap-2">
              <Music className="w-4 h-4 text-[#FFE600]" />
              Artistas & Horarios (Line-up)
            </h3>
            <button
              type="button"
              onClick={addLineupItem}
              className="text-xs font-bold text-[#FFE600] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Agregar Artista / DJ
            </button>
          </div>

          <div className="space-y-3">
            {lineup.map((item, index) => (
              <div
                key={index}
                className="grid grid-cols-12 gap-3 items-center bg-[#141828] p-3 rounded-xl border border-[#21273C]"
              >
                <div className="col-span-6">
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => {
                      const copy = [...lineup];
                      copy[index].name = e.target.value;
                      setLineup(copy);
                    }}
                    placeholder="Banda o DJ"
                    className="w-full px-3 py-1.5 bg-[#1B2136] border border-[#2A3455] rounded-lg text-white text-xs outline-none focus:border-[#FFE600]"
                  />
                </div>
                <div className="col-span-3">
                  <input
                    type="text"
                    value={item.time}
                    onChange={(e) => {
                      const copy = [...lineup];
                      copy[index].time = e.target.value;
                      setLineup(copy);
                    }}
                    placeholder="01:30"
                    className="w-full px-3 py-1.5 bg-[#1B2136] border border-[#2A3455] rounded-lg text-white text-xs outline-none focus:border-[#FFE600]"
                  />
                </div>
                <div className="col-span-2 flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={item.highlight}
                    id={`hl-${index}`}
                    onChange={(e) => {
                      const copy = [...lineup];
                      copy[index].highlight = e.target.checked;
                      setLineup(copy);
                    }}
                    className="accent-[#FFE600]"
                  />
                  <label htmlFor={`hl-${index}`} className="text-[11px] text-gray-300 cursor-pointer">
                    Principal
                  </label>
                </div>
                <div className="col-span-1 text-right">
                  <button
                    type="button"
                    onClick={() => removeLineupItem(index)}
                    className="text-gray-500 hover:text-red-400 p-1 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 5. Tandas de Entradas y Precios */}
        <div className="bg-[#0F121C] border border-[#1E253A] rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black uppercase text-white flex items-center gap-2">
                <Ticket className="w-4 h-4 text-[#38BDF8]" />
                Tandas de Entradas & Precios
              </h3>
              <p className="text-[11px] text-[#94A3B8]">
                Podés modificar precios, nombres y cupos. Las tandas que ya tienen ventas no pueden eliminarse.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setTiers(tiers.map((t) => ({ ...t, price: 0 })));
                }}
                className="text-xs font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                title="Establecer todas las tandas con precio $0 para evento gratuito"
              >
                🎁 Hacer Evento Gratuito ($0)
              </button>
              <button
                type="button"
                onClick={addTier}
                className="text-xs font-bold text-[#38BDF8] hover:underline flex items-center gap-1 cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                Agregar Tanda
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {tiers.map((tier, index) => {
              const hasSold = tier.sold > 0;
              const isFree = tier.price === 0;

              return (
                <div
                  key={tier.id || index}
                  className="bg-[#141828] border border-[#21273C] p-4 rounded-xl space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-white">Tanda #{index + 1}</span>
                      {isFree && (
                        <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          🟢 Gratuita ($0)
                        </span>
                      )}
                      {hasSold ? (
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-[#FFE600]/15 text-[#FFE600] border border-[#FFE600]/30">
                          {tier.sold} vendidas
                        </span>
                      ) : (
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-blue-500/10 text-[#38BDF8] border border-blue-500/20">
                          0 vendidas
                        </span>
                      )}
                    </div>

                    {!hasSold && (
                      <button
                        type="button"
                        onClick={() => removeTier(index)}
                        className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Eliminar Tanda
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="sm:col-span-2">
                      <label className="text-[11px] font-bold text-gray-300 block mb-1">
                        Nombre de la Tanda *
                      </label>
                      <input
                        type="text"
                        required
                        value={tier.name}
                        onChange={(e) => {
                          const copy = [...tiers];
                          copy[index].name = e.target.value;
                          setTiers(copy);
                        }}
                        placeholder="Ej: General - Preventa 1"
                        className="w-full px-3 py-2 bg-[#1B2136] border border-[#2A3455] rounded-lg text-white text-xs outline-none focus:border-[#FFE600]"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-bold text-gray-300">
                          Precio ($ ARS) *
                        </label>
                        {tier.price > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              const copy = [...tiers];
                              copy[index].price = 0;
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
                          copy[index].price = Number(e.target.value);
                          setTiers(copy);
                        }}
                        className="w-full px-3 py-2 bg-[#1B2136] border border-[#2A3455] rounded-lg text-white text-xs outline-none focus:border-[#FFE600] font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-gray-300 block mb-1">
                        Capacidad Total *
                      </label>
                      <input
                        type="number"
                        min={tier.sold || 1}
                        required
                        value={tier.capacity}
                        onChange={(e) => {
                          const copy = [...tiers];
                          copy[index].capacity = Number(e.target.value);
                          setTiers(copy);
                        }}
                        className="w-full px-3 py-2 bg-[#1B2136] border border-[#2A3455] rounded-lg text-white text-xs outline-none focus:border-[#FFE600] font-mono"
                      />
                      {hasSold && (
                        <span className="text-[10px] text-gray-400 block mt-0.5">
                          Mínimo: {tier.sold}
                        </span>
                      )}
                    </div>

                    <div className="sm:col-span-3">
                      <label className="text-[11px] font-bold text-gray-300 block mb-1">
                        Descripción (Opcional)
                      </label>
                      <input
                        type="text"
                        value={tier.description}
                        onChange={(e) => {
                          const copy = [...tiers];
                          copy[index].description = e.target.value;
                          setTiers(copy);
                        }}
                        placeholder="Ej: Acceso general a precio promocional anticipado"
                        className="w-full px-3 py-2 bg-[#1B2136] border border-[#2A3455] rounded-lg text-white text-xs outline-none focus:border-[#FFE600]"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-gray-300 block mb-1">
                        Estado Tanda
                      </label>
                      <select
                        value={tier.status}
                        onChange={(e) => {
                          const copy = [...tiers];
                          copy[index].status = e.target.value;
                          setTiers(copy);
                        }}
                        className="w-full px-3 py-2 bg-[#1B2136] border border-[#2A3455] rounded-lg text-white text-xs outline-none focus:border-[#FFE600]"
                      >
                        <option value="AVAILABLE">Disponible</option>
                        <option value="SOLD_OUT">Agotada</option>
                        <option value="HIDDEN">Oculta</option>
                      </select>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex items-center justify-between gap-4 pt-4 border-t border-[#1E253A]">
          <Link
            href="/panda-control-2026"
            className="px-5 py-3 rounded-xl bg-[#161B2B] hover:bg-[#20273D] text-gray-300 hover:text-white text-xs font-bold transition-colors"
          >
            Cancelar y Volver
          </Link>

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-8 py-3 rounded-xl bg-gradient-to-r from-[#FFE600] to-[#FFE600] hover:brightness-110 text-black font-black text-sm uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-xl shadow-[#FFE600]/20 disabled:opacity-50 transition-all"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Guardando Cambios...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Guardar Cambios del Evento
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
