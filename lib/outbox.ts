import { ABANDON_SERIES_FUNNELS, abandonSeries, statedPrice } from "@/lib/abandonCopy";
import { purchasesOf, shelfOf } from "@/lib/account";
import { backupCopy } from "@/lib/backupCopy";
import { checkoutPages, resolveFunnel, type Product } from "@/lib/funnels";
import type { Currency } from "@/lib/geo";
import { KIT_HOME } from "@/lib/liveUrl";
import { money } from "@/lib/launch";
import { card, letter, resumeToken, type CardButton } from "@/lib/mail";
import { mailCopy } from "@/lib/mailCopy";
import { getLaunch } from "@/lib/products";
import { orderTitle, shopLabels, type ShopLabel } from "@/lib/shop";
import { hasPaidOrder } from "@/lib/sales";
import { SesError, sendEmail, sesConfigured, type Email } from "@/lib/ses";
import { supabase } from "@/lib/supabase";

// The one job that sends every scheduled email, run each minute by
// /api/cron/email (pg_cron, db/email-schedule.sql). In this order:
//   1. receipts: an order's downloads, 5 minutes after it paid, with the
//      one-click upsells bought right after it in the same email, and their
//      "💾 Backup Link" 10 minutes later (ClickFunnels' habit, for buried emails);
//   2. abandoned checkouts: the MIDI Drum Kit's three emails (15 min, 6 h, 18 h
//      apart), the others' one reminder an hour after step 1, never to a buyer;
//   3. sequences: the next step of every contact whose time has come;
//   4. broadcasts and launch emails: the next batch of their audience.
// Sends are paced to SES's per-second rate (EMAIL_RATE, 1 in the sandbox, 14
// once production access is granted) and stop before the function's time runs out.

const BRAND_ORIGIN = KIT_HOME; // m.thegrind.studio: every funnel's public home

const RECEIPT_AFTER_MS = 5 * 60_000;
const RECEIPT_GIVE_UP_MS = 3 * 86_400_000;
const RECEIPT_TRIES = 5;
const BACKUP_AFTER_MS = 10 * 60_000;
// Receipts older than this get no backup (those sent before it existed included).
const BACKUP_GIVE_UP_MS = 6 * 3_600_000;
const REMIND_AFTER_MS = 60 * 60_000;
const FIRST_SERIES_MS = 15 * 60_000; // the earliest first reminder (lib/abandonCopy.ts)
const REMIND_GIVE_UP_MS = 3 * 86_400_000;

export type OutboxReport = {
  receipts: number;
  backups: number;
  reminders: number;
  sequence: number;
  broadcast: number;
  launch: number;
  failed: number;
  stopped?: string; // why the run ended early
  notes: string[];
};

class Run {
  report: OutboxReport = { receipts: 0, backups: 0, reminders: 0, sequence: 0, broadcast: 0, launch: 0, failed: 0, notes: [] };
  // SES refused an unverified address: it's still in its sandbox, so mass sends wait.
  sandbox = false;
  private next = 0;
  private gap: number;
  constructor(
    private deadline: number,
    readonly dryRun: boolean,
  ) {
    const rate = Number(process.env.EMAIL_RATE) || 1;
    this.gap = Math.ceil(1000 / Math.max(rate, 0.1)) + 20;
  }
  get over() {
    return Boolean(this.report.stopped) || Date.now() > this.deadline;
  }
  /** Send one email at SES's pace. Throttling stops the whole run; other errors go back to the caller. */
  async send(email: Email): Promise<string | null> {
    if (this.dryRun) return "dry-run";
    const wait = this.next - Date.now();
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    this.next = Date.now() + this.gap;
    try {
      const sent = await sendEmail(email);
      if ("skipped" in sent) {
        this.report.notes.push(`skipped: ${sent.skipped}`);
        return null;
      }
      return sent.id;
    } catch (err) {
      if (err instanceof SesError && err.throttled) this.report.stopped = "SES says slow down (rate or daily quota)";
      if (err instanceof SesError && err.sandbox && !this.sandbox) {
        this.sandbox = true;
        this.report.notes.push("SES is still in its sandbox: only verified addresses receive email");
      }
      throw err;
    }
  }
}

