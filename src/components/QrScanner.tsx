"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import jsQR from "jsqr";
import {
  Camera,
  CheckCircle2,
  AlertTriangle,
  XCircle,
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
  const [recentScans, setRecentScans] = useState<ScanResult[]>([]);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [supportsZoom, setSupportsZoom] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const nativeCameraInputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const cameraSectionRef = useRef<HTMLDivElement>(null);

  // Cooldown system: timestamp-based instead of boolean to prevent permanent lock
  const lastScanTimestampRef = useRef<number>(0);
  const lastScannedCodeRef = useRef<string>("");
  const SCAN_COOLDOWN_MS = 3000; // 3 seconds between scans of the same code
  const SCAN_LOCK_MS = 1500; // 1.5 seconds general lock after any scan starts

  const isScanLocked = () => {
    return Date.now() - lastScanTimestampRef.current < SCAN_LOCK_MS;
  };

  // Apply optical or digital zoom via standard WebRTC track constraints
  const applyZoom = async (zoom: number) => {
    try {
      if (streamRef.current) {
        const track = streamRef.current.getVideoTracks()[0];
        if (track) {
          const capabilities = (track as any).getCapabilities ? (track as any).getCapabilities() : null;
          if (capabilities && capabilities.zoom) {
            const minZ = capabilities.zoom.min || 1;
            const maxZ = capabilities.zoom.max || 5;
            const clamped = Math.min(Math.max(zoom, minZ), maxZ);
            await (track as any).applyConstraints({ advanced: [{ zoom: clamped }] });
            setZoomLevel(clamped);
          }
        }
      }
    } catch (e) {
      console.warn("Zoom error:", e);
    }
  };

  const handleValidateCode = useCallback(async (rawCode: string) => {
    const code = rawCode.trim();
    if (!code) return;

    // Cooldown check: prevent rapid-fire duplicate scans
    const now = Date.now();
    if (now - lastScanTimestampRef.current < SCAN_LOCK_MS) return;
    if (code === lastScannedCodeRef.current && now - lastScanTimestampRef.current < SCAN_COOLDOWN_MS) return;

    // Mark scan timestamp and code immediately
    lastScanTimestampRef.current = now;
    lastScannedCodeRef.current = code;
    setIsProcessing(true);

    try {
      // Fetch with a 8-second timeout so a hung request can't permanently block scanning
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const data: ScanResult = await res.json();
      setScanResult(data);

      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(data.status === "VALID" ? 150 : [80, 50, 80]);
      }

      setRecentScans((prev) => [data, ...prev.slice(0, 49)]);
    } catch (err) {
      console.error("Validation error:", err);
      const errResult: ScanResult = {
        status: "ERROR",
        message: err instanceof DOMException && err.name === "AbortError"
          ? "La verificación tardó demasiado. Reintentá o usá el código manual."
          : "Error de conexión al verificar entrada. Comprueba tu conexión a internet.",
      };
      setScanResult(errResult);
    } finally {
      setIsProcessing(false);
      // Auto-clear result after 4 seconds so scanning resumes automatically
      // The operator doesn't need to press "Siguiente" in a busy door line
      setTimeout(() => {
        setScanResult((prev) => {
          // Only auto-clear if it's the same result (user didn't already clear it)
          if (prev && prev.message) {
            lastScannedCodeRef.current = ""; // Allow same code to be re-scanned
            if (typeof window !== "undefined" && window.innerWidth < 1024) {
              cameraSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
            }
          }
          return null;
        });
      }, 4000);
    }
  }, []);

  // Auto-scroll to verification result when a code is scanned or validated (especially on mobile)
  useEffect(() => {
    if (isProcessing || scanResult) {
      const timer = setTimeout(() => {
        if (typeof window !== "undefined" && window.innerWidth < 1024) {
          resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isProcessing, scanResult]);

  // Flag to suppress watchdog during intentional camera switches
  const isSwitchingCameraRef = useRef<boolean>(false);

  const stopCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
    setSupportsZoom(false);
  };

  const startCamera = async (cameraId?: string, preferredFacing?: "environment" | "user") => {
    try {
      setCameraError(null);
      isSwitchingCameraRef.current = true;

      // Stop existing stream cleanly
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }

      // iOS Safari requires a moment to release hardware lock on the previous sensor
      await new Promise((resolve) => setTimeout(resolve, 250));

      const activeFacing = preferredFacing || facingMode;
      const targetCameraId = cameraId !== undefined ? cameraId : selectedCamera;

      let stream: MediaStream | null = null;

      // Strategy 1: If a specific cameraId was requested, try with ideal deviceId (won't crash on iOS if ID changed)
      if (targetCameraId) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: {
              deviceId: { ideal: targetCameraId },
            },
          });
        } catch (e1) {
          console.warn("Failed getUserMedia with ideal deviceId:", e1);
        }
      }

      // Strategy 2: If no stream yet, use facingMode: { ideal: activeFacing }
      // NOTE: DO NOT specify width/height here! On iOS portrait, width/height can bias Safari to pick front camera instead of rear.
      if (!stream) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: {
              facingMode: { ideal: activeFacing },
            },
          });
        } catch (e2) {
          console.warn("Failed with facingMode ideal:", e2);
          // Fallback: direct string facingMode
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              audio: false,
              video: {
                facingMode: activeFacing,
              },
            });
          } catch (e3) {
            console.warn("Failed with direct facingMode:", e3);
            // Last resort: any video device
            stream = await navigator.mediaDevices.getUserMedia({
              audio: false,
              video: true,
            });
          }
        }
      }

      if (!stream) {
        throw new Error("No se pudo obtener acceso al video de la cámara.");
      }

      streamRef.current = stream;

      if (videoRef.current) {
        const video = videoRef.current;
        // Critical for iOS Safari: must set muted property directly on DOM element
        video.muted = true;
        video.defaultMuted = true;
        video.setAttribute("playsinline", "true");
        video.setAttribute("webkit-playsinline", "true");
        video.srcObject = stream;

        // Start playback with fallback on loadedmetadata
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            console.warn("video.play() failed initially, waiting for onloadedmetadata:", err);
            video.onloadedmetadata = () => {
              video.play().catch((err2) => {
                console.warn("video.play() on metadata also failed:", err2);
              });
            };
          });
        }
      }

      setIsScanning(true);

      // Verify track settings to update state and zoom capabilities
      const track = stream.getVideoTracks()[0];
      if (track) {
        const settings = track.getSettings?.();
        if (settings && settings.facingMode) {
          setFacingMode(settings.facingMode as "environment" | "user");
        }
        if (settings && settings.deviceId) {
          setSelectedCamera(settings.deviceId);
        }

        // Set continuous autofocus if supported
        const capabilities = (track as any).getCapabilities ? (track as any).getCapabilities() : null;
        if (capabilities) {
          if (capabilities.focusMode && capabilities.focusMode.includes("continuous")) {
            try {
              await (track as any).applyConstraints({ advanced: [{ focusMode: "continuous" }] });
            } catch {
              // Ignore focus error
            }
          }
          if (capabilities.zoom) {
            setSupportsZoom(true);
            setZoomLevel(1);
          }
        }
      }

      // Enumerate cameras so the user can choose from all available lenses
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices
          .filter((d) => d.kind === "videoinput")
          .map((d, index) => ({
            id: d.deviceId,
            label: d.label || `Cámara ${index + 1}`,
          }));
        if (videoDevices.length > 0) {
          setCameras(videoDevices);
        }
      } catch (e) {
        console.warn("Could not enumerate cameras:", e);
      }
    } catch (err: unknown) {
      console.error("Start camera error:", err);
      const errMsg = err instanceof Error ? err.message : String(err);
      if (errMsg.includes("NotAllowedError") || errMsg.includes("Permission")) {
        setCameraError(
          "Permiso de cámara denegado. Para escanear, habilita los permisos de cámara en la configuración de Safari / Navegador."
        );
      } else if (errMsg.includes("NotFoundError") || errMsg.includes("DevicesNotFoundError")) {
        setCameraError("No se encontró ninguna cámara disponible en este dispositivo.");
      } else if (errMsg.includes("OverconstrainedError") || errMsg.includes("Overconstrained")) {
        setCameraError("La cámara seleccionada no está disponible. Probá cambiando de cámara.");
      } else {
        setCameraError("No se pudo iniciar la cámara. Verifica que ninguna otra app la esté usando.");
      }
      setIsScanning(false);
    } finally {
      // Keep switching flag on for 1.2s to prevent watchdog from immediately interfering
      setTimeout(() => {
        isSwitchingCameraRef.current = false;
      }, 1200);
    }
  };

  const handleToggleCamera = async () => {
    const nextFacing = facingMode === "environment" ? "user" : "environment";
    setFacingMode(nextFacing);
    setSelectedCamera("");

    // Try to find a matching camera device from enumerated cameras
    let targetId: string | undefined = undefined;
    if (cameras.length > 0) {
      if (nextFacing === "environment") {
        // Find back camera (prefer regular wide 1x, avoid ultra wide 0.5x if possible)
        const backCam =
          cameras.find((c) => {
            const l = (c.label || "").toLowerCase();
            return (
              (l.includes("back") || l.includes("trasera") || l.includes("rear")) &&
              !l.includes("ultra") &&
              !l.includes("0.5")
            );
          }) ||
          cameras.find((c) => {
            const l = (c.label || "").toLowerCase();
            return l.includes("back") || l.includes("trasera") || l.includes("rear");
          });
        if (backCam) targetId = backCam.id;
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
        if (frontCam) targetId = frontCam.id;
      }
    }

    if (targetId) {
      setSelectedCamera(targetId);
      await startCamera(targetId, nextFacing);
    } else {
      await startCamera(undefined, nextFacing);
    }
  };


  // Continuous scanning loop using jsQR + native BarcodeDetector fallback
  useEffect(() => {
    if (!isScanning) return;

    let isLoopRunning = true;
    let lastFrameTime = 0;
    const scanIntervalMs = 100; // ~10 fps scanning — fast enough for instant reads, light on CPU

    const scanFrame = () => {
      if (!isLoopRunning) return;

      const video = videoRef.current;
      if (
        video &&
        video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
        !isScanLocked() &&
        !isProcessing
      ) {
        const now = Date.now();
        if (now - lastFrameTime >= scanIntervalMs) {
          lastFrameTime = now;

          if (!canvasRef.current) {
            canvasRef.current = document.createElement("canvas");
          }
          const canvas = canvasRef.current;
          const vw = video.videoWidth;
          const vh = video.videoHeight;

          if (vw > 0 && vh > 0) {
            // Downsample high-res feeds for fast decoding
            const maxDimension = Math.max(vw, vh);
            const scale = maxDimension > 1280 ? 1280 / maxDimension : 1;
            canvas.width = Math.floor(vw * scale);
            canvas.height = Math.floor(vh * scale);

            const ctx = canvas.getContext("2d", { willReadFrequently: true });
            if (ctx) {
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

              // jsQR — pure JS, works on every browser without exceptions
              const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
              const qrResult = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: "attemptBoth",
              });
              if (qrResult && qrResult.data && !isScanLocked()) {
                handleValidateCode(qrResult.data);
              }
            }
          }
        }
      }

      if (isLoopRunning) {
        animationFrameRef.current = requestAnimationFrame(scanFrame);
      }
    };

    animationFrameRef.current = requestAnimationFrame(scanFrame);

    return () => {
      isLoopRunning = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [isScanning, handleValidateCode, isProcessing]);

  // WATCHDOG: Monitor video stream health
  // iOS Safari kills camera streams when screen dims, app switches, or after prolonged use
  useEffect(() => {
    if (!isScanning) return;

    let deadCounter = 0;

    const watchdogInterval = setInterval(() => {
      // Don't interfere during intentional camera switches
      if (isSwitchingCameraRef.current) return;

      const video = videoRef.current;
      const stream = streamRef.current;

      if (!stream || !video) return;

      const tracks = stream.getVideoTracks();
      const trackDead = tracks.length === 0 || tracks[0].readyState === "ended";

      // If the track explicitly ended (iOS hardware killed the track)
      if (trackDead) {
        console.warn("[Watchdog] Video track ended — auto-restarting camera...");
        setCameraError("La cámara se detuvo. Reiniciando automáticamente...");
        startCamera(selectedCamera || undefined, facingMode).then(() => {
          setCameraError(null);
        });
        return;
      }

      // If video is paused by iOS (e.g. user briefly locked screen or switched tabs)
      if (video.paused) {
        console.warn("[Watchdog] Video paused — attempting resume...");
        video.play().catch(() => {});
      }

      // Check if video is stalled
      if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
        deadCounter++;
        if (deadCounter >= 3) {
          // 3 consecutive checks (15 seconds) stalled
          deadCounter = 0;
          console.warn("[Watchdog] Video feed stalled for 15s — restarting camera...");
          startCamera(selectedCamera || undefined, facingMode);
        }
      } else {
        deadCounter = 0;
      }
    }, 5000);

    return () => clearInterval(watchdogInterval);
  }, [isScanning, selectedCamera, facingMode]);

  const handleResetForNextScan = () => {
    setScanResult(null);
    lastScanTimestampRef.current = 0;
    lastScannedCodeRef.current = "";
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      cameraSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCameraError(null);
    setIsProcessing(true);

    try {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = img.naturalWidth || img.width;
          canvas.height = img.naturalHeight || img.height;
          const ctx = canvas.getContext("2d", { willReadFrequently: true });
          if (!ctx) throw new Error("Could not get 2D context");

          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

          const qrResult = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "attemptBoth",
          });

          if (qrResult && qrResult.data) {
            handleValidateCode(qrResult.data);
          } else {
            setScanResult({
              status: "INVALID",
              message: "No se encontró ningún código QR legible en la foto. Intenta con mejor iluminación.",
            });
          }
        } catch (err) {
          console.warn("Decode image error:", err);
          setScanResult({
            status: "ERROR",
            message: "Error al procesar la imagen del QR.",
          });
        } finally {
          URL.revokeObjectURL(objectUrl);
          setIsProcessing(false);
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        setIsProcessing(false);
        setCameraError("No se pudo cargar la imagen seleccionada.");
      };

      img.src = objectUrl;
    } catch (err) {
      console.warn("File scan error:", err);
      setCameraError(
        "No se pudo detectar un código QR claro en la imagen. Prueba con mejor iluminación o mayor nitidez."
      );
      setIsProcessing(false);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (nativeCameraInputRef.current) nativeCameraInputRef.current.value = "";
    }
  };

  useEffect(() => {
    // Start camera automatically on mount
    startCamera();

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
      {/* Top Banner */}
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
        <div ref={cameraSectionRef} className="lg:col-span-7 space-y-4 scroll-mt-6">
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
                  title={
                    facingMode === "environment"
                      ? "Actualmente cámara trasera. Clic para cambiar a frontal."
                      : "Actualmente cámara frontal. Clic para cambiar a trasera."
                  }
                >
                  <FlipHorizontal className="w-3.5 h-3.5 text-[#FFE600]" />
                  <span className="text-[11px] font-bold">
                    {facingMode === "environment" ? "📷 Trasera" : "🤳 Frontal"}
                  </span>
                </button>
              </div>
            </div>

            {/* Native HTML5 Video Viewport */}
            <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-black border-2 border-[#1E253A] flex items-center justify-center">
              <video
                ref={videoRef}
                playsInline
                autoPlay
                muted
                className="w-full h-full object-cover"
              />

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

                  {/* Zoom controls if device supports optical/digital zoom */}
                  {supportsZoom && (
                    <div className="absolute top-3 right-3 z-10 flex items-center bg-black/80 backdrop-blur-md rounded-full border border-neutral-700 p-1 pointer-events-auto gap-1">
                      <button
                        type="button"
                        onClick={() => applyZoom(1)}
                        className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all ${
                          zoomLevel === 1 ? "bg-amber-400 text-black shadow-sm" : "text-gray-300 hover:text-white"
                        }`}
                      >
                        1x
                      </button>
                      <button
                        type="button"
                        onClick={() => applyZoom(2)}
                        className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all ${
                          zoomLevel >= 2 ? "bg-amber-400 text-black shadow-sm" : "text-gray-300 hover:text-white"
                        }`}
                      >
                        2x
                      </button>
                    </div>
                  )}

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

            {/* Alternative: Native Camera Photo or Upload Screenshot */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-2.5 text-xs border-t border-[#1C2236]">
              {/* Native iOS camera capture input */}
              <input
                type="file"
                accept="image/*"
                capture="environment"
                ref={nativeCameraInputRef}
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => nativeCameraInputRef.current?.click()}
                disabled={isProcessing}
                className="px-3.5 py-2 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 border border-amber-400/40 text-amber-300 font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-40"
              >
                <Camera className="w-3.5 h-3.5 text-amber-400" />
                <span>📸 Tomar foto con cámara del cel</span>
              </button>

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
                className="px-3 py-2 rounded-xl bg-[#141827] hover:bg-[#1E253A] border border-[#232B45] text-gray-300 font-medium flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40"
              >
                <UploadCloud className="w-3.5 h-3.5 text-[#38BDF8]" />
                <span>Subir captura</span>
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
        <div ref={resultRef} className="lg:col-span-5 space-y-4 scroll-mt-6">
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
                      <span className="font-bold text-white">
                        {scanResult.ticket?.tier.name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#64748B]">Evento:</span>
                      <span className="font-bold text-white text-right truncate max-w-[200px]">
                        {scanResult.event?.title}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#64748B]">Orden:</span>
                      <span className="font-mono text-gray-400">
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

            {/* Reset button for next scan — also shows auto-resume timer */}
            {scanResult && (
              <div className="mt-4 space-y-2">
                <button
                  onClick={handleResetForNextScan}
                  className="w-full py-3.5 rounded-xl bg-[#FFE600] hover:bg-[#FFF04D] text-black font-extrabold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-lg shadow-[#FFE600]/15"
                >
                  <RefreshCw className="w-4 h-4" />
                  Siguiente Escaneo (Continuar)
                </button>
                <p className="text-[10px] text-center text-[#64748B]">
                  ⏱ El escáner se reanuda automáticamente en unos segundos
                </p>
              </div>
            )}
          </div>

          {/* Recent Scans Mini Feed */}
          {recentScans.length > 0 && (
            <div className="bg-[#0F121C] border border-[#1E253A] rounded-2xl p-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] block mb-3">
                Últimos Accesos Verificados
              </span>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {recentScans.map((scan, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2 rounded-lg bg-[#141827] text-xs border border-[#1C2236]"
                  >
                    <div className="flex items-center gap-2 truncate">
                      {scan.status === "VALID" ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      ) : scan.status === "ALREADY_USED" ? (
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                      )}
                      <span className="text-white font-medium truncate">
                        {scan.ticket
                          ? `${scan.ticket.attendeeName} ${scan.ticket.attendeeLastName}`
                          : "Código no reconocido"}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        scan.status === "VALID"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : scan.status === "ALREADY_USED"
                          ? "bg-amber-500/20 text-amber-400"
                          : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {scan.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
