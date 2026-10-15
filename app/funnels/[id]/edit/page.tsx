import { notFound } from "next/navigation";
import { EditorShell } from "@/components/EditorShell";
import { KitEditProvider } from "@/app/(funnels)/_kit/KitSectionBlock";
import { PRODUCT_TYPE } from "@/lib/liveUrl";
import { getKitProduct } from "@/lib/products";
import { getFunnel } from "@/lib/store";

export const dynamic = "force-dynamic";

type Params = { id: string };

export default async function FunnelEditPage({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  const funnel = await getFunnel(id);
  if (!funnel) notFound();
  if (funnel.type !== PRODUCT_TYPE) return <EditorShell initialFunnel={funnel} />;

  // A launch-kit product's page: its sections need the product (name, prices, launch).
  const p = await getKitProduct(id);
  if (!p) notFound();
  return (
    <KitEditProvider
      product={{ slug: p.slug, name: p.product, tagline: p.tagline, price: p.price, bump: p.bump, launch: p.launch }}
    >
      <EditorShell initialFunnel={funnel} />
    </KitEditProvider>
  );
}
