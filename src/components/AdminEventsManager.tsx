"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import {
  Calendar,
  Filter,
  Search,
  Download,
  CheckCircle2,
  Clock,
  Users,
  DollarSign,
  Ticket,
  ExternalLink,
  Sparkles,
  TrendingUp,
  Flame,
  FileSpreadsheet,
  X,
  Copy,
  Check,
  FolderUp,
  Pencil,
  Trash2,
  AlertTriangle,
  Loader2,
} from "lucide-react";

export interface EventWithDetails {
  id: string;
  slug: string;
  title: string;
  venue: string;
  city: string;
  date: string | Date;
  status: string;
  tiers: Array<{
    id: string;
    name: string;
    price: number;
    capacity: number;
    sold: number;
    status: string;
    serviceFee: number;
  }>;
}

export interface TicketWithOrder {
  id: string;
  ticketCode: string;
  attendeeName: string;
  attendeeLastName: string;
  attendeeDni: string;
  attendeeEmail: string | null;
  price: number;
  status: string;
  checkedInAt: string | Date | null;
  createdAt: string | Date;
  tier: {
    id: string;
    name: string;
    price: number;
  };
  order: {
    id?: string;
    orderNumber: string;
    buyerName: string;
    buyerLastName: string;
    buyerEmail: string;
    buyerPhone: string;
    eventId: string;
    total?: number;
    event: {
      id: string;
      title: string;
    };
  };
}

interface Props {
  events: EventWithDetails[];
  tickets: TicketWithOrder[];
}

