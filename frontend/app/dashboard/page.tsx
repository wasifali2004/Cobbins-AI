import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { DashboardWorkspace, type DashboardView } from "@/components/dashboard-workspace";

export const metadata: Metadata = {
  title: "Dashboard — Cobbins AI",
  description: "Search, organize, and generate interfaces in Cobbins AI.",
};

const dashboardViews = new Set<DashboardView>(["overview", "library", "generate", "collections", "settings"]);

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const { view } = await searchParams;
  const initialView = view && dashboardViews.has(view as DashboardView) ? view as DashboardView : "overview";
  return <DashboardWorkspace initialView={initialView} />;
}
