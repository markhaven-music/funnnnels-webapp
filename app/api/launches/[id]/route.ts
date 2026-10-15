import { NextResponse } from "next/server";
import { revalidateFunnelPages } from "@/lib/pages";
import {
  checkLaunch,
  checkProduct,
  countTag,
  deleteProduct,
  getLaunch,
  listLaunchEmails,
  parseLaunch,
  parseProduct,
  salesByDay,
  updateLaunch,
  updateProduct,
} from "@/lib/products";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

// One launch: its product, dates, emails, waitlist size and sales per day.
export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const launch = await getLaunch(id);
  if (!launch) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const [emails, waitlist, sales] = await Promise.all([
    listLaunchEmails(id),
    countTag(launch.launch.waitlistTag).catch(() => null),
    salesByDay(launch.product.slug).catch((err) => {
      console.error("launch sales failed", err);
      return { days: [], source: "none" as const };
    }),
  ]);
  return NextResponse.json({ launch, emails, waitlist, sales });
}

// Edit the product (name, prices, add-on) and/or the launch (dates, early-bird
// prices). The cached pages refresh right away; unsent emails follow the dates.
export async function PATCH(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const cur = await getLaunch(id);
  if (!cur) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = await req.json().catch(() => ({}));

  const product = body.product ? { ...parseProduct(body.product), slug: cur.product.slug } : null;
  const launch = body.launch ? parseLaunch(body.launch) : null;
  const price = product?.price ?? cur.product.price;
  const errors = [
    ...(product ? checkProduct(product) : []),
    ...checkLaunch({ price }, launch ?? { ...cur.launch }),
  ];
  if (errors.length) return NextResponse.json({ error: errors.join(" ") }, { status: 400 });

  try {
    if (product) await updateProduct(cur.product.slug, product);
    if (launch) await updateLaunch(id, launch);
  } catch (err) {
    console.error("update launch failed", err);
    return NextResponse.json({ error: "Couldn't save the launch." }, { status: 500 });
  }
  revalidateFunnelPages(cur.product.slug);
  return NextResponse.json({ launch: await getLaunch(id), emails: await listLaunchEmails(id) });
}

// Remove the product completely (launches, emails, page, zips). Contacts and
// their tags stay. Meant for test products and launches that never happened.
export async function DELETE(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const cur = await getLaunch(id);
  if (!cur) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await deleteProduct(cur.product.slug);
  revalidateFunnelPages(cur.product.slug);
  return NextResponse.json({ ok: true });
}
