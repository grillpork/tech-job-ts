import { ClientAuthGuard } from "@/components/ClientAuthGuard";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ClientAuthGuard> {children}</ClientAuthGuard>;
}
