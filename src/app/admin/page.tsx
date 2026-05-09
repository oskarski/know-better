import type { Metadata } from "next";

import { AdminLoginForm } from "@/components/admin/admin-login-form";
import { AdminPanel } from "@/components/admin/admin-panel";
import { isAdminAuthenticated } from "@/lib/admin-session";
import { getAdminDashboard } from "@/lib/game-store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Panel admina | KnowBetter",
  description: "Podgląd postępów graczy KnowBetter.",
};

export default async function AdminPage() {
  const isAuthenticated = await isAdminAuthenticated();

  if (!isAuthenticated) {
    return <AdminLoginForm />;
  }

  const dashboard = await getAdminDashboard();

  return <AdminPanel players={dashboard.players} gameState={dashboard.gameState} />;
}
