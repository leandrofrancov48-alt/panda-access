import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const yellowBalloon = localFont({
  src: "./fonts/YellowBalloon.ttf",
  variable: "--font-yellow-balloon",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Panda Access • Entradas Oficiales para Eventos y Recitales",
  description: "La plataforma directa y segura de venta de entradas para los mejores recitales y fiestas. Acceso con código QR, sin filas y 100% digital.",
  keywords: ["panda access", "entradas", "tickets", "recitales", "fiestas", "cumbia"],
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`dark ${yellowBalloon.variable} scroll-smooth`} style={{ colorScheme: "dark" }}>
      <body
        className={`${yellowBalloon.className} min-h-screen flex flex-col transition-colors duration-200 selection:bg-amber-400 selection:text-black bg-[#0C0B09] text-[#FAF6EE]`}
      >
        <div className="print:hidden">
          <Navbar />
        </div>
        <main className="flex-1 pt-24 pb-12 print:pt-0 print:pb-0">
          {children}
        </main>
        <div className="print:hidden">
          <Footer />
        </div>
      </body>
    </html>
  );
}
