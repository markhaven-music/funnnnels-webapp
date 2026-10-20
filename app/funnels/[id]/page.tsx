import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FunnelMapView } from "@/components/FunnelMap";
import { getFunnelMap } from "@/lib/funnelMap";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const map = await getFunnelMap((await params).id);
  return { title: map ? `${map.name} · funnnnels` : "funnnnels" };
}

// A funnel's map: its pages in order, their live links and numbers (lib/funnelMap.ts).
export default async function FunnelMapPage({ params }: { params: Params }) {
  const map = await getFunnelMap((await params).id);
  if (!map) notFound();
  return <FunnelMapView map={map} />;
}
