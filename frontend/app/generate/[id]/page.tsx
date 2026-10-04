import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { GenerationResult } from "@/components/generation-result";

export const metadata: Metadata = {
  title: "Generated interface — Cobbins AI",
  description: "Preview, inspect, and export a generated Cobbins AI interface.",
};

export default async function GenerationResultPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const { id } = await params;
  return <GenerationResult generationId={id} />;
}
