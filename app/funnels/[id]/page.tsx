import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FunnelMapView } from "@/components/FunnelMap";
import { funnelPrices } from "@/lib/catalog";
import { getFunnelMap } from "@/lib/funnelMap";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const map = await getFunnelMap((await params).id);
  return { title: map ? `${map.name} · funnnnels` : "funnnnels" };
}

// A funnel's map: its pages in order, their live links and numbers (lib/funnelMap.ts),
// and what it charges (lib/catalog.ts; none for builder funnels and launch kits).
export default async function FunnelMapPage({ params }: { params: Params }) {
  const id = (await params).id;
  const [map, prices] = await Promise.all([
    getFunnelMap(id),
    funnelPrices(id).catch((err) => {
      console.error(`funnel map ${id}: its prices couldn't be read`, err);
      return [];
    }),
  ]);
  if (!map) notFound();
  return <FunnelMapView map={map} prices={prices} />;
}
