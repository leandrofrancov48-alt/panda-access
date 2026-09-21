"use client";

import { useRef, useState } from "react";
import { Upload, X, Loader2, Link as LinkIcon } from "lucide-react";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
}

export default function ImageUpload({ value, onChange, label = "Imagen de Portada (Afiche)" }: ImageUploadProps) {
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
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-gray-300">{label} *</label>
        <div className="flex items-center bg-[#161B2B] rounded-lg border border-[#232B45] overflow-hidden">
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
            Subir
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
            URL
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
                <span className="text-xs text-gray-400">Subiendo imagen...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="w-8 h-8 text-gray-500" />
                <span className="text-xs text-gray-400">
                  <span className="text-[#FFE600] font-bold">Hacé clic</span> o arrastrá una imagen
                </span>
                <span className="text-[10px] text-gray-600">
                  JPG, PNG, WebP o GIF • Máximo 4.5MB
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
          placeholder="https://images.unsplash.com/..."
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
        <div className="flex items-center gap-3">
          <div className="w-16 h-20 rounded-lg overflow-hidden border border-white/10 bg-[#080A10] shrink-0">
            <img
              src={value}
              alt="Preview"
              className="w-full h-full object-cover"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[11px] text-gray-400 block">Previsualización de portada</span>
            <span className="text-[10px] text-gray-600 block truncate">{value}</span>
          </div>
          <button
            type="button"
            onClick={() => onChange("")}
            className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-colors shrink-0"
            title="Quitar imagen"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