export async function runOutbox({ budgetMs = 50_000, dryRun = false } = {}): Promise<OutboxReport> {
  const run = new Run(Date.now() + budgetMs, dryRun);
  if (!sesConfigured()) {
    run.report.stopped = "SES is not set up (SES_* and EMAIL_FROM)";
    return run.report;
  }
  for (const step of [receipts, backups, reminders, sequences, broadcasts, launchEmails]) {
    if (run.over) break;
    try {
      await step(run);
    } catch (err) {
      console.error(`outbox: ${step.name} failed`, err);
      run.report.notes.push(`${step.name}: ${String(err).slice(0, 200)}`);
    }
  }
  return run.report;
}

const errorText = (err: unknown) =>
  err instanceof SesError && err.sandbox ? "SES is still in its sandbox: only verified addresses receive email" : String(err).slice(0, 300);

// ─── 1. receipts ───────────────────────────────────────────────────

type OrderRow = {
  id: string;
  provider: "stripe" | "paypal";
  funnel: string;
  items: string[];
  amount_cents: number;
  currency: "eur" | "usd";
  email: string | null;
  name: string | null;
  lang: string;
  offer: string | null;
  parent: string | null;
  email_sent_at: string | null;
  email_attempts: number;
};

async function receipts(run: Run) {
  const db = supabase();
  const now = Date.now();
  const { data, error } = await db
    .from("orders")
    .select("id, provider, funnel, items, amount_cents, currency, email, name, lang, offer, parent, email_sent_at, email_attempts")
    .is("email_sent_at", null)
    .not("email", "is", null)
    .eq("status", "succeeded")
    .lt("email_attempts", RECEIPT_TRIES)
    .lte("created_at", new Date(now - RECEIPT_AFTER_MS).toISOString())
    .gte("created_at", new Date(now - RECEIPT_GIVE_UP_MS).toISOString())
    .order("created_at")
    .limit(100);
  if (error) throw error;
  const due = (data ?? []) as OrderRow[];

  // The upsells waiting with their order go in its email; an upsell whose
  // order already had its email (or isn't recorded) gets one of its own.
  const mains = due.filter((o) => !o.offer || !due.some((m) => m.id === o.parent));
  for (const main of mains) {
    if (run.over) return;
    const group = [main, ...due.filter((o) => o.offer && o.parent === main.id && o !== main)];
    const ids = group.map((o) => o.id);
    if (!run.dryRun) {
      // Claim them, so a second run at the same time can't send them again.
      const { data: claimed, error: cErr } = await db.from("orders").update({ email_sent_at: new Date().toISOString() }).in("id", ids).is("email_sent_at", null).select("id");
      if (cErr) throw cErr;
      if (!claimed?.some((c) => c.id === main.id)) continue;
    }
    const f = await resolveFunnel(main.funnel);
    try {
      if (!f) throw new Error(`unknown product ${main.funnel}`);
      // The shop's products are named in the database.
      const shop = f.kind === "shop" ? await shopLabels(group.flatMap((o) => o.items)) : {};
      const id = await run.send(receiptEmail(group, f, shop));
      if (id === null && !run.dryRun) await db.from("orders").update({ email_sent_at: null }).in("id", ids);
      else run.report.receipts++;
    } catch (err) {
      run.report.failed++;
      if (!run.dryRun) {
        await db
          .from("orders")
          .update({ email_sent_at: null, email_error: errorText(err), email_attempts: main.email_attempts + 1 })
          .in("id", ids);
      }
      if (run.over) return;
    }
  }
}

/** Every file of an order and the upsells sent with it: its label and its download link (they don't expire). */
function downloads(group: OrderRow[], f: Product, shop: Record<string, ShopLabel>): { label: string; href: string }[] {
  // The add-ons' and upsells' names as dashboard → Products has them (an add-on added there is on no shelf).
  const names: Record<string, string> = Object.fromEntries([...(f.bumps ?? []), ...(f.bump ? [f.bump] : []), ...(f.offers ?? [])].map((x) => [x.id, x.name]));
  return group.flatMap((o) => {
    const shelf = shelfOf(o.funnel, { id: o.id, items: o.items, offer: o.offer }) ?? kitShelf(o, f, shop);
    return shelf.files.map((file) => ({ label: names[file.key] ?? file.label, href: file.href }));
  });
}

