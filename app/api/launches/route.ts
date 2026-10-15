import { NextResponse } from "next/server";
import { revalidateFunnelPages } from "@/lib/pages";
import {
  checkLaunch,
  checkProduct,
  countTag,
  createLaunch,
  listLaunches,
  parseLaunch,
  parseProduct,
} from "@/lib/products";

export const runtime = "nodejs";

// Dashboard → Launches. Behind ADMIN_PASSWORD like every non-public route (proxy.ts).

export async function GET() {
  const launches = await listLaunches();
  const waitlist = await Promise.all(launches.map((l) => countTag(l.launch.waitlistTag).catch(() => null)));
  return NextResponse.json({ launches: launches.map((l, i) => ({ ...l, waitlist: waitlist[i] })) });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const product = parseProduct(body.product);
  const launch = parseLaunch(body.launch);
  const errors = [...checkProduct(product), ...checkLaunch(product, launch)];
  if (errors.length) return NextResponse.json({ error: errors.join(" ") }, { status: 400 });
  try {
    const created = await createLaunch(product, launch);
    // A 404 may be cached for this URL from before the product existed.
    revalidateFunnelPages(product.slug);
    return NextResponse.json({ launch: created });
  } catch (err) {
    console.error("create launch failed", err);
    return NextResponse.json({ error: (err as Error).message || "Couldn't create the launch." }, { status: 500 });
  }
}
