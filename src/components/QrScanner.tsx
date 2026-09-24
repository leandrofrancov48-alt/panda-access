"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import {
  Camera,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Volume2,
  VolumeX,
  Search,
  RefreshCw,
  Zap,
  Clock,
  FlipHorizontal,
  UploadCloud,
  HelpCircle,
  Sparkles,
} from "lucide-react";

interface ScanResult {
  status: "VALID" | "ALREADY_USED" | "INVALID" | "ERROR";
  message: string;
  ticket?: {
    id: string;
    ticketCode: string;
    attendeeName: string;
    attendeeLastName: string;
    attendeeDni: string;
    status: string;
    checkedInAt?: string | null;
    tier: {
      name: string;
      price: number;
    };
    order: {
      orderNumber: string;
    };
  };
  event?: {
    title: string;
    venue: string;
  };
}

export default function QrScanner() {
  const [isScanning, setIsScanning] = useState(false);
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>("");
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [manualCode, setManualCode] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [recentScans, setRecentScans] = useState<ScanResult[]>([]);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isProcessingRef = useRef<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const readerElementId = "qr-reader-viewport";

  // Web Audio Synth for instant feedback without external audio files
  const playSound = (type: "VALID" | "ALREADY_USED" | "INVALID") => {
    if (!soundEnabled) return;
    try {
      const AudioContextClass =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioContextClass();

      if (type === "VALID") {
        // High melodic double chime (C6 -> G6)
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = "sine";
        osc1.frequency.setValueAtTime(1046.5, ctx.currentTime); // C6
        osc1.frequency.setValueAtTime(1567.98, ctx.currentTime + 0.12); // G6
        gain1.gain.setValueAtTime(0.3, ctx.currentTime);
        gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start();
        osc1.stop(ctx.currentTime + 0.35);
      } else if (type === "ALREADY_USED") {
        // Warning dual buzz (two mid-low tones)
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(320, ctx.currentTime);
        osc.frequency.setValueAtTime(260, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      } else {
        // Invalid low error buzz
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "square";
        osc.frequency.setValueAtTime(180, ctx.currentTime);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      }
    } catch {
      // Audio context might be restricted before user gesture
    }
  };

  const handleValidateCode = useCallback(async (rawCode: string) => {
    const code = rawCode.trim();
    if (!code || isProcessingRef.current) return;

    isProcessingRef.current = true;
    setIsProcessing(true);

    // Pause video scanner feed while verifying to avoid duplicate requests
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        scannerRef.current.pause(true);
      } catch (e) {
        console.warn("Error pausing scanner:", e);
      }
    }

    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      const data: ScanResult = await res.json();
      setScanResult(data);
      playSound(data.status as "VALID" | "ALREADY_USED" | "INVALID");

      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(data.status === "VALID" ? 150 : [80, 50, 80]);
      }

      setRecentScans((prev) => [data, ...prev.slice(0, 9)]);
    } catch (err) {
      console.error("Validation error:", err);
      const errResult: ScanResult = {
        status: "ERROR",
        message: "Error de conexión al verificar entrada. Comprueba tu conexión a internet.",
      };
      setScanResult(errResult);
    } finally {
      setIsProcessing(false);
    }
  }, [soundEnabled]);

  const stopCamera = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
      } catch (err) {
        console.error("Stop camera error:", err);
      }
    }
    setIsScanning(false);
  };

  const startCamera = async (cameraId?: string, preferredFacing?: "environment" | "user") => {
    try {
      setCameraError(null);

      // Stop any existing instance cleanly
      await stopCamera();

      // Brief delay to allow iOS Safari (WebKit) to fully release previous media stream tracks
      await new Promise((resolve) => setTimeout(resolve, 150));

      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(readerElementId, {
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
          verbose: false,
        });
      }

      const activeFacing = preferredFacing || facingMode;
      const targetCameraId = cameraId !== undefined ? cameraId : selectedCamera;
      const hasSpecificCamera = Boolean(targetCameraId && targetCameraId !== "");

      let cameraConfig: any;
      const scanConfig: any = {
        fps: 12,
        disableFlip: activeFacing === "environment",
        qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
          const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
          const size = Math.floor(minEdge * 0.72);
          return { width: size, height: size };
        },
      };

      if (hasSpecificCamera) {
        cameraConfig = targetCameraId;
      } else if (activeFacing === "environment") {
        cameraConfig = { facingMode: "environment" };
      } else {
        cameraConfig = { facingMode: "user" };
      }

      await scannerRef.current.start(
        cameraConfig,
        scanConfig,
        (decodedText) => {
          handleValidateCode(decodedText);
        },
        () => {
          // Frame evaluation - normal when QR is not yet aligned
        }
      );

      setIsScanning(true);

      // Once permission is granted, enumerate actual cameras to show options
      try {
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length > 0) {
          setCameras(devices);
        }
      } catch (e) {
        console.warn("Could not enumerate cameras:", e);
      }
    } catch (err: unknown) {
      console.error("Start camera error:", err);
      const errMsg = err instanceof Error ? err.message : String(err);
      if (errMsg.includes("NotAllowedError") || errMsg.includes("Permission")) {
        setCameraError(
          "Permiso de cámara denegado. Para escanear, habilita los permisos de cámara en la configuración de tu navegador."
        );
      } else if (errMsg.includes("NotFoundError") || errMsg.includes("DevicesNotFoundError")) {
        setCameraError("No se encontró ninguna cámara disponible en este dispositivo.");
      } else {
        setCameraError("No se pudo iniciar la cámara. Verifica que ninguna otra app la esté usando.");
      }
      setIsScanning(false);
    }
  };

  const handleToggleCamera = async () => {
    const nextFacing = facingMode === "environment" ? "user" : "environment";
    setFacingMode(nextFacing);
    setSelectedCamera("");

    // If cameras were already enumerated on this device, look for the best matching device
    let matchedDevice: string | undefined = undefined;
    if (cameras.length > 0) {
      if (nextFacing === "environment") {
        const backCam =
          cameras.find((c) => {
            const l = (c.label || "").toLowerCase();
            return (
              (l.includes("back") ||
                l.includes("trasera") ||
                l.includes("rear") ||
                l.includes("environment")) &&
              !l.includes("ultra")
            );
          }) ||
          cameras.find((c) => {
            const l = (c.label || "").toLowerCase();
            return l.includes("back") || l.includes("trasera") || l.includes("rear");
          });
        if (backCam) matchedDevice = backCam.id;
      } else {
        const frontCam = cameras.find((c) => {
          const l = (c.label || "").toLowerCase();
          return (
            l.includes("front") ||
            l.includes("frontal") ||
            l.includes("user") ||
            l.includes("selfie")
          );
        });
        if (frontCam) matchedDevice = frontCam.id;
      }
    }

    if (matchedDevice) {
      setSelectedCamera(matchedDevice);
      await startCamera(matchedDevice, nextFacing);
    } else {
      await startCamera(undefined, nextFacing);
    }
  };

  const handleResetForNextScan = () => {
    setScanResult(null);
    isProcessingRef.current = false;
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        scannerRef.current.resume();
      } catch (e) {
        console.warn("Resume error:", e);
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCameraError(null);
    setIsProcessing(true);

    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(readerElementId, {
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
          verbose: false,
        });
      }

      const decodedText = await scannerRef.current.scanFile(file, false);
      handleValidateCode(decodedText);
    } catch (err) {
      console.warn("File scan error:", err);
      setCameraError(
        "No se pudo detectar un código QR claro en la imagen. Prueba subiendo una captura con buena iluminación o mayor nitidez."
      );
      setIsProcessing(false);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode) {
      handleValidateCode(manualCode);
      setManualCode("");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Top Banner & Audio Control */}
      <div className="bg-[#0F121C] border border-[#1E253A] rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h1 className="text-2xl font-black text-white">
              Scanner de Puerta <span className="text-[#FFE600]">• En Vivo</span>
            </h1>
          </div>
          <p className="text-xs text-[#94A3B8] mt-1">
            Control de accesos para eventos de cumbia. Compatible con celulares, tablets y webcams.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="p-2.5 rounded-xl border border-[#21273C] bg-[#141827] hover:bg-[#1C2236] text-gray-300 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Consejos de lectura"
          >
            <HelpCircle className="w-4 h-4 text-[#38BDF8]" />
            <span className="hidden sm:inline">Consejos de lectura</span>
          </button>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs font-bold transition-colors cursor-pointer ${
              soundEnabled
                ? "bg-[#181C2E] border-[#FFE600]/40 text-[#FFE600]"
                : "bg-[#121522] border-[#21273C] text-gray-500"
            }`}
          >
            {soundEnabled ? (
              <>
                <Volume2 className="w-4 h-4" />
                <span className="hidden sm:inline">Sonido Activado</span>
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4" />
                <span className="hidden sm:inline">Sonido Silenciado</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Help Tips Banner (Collapsible) */}
      {showHelp && (
        <div className="bg-[#141A2E] border border-[#2B3A64] rounded-2xl p-4 text-xs text-gray-200 space-y-2 animate-in fade-in duration-200">
          <div className="font-extrabold text-[#FFE600] flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" />
            ¿Cómo asegurar una lectura 100% rápida de los códigos QR?
          </div>
          <ul className="list-disc list-inside space-y-1 text-[#CBD5E1] pl-1">
            <li><strong>Distancia recomendada:</strong> Mantené el celular a unos <strong>20 a 35 cm</strong> de la pantalla o del papel. Si está demasiado cerca, la lente no puede enfocar.</li>
            <li><strong>Brillo de la pantalla:</strong> Si escaneás desde otro celular, pedile al asistente que suba el brillo al máximo.</li>
            <li><strong>Reflejos de luz:</strong> Evitá apuntar de frente contra fuentes de luz o pantallas con reflejos directos.</li>
            <li><strong>Cámara trasera:</strong> El sistema selecciona automáticamente la cámara trasera con autoenfoque.</li>
          </ul>
        </div>
      )}

      {/* Main Scanner Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Camera / Scanner (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-[#0F121C] border border-[#1E253A] rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-widest text-[#94A3B8] flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-[#38BDF8]" />
                Lector Óptico
              </span>

              {/* Camera toggles */}
              <div className="flex items-center gap-2">
                {cameras.length > 1 && (
                  <select
                    value={selectedCamera}
                    onChange={(e) => {
                      const newId = e.target.value;
                      setSelectedCamera(newId);
                      if (newId) {
                        const dev = cameras.find((c) => c.id === newId);
                        const labelLower = (dev?.label || "").toLowerCase();
                        const isFront =
                          labelLower.includes("front") ||
                          labelLower.includes("frontal") ||
                          labelLower.includes("user") ||
                          labelLower.includes("selfie");
                        const newFacing = isFront ? "user" : "environment";
                        setFacingMode(newFacing);
                        if (isScanning) {
                          startCamera(newId, newFacing);
                        }
                      } else {
                        if (isScanning) {
                          startCamera(undefined, facingMode);
                        }
                      }
                    }}
                    className="text-xs bg-[#171B2B] text-white border border-[#252C42] rounded-lg px-2.5 py-1.5 max-w-[180px] sm:max-w-xs truncate"
                  >
                    <option value="">
                      Cámara Automática ({facingMode === "environment" ? "Trasera" : "Frontal"})
                    </option>
                    {cameras.map((c) => {
                      const l = c.label || "";
                      const isBack =
                        l.toLowerCase().includes("back") ||
                        l.toLowerCase().includes("trasera") ||
                        l.toLowerCase().includes("rear");
                      const isFront =
                        l.toLowerCase().includes("front") ||
                        l.toLowerCase().includes("frontal") ||
                        l.toLowerCase().includes("user");
                      const prefix = isBack ? "📷 " : isFront ? "🤳 " : "📹 ";
                      return (
                        <option key={c.id} value={c.id}>
                          {prefix}
                          {l || `Cámara ${c.id.slice(0, 8)}`}
                        </option>
                      );
                    })}
                  </select>
                )}

                <button
                  type="button"
                  onClick={handleToggleCamera}
                  className="px-3 py-1.5 rounded-lg bg-[#181C2E] border border-[#283250] text-gray-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Cambiar entre cámara trasera y frontal"
                >
                  <FlipHorizontal className="w-3.5 h-3.5 text-[#FFE600]" />
                  <span className="text-[11px] font-bold">{facingMode === "environment" ? "Trasera" : "Frontal"}</span>
                </button>
              </div>
            </div>

            {/* Viewport for html5-qrcode */}
            <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-black border-2 border-[#1E253A] flex items-center justify-center">
              <div id={readerElementId} className="w-full h-full" />

              {!isScanning && (
                <div className="absolute inset-0 bg-[#07080C]/90 flex flex-col items-center justify-center p-6 text-center space-y-4 z-10">
                  <div className="w-16 h-16 rounded-2xl bg-[#FFE600]/10 border border-[#FFE600]/30 flex items-center justify-center text-[#FFE600]">
                    <Camera className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-white text-base">
                      Cámara desactivada
                    </h3>
                    <p className="text-xs text-[#94A3B8] mt-1 max-w-xs">
                      Tocá el botón para encender la cámara trasera de tu celular o la cámara web de tu PC.
                    </p>
                  </div>
                  <button
                    onClick={() => startCamera()}
                    className="px-6 py-3 rounded-xl bg-[#FFE600] text-black font-extrabold text-sm shadow-lg shadow-[#FFE600]/20 hover:bg-[#FFF04D] transition-all cursor-pointer"
                  >
                    Activar Cámara en Vivo
                  </button>
                </div>
              )}

              {isScanning && (
                <>
                  {/* Targeting reticle overlay */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-8">
                    <div className="relative w-56 h-56 sm:w-64 sm:h-64 border border-[#FFE600]/30 rounded-2xl">
                      {/* Corner markers */}
                      <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-[#FFE600] rounded-tl-lg" />
                      <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-[#FFE600] rounded-tr-lg" />
                      <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-[#FFE600] rounded-bl-lg" />
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-[#FFE600] rounded-br-lg" />
                      {/* Laser pulse line */}
                      <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-[#FFE600] to-transparent shadow-[0_0_8px_#FFE600] animate-pulse absolute top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  <div className="absolute bottom-3 left-3 right-3 z-10 flex justify-between items-center pointer-events-none">
                    <span className="bg-black/85 backdrop-blur-md px-3 py-1.5 rounded-full text-[11px] font-mono text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 pointer-events-auto">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      Lector activo • Apuntá al QR
                    </span>
                    <button
                      onClick={stopCamera}
                      className="bg-black/85 hover:bg-neutral-800 text-white text-xs px-3 py-1.5 rounded-lg border border-neutral-700 pointer-events-auto cursor-pointer"
                    >
                      Pausar
                    </button>
                  </div>
                </>
              )}
            </div>

            {cameraError && (
              <div className="text-xs text-[#FF2E4C] bg-[#FF2E4C]/10 p-3 rounded-xl border border-[#FF2E4C]/20 leading-relaxed">
                <strong>Aviso:</strong> {cameraError}
              </div>
            )}

            {/* Alternative: Upload Photo / Screenshot of QR */}
            <div className="pt-1 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs border-t border-[#1C2236]">
              <span className="text-[#64748B]">¿Tenés una foto o captura del QR?</span>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="px-3.5 py-1.5 rounded-lg bg-[#141827] hover:bg-[#1E253A] border border-[#232B45] text-gray-200 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40"
              >
                <UploadCloud className="w-3.5 h-3.5 text-[#38BDF8]" />
                Subir foto / captura
              </button>
            </div>

            {/* Manual fallback code input */}
            <form onSubmit={handleManualSubmit} className="pt-2">
              <label className="text-xs font-semibold text-[#94A3B8] block mb-1.5">
                Ingreso manual (por si la pantalla está rota o hay poca luz):
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    placeholder="Código (CT-TKT-...) o DNI del asistente"
                    className="w-full pl-9 pr-3 py-2.5 bg-[#141827] border border-[#21273C] rounded-xl text-white text-sm focus:border-[#FFE600] outline-none font-mono"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!manualCode.trim() || isProcessing}
                  className="px-4 py-2.5 bg-[#1F263D] hover:bg-[#FFE600] hover:text-black text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-40 cursor-pointer"
                >
                  Verificar
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Scan Result & Realtime Feedback (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Result Card */}
          <div className="bg-[#0F121C] border border-[#1E253A] rounded-2xl p-6 min-h-[380px] flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-[#94A3B8] block mb-4">
                Resultado de Verificación
              </span>

              {/* Waiting state */}
              {!scanResult && !isProcessing && (
                <div className="py-16 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-[#181C2E] border border-[#252C42] flex items-center justify-center mx-auto text-gray-500">
                    <Zap className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-gray-300">
                    Listo para escanear
                  </h4>
                  <p className="text-xs text-[#64748B] max-w-xs mx-auto">
                    Apunta la cámara al código QR de la entrada o escribe el código manualmente.
                  </p>
                </div>
              )}

              {/* Loading state */}
              {isProcessing && (
                <div className="py-16 text-center space-y-3">
                  <RefreshCw className="w-8 h-8 text-[#FFE600] animate-spin mx-auto" />
                  <p className="text-sm font-bold text-white">
                    Verificando autenticidad...
                  </p>
                </div>
              )}

              {/* SUCCESS / VALID */}
              {scanResult && !isProcessing && scanResult.status === "VALID" && (
                <div className="space-y-4 animate-in fade-in zoom-in duration-200">
                  <div className="bg-emerald-500/15 border-2 border-emerald-500/40 rounded-2xl p-5 text-center">
                    <CheckCircle2 className="w-14 h-14 text-emerald-400 mx-auto mb-2" />
                    <span className="text-xs uppercase font-black tracking-widest text-emerald-400 block">
                      ¡Acceso Autorizado!
                    </span>
                    <h3 className="text-2xl font-black text-white mt-1">
                      {scanResult.ticket?.attendeeName} {scanResult.ticket?.attendeeLastName}
                    </h3>
                    <p className="text-xs font-mono text-emerald-300 mt-1">
                      DNI: {scanResult.ticket?.attendeeDni}
                    </p>
                  </div>

                  <div className="bg-[#141827] rounded-xl p-4 border border-[#22283D] space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-[#64748B]">Sector / Tanda:</span>
                      <span className="font-bold text-[#38BDF8]">
                        {scanResult.ticket?.tier.name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#64748B]">Evento:</span>
                      <span className="font-semibold text-white truncate max-w-[180px]">
                        {scanResult.event?.title}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#64748B]">Código Entrada:</span>
                      <span className="font-mono text-gray-400">
                        {scanResult.ticket?.ticketCode}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#64748B]">Orden:</span>
                      <span className="font-mono text-gray-300">
                        #{scanResult.ticket?.order.orderNumber}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* ALREADY USED */}
              {scanResult && !isProcessing && scanResult.status === "ALREADY_USED" && (
                <div className="space-y-4 animate-in fade-in zoom-in duration-200">
                  <div className="bg-amber-500/15 border-2 border-amber-500/40 rounded-2xl p-5 text-center">
                    <AlertTriangle className="w-14 h-14 text-amber-400 mx-auto mb-2" />
                    <span className="text-xs uppercase font-black tracking-widest text-amber-400 block">
                      ¡Entrada Ya Utilizada!
                    </span>
                    <h3 className="text-xl font-black text-white mt-1">
                      {scanResult.ticket?.attendeeName} {scanResult.ticket?.attendeeLastName}
                    </h3>
                    <p className="text-xs text-amber-200 mt-1">
                      Esta entrada ya ingresó al predio
                    </p>
                    {scanResult.ticket?.checkedInAt && (
                      <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-mono">
                        <Clock className="w-3.5 h-3.5" />
                        Primer ingreso: {new Date(scanResult.ticket.checkedInAt).toLocaleTimeString("es-AR")} hs
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-[#94A3B8] text-center italic">
                    Posible captura de pantalla repetida o reventa no autorizada.
                  </p>
                </div>
              )}

              {/* INVALID */}
              {scanResult && !isProcessing && (scanResult.status === "INVALID" || scanResult.status === "ERROR") && (
                <div className="space-y-4 animate-in fade-in zoom-in duration-200">
                  <div className="bg-[#FF2E4C]/15 border-2 border-[#FF2E4C]/40 rounded-2xl p-5 text-center">
                    <XCircle className="w-14 h-14 text-[#FF2E4C] mx-auto mb-2" />
                    <span className="text-xs uppercase font-black tracking-widest text-[#FF2E4C] block">
                      Entrada No Válida
                    </span>
                    <h3 className="text-xl font-black text-white mt-1">
                      Código No Encontrado
                    </h3>
                    <p className="text-xs text-red-200 mt-2">
                      {scanResult.message}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Reset button for next scan */}
            {scanResult && (
              <button
                onClick={handleResetForNextScan}
                className="w-full mt-4 py-3.5 rounded-xl bg-[#FFE600] hover:bg-[#FFF04D] text-black font-extrabold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-lg shadow-[#FFE600]/15"
              >
                <RefreshCw className="w-4 h-4" />
                Continuar Escaneando (Siguiente Asistente)
              </button>
            )}
          </div>

          {/* Quick instructions */}
          <div className="bg-[#0B0D14] border border-[#161B2B] rounded-xl p-4 text-xs text-[#64748B] space-y-1.5">
            <p className="font-bold text-gray-400">💡 Instrucciones para el personal de puerta:</p>
            <p>• Pide al asistente que suba el brillo de su celular.</p>
            <p>• Valida siempre el nombre y DNI con su documento de identidad.</p>
            <p>• Si el QR fue reutilizado, el sistema te avisará al instante con alarma sonora.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