/** What the order is called in its emails' subject. */
function orderProduct(main: OrderRow, f: Product, shop: Record<string, ShopLabel>): string {
  return main.offer
    ? (shelfOf(main.funnel, { id: main.id, items: main.items, offer: main.offer })?.name ?? f.product)
    : f.kind === "shop"
      ? orderTitle(main.items, shop)
      : f.product;
}

function receiptEmail(group: OrderRow[], f: Product, shop: Record<string, ShopLabel>): Email {
  const main = group[0];
  const c = mailCopy(main.lang).receipt;
  const buttons: CardButton[] = [];
  const text: string[] = [c.title, "", c.lead, ""];
  for (const file of downloads(group, f, shop)) {
    buttons.push({ label: c.download(file.label), url: file.href, primary: buttons.length === 0 });
    text.push(`${c.download(file.label)}: ${file.href}`);
  }
  const orders = group.map((o) => c.order(o.id, money(o.amount_cents / 100, o.currency), o.provider === "paypal"));
  text.push("", ...orders, c.account, "", `${c.help} support@thegrind.studio`);
  return {
    to: main.email!,
    subject: c.subject(orderProduct(main, f, shop)),
    // Tracked for dashboard → Orders (opened, downloads clicked); not an email Insights credits sales to.
    html: card({ lang: main.lang, title: c.title, lead: c.lead, buttons, notes: [...orders, c.account], help: c.help, track: { t: { kind: "receipt", ref: main.id }, email: main.email! } }),
    text: text.join("\n"),
  };
}

// ─── 1b. backup links ──────────────────────────────────────────────

async function backups(run: Run) {
  const db = supabase();
  const now = Date.now();
  const { data, error } = await db
    .from("orders")
    .select("id, provider, funnel, items, amount_cents, currency, email, name, lang, offer, parent, email_sent_at, email_attempts")
    .is("backup_sent_at", null)
    .not("email", "is", null)
    .eq("status", "succeeded")
    .lte("email_sent_at", new Date(now - BACKUP_AFTER_MS).toISOString())
    .gte("email_sent_at", new Date(now - BACKUP_GIVE_UP_MS).toISOString())
    .order("email_sent_at")
    .limit(100);
  if (error) throw error;
  const due = (data ?? []) as OrderRow[];

  // Like the receipt: the upsells sent with their order are in its backup.
  const mains = due.filter((o) => !o.offer || !due.some((m) => m.id === o.parent));
  for (const main of mains) {
    if (run.over) return;
    const group = [main, ...due.filter((o) => o.offer && o.parent === main.id && o !== main)];
    const ids = group.map((o) => o.id);
    if (!run.dryRun) {
      const { data: claimed, error: cErr } = await db.from("orders").update({ backup_sent_at: new Date().toISOString() }).in("id", ids).is("backup_sent_at", null).select("id");
      if (cErr) throw cErr;
      if (!claimed?.some((c) => c.id === main.id)) continue;
    }
    const f = await resolveFunnel(main.funnel);
    try {
      if (!f) throw new Error(`unknown product ${main.funnel}`);
      const shop = f.kind === "shop" ? await shopLabels(group.flatMap((o) => o.items)) : {};
      const c = backupCopy(main.lang);
      const first = (main.name ?? "").trim().split(/\s+/)[0]?.slice(0, 40) ?? "";
      const body = [c.intro(first), ...downloads(group, f, shop).map((d) => `[button: ${c.button(d.label)}](${d.href})`), c.outro].join("\n\n");
      const id = await run.send(letter({ to: { email: main.email!, name: main.name }, subject: c.subject(orderProduct(main, f, shop)), body, lang: main.lang, track: { kind: "backup", ref: main.id } }));
      if (id === null && !run.dryRun) await db.from("orders").update({ backup_sent_at: null }).in("id", ids);
      else run.report.backups++;
    } catch (err) {
      // One try only: a backup is a second chance, never a late one.
      run.report.failed++;
      run.report.notes.push(`backup ${main.id}: ${errorText(err)}`);
      if (run.over) return;
    }
  }
}

