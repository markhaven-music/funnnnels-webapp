import { NextResponse } from "next/server";
import { addItem, moveItem, removeItem, updateItem, type ItemRole } from "@/lib/catalog";
import { revalidateSalesPages } from "@/lib/pages";

export const runtime = "nodejs";

// Dashboard → Products: what each funnel sells (funnel_items, lib/catalog.ts).
//   POST   { funnel, product, role: "bump" | "upsell", price }  a product into a funnel
//   PATCH  { funnel, role, key, name, price }                   its name and price there
//   PUT    { funnel, role, key, move: -1 | 1 }                  an add-on one place up or down
//   DELETE { funnel, role, key }                                an add-on or upsell out
// Each saves straight to the live checkout and refreshes the funnel's pages.
// Behind ADMIN_PASSWORD (proxy.ts).

const ROLES: ItemRole[] = ["main", "bump", "upsell"];
const num = (v: unknown) => (typeof v === "number" ? v : Number(v));
const price = (v: unknown) => {
  const m = (v ?? {}) as Record<string, unknown>;
  return { eur: num(m.eur), usd: num(m.usd) };
};

async function run(body: Record<string, unknown>, act: (funnel: string) => Promise<string | null>) {
  const funnel = String(body.funnel ?? "");
  try {
    const refused = await act(funnel);
    if (refused) return NextResponse.json({ error: refused }, { status: 400 });
    revalidateSalesPages(funnel);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("products: saving a funnel item failed", err);
    return NextResponse.json({ error: "Couldn't save." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const role = body.role === "upsell" ? "upsell" : "bump";
  return run(body, (funnel) => addItem(funnel, String(body.product ?? ""), role, price(body.price)));
}

export async function PATCH(req: Request) {
  const body = await req.json().catch(() => ({}));
  if (!ROLES.includes(body.role)) return NextResponse.json({ error: "Unknown role." }, { status: 400 });
  return run(body, (funnel) => updateItem(funnel, body.role, String(body.key ?? ""), String(body.name ?? ""), price(body.price)));
}

export async function PUT(req: Request) {
  const body = await req.json().catch(() => ({}));
  if (!ROLES.includes(body.role) || (body.move !== -1 && body.move !== 1)) return NextResponse.json({ error: "Bad move." }, { status: 400 });
  return run(body, (funnel) => moveItem(funnel, body.role, String(body.key ?? ""), body.move));
}

export async function DELETE(req: Request) {
  const body = await req.json().catch(() => ({}));
  if (!ROLES.includes(body.role)) return NextResponse.json({ error: "Unknown role." }, { status: 400 });
  return run(body, (funnel) => removeItem(funnel, body.role, String(body.key ?? "")));
}
