"use client";

import { useRef, useState } from "react";
import { Upload, X, Loader2, Link as LinkIcon } from "lucide-react";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  aspectRatio?: "vertical" | "horizontal";
  helperText?: string;
  required?: boolean;
}

export default function ImageUpload({
  value,
  onChange,
  label = "Imagen de Portada (Afiche)",
  aspectRatio = "vertical",
  helperText,
  required = false,
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [mode, setMode] = useState<"upload" | "url">(value && !value.startsWith("blob:") ? "url" : "upload");

  const handleFileUpload = async (file: File) => {
    setUploadError(null);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al subir la imagen.");
      }

      onChange(data.url);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error desconocido al subir la imagen.";
      setUploadError(msg);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      handleFileUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <div>
          <label className="text-xs font-bold text-gray-300">
            {label} {required && <span className="text-amber-400">*</span>}
          </label>
          {helperText && (
            <p className="text-[11px] text-gray-400">{helperText}</p>
          )}
        </div>
        <div className="flex items-center self-start sm:self-auto bg-[#161B2B] rounded-lg border border-[#232B45] overflow-hidden">
          <button
            type="button"
            onClick={() => setMode("upload")}
            className={`px-3 py-1 text-[10px] font-bold transition-colors ${
              mode === "upload"
                ? "bg-[#FFE600] text-black"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Upload className="w-3 h-3 inline mr-1" />
            Subir PC
          </button>
          <button
            type="button"
            onClick={() => setMode("url")}
            className={`px-3 py-1 text-[10px] font-bold transition-colors ${
              mode === "url"
                ? "bg-[#FFE600] text-black"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <LinkIcon className="w-3 h-3 inline mr-1" />
            Pegar URL
          </button>
        </div>
      </div>

      {mode === "upload" ? (
        <>
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
              dragOver
                ? "border-[#FFE600] bg-[#FFE600]/5"
                : isUploading
                ? "border-[#232B45] bg-[#0D1018]"
                : "border-[#232B45] hover:border-[#FFE600]/50 hover:bg-[#161B2B]/50"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleFileChange}
              className="hidden"
            />

            {isUploading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-8 h-8 text-[#FFE600] animate-spin" />
                <span className="text-xs text-gray-400">Subiendo imagen a la nube...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="w-8 h-8 text-gray-500" />
                <span className="text-xs text-gray-400">
                  <span className="text-[#FFE600] font-bold">Hacé clic para elegir de tu PC</span> o arrastrala acá
                </span>
                <span className="text-[10px] text-gray-500">
                  {aspectRatio === "horizontal"
                    ? "Formato apaisado / horizontal recomendado (16:9 o 21:9) • JPG, PNG, WebP • Máx 4.5MB"
                    : "Formato afiche / flyer (vertical o cuadrado) • JPG, PNG, WebP • Máx 4.5MB"}
                </span>
              </div>
            )}
          </div>
        </>
      ) : (
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://images.unsplash.com/... o https://..."
          className="w-full px-4 py-2.5 bg-[#161B2B] border border-[#232B45] rounded-xl text-white text-sm focus:border-[#FFE600] outline-none font-mono text-xs"
        />
      )}

      {uploadError && (
        <div className="flex items-center gap-2 text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          <X className="w-3.5 h-3.5 shrink-0" />
          {uploadError}
        </div>
      )}

      {value && (
        <div className="flex items-center gap-3 p-3 bg-[#111422] rounded-xl border border-white/5">
          <div
            className={`rounded-lg overflow-hidden border border-white/10 bg-[#080A10] shrink-0 ${
              aspectRatio === "horizontal"
                ? "w-32 h-16 sm:w-40 sm:h-20"
                : "w-16 h-20"
            }`}
          >
            <img
              src={value}
              alt="Preview"
              className="w-full h-full object-cover"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-xs font-semibold text-gray-300 block">
              {aspectRatio === "horizontal"
                ? "Banner Horizontal (Cabecera del evento)"
                : "Afiche / Portada (Cartelera)"}
            </span>
            <span className="text-[10px] text-gray-500 block truncate font-mono mt-0.5">{value}</span>
            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 mt-1">
              ✓ Imagen cargada correctamente
            </span>
          </div>
          <button
            type="button"
            onClick={() => onChange("")}
            className="p-2 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors shrink-0"
            title="Quitar imagen"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
