import { redirect } from "next/navigation";
import { createFunnel } from "@/lib/store";

export default async function NewFunnelPage() {
  const f = await createFunnel("Untitled funnel");
  redirect(`/funnels/${f.id}/edit`);
}