/** Dashboard-made products (Launches, and the shop's), downloaded from their own page. */
function kitShelf(o: OrderRow, f: Product, shop: Record<string, ShopLabel>) {
  const labels: Record<string, string> = {
    pack: f.product,
    ...(f.bump ? { [f.bump.id]: f.bump.name } : {}),
    ...Object.fromEntries(Object.entries(shop).map(([slug, l]) => [slug, l.name])),
  };
  return {
    name: f.product,
    files: o.items.map((k) => ({ key: k, label: labels[k] ?? k, href: `${f.home ?? BRAND_ORIGIN}/${f.slug}/download?order=${encodeURIComponent(o.id)}&file=${encodeURIComponent(k)}` })),
  };
}

// ─── 2. abandoned checkouts ────────────────────────────────────────
// A funnel with a series (lib/abandonCopy.ts: the MIDI Drum Kit's three emails
// from ClickFunnels) sends them one after the other; the others send the one
// reminder of lib/mailCopy.ts an hour after step 1. checkout_starts.reminders
// counts what went out (db/email-series.sql); a buyer or someone who left the
// list gets nothing more.

const REMINDERS_DONE = 3;

async function reminders(run: Run) {
  const db = supabase();
  const now = Date.now();
  const { data, error } = await db
    .from("checkout_starts")
    .select("funnel, email, name, lang, currency, started_at, reminders, reminder_sent_at")
    .lt("reminders", REMINDERS_DONE)
    .lte("started_at", new Date(now - FIRST_SERIES_MS).toISOString())
    .gte("started_at", new Date(now - REMIND_GIVE_UP_MS).toISOString())
    .order("started_at")
    .limit(100);
  if (error) throw error;

  for (const row of data ?? []) {
    if (run.over) return;
    const sent: number = row.reminders;
    const series = ABANDON_SERIES_FUNNELS.has(row.funnel) ? abandonSeries(row.lang) : null;
    const at = (patch: Record<string, unknown>) => db.from("checkout_starts").update(patch).eq("funnel", row.funnel).eq("email", row.email);
    const done = () => (run.dryRun ? null : at({ reminders: REMINDERS_DONE }));
    if (sent >= (series?.length ?? 1)) {
      await done();
      continue;
    }
    const wait = series ? series[sent].after * 60_000 : REMIND_AFTER_MS;
    if (Date.parse(sent === 0 ? row.started_at : (row.reminder_sent_at ?? row.started_at)) + wait > now) continue;

    const f = await resolveFunnel(row.funnel);
    // Bought (our orders, or Stripe/PayPal for a sale we never saw), or left the list: nothing more.
    const { data: contact } = await db.from("contacts").select("status, tags").eq("email", row.email).maybeSingle();
    const bought = (await hasPaidOrder(row.funnel, row.email)) || (await purchasesOf(row.email)).some((p) => p.funnel === row.funnel);
    // A free-pack sign-up (app/free/packs.ts tag "free-pack"): most took the Drum Kit
    // page's button for their download and never meant to order (11-05: "Yes, stop
    // them"); the Drum Kit follow-up of db/free-packs-kit.sql writes to them instead.
    const freePack = Array.isArray(contact?.tags) && contact.tags.includes("free-pack");
    if (!f || bought || freePack || (contact && contact.status !== "subscribed")) {
      await done();
      continue;
    }
    if (!run.dryRun) {
      const { data: claimed } = await db
        .from("checkout_starts")
        .update({ reminders: sent + 1, reminder_sent_at: new Date().toISOString() })
        .eq("funnel", row.funnel)
        .eq("email", row.email)
        .eq("reminders", sent)
        .select("email");
      if (!claimed?.length) continue;
    }
    const first = (row.name ?? "").trim().split(/\s+/)[0]?.slice(0, 40) ?? "";
    // The series says "I've saved your cart": its link opens the order page on step 2
    // with their name and email filled (lib/mail.ts resumeToken, read by OrderForm.tsx).
    const order = `${f.home ?? BRAND_ORIGIN}${checkoutPages(f, row.lang).orderPage}`;
    const url = series ? `${order}?c=${resumeToken({ funnel: row.funnel, email: row.email, name: row.name })}` : order;
    // The series' emails count apart in Insights (<funnel>/1, /2, /3); the single reminder is <funnel>.
    const ref = series ? `${row.funnel}/${sent + 1}` : row.funnel;
    let email: Email;
    if (series) {
      const m = series[sent];
      // The price they saw at checkout; before the currency was saved, English is dollars, the others euros.
      const currency: Currency = row.currency === "eur" || row.currency === "usd" ? row.currency : row.lang && row.lang !== "en" ? "eur" : "usd";
      const price = statedPrice(f.price[currency], currency, row.lang);
      email = letter({ to: { email: row.email, name: row.name }, subject: m.subject(first), preheader: m.preheader, body: m.body({ name: first, url, price }), lang: row.lang, track: { kind: "reminder", ref } });
    } else {
      const c = mailCopy(row.lang).reminder;
      email = {
        to: row.email,
        subject: c.subject(f.product),
        html: card({ lang: row.lang, title: c.title(first, f.product), lead: c.lead, buttons: [{ label: c.button, url }], notes: c.notes, help: c.help, track: { t: { kind: "reminder", ref }, email: row.email } }),
        text: [c.title(first, f.product), "", c.lead, "", `${c.button}: ${url}`, "", ...c.notes, "", "support@thegrind.studio"].join("\n"),
      };
    }
    try {
      const id = await run.send(email);
      // Not sent (time up): this one again next run.
      if (id === null && !run.dryRun) await at({ reminders: sent, reminder_sent_at: row.reminder_sent_at });
      else {
        run.report.reminders++;
        // For dashboard → Email → Insights: sent, and the orders that followed.
        if (!run.dryRun) await db.from("email_sends").upsert({ kind: "reminder", ref, email: row.email, status: "sent", message_id: id }, { onConflict: "kind,ref,email", ignoreDuplicates: true });
      }
    } catch (err) {
      run.report.failed++;
      // A refusal counts as sent: never a late or doubled reminder.
      run.report.notes.push(`reminder ${ref}/${row.email}: ${errorText(err)}`);
      if (run.over) return;
    }
  }
}

