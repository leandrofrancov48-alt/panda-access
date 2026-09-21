"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isStandalone =
    pathname?.startsWith("/panda-control-2026") ||
    pathname?.startsWith("/scanner") ||
    pathname?.startsWith("/admin");

  if (isStandalone) {
    return <>{children}</>;
  }

  return (
    <>
      <div className="print:hidden">
        <Navbar />
      </div>
      <main className="flex-1 pt-24 pb-12 print:pt-0 print:pb-0">
        {children}
      </main>
      <div className="print:hidden">
        <Footer />
      </div>
    </>
  );
}
