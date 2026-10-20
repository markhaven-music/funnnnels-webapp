import { Dashboard } from "@/components/Dashboard";
import { withCodeFunnels } from "@/lib/codeFunnels";
import { listFunnels } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function Home() {
  const funnels = withCodeFunnels(await listFunnels());
  return <Dashboard funnels={funnels} />;
}