// ─── 3. sequences ──────────────────────────────────────────────────

type Step = { id: string; position: number; delay_hours: number; subject: string; body: string };
type Sequence = { id: string; exit_tag: string | null; active: boolean; steps: Step[] };

async function sequences(run: Run) {
  const db = supabase();
  const { data: runs, error } = await db
    .from("sequence_runs")
    .select("sequence_id, email, next_position, started_at")
    .eq("status", "active")
    .lte("next_at", new Date().toISOString())
    .order("next_at")
    .limit(200);
  if (error) throw error;
  if (!runs?.length) return;

  const ids = [...new Set(runs.map((r) => r.sequence_id))];
  const { data: seqs, error: sErr } = await db.from("sequences").select("id, exit_tag, active, sequence_steps(id, position, delay_hours, subject, body)").in("id", ids);
  if (sErr) throw sErr;
  const byId = new Map<string, Sequence>(
    (seqs ?? []).map((s) => [s.id, { id: s.id, exit_tag: s.exit_tag, active: s.active, steps: [...(s.sequence_steps as Step[])].sort((a, b) => a.position - b.position) }]),
  );

  for (const r of runs) {
    if (run.over) return;
    const seq = byId.get(r.sequence_id);
    if (!seq?.active) continue; // paused: the run waits
    const setRun = (patch: Record<string, unknown>) => db.from("sequence_runs").update(patch).eq("sequence_id", r.sequence_id).eq("email", r.email);
    const step = seq.steps[r.next_position];
    if (!step) {
      if (!run.dryRun) await setRun({ status: "done" });
      continue;
    }
    // The first step's delay counts from the start.
    if (r.next_position === 0 && step.delay_hours > 0) {
      const at = Date.parse(r.started_at) + step.delay_hours * 3_600_000;
      if (at > Date.now()) {
        if (!run.dryRun) await setRun({ next_at: new Date(at).toISOString() });
        continue;
      }
    }
    const { data: contact } = await db.from("contacts").select("email, name, lang, status, tags").eq("email", r.email).maybeSingle();
    if (!contact || contact.status !== "subscribed" || (seq.exit_tag && (contact.tags ?? []).includes(seq.exit_tag))) {
      if (!run.dryRun) await setRun({ status: "exited" });
      continue;
    }

    const sent = await sendOnce(run, "sequence", step.id, contact, () => letter({ to: contact, subject: step.subject, body: step.body, lang: contact.lang, track: { kind: "sequence", ref: step.id } }));
    // Not sent and not recorded (time up, the sandbox): this step again next run.
    if (sent === "retry") {
      if (run.over || run.sandbox) return;
      continue;
    }
    const following = seq.steps[r.next_position + 1];
    if (!run.dryRun) {
      await setRun(
        following
          ? { next_position: r.next_position + 1, next_at: new Date(Date.now() + following.delay_hours * 3_600_000).toISOString() }
          : { next_position: r.next_position + 1, status: "done" },
      );
    }
    if (sent === "sent") run.report.sequence++;
  }
}

