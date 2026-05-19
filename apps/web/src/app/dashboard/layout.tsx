import DashboardShell from "@/features/dashboard-layout/DashboardShell";
import { ImpersonationProvider } from "@/context/ImpersonationContext";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ImpersonationProvider>
      <DashboardShell>{children}</DashboardShell>
    </ImpersonationProvider>
  );
}
