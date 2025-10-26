import { ClientAuthGuard } from "@/components/ClientAuthGuard";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClientAuthGuard>
      <div className="flex h-screen overflow-hidden">
      {/* Sidebar (ซ้าย) */}
      <aside className="bg-muted/40 border-r">
        <Sidebar />
      </aside>

      {/* Main content (ขวา) */}
      <div className="flex flex-col flex-1">
        {/* Navbar ด้านบน */}
        <Navbar />

        {/* Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
    </ClientAuthGuard>
  );
}