/**
 * One email to one contact for one broadcast/launch email/sequence step,
 * at most once ever (email_sends): "sent", "failed" (recorded, never tried
 * again), "skip" (already sent before), "retry" (not sent and not recorded:
 * time up, SES skipped it or is in its sandbox).
 */
async function sendOnce(
  run: Run,
  kind: "broadcast" | "launch" | "sequence",
  ref: string,
  to: { email: string },
  build: () => Email,
  claimed = false,
): Promise<"sent" | "failed" | "skip" | "retry"> {
  const db = supabase();
  if (!claimed && !run.dryRun) {
    const { data, error } = await db.from("email_sends").upsert({ kind, ref, email: to.email }, { onConflict: "kind,ref,email", ignoreDuplicates: true }).select("email");
    if (error) throw error;
    if (!data?.length) return "skip";
  }
  const row = () => db.from("email_sends");
  const release = () => row().delete().eq("kind", kind).eq("ref", ref).eq("email", to.email);
  try {
    const id = await run.send(build());
    if (id === null) {
      if (!run.dryRun) await release();
      return "retry";
    }
    if (!run.dryRun) await row().update({ status: "sent", message_id: id }).eq("kind", kind).eq("ref", ref).eq("email", to.email);
    return "sent";
  } catch (err) {
    if (run.sandbox || run.over) {
      if (!run.dryRun) await release();
      return "retry";
    }
    run.report.failed++;
    if (!run.dryRun) await row().update({ status: "failed", error: errorText(err) }).eq("kind", kind).eq("ref", ref).eq("email", to.email);
    return "failed";
  }
}

// ─── 4. broadcasts and launch emails ───────────────────────────────

type Audience = { tag: string | null; exclude: string | null };

/**
 * Send the next batches of one mass email until its audience is done or the
 * run's time is up. "done", "paused" (time up: the next run goes on) or
 * "sandbox" (SES refused an unverified address: still in its sandbox).
 */
async function sendToAudience(
  run: Run,
  kind: "broadcast" | "launch",
  ref: string,
  audience: Audience,
  build: (r: { email: string; name: string | null; lang: string | null }) => Email,
  counted: (n: number, failed: number) => Promise<void>,
): Promise<"done" | "paused" | "sandbox"> {
  const db = supabase();
  if (run.sandbox) return "sandbox";
  for (;;) {
    if (run.over) return "paused";
    if (run.dryRun) {
      const { data } = await db.rpc("audience_size", { p_tag: audience.tag, p_exclude: audience.exclude });
      run.report.notes.push(`${kind} ${ref}: would send to ${data} contacts`);
      return "paused";
    }
    const { data: batch, error } = await db.rpc("claim_recipients", { p_kind: kind, p_ref: ref, p_tag: audience.tag, p_exclude: audience.exclude, lim: 25 });
    if (error) throw error;
    if (!batch?.length) return "done";
    let sent = 0;
    let failed = 0;
    let i = 0;
    for (; i < batch.length; i++) {
      const outcome = await sendOnce(run, kind, ref, batch[i], () => build(batch[i]), true);
      if (outcome === "sent") sent++;
      if (outcome === "failed") failed++;
      if (outcome === "retry" || run.over) {
        i++;
        break;
      }
    }
    // Claimed but not tried (the run ended): give them back for the next run.
    const untried = batch.slice(i).map((r: { email: string }) => r.email);
    if (untried.length) await db.from("email_sends").delete().eq("kind", kind).eq("ref", ref).in("email", untried);
    await counted(sent, failed);
    if (kind === "broadcast") run.report.broadcast += sent;
    else run.report.launch += sent;
    if (run.sandbox) return "sandbox";
    if (run.over) return "paused";
  }
}

