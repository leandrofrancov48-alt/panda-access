import QrScanner from "@/components/QrScanner";
import ScannerHeader from "@/components/ScannerHeader";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Lector QR de Puerta • Panda Access",
  robots: { index: false, follow: false },
};

export default function StandaloneScannerPage() {
  return (
    <div className="min-h-screen bg-[#0C0B09] text-[#FAF6EE] flex flex-col">
      {/* Dedicated Clean Header for Door Staff */}
      <ScannerHeader />

      {/* Main Scanner Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        <QrScanner />
      </main>
    </div>
  );
}
