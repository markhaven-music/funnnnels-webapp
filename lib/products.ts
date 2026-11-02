import { DEFAULT_KIT_SECTIONS } from "@/app/(funnels)/_kit/content";
import { pageId } from "@/lib/blocks";
import type { Bump, Product } from "@/lib/funnels";
import { playbookEmails, toCents, type EmailStep, type Launch, type Money } from "@/lib/launch";
import { stripe, stripeConfigured } from "@/lib/stripe";
import { supabase } from "@/lib/supabase";

// Products made in the dashboard (the launch kit), their launches and launch
// emails. Tables: products, launches, launch_emails (db/launch-kit.sql). Paid
// zips sit in the private "product-files" bucket and leave it only as a
// short-lived signed link, after the payment is confirmed.

export const BUCKET = "product-files";

// First path segments that are app routes, never product slugs (see proxy.ts).
// Two-letter language prefixes (/fr/midi-drum-kit…) are taken too.
export const RESERVED_SLUGS = new Set(["api", "funnels", "p", "account", "unsubscribe", "jazz-midi-pack", "top-hits-midi-bundle", "midi-drum-kit", "famous-beats-bundle", "shop", "fr", "it", "de", "nl", "es", "favicon", "robots", "sitemap"]);
export const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

type ProductRow = {
  slug: string;
  name: string;
  tagline: string;
  price_eur_cents: number;
  price_usd_cents: number;
  bump: { id: string; name: string; pitch: string; eur_cents: number; usd_cents: number } | null;
  files: Record<string, string>;
  created_at: string;
  updated_at: string;
};

type LaunchRow = {
  id: string;
  product_slug: string;
  waitlist_at: string;
  cart_open_at: string;
  early_bird_end_at: string;
  early_eur_cents: number;
  early_usd_cents: number;
  waitlist_tag: string;
  created_at: string;
};

type EmailRow = {
  id: string;
  launch_id: string;
  step: EmailStep;
  subject: string;
  body: string;
  audience_tag: string;
  exclude_tag: string | null;
  send_at: string;
  status: LaunchEmail["status"];
  sent_at: string | null;
  sent_count: number | null;
  error: string | null;
};

export type LaunchEmail = {
  id: string;
  step: EmailStep;
  subject: string;
  body: string;
  audienceTag: string;
  excludeTag: string | null;
  sendAt: string;
  status: "draft" | "scheduled" | "sending" | "sent" | "failed" | "skipped";
  sentAt: string | null;
  sentCount: number | null;
  error: string | null;
};

const units = (cents: number) => cents / 100;

function toLaunch(r: LaunchRow): Launch {
  return {
    id: r.id,
    waitlistAt: r.waitlist_at,
    cartOpenAt: r.cart_open_at,
    earlyBirdEndAt: r.early_bird_end_at,
    early: { eur: units(r.early_eur_cents), usd: units(r.early_usd_cents) },
    waitlistTag: r.waitlist_tag,
  };
}

function toBump(b: ProductRow["bump"]): Bump | null {
  return b ? { id: b.id, name: b.name, pitch: b.pitch, price: { eur: units(b.eur_cents), usd: units(b.usd_cents) } } : null;
}

function toProduct(r: ProductRow, launch: LaunchRow | null): Product {
  const l = launch ? toLaunch(launch) : null;
  return {
    kind: "kit",
    slug: r.slug,
    product: r.name,
    brand: "GRIND STUDIO",
    tagline: r.tagline,
    price: { eur: units(r.price_eur_cents), usd: units(r.price_usd_cents) },
    bump: toBump(r.bump),
    checkout: {
      leadTags: ["checkout-started"],
      buyerTags: ["buyer", `buyer-${r.slug}`],
      thankYou: `/${r.slug}/thank-you`,
    },
    // The waitlist form: tags the sign-up for this launch's emails.
    optin: { source: r.slug, tags: ["lead", l?.waitlistTag ?? `waitlist-${r.slug}`] },
    launch: l,
  };
}

