import AdminNavbar from "@/components/AdminNavbar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0C0B09] text-[#FAF6EE]">
      <AdminNavbar />
      <div className="pb-16">{children}</div>
    </div>
  );
}
