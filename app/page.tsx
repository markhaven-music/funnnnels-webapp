import { Dashboard } from "@/components/Dashboard";
import { listFunnels } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function Home() {
  const funnels = await listFunnels();
  return <Dashboard funnels={funnels} />;
}