export const emailFromRow = (r: EmailRow): LaunchEmail => ({
  id: r.id,
  step: r.step,
  subject: r.subject,
  body: r.body,
  audienceTag: r.audience_tag,
  excludeTag: r.exclude_tag,
  sendAt: r.send_at,
  status: r.status,
  sentAt: r.sent_at,
  sentCount: r.sent_count,
  error: r.error,
});

/** A product's current launch: the one with the latest cart-open date. */
async function currentLaunchRow(slug: string): Promise<LaunchRow | null> {
  const { data, error } = await supabase()
    .from("launches")
    .select("*")
    .eq("product_slug", slug)
    .order("cart_open_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data as LaunchRow | null) ?? null;
}

export async function getKitProduct(slug: string): Promise<Product | null> {
  const [{ data, error }, launch] = await Promise.all([
    supabase().from("products").select("*").eq("slug", slug).maybeSingle(),
    currentLaunchRow(slug),
  ]);
  if (error) throw error;
  return data ? toProduct(data as ProductRow, launch) : null;
}

/** Storage path of a paid file (key "pack" or the bump's id), or null. */
export async function productFile(slug: string, key: string): Promise<string | null> {
  const { data, error } = await supabase().from("products").select("files").eq("slug", slug).maybeSingle();
  if (error) throw error;
  const files = (data?.files ?? {}) as Record<string, string>;
  return typeof files[key] === "string" ? files[key] : null;
}

/** A link to a paid zip that works for 60 seconds, named after the file. */
export async function signedDownload(path: string): Promise<string | null> {
  const name = path.split("/").pop() ?? "download.zip";
  const { data, error } = await supabase().storage.from(BUCKET).createSignedUrl(path, 60, { download: name });
  if (error) {
    console.error("signed download failed", error);
    return null;
  }
  return data.signedUrl;
}

// ─── dashboard ─────────────────────────────────────────────────

export type ProductInput = {
  slug: string;
  name: string;
  tagline: string;
  price: Money;
  bump: { name: string; pitch: string; price: Money } | null;
};

export type LaunchInput = {
  waitlistAt: string;
  cartOpenAt: string;
  earlyBirdEndAt: string;
  early: Money;
};

export type LaunchSummary = {
  id: string;
  product: { slug: string; name: string; tagline: string; price: Money; bump: Bump | null; files: Record<string, string> };
  launch: Launch;
  createdAt: string;
};

function summary(l: LaunchRow, p: ProductRow): LaunchSummary {
  return {
    id: l.id,
    product: {
      slug: p.slug,
      name: p.name,
      tagline: p.tagline,
      price: { eur: units(p.price_eur_cents), usd: units(p.price_usd_cents) },
      bump: toBump(p.bump),
      files: p.files ?? {},
    },
    launch: toLaunch(l),
    createdAt: l.created_at,
  };
}

export async function listLaunches(): Promise<LaunchSummary[]> {
  const { data, error } = await supabase()
    .from("launches")
    .select("*, products(*)")
    .order("cart_open_at", { ascending: false });
  if (error) throw error;
  return (data as (LaunchRow & { products: ProductRow })[]).map((r) => summary(r, r.products));
}

export async function getLaunch(id: string): Promise<LaunchSummary | null> {
  const { data, error } = await supabase().from("launches").select("*, products(*)").eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const r = data as LaunchRow & { products: ProductRow };
  return summary(r, r.products);
}

export async function listLaunchEmails(launchId: string): Promise<LaunchEmail[]> {
  const { data, error } = await supabase()
    .from("launch_emails")
    .select("*")
    .eq("launch_id", launchId)
    .order("send_at", { ascending: true });
  if (error) throw error;
  return (data as EmailRow[]).map(emailFromRow);
}

/** Problems with a launch's dates and prices, in plain words ([] = fine). */
export function checkLaunch(p: Pick<ProductInput, "price">, l: LaunchInput): string[] {
  const errors: string[] = [];
  const [w, o, e] = [l.waitlistAt, l.cartOpenAt, l.earlyBirdEndAt].map((d) => Date.parse(d));
  if ([w, o, e].some(Number.isNaN)) errors.push("Every date is required.");
  else {
    if (w > o) errors.push("The waitlist must start before the cart opens.");
    if (o >= e) errors.push("The early-bird must end after the cart opens.");
  }
  for (const c of ["eur", "usd"] as const) {
    if (!(l.early[c] > 0)) errors.push(`Early-bird ${c.toUpperCase()} price is required.`);
    else if (l.early[c] >= p.price[c]) errors.push(`The early-bird ${c.toUpperCase()} price must be below the full price.`);
  }
  return errors;
}

export function checkProduct(p: ProductInput): string[] {
  const errors: string[] = [];
  if (!SLUG.test(p.slug) || p.slug.length > 60) errors.push("The URL can only use lowercase letters, numbers and dashes.");
  if (RESERVED_SLUGS.has(p.slug)) errors.push(`"${p.slug}" is taken by the app. Pick another URL.`);
  if (!p.name.trim()) errors.push("The product needs a name.");
  for (const c of ["eur", "usd"] as const) if (!(p.price[c] > 0)) errors.push(`${c.toUpperCase()} price is required.`);
  if (p.bump) {
    if (!p.bump.name.trim()) errors.push("The add-on needs a name.");
    for (const c of ["eur", "usd"] as const) if (!(p.bump.price[c] > 0)) errors.push(`Add-on ${c.toUpperCase()} price is required.`);
  }
  return errors;
}

// Request bodies from the dashboard → inputs (validated by checkProduct / checkLaunch).
const num = (v: unknown) => (typeof v === "number" ? v : Number(v));
const money = (v: unknown) => {
  const m = (v ?? {}) as Record<string, unknown>;
  return { eur: num(m.eur), usd: num(m.usd) };
};

export function parseProduct(raw: unknown): ProductInput {
  const p = (raw ?? {}) as Record<string, unknown>;
  const bump = p.bump as Record<string, unknown> | null | undefined;
  return {
    slug: String(p.slug ?? "").trim().toLowerCase(),
    name: String(p.name ?? ""),
    tagline: String(p.tagline ?? ""),
    price: money(p.price),
    bump: bump ? { name: String(bump.name ?? ""), pitch: String(bump.pitch ?? ""), price: money(bump.price) } : null,
  };
}

export function parseLaunch(raw: unknown): LaunchInput {
  const l = (raw ?? {}) as Record<string, unknown>;
  const iso = (v: unknown) => {
    const t = Date.parse(String(v ?? ""));
    return Number.isNaN(t) ? "" : new Date(t).toISOString();
  };
  return {
    waitlistAt: iso(l.waitlistAt),
    cartOpenAt: iso(l.cartOpenAt),
    earlyBirdEndAt: iso(l.earlyBirdEndAt),
    early: money(l.early),
  };
}

function bumpRow(slug: string, b: ProductInput["bump"]): ProductRow["bump"] {
  if (!b) return null;
  return { id: `${slug}-addon`, name: b.name.trim(), pitch: b.pitch.trim(), eur_cents: toCents(b.price.eur), usd_cents: toCents(b.price.usd) };
}

/**
 * New product + its launch, in one go: the product row, the launch, the
 * playbook's emails (drafts) and the product's page in the editor
 * (a `funnels` row with id = slug, type "Product", the template sections,
 * already published so the URL works straight away).
 */
export async function createLaunch(p: ProductInput, l: LaunchInput): Promise<LaunchSummary> {
  const db = supabase();
  const { error: pErr } = await db.from("products").insert({
    slug: p.slug,
    name: p.name.trim(),
    tagline: p.tagline.trim(),
    price_eur_cents: toCents(p.price.eur),
    price_usd_cents: toCents(p.price.usd),
    bump: bumpRow(p.slug, p.bump),
  });
  if (pErr) throw pErr.code === "23505" ? new Error(`A product at /${p.slug} already exists.`) : pErr;

  try {
    const waitlistTag = `waitlist-${p.slug}`;
    const { data: launch, error: lErr } = await db
      .from("launches")
      .insert({
        product_slug: p.slug,
        waitlist_at: l.waitlistAt,
        cart_open_at: l.cartOpenAt,
        early_bird_end_at: l.earlyBirdEndAt,
        early_eur_cents: toCents(l.early.eur),
        early_usd_cents: toCents(l.early.usd),
        waitlist_tag: waitlistTag,
      })
      .select("*")
      .single();
    if (lErr) throw lErr;

    const emails = playbookEmails({ ...l, waitlistTag }, p.slug).map((e) => ({
      launch_id: launch.id,
      step: e.step,
      subject: e.subject,
      body: e.body,
      audience_tag: e.audienceTag,
      exclude_tag: e.excludeTag,
      send_at: e.sendAt,
    }));
    const { error: eErr } = await db.from("launch_emails").insert(emails);
    if (eErr) throw eErr;

    const pages = [{ id: pageId(), name: "Sales page", slug: "/", blocks: DEFAULT_KIT_SECTIONS }];
    const { error: fErr } = await db.from("funnels").upsert({
      id: p.slug,
      name: p.name.trim(),
      status: "live",
      type: "Product",
      tag: "new",
      palette: ["oklch(0.8 0.13 75)", "oklch(0.55 0.12 60)"],
      steps: 1,
      on: 1,
      pages,
      published_pages: pages,
    });
    if (fErr) throw fErr;

    return (await getLaunch(launch.id))!;
  } catch (err) {
    // All or nothing: drop the half-made product (its launch and emails cascade).
    await db.from("products").delete().eq("slug", p.slug);
    throw err;
  }
}

export async function updateProduct(slug: string, p: Omit<ProductInput, "slug">) {
  const { error } = await supabase()
    .from("products")
    .update({
      name: p.name.trim(),
      tagline: p.tagline.trim(),
      price_eur_cents: toCents(p.price.eur),
      price_usd_cents: toCents(p.price.usd),
      bump: bumpRow(slug, p.bump),
      updated_at: new Date().toISOString(),
    })
    .eq("slug", slug);
  if (error) throw error;
}

/** New dates or early-bird prices. Emails not sent yet move with the dates. */
export async function updateLaunch(id: string, l: LaunchInput) {
  const cur = await getLaunch(id);
  if (!cur) return null;
  const db = supabase();
  const { error } = await db
    .from("launches")
    .update({
      waitlist_at: l.waitlistAt,
      cart_open_at: l.cartOpenAt,
      early_bird_end_at: l.earlyBirdEndAt,
      early_eur_cents: toCents(l.early.eur),
      early_usd_cents: toCents(l.early.usd),
    })
    .eq("id", id);
  if (error) throw error;

  const moved = new Map(
    playbookEmails({ ...l, waitlistTag: cur.launch.waitlistTag }, cur.product.slug).map((e) => [e.step, e.sendAt]),
  );
  for (const e of await listLaunchEmails(id)) {
    const at = moved.get(e.step);
    if (at && at !== e.sendAt && (e.status === "draft" || e.status === "scheduled")) {
      const { error: mErr } = await db.from("launch_emails").update({ send_at: at }).eq("id", e.id);
      if (mErr) throw mErr;
    }
  }
  return getLaunch(id);
}

export async function updateLaunchEmail(
  launchId: string,
  emailId: string,
  patch: Partial<Pick<LaunchEmail, "subject" | "body" | "audienceTag" | "sendAt" | "status">>,
): Promise<LaunchEmail | null> {
  const update: Record<string, unknown> = {};
  if (patch.subject !== undefined) update.subject = patch.subject;
  if (patch.body !== undefined) update.body = patch.body;
  if (patch.audienceTag !== undefined) update.audience_tag = patch.audienceTag;
  if (patch.sendAt !== undefined) update.send_at = patch.sendAt;
  if (patch.status !== undefined) update.status = patch.status;
  const { data, error } = await supabase()
    .from("launch_emails")
    .update(update)
    .eq("id", emailId)
    .eq("launch_id", launchId)
    // Sent history is kept as it was.
    .in("status", ["draft", "scheduled", "failed", "skipped"])
    .select("*")
    .maybeSingle();
  if (error) throw error;
  return data ? emailFromRow(data as EmailRow) : null;
}

/** Remove a product completely: its launches, emails, page and uploaded zips. Contacts stay. */
export async function deleteProduct(slug: string) {
  const db = supabase();
  const { data: files } = await db.storage.from(BUCKET).list(slug);
  if (files?.length) await db.storage.from(BUCKET).remove(files.map((f) => `${slug}/${f.name}`));
  await db.from("funnels").delete().eq("id", slug).eq("type", "Product");
  const { error } = await db.from("products").delete().eq("slug", slug);
  if (error) throw error;
}

// ─── uploads ───────────────────────────────────────────────────
// The browser uploads straight to Supabase Storage with a one-time signed
// URL (a Vercel function can't take a body over 4.5 MB), then tells us the
// upload finished so the product points at the new file.

export function filePath(slug: string, filename: string) {
  const safe = filename.replace(/[^\w .()+-]/g, "").replace(/\s+/g, " ").trim().slice(0, 120) || "download.zip";
  return `${slug}/${safe.toLowerCase().endsWith(".zip") ? safe : `${safe}.zip`}`;
}

export async function uploadTarget(slug: string, filename: string) {
  const path = filePath(slug, filename);
  const { data, error } = await supabase().storage.from(BUCKET).createSignedUploadUrl(path, { upsert: true });
  if (error) throw error;
  return { path, token: data.token, signedUrl: data.signedUrl };
}

export async function attachFile(slug: string, key: string, path: string) {
  if (!path.startsWith(`${slug}/`)) throw new Error("That file belongs to another product.");
  const db = supabase();
  const { data: found } = await db.storage.from(BUCKET).list(slug, { search: path.slice(slug.length + 1) });
  if (!found?.some((f) => `${slug}/${f.name}` === path)) throw new Error("The upload didn't arrive. Try again.");
  const { data, error } = await db.from("products").select("files").eq("slug", slug).maybeSingle();
  if (error) throw error;
  const files = { ...((data?.files ?? {}) as Record<string, string>), [key]: path };
  const { error: upErr } = await db.from("products").update({ files, updated_at: new Date().toISOString() }).eq("slug", slug);
  if (upErr) throw upErr;
  return files;
}

// ─── numbers ───────────────────────────────────────────────────

export async function countTag(tag: string): Promise<number> {
  const { count, error } = await supabase()
    .from("contacts")
    .select("id", { count: "exact", head: true })
    .filter("tags", "cs", JSON.stringify([tag]));
  if (error) throw error;
  return count ?? 0;
}

export type DaySales = { day: string; orders: number; eur: number; usd: number };

/**
 * Card sales per day (UTC), straight from Stripe: PaymentIntents tagged with
 * this product. PayPal sales aren't counted yet; once the orders table lands
 * this should read from it instead and include both.
 */
export async function salesByDay(slug: string): Promise<{ days: DaySales[]; source: "stripe" | "none" }> {
  if (!stripeConfigured()) return { days: [], source: "none" };
  const byDay = new Map<string, DaySales>();
  let page: string | undefined;
  for (let i = 0; i < 10; i++) {
    const res = await stripe().paymentIntents.search({
      query: `status:'succeeded' AND metadata['funnel']:'${slug}'`,
      limit: 100,
      ...(page ? { page } : {}),
    });
    for (const pi of res.data) {
      const day = new Date(pi.created * 1000).toISOString().slice(0, 10);
      const d = byDay.get(day) ?? { day, orders: 0, eur: 0, usd: 0 };
      d.orders += 1;
      if (pi.currency === "eur") d.eur += pi.amount / 100;
      if (pi.currency === "usd") d.usd += pi.amount / 100;
      byDay.set(day, d);
    }
    if (!res.has_more || !res.next_page) break;
    page = res.next_page;
  }
  return { days: [...byDay.values()].sort((a, b) => a.day.localeCompare(b.day)), source: "stripe" };
}
