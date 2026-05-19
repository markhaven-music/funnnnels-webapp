import { notFound } from "next/navigation";
import { EditorShell } from "@/components/EditorShell";
import { getFunnel } from "@/lib/store";

export const dynamic = "force-dynamic";

type Params = { id: string };
type Search = { seed?: string };

export default async function FunnelEditPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<Search>;
}) {
  const { id } = await params;
  const { seed } = await searchParams;
  const funnel = await getFunnel(id);
  if (!funnel) notFound();
  return <EditorShell initialFunnel={funnel} initialSeed={seed ?? null} />;
}