async function broadcasts(run: Run) {
  const db = supabase();
  const { data, error } = await db
    .from("broadcasts")
    .select("*")
    .in("status", ["scheduled", "sending"])
    .lte("send_at", new Date().toISOString())
    .order("send_at")
    .limit(5);
  if (error) throw error;
  for (const b of data ?? []) {
    if (run.over) return;
    if (!run.dryRun && b.status === "scheduled") await db.from("broadcasts").update({ status: "sending", error: null }).eq("id", b.id);
    let total = { sent: b.sent_count as number, failed: b.failed_count as number };
    const outcome = await sendToAudience(
      run,
      "broadcast",
      b.id,
      { tag: b.audience_tag, exclude: b.exclude_tag },
      (r) => letter({ to: r, subject: b.subject, preheader: b.preheader, body: b.body, lang: r.lang, track: { kind: "broadcast", ref: b.id } }),
      async (sent, failed) => {
        total = { sent: total.sent + sent, failed: total.failed + failed };
        await db.from("broadcasts").update({ sent_count: total.sent, failed_count: total.failed, updated_at: new Date().toISOString() }).eq("id", b.id);
      },
    );
    if (run.dryRun) continue;
    if (outcome === "done") await db.from("broadcasts").update({ status: "sent", sent_at: new Date().toISOString() }).eq("id", b.id);
    if (outcome === "sandbox") {
      // Back to draft, not left scheduled: a newsletter must not go out days late on its own.
      await db
        .from("broadcasts")
        .update({ status: "draft", error: "Not sent: Amazon SES is still in its sandbox (only verified addresses receive). Schedule it again once production access is on." })
        .eq("id", b.id);
    }
  }
}

async function launchEmails(run: Run) {
  const db = supabase();
  const { data, error } = await db
    .from("launch_emails")
    .select("*")
    .in("status", ["scheduled", "sending"])
    .lte("send_at", new Date().toISOString())
    .order("send_at")
    .limit(5);
  if (error) throw error;
  for (const e of data ?? []) {
    if (run.over) return;
    const l = await getLaunch(e.launch_id);
    if (!l) continue;
    if (!run.dryRun && e.status === "scheduled") await db.from("launch_emails").update({ status: "sending", error: null }).eq("id", e.id);
    const vars = launchVars(l);
    let sentCount = (e.sent_count as number | null) ?? 0;
    const outcome = await sendToAudience(
      run,
      "launch",
      e.id,
      { tag: e.audience_tag, exclude: e.exclude_tag },
      (r) => letter({ to: r, subject: e.subject, body: e.body, vars, lang: r.lang, track: { kind: "launch", ref: e.id } }),
      async (sent) => {
        sentCount += sent;
        await db.from("launch_emails").update({ sent_count: sentCount }).eq("id", e.id);
      },
    );
    if (run.dryRun) continue;
    if (outcome === "done") await db.from("launch_emails").update({ status: "sent", sent_at: new Date().toISOString() }).eq("id", e.id);
    if (outcome === "sandbox") {
      await db.from("launch_emails").update({ status: "draft", error: "Not sent: Amazon SES is still in its sandbox. Schedule it again once production access is on." }).eq("id", e.id);
    }
  }
}

const both = (eur: number, usd: number) => (eur === usd ? `€${eur} / $${usd}` : `${money(eur, "eur")} / ${money(usd, "usd")}`);
const when = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris", timeZoneName: "short" }).format(
    new Date(iso),
  );

/** {name} {earlyprice} {fullprice} {cartopen} {deadline} {link} for a launch email. */
function launchVars(l: NonNullable<Awaited<ReturnType<typeof getLaunch>>>): Record<string, string> {
  return {
    name: l.product.name,
    earlyprice: both(l.launch.early.eur, l.launch.early.usd),
    fullprice: both(l.product.price.eur, l.product.price.usd),
    cartopen: when(l.launch.cartOpenAt),
    deadline: when(l.launch.earlyBirdEndAt),
    link: `${BRAND_ORIGIN}/${l.product.slug}`,
  };
}

/** A test of a newsletter-type email to one address (the dashboard's "Send me a test"). */
export async function sendTest(to: string, o: { subject: string; preheader?: string; body: string; vars?: Record<string, string> }): Promise<string> {
  const email = letter({ to: { email: to, name: null }, subject: `[Test] ${o.subject}`, preheader: o.preheader, body: o.body, vars: o.vars });
  const sent = await sendEmail(email);
  if ("skipped" in sent) throw new Error(sent.skipped);
  return sent.id;
}

export { launchVars };