export default function AdminEventsManager({ events, tickets }: Props) {
  const router = useRouter();

  // Selected event ID: "all" or event.id
  const [selectedEventId, setSelectedEventId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "USED" | "VALID">("ALL");

  // Estado para eliminar evento
  const [eventToDelete, setEventToDelete] = useState<EventWithDetails | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);

  // Estado para eliminar venta / entrada de prueba
  const [saleToDelete, setSaleToDelete] = useState<TicketWithOrder | null>(null);
  const [isDeletingSale, setIsDeletingSale] = useState(false);
  const [saleActionSuccess, setSaleActionSuccess] = useState<string | null>(null);
  const [saleActionError, setSaleActionError] = useState<string | null>(null);

  // Selected event details
  const currentEvent = useMemo(() => {
    if (selectedEventId === "all") return null;
    return events.find((e) => e.id === selectedEventId) || null;
  }, [selectedEventId, events]);

  // Filtered tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter((tkt) => {
      // 1. Event filter
      if (selectedEventId !== "all" && tkt.order.eventId !== selectedEventId) {
        return false;
      }

      // 2. Status filter
      if (statusFilter === "USED" && tkt.status !== "USED") return false;
      if (statusFilter === "VALID" && tkt.status !== "VALID") return false;

      // 3. Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const fullName = `${tkt.attendeeName} ${tkt.attendeeLastName}`.toLowerCase();
        const buyerName = `${tkt.order.buyerName} ${tkt.order.buyerLastName}`.toLowerCase();
        const dni = tkt.attendeeDni.toLowerCase();
        const code = tkt.ticketCode.toLowerCase();
        const orderNum = tkt.order.orderNumber.toLowerCase();

        return (
          fullName.includes(q) ||
          buyerName.includes(q) ||
          dni.includes(q) ||
          code.includes(q) ||
          orderNum.includes(q)
        );
      }

      return true;
    });
  }, [tickets, selectedEventId, statusFilter, searchQuery]);

  // Event specific or global stats
  const stats = useMemo(() => {
    const relevantTickets =
      selectedEventId === "all"
        ? tickets
        : tickets.filter((t) => t.order.eventId === selectedEventId);

    const totalSold = relevantTickets.length;
    const checkedIn = relevantTickets.filter((t) => t.status === "USED").length;
    const revenue = relevantTickets.reduce((acc, t) => acc + t.price, 0);

    let totalCapacity = 0;
    if (currentEvent) {
      totalCapacity = currentEvent.tiers.reduce((acc, t) => acc + t.capacity, 0);
    } else {
      totalCapacity = events.reduce(
        (acc, e) => acc + e.tiers.reduce((sub, t) => sub + t.capacity, 0),
        0
      );
    }

    const attendanceRate = totalSold > 0 ? Math.round((checkedIn / totalSold) * 100) : 0;
    const remainingCapacity = Math.max(0, totalCapacity - totalSold);

    return {
      totalSold,
      checkedIn,
      revenue,
      totalCapacity,
      attendanceRate,
      remainingCapacity,
    };
  }, [tickets, events, selectedEventId, currentEvent]);

  // Estados para modal y copiado de Google Sheets
  const [sheetsNotification, setSheetsNotification] = useState<string | null>(null);
  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState(false);
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);

  // Copiar formato TSV (para pegar nativamente en Google Sheets)
  const handleCopyTsv = async () => {
    if (filteredTickets.length === 0) return;

    const headers = [
      "N° Orden",
      "Nombre Asistente",
      "Apellido Asistente",
      "DNI Asistente",
      "Email Comprador",
      "Evento",
      "Sector / Tanda",
      "Precio ($)",
      "Código QR",
      "Estado Ingreso",
      "Hora Ingreso",
    ];

    const rows = filteredTickets.map((t) => [
      t.order.orderNumber,
      t.attendeeName,
      t.attendeeLastName,
      t.attendeeDni,
      t.order.buyerEmail,
      t.order.event.title,
      t.tier.name,
      t.price === 0 ? "GRATIS" : t.price,
      t.ticketCode,
      t.status === "USED" ? "INGRESÓ" : "SIN INGRESAR",
      t.checkedInAt
        ? `${new Date(t.checkedInAt).getHours().toString().padStart(2, "0")}:${new Date(t.checkedInAt).getMinutes().toString().padStart(2, "0")} hs`
        : "N/A",
    ]);

    const tsvContent = [headers.join("\t"), ...rows.map((r) => r.join("\t"))].join("\n");

    try {
      await navigator.clipboard.writeText(tsvContent);
      setCopiedToClipboard(true);
      setTimeout(() => setCopiedToClipboard(false), 4000);
      return true;
    } catch {
      return false;
    }
  };

  // Abrir modal y preparar datos de Google Sheets
  const handleOpenGoogleSheets = async () => {
    await handleCopyTsv();
    setIsSheetsModalOpen(true);
  };

  // Exportar archivo Excel nativo (.xlsx) para abrir en Excel o subir a Google Drive
  const handleExportExcel = () => {
    if (filteredTickets.length === 0) return;

    const data = filteredTickets.map((t) => ({
      "N° Orden": t.order.orderNumber,
      "Nombre": t.attendeeName,
      "Apellido": t.attendeeLastName,
      "DNI": t.attendeeDni,
      "Email Comprador": t.order.buyerEmail,
      "Evento": t.order.event.title,
      "Sector / Tanda": t.tier.name,
      "Precio ($)": t.price === 0 ? "GRATIS" : t.price,
      "Código QR": t.ticketCode,
      "Estado Ingreso": t.status === "USED" ? "INGRESÓ" : "SIN INGRESAR",
      "Hora Ingreso": t.checkedInAt
        ? `${new Date(t.checkedInAt).getHours().toString().padStart(2, "0")}:${new Date(t.checkedInAt).getMinutes().toString().padStart(2, "0")} hs`
        : "N/A",
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);

    // Ajustar anchos automáticos de columnas
    worksheet["!cols"] = [
      { wch: 16 }, // N° Orden
      { wch: 18 }, // Nombre
      { wch: 18 }, // Apellido
      { wch: 12 }, // DNI
      { wch: 30 }, // Email Comprador
      { wch: 32 }, // Evento
      { wch: 24 }, // Sector / Tanda
      { wch: 12 }, // Precio
      { wch: 18 }, // Código QR
      { wch: 16 }, // Estado Ingreso
      { wch: 16 }, // Hora Ingreso
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Asistentes");

    const filename = currentEvent
      ? `asistentes-${currentEvent.slug}.xlsx`
      : "asistentes-todos-los-eventos.xlsx";

    XLSX.writeFile(workbook, filename);
  };

  // Export to CSV for Excel / Google Drive upload
  const handleExportCsv = () => {
    if (filteredTickets.length === 0) return;

    const headers = [
      "Orden",
      "Asistente Nombre",
      "Asistente Apellido",
      "DNI",
      "Email Comprador",
      "Evento",
      "Sector",
      "Precio ($)",
      "Codigo QR",
      "Estado Ingreso",
      "Fecha Ingreso",
    ];

    const rows = filteredTickets.map((t) => [
      `"${t.order.orderNumber}"`,
      `"${t.attendeeName}"`,
      `"${t.attendeeLastName}"`,
      `"${t.attendeeDni}"`,
      `"${t.order.buyerEmail}"`,
      `"${t.order.event.title.replace(/"/g, '""')}"`,
      `"${t.tier.name}"`,
      t.price === 0 ? '"GRATIS"' : t.price,
      `"${t.ticketCode}"`,
      t.status === "USED" ? "INGRESÓ" : "SIN INGRESAR",
      t.checkedInAt ? `"${new Date(t.checkedInAt).toLocaleString("es-AR")}"` : "N/A",
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const filename = currentEvent
      ? `asistentes-${currentEvent.slug}.csv`
      : "asistentes-todos-los-eventos.csv";
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Confirmar eliminación de evento
  const handleDeleteConfirm = async () => {
    if (!eventToDelete) return;
    setIsDeleting(true);
    setDeleteError(null);

    try {
      const res = await fetch(`/api/admin/events/${eventToDelete.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Error al eliminar el evento.");
      }

      setDeleteSuccess(data.message || "Evento eliminado exitosamente.");
      const deletedId = eventToDelete.id;
      setEventToDelete(null);
      if (selectedEventId === deletedId) {
        setSelectedEventId("all");
      }
      router.refresh();
      setTimeout(() => setDeleteSuccess(null), 5000);
    } catch (err: unknown) {
      setDeleteError((err as Error).message);
    } finally {
      setIsDeleting(false);
    }
  };

  // Confirmar eliminación de venta/orden
  const handleDeleteSaleConfirm = async () => {
    if (!saleToDelete) return;
    setIsDeletingSale(true);
    setSaleActionError(null);

    try {
      const orderId = saleToDelete.order.id || saleToDelete.order.orderNumber;
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Error al eliminar la venta.");
      }

      setSaleActionSuccess(data.message || `Orden #${saleToDelete.order.orderNumber} eliminada exitosamente.`);
      setSaleToDelete(null);
      router.refresh();
      setTimeout(() => setSaleActionSuccess(null), 6000);
    } catch (err: unknown) {
      setSaleActionError((err as Error).message);
    } finally {
      setIsDeletingSale(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. Selector de Eventos */}
      <div className="bg-[#0F121C] border border-[#1E253A] rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1C2236]">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#FFE600]" />
            <h2 className="text-sm font-black uppercase text-white tracking-wider">
              Seleccionar Evento para Gestionar
            </h2>
          </div>
          <span className="text-xs text-[#94A3B8]">
            {events.length} eventos en catálogo
          </span>
        </div>

        {/* Event Pills / Tabs */}
        <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedEventId("all")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 ${
              selectedEventId === "all"
                ? "bg-[#FFE600] text-black shadow-lg shadow-[#FFE600]/20 font-black"
                : "bg-[#141828] text-gray-300 hover:text-white hover:bg-[#1C2238] border border-[#222A42]"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Todos los Eventos ({tickets.length} ventas)
          </button>

          {events.map((evt) => {
            const isSelected = selectedEventId === evt.id;
            const evtSold = evt.tiers.reduce((acc, t) => acc + t.sold, 0);

            return (
              <button
                key={evt.id}
                type="button"
                onClick={() => setSelectedEventId(evt.id)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 ${
                  isSelected
                    ? "bg-[#FFE600] text-black shadow-lg shadow-[#FFE600]/20 font-black"
                    : "bg-[#141828] text-gray-300 hover:text-white hover:bg-[#1C2238] border border-[#222A42]"
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span className="truncate max-w-[200px]">{evt.title}</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full ${
                    isSelected
                      ? "bg-black/20 text-black font-extrabold"
                      : "bg-[#1F263D] text-[#38BDF8]"
                  }`}
                >
                  {evtSold}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Resumen & Stock de Entradas del Evento Seleccionado */}
      <div className="bg-[#0F121C] border border-[#1E253A] rounded-2xl p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1C2236]">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-[#38BDF8]">
              {currentEvent ? "Disponibilidad y Cupos del Evento" : "Métricas Globales"}
            </span>
            <h3 className="text-xl font-black text-white mt-0.5">
              {currentEvent ? currentEvent.title : "Todos los Eventos Combinados"}
            </h3>
            {currentEvent && (
              <p className="text-xs text-[#94A3B8] mt-1">
                📍 {currentEvent.venue}, {currentEvent.city} • Fecha:{" "}
                <span suppressHydrationWarning>
                  {new Date(currentEvent.date).toLocaleDateString("es-AR")}
                </span>
              </p>
            )}
          </div>

          {currentEvent && (
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/eventos/${currentEvent.slug}`}
                target="_blank"
                className="px-3.5 py-1.5 rounded-lg bg-[#181C2E] hover:bg-[#222840] border border-[#2A3452] text-xs font-bold text-gray-300 hover:text-white flex items-center gap-1.5 w-fit transition-colors"
                title="Ver página pública del show"
              >
                <ExternalLink className="w-3.5 h-3.5 text-[#38BDF8]" />
                Ver Show
              </Link>

              <Link
                href={`/admin/eventos/${currentEvent.id}/editar`}
                className="px-3.5 py-1.5 rounded-lg bg-[#FFE600]/15 hover:bg-[#FFE600]/25 border border-[#FFE600]/40 text-xs font-bold text-[#FFE600] flex items-center gap-1.5 w-fit transition-colors"
                title="Editar información, afiche o tandas de precios"
              >
                <Pencil className="w-3.5 h-3.5" />
                Editar Evento
              </Link>

              <button
                type="button"
                onClick={() => setEventToDelete(currentEvent)}
                className="px-3.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-xs font-bold text-red-400 hover:text-red-300 flex items-center gap-1.5 w-fit transition-colors cursor-pointer"
                title="Eliminar este evento de la base de datos"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Eliminar
              </button>
            </div>
          )}
        </div>

        {deleteSuccess && (
          <div className="bg-emerald-500/15 border border-emerald-500/30 rounded-xl p-3.5 flex items-center gap-2 text-emerald-300 text-xs animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{deleteSuccess}</span>
          </div>
        )}

        {/* Métricas rápidas del evento */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-[#141828] border border-[#21273C] p-4 rounded-xl space-y-1">
            <span className="text-[10px] uppercase font-bold text-[#64748B] block">
              Recaudación
            </span>
            <div className="text-lg sm:text-xl font-black text-[#FFE600]">
              {currentEvent && currentEvent.tiers.every((t) => t.price === 0)
                ? "$0 (Gratuito)"
                : `$${stats.revenue.toLocaleString("es-AR")}`}
            </div>
          </div>

          <div className="bg-[#141828] border border-[#21273C] p-4 rounded-xl space-y-1">
            <span className="text-[10px] uppercase font-bold text-[#64748B] block">
              Entradas Vendidas
            </span>
            <div className="text-lg sm:text-xl font-black text-white">
              {stats.totalSold}{" "}
              <span className="text-xs text-[#94A3B8] font-normal">
                / {stats.totalCapacity}
              </span>
            </div>
          </div>

          <div className="bg-[#141828] border border-[#21273C] p-4 rounded-xl space-y-1">
            <span className="text-[10px] uppercase font-bold text-[#64748B] block">
              Entradas Restantes
            </span>
            <div className="text-lg sm:text-xl font-black text-emerald-400">
              {stats.remainingCapacity} disp.
            </div>
          </div>

          <div className="bg-[#141828] border border-[#21273C] p-4 rounded-xl space-y-1">
            <span className="text-[10px] uppercase font-bold text-[#64748B] block">
              Ingresaron en Puerta
            </span>
            <div className="text-lg sm:text-xl font-black text-[#38BDF8]">
              {stats.checkedIn}{" "}
              <span className="text-xs text-[#94A3B8] font-normal">
                ({stats.attendanceRate}%)
              </span>
            </div>
          </div>
        </div>

        {/* Desglose por Tanda / Sector (si hay un evento seleccionado) */}
        {currentEvent && (
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-[#94A3B8] flex items-center gap-1.5">
              <Ticket className="w-3.5 h-3.5 text-[#FFE600]" />
              Stock de Entradas por Tanda
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentEvent.tiers.map((tier) => {
                const available = Math.max(0, tier.capacity - tier.sold);
                const pct = tier.capacity > 0 ? Math.round((tier.sold / tier.capacity) * 100) : 0;
                const tierRevenue = tier.sold * tier.price;
                const isSoldOut = available === 0 || tier.status === "SOLD_OUT";

                return (
                  <div
                    key={tier.id}
                    className="bg-[#141828] border border-[#21273C] rounded-xl p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h5 className="font-extrabold text-sm text-white">
                          {tier.name}
                        </h5>
                        {tier.price === 0 ? (
                          <span className="text-xs font-black text-emerald-400 block mt-0.5">
                            GRATIS (Sin costo)
                          </span>
                        ) : (
                          <span className="text-xs font-black text-[#FFE600] block mt-0.5">
                            ${tier.price.toLocaleString("es-AR")}{" "}
                            <span className="text-[10px] text-gray-400 font-normal">c/u</span>
                          </span>
                        )}
                      </div>
                      {isSoldOut ? (
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                          Agotado
                        </span>
                      ) : (
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          {available} disponibles
                        </span>
                      )}
                    </div>

                    {/* Progress bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-gray-300">
                        <span>Vendidas: <strong>{tier.sold}</strong> / {tier.capacity}</span>
                        <span className="font-bold text-[#38BDF8]">{pct}%</span>
                      </div>
                      <div className="w-full h-2 bg-[#090A10] rounded-full overflow-hidden border border-[#21273C]">
                        <div
                          className="h-full bg-gradient-to-r from-[#FFE600] to-[#FF2E4C] rounded-full"
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#1C2236] flex justify-between text-[11px] text-[#64748B]">
                      <span>Recaudado en esta tanda:</span>
                      <span className="font-bold text-gray-200">
                        ${tierRevenue.toLocaleString("es-AR")}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 3. Tabla de Compradores & Asistentes Filtrada */}
      <div className="bg-[#0F121C] border border-[#1E253A] rounded-2xl p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#1C2236]">
          <div>
            <h3 className="text-lg font-black uppercase text-white tracking-wide flex items-center gap-2">
              <Users className="w-5 h-5 text-[#38BDF8]" />
              Lista de Compradores & Asistentes ({filteredTickets.length})
            </h3>
            <p className="text-xs text-[#94A3B8] mt-0.5">
              {currentEvent
                ? `Mostrando únicamente compradores de ${currentEvent.title}`
                : "Mostrando todas las compras de todos los eventos"}
            </p>
          </div>

          {/* Export buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Descargar Excel (.xlsx) */}
            <button
              onClick={handleExportExcel}
              disabled={filteredTickets.length === 0}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-emerald-600/20 disabled:opacity-40"
              title="Descargar archivo Excel (.xlsx) que abre directo en Excel o sube a Google Drive"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Descargar Excel (.xlsx)
            </button>

            {/* Abrir en Google Sheets (con modal explicativo) */}
            <button
              onClick={handleOpenGoogleSheets}
              disabled={filteredTickets.length === 0}
              className="px-3.5 py-2 rounded-xl bg-[#1A2035] hover:bg-[#252E4C] text-emerald-300 hover:text-emerald-200 border border-emerald-500/40 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer disabled:opacity-40"
              title="Abre el asistente para pegar los datos en Google Sheets"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              Pegar en Google Sheets
              <ExternalLink className="w-3 h-3 text-emerald-400/70" />
            </button>

            {/* Descargar CSV */}
            <button
              onClick={handleExportCsv}
              disabled={filteredTickets.length === 0}
              className="px-3 py-2 rounded-xl bg-[#141828] hover:bg-[#1C2236] text-gray-400 hover:text-white border border-[#21273C] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40"
              title="Descargar archivo .CSV tradicional"
            >
              <Download className="w-3.5 h-3.5 text-gray-400" />
              CSV
            </button>
          </div>
        </div>

        {/* Sale Action Alerts */}
        {saleActionSuccess && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{saleActionSuccess}</span>
            </div>
            <button
              onClick={() => setSaleActionSuccess(null)}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {saleActionError && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-bold flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{saleActionError}</span>
            </div>
            <button
              onClick={() => setSaleActionError(null)}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Filter controls */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1">
          {/* Search */}
          <div className="sm:col-span-8 relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por Nombre, DNI, Código de entrada o # de Orden..."
              className="w-full pl-10 pr-4 py-2.5 bg-[#141828] border border-[#21273C] rounded-xl text-white text-xs focus:border-[#FFE600] outline-none font-mono"
            />
          </div>

          {/* Status filter */}
          <div className="sm:col-span-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "ALL" | "USED" | "VALID")}
              className="w-full px-3 py-2.5 bg-[#141828] border border-[#21273C] rounded-xl text-white text-xs focus:border-[#FFE600] outline-none font-bold"
            >
              <option value="ALL">Todos los Estados</option>
              <option value="USED">✅ Ya ingresaron al predio</option>
              <option value="VALID">⏳ Pendientes de ingreso</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto pt-2">
          {filteredTickets.length > 0 ? (
            <table className="w-full text-left text-xs text-gray-300">
              <thead className="text-[10px] uppercase font-bold text-[#64748B] bg-[#141828] border-y border-[#1E253A] whitespace-nowrap">
                <tr>
                  <th className="py-3 px-4">Titular de la Entrada</th>
                  <th className="py-3 px-4">DNI</th>
                  <th className="py-3 px-4">Evento</th>
                  <th className="py-3 px-4">Sector</th>
                  <th className="py-3 px-4">Comprador</th>
                  <th className="py-3 px-4">Código QR</th>
                  <th className="py-3 px-4">Estado en Puerta</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1B2134] whitespace-nowrap">
                {filteredTickets.map((tkt) => (
                  <tr key={tkt.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-4 font-bold text-white">
                      {tkt.attendeeName} {tkt.attendeeLastName}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[#FFE600] font-bold">
                      {tkt.attendeeDni}
                    </td>
                    <td className="py-3.5 px-4 max-w-xs truncate font-medium">
                      {tkt.order.event.title}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-[#38BDF8]">
                      {tkt.tier.name}
                    </td>
                    <td className="py-3.5 px-4 text-gray-400">
                      {tkt.order.buyerName} {tkt.order.buyerLastName}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-gray-400">
                      {tkt.ticketCode}
                    </td>
                    <td className="py-3.5 px-4">
                      {tkt.status === "USED" ? (
                        <span
                          suppressHydrationWarning
                          className="inline-flex items-center gap-1 text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          Ingresó{" "}
                          {tkt.checkedInAt
                            ? `${new Date(tkt.checkedInAt).getHours().toString().padStart(2, "0")}:${new Date(tkt.checkedInAt).getMinutes().toString().padStart(2, "0")} hs`
                            : ""}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase">
                          Sin Ingresar
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/tickets/${tkt.ticketCode}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 text-[#FFE600] hover:underline font-bold text-xs"
                        >
                          Ver QR
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => setSaleToDelete(tkt)}
                          className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/30 transition-all cursor-pointer"
                          title={`Eliminar venta #${tkt.order.orderNumber} y anular entrada`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-12 text-center text-gray-400 text-xs space-y-2">
              <Ticket className="w-8 h-8 text-gray-600 mx-auto" />
              <p>No se encontraron compras o asistentes con los filtros seleccionados.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Instructivo para Google Sheets & Drive */}
      {isSheetsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0F121C] border border-[#232A42] rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative">
            <button
              onClick={() => setIsSheetsModalOpen(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">
                  Exportar a Google Sheets / Drive
                </h3>
                <p className="text-xs text-[#94A3B8]">
                  Elegí cómo preferís abrir los datos de tus asistentes
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Opción 1: Descargar archivo Excel .xlsx para Drive */}
              <div className="bg-[#141828] border border-[#222A42] rounded-2xl p-4 space-y-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    Método 1 • Recomendado (Sin copiar ni pegar)
                  </span>
                  <h4 className="font-extrabold text-white text-sm mt-2">
                    Descargar archivo Excel (.xlsx)
                  </h4>
                  <p className="text-xs text-gray-300 mt-1 leading-relaxed">
                    Descargás el archivo listo con columnas formateadas. Podés abrirlo con Microsoft Excel o arrastrarlo a tu Google Drive, donde se abre directamente en Google Sheets con un doble clic.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    onClick={() => {
                      handleExportExcel();
                      setIsSheetsModalOpen(false);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center gap-2 transition-colors cursor-pointer shadow-lg shadow-emerald-600/20"
                  >
                    <Download className="w-4 h-4" />
                    Descargar .xlsx Ahora
                  </button>
                  <a
                    href="https://drive.google.com/drive/my-drive"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2.5 rounded-xl bg-[#1A2035] hover:bg-[#252E4C] text-gray-200 text-xs font-bold border border-[#2A3554] flex items-center gap-1.5 transition-colors"
                  >
                    <FolderUp className="w-3.5 h-3.5 text-[#38BDF8]" />
                    Abrir Google Drive
                    <ExternalLink className="w-3 h-3 text-gray-400" />
                  </a>
                </div>
              </div>

              {/* Opción 2: Pegar directo en Google Sheets */}
              <div className="bg-[#141828] border border-[#222A42] rounded-2xl p-4 space-y-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#FFE600] bg-[#FFE600]/10 px-2 py-0.5 rounded border border-[#FFE600]/20">
                    Método 2 • Pegar en una hoja nueva de Google
                  </span>
                  <p className="text-xs text-gray-300 mt-2 leading-relaxed">
                    Por seguridad y privacidad de tu cuenta de Google, ninguna web externa puede escribir dentro de tu Drive sin pedirte contraseñas de desarrollador. Pero podés pasarlo en 3 pasos:
                  </p>
                </div>

                <div className="text-xs text-gray-200 space-y-2.5 bg-[#0C0E17] p-3.5 rounded-xl border border-[#1E253A]">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[10px] flex items-center justify-center shrink-0">1</span>
                      <span>Copiar datos:</span>
                    </span>
                    <button
                      onClick={handleCopyTsv}
                      className="px-3 py-1.5 rounded-lg bg-[#1F263D] hover:bg-[#2A3452] border border-[#2D385A] text-[11px] font-bold text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {copiedToClipboard ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">¡Copiado al portapapeles!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-gray-400" />
                          <span>Copiar al portapapeles</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[10px] flex items-center justify-center shrink-0">2</span>
                      <span>Abrir hoja en blanco:</span>
                    </span>
                    <a
                      href="https://sheets.new"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-[11px] font-bold text-emerald-300 flex items-center gap-1.5 transition-colors"
                    >
                      Abrir pestaña de Sheets
                      <ExternalLink className="w-3 h-3 text-emerald-400" />
                    </a>
                  </div>

                  <div className="flex items-start gap-2 pt-1 border-t border-white/5">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">3</span>
                    <span className="text-[11px] text-gray-300">
                      En la hoja de Google Sheets, hacé clic en la celda <strong>A1</strong> y presioná <kbd className="px-1.5 py-0.5 bg-black/60 border border-white/20 rounded font-mono text-[10px] font-bold text-white">Ctrl + V</kbd> (o clic derecho ➔ Pegar).
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsSheetsModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-[#1A2035] hover:bg-[#252E4C] text-gray-300 text-xs font-bold transition-colors cursor-pointer"
              >
                Entendido, cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación para Eliminar Evento */}
      {eventToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0F121C] border border-[#2B1B22] rounded-3xl max-w-md w-full p-6 sm:p-7 space-y-5 shadow-2xl relative">
            <button
              onClick={() => {
                if (!isDeleting) {
                  setEventToDelete(null);
                  setDeleteError(null);
                }
              }}
              disabled={isDeleting}
              className="absolute top-5 right-5 text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-30"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">
                  ¿Eliminar Evento?
                </h3>
                <p className="text-xs text-red-400 font-medium">
                  Esta acción no se puede deshacer
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-gray-300 bg-[#141824] p-4 rounded-xl border border-[#21273C]">
              <p>
                Estás a punto de eliminar definitivamente:
              </p>
              <p className="font-black text-white text-sm">
                "{eventToDelete.title}"
              </p>
              <p className="text-[11px] text-[#94A3B8]">
                Se eliminarán el evento, sus tandas de precios, los registros de entradas emitidas y las estadísticas asociadas.
              </p>
            </div>

            {deleteError && (
              <div className="bg-red-500/15 border border-red-500/30 p-3 rounded-xl text-red-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setEventToDelete(null);
                  setDeleteError(null);
                }}
                disabled={isDeleting}
                className="px-4 py-2.5 rounded-xl bg-[#1A2035] hover:bg-[#252E4C] text-gray-300 hover:text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-40"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-red-600/30 disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Eliminando...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Sí, Eliminar Evento
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Eliminar Venta / Anular Entrada */}
      {saleToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#15130F] border-2 border-red-500/40 rounded-3xl max-w-md w-full p-6 sm:p-7 space-y-5 shadow-[0_0_50px_rgba(239,68,68,0.25)] relative">
            <button
              onClick={() => {
                if (!isDeletingSale) {
                  setSaleToDelete(null);
                  setSaleActionError(null);
                }
              }}
              disabled={isDeletingSale}
              className="absolute top-5 right-5 text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-30"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white uppercase tracking-wide">
                  ¿Eliminar Venta?
                </h3>
                <p className="text-xs text-red-400 font-medium">
                  Se descontará del total y se liberará el cupo
                </p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs bg-[#0D0C0A] p-4 rounded-xl border border-[#2E2820]">
              <div className="flex justify-between items-center pb-2 border-b border-[#221D17]">
                <span className="text-[#8F8270]">Orden:</span>
                <span className="font-mono text-amber-300 font-bold">#{saleToDelete.order.orderNumber}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#8F8270]">Titular:</span>
                <span className="font-bold text-[#FAF6EE]">{saleToDelete.attendeeName} {saleToDelete.attendeeLastName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#8F8270]">DNI:</span>
                <span className="font-mono text-[#FAF6EE]">{saleToDelete.attendeeDni}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#8F8270]">Evento:</span>
                <span className="text-[#FAF6EE] font-medium truncate max-w-[200px]">{saleToDelete.order.event.title}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#8F8270]">Sector:</span>
                <span className="text-[#38BDF8] font-semibold">{saleToDelete.tier.name}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-[#221D17]">
                <span className="text-[#8F8270]">Monto Entrada:</span>
                <span className="text-emerald-400 font-bold">${saleToDelete.price.toLocaleString("es-AR")}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#8F8270]">Código Ticket:</span>
                <span className="font-mono text-[11px] text-[#8F8270]">{saleToDelete.ticketCode}</span>
              </div>
            </div>

            <p className="text-[11px] text-[#8F8270] leading-relaxed">
              ⚠️ Al confirmar, se eliminará esta orden de la base de datos, el monto dejará de sumar en la recaudación del panel y la entrada quedará inválida para ingresar en puerta.
            </p>

            {saleActionError && (
              <div className="bg-red-500/15 border border-red-500/30 p-3 rounded-xl text-red-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{saleActionError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setSaleToDelete(null);
                  setSaleActionError(null);
                }}
                disabled={isDeletingSale}
                className="px-4 py-2.5 rounded-xl bg-[#201C16] hover:bg-[#2A241C] text-[#CEC1AD] hover:text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-40 border border-[#332B21]"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleDeleteSaleConfirm}
                disabled={isDeletingSale}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-red-600/30 disabled:opacity-50 active:scale-95"
              >
                {isDeletingSale ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Eliminando...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Sí, Eliminar Venta
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
