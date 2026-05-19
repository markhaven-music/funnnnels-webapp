import { notFound } from "next/navigation";
import { EditorShell } from "@/components/EditorShell";
import { getFunnel } from "@/lib/store";

export const dynamic = "force-dynamic";

type Params = { id: string };

export default async function FunnelEditPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { id } = await params;
  const funnel = await getFunnel(id);
  if (!funnel) notFound();
  return <EditorShell initialFunnel={funnel} />;
}
