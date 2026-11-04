import { supabase } from "@/lib/supabase";
import { listOrders } from "@/lib/sales";
import { listConversations, type Conversation } from "@/lib/support";

// Dashboard → Support → Overview: what to answer first. Plain rules, like the
// home's Insights (lib/insights.ts): no model and no API key. Each open
// conversation gets a category from its words and its sender, and a priority
// from that, whether the person bought from us (funnnnels orders and the
// ClickFunnels purchases in legacy_purchases), and how long they've waited.

export type Priority = "urgent" | "high" | "normal" | "low" | "ignore";
export type Category = "dispute" | "refund" | "download" | "question" | "feedback" | "phishing" | "spam" | "notification" | "other";
export type OverviewItem = {
  customer: string;
  priority: Priority;
  category: Category;
  title: string;
  why: string;
  action: string;
};
export type Overview = { summary: string; items: OverviewItem[] };

const DAY = 86_400_000;

// ─── what the words say ────────────────────────────────────────────
// Lower-case text; the five languages we sell in.

const DISPUTE = /\b(chargeback|dispute|scam|fraud|unauthori[sz]ed|did ?n[o']t (place|make|authori[sz]e|order)|never (ordered|placed|bought)|report (you|this)|lawyer|truffa|estafa|arnaque|betrug|stafa)\b/;
const REFUND = /\b(refund|money back|reimburse|rimbors|reembols|rembours|erstatt|geld zur(ü|u)ck|charged twice|double charge|cancel (my|the) (order|purchase))/;
const DOWNLOAD = /\b(download|scaric|t(é|e)l(é|e)charg|descarg|herunterlad|link|can'?t (access|open|find)|cannot (access|open|find)|does ?n[o']t work|not working|expired|can'?t be reached|unzip|zip file|corrupt|no (file|files)|missing file)/;
const QUESTION = /\?|\b(how (do|can)|which|price|discount|upgrade|bundle|is it possible|could you|can you|quanto|come posso|comment|cómo|wie kann)/;
// Physical goods: we only sell files.
const SHIPPING = /\b(packaging|package|parcel|shipment|shipping|freight|courier|delivery damage|damaged in transit|logistics)\b/;
const PHISH_TEXT = /\b(update (your )?payment|payment (update|information) required|verify (your )?(account|identity)|account (will be |has been )?(suspended|disabled|restricted|terminated)|policy violation|copyright (claim|infringement)|unusual activity|confirm your (account|identity))\b/;

const BRANDS = ["meta", "facebook", "instagram", "google", "paypal", "stripe", "apple", "amazon", "microsoft", "siteground", "tiktok", "chanel", "netflix", "spotify", "youtube"];

// Latin letters next to Greek or Cyrillic ones in one name ("Μеtа"): a lookalike.
const mixedScript = (s: string) => /\p{Script=Latin}/u.test(s) && /[\p{Script=Greek}\p{Script=Cyrillic}]/u.test(s);
// Mostly written in a script we don't sell in (Korean, Chinese, Japanese…).
function foreignScript(s: string): boolean {
  const letters = s.match(/\p{L}/gu) ?? [];
  if (letters.length < 20) return false;
  const latin = letters.filter((c) => /\p{Script=Latin}/u.test(c)).length;
  return latin / letters.length < 0.5;
}
// The new part of an email, without the quoted history under it.
function fresh(text: string): string {
  const m = text.match(/^(On .{4,200}wrote:\s*$|-{2,} ?Original Message ?-{2,}|_{8,}|From: .+$|>.*$)/m);
  return (m && m.index && m.index > 0 ? text.slice(0, m.index) : text).trim();
}

type Msg = { direction: "in" | "out"; from_name: string | null; subject: string | null; text_body: string | null; sent_at: string };
type Bought = { product: string; ref: string | null };

function classify(c: Conversation, msgs: Msg[], bought: Bought[], now: number): OverviewItem {
  const domain = c.customer.split("@")[1] ?? "";
  const local = c.customer.split("@")[0] ?? "";
  const incoming = msgs.filter((m) => m.direction === "in");
  const subject = (incoming.at(-1)?.subject ?? c.subject ?? "").trim();
  const name = incoming.find((m) => m.from_name)?.from_name ?? "";
  const body = incoming.map((m) => fresh(m.text_body ?? "")).join("\n").toLowerCase();
  const words = `${incoming.map((m) => m.subject ?? "").join("\n").toLowerCase()}\n${body}`;
  const buyer = bought.length > 0;
  const last = msgs.at(-1);
  const lastOurs = last?.direction === "out";
  // Waiting since their first email after our last reply.
  const lastOut = msgs.findLastIndex((m) => m.direction === "out");
  const firstWaiting = msgs.slice(lastOut + 1).find((m) => m.direction === "in");
  const waitingDays = firstWaiting && !lastOurs ? Math.floor((now - Date.parse(firstWaiting.sent_at)) / DAY) : 0;

  const item = (priority: Priority, category: Category, title: string, why: string, action: string): OverviewItem => ({ customer: c.customer, priority, category, title, why, action });

  // ── not a person ──
  if (/^(mailer-daemon|postmaster)$/.test(local) || /delivery status notification|undeliverable|mail delivery (failed|subsystem)|returned mail/i.test(subject)) {
    return item("ignore", "notification", "Bounce report", "An email we sent couldn't be delivered, or an auto-reply came back to it.", "Nothing to answer.");
  }
  if (/^(auto(matic)?[ -]?reply|out of (the )?office|r(é|e)ponse automatique|risposta automatica|respuesta autom(á|a)tica|abwesenheit)/i.test(subject)) {
    return item("ignore", "notification", "Auto-reply", "An automatic answer to one of our emails.", "Nothing to answer.");
  }
  const brand = BRANDS.find((b) => name.toLowerCase().normalize("NFKC").includes(b) || subject.toLowerCase().includes(b));
  if (!buyer && (mixedScript(name) || (brand && !domain.includes(brand)) || PHISH_TEXT.test(words))) {
    const sender = name || c.customer;
    return item("ignore", "phishing", "Phishing", `"${sender}" writes from ${domain}${mixedScript(name) ? ", with lookalike letters in the name" : brand && !domain.includes(brand) ? `, which isn't ${brand[0].toUpperCase() + brand.slice(1)}` : ""}.`, "Don't click anything. Mark it done.");
  }
  if (/^(no-?reply|do-?not-?reply|notifications?|alerts?|news(letter)?|info|marketing)$/.test(local) && !buyer) {
    return item("ignore", "notification", "Automatic email", `Sent by ${c.customer}, an address that doesn't take replies.`, "Nothing to answer.");
  }
  if (!buyer && (foreignScript(words) || SHIPPING.test(words))) {
    return item("ignore", "spam", "Spam", SHIPPING.test(words) ? "Talks about a damaged parcel or shipping, but we only sell downloads." : "Written in a language we don't sell in, from someone who never bought.", "Mark it done.");
  }

  // ── a person ──
  const products = bought.map((b) => `${b.product}${b.ref ? ` (#${b.ref})` : ""}`);
  const who = buyer ? `Bought ${products.slice(0, 3).join(", ")}${products.length > 3 ? ` and ${products.length - 3} more` : ""}.` : "No purchase found with this email.";
  const wait = lastOurs ? "We answered last; waiting on them." : waitingDays >= 1 ? `Waiting ${waitingDays} day${waitingDays === 1 ? "" : "s"}${incoming.length > 1 ? `, ${incoming.length} emails` : ""}.` : "Wrote today.";
  const why = `${who} ${wait}`;
  const isReplyToUs = /^(re|aw|r|rif|sv):/i.test(subject);

  let category: Category;
  let score: number;
  let title: string;
  let action: string;
  if (DISPUTE.test(words)) {
    category = "dispute";
    score = 90;
    title = "Says the order wasn't theirs, or calls it a scam";
    action = "Answer today and settle it (refund if fair) before they open a chargeback.";
  } else if (REFUND.test(words)) {
    category = "refund";
    score = 65;
    title = "Asks for a refund";
    action = "Check the order, then refund it in Stripe/PayPal or explain why not.";
  } else if (DOWNLOAD.test(words) && (buyer || /order|#\d{3,}/.test(words))) {
    category = "download";
    score = 60;
    title = "Can't download what they bought";
    action = "Send the files again, or point them to m.thegrind.studio/account to download.";
  } else if (isReplyToUs && fresh(incoming.at(-1)?.text_body ?? "").length < 280 && !QUESTION.test(body)) {
    category = "feedback";
    score = 15;
    title = "Short reply to one of our emails";
    action = "No answer needed.";
  } else if (QUESTION.test(body) || (!isReplyToUs && QUESTION.test(subject.toLowerCase()))) {
    category = "question";
    score = 40;
    title = `Question: ${subject.replace(/^(re|aw|fwd?|r|rif):\s*/i, "").slice(0, 60) || "no subject"}`;
    action = buyer ? "Answer it; they're already a customer." : "Answer it; could turn into a sale.";
  } else {
    category = "other";
    score = 30;
    title = subject.replace(/^(re|aw|fwd?|r|rif):\s*/i, "").slice(0, 60) || "No subject";
    action = "Read it and answer if needed.";
  }
  if (buyer) score += 15;
  score += Math.min(waitingDays, 14);
  if (lastOurs) score = category === "dispute" ? Math.min(score, 70) : Math.min(score, 25);

  const priority: Priority = score >= 85 ? "urgent" : score >= 60 ? "high" : score >= 35 ? "normal" : "low";
  return item(priority, category, title, why, action);
}

const RANK: Record<Priority, number> = { urgent: 0, high: 1, normal: 2, low: 3, ignore: 4 };

export async function getOverview(now = Date.now()): Promise<Overview> {
  const open = (await listConversations()).filter((c) => !c.done);
  if (!open.length) return { summary: "No open conversations.", items: [] };
  const customers = open.map((c) => c.customer);
  const db = supabase();
  const [{ data: msgs, error }, { data: legacy }, { data: catalog }, orders] = await Promise.all([
    db.from("support_messages").select("customer, direction, from_name, subject, text_body, sent_at").in("customer", customers).order("sent_at", { ascending: true }).limit(3000),
    db.from("legacy_purchases").select("email, product, ref").in("email", customers),
    db.from("catalog").select("slug, name"),
    listOrders(5000),
  ]);
  if (error) throw error;
  const productName = new Map((catalog ?? []).map((p) => [p.slug as string, p.name as string]));
  const label = (slug: string) => productName.get(slug) ?? slug;

  const byCustomer = new Map<string, Msg[]>();
  for (const m of msgs ?? []) byCustomer.set(m.customer, [...(byCustomer.get(m.customer) ?? []), m as Msg]);
  const boughtBy = new Map<string, Bought[]>();
  for (const p of legacy ?? []) boughtBy.set(p.email, [...(boughtBy.get(p.email) ?? []), { product: label(p.product), ref: p.ref }]);
  for (const o of orders) {
    const e = o.email?.toLowerCase();
    if (e && customers.includes(e) && !o.offer) boughtBy.set(e, [...(boughtBy.get(e) ?? []), { product: label(o.funnel), ref: null }]);
  }

  const items = open
    .map((c) => ({ item: classify(c, byCustomer.get(c.customer) ?? [], boughtBy.get(c.customer) ?? [], now), at: Date.parse(c.lastAt) }))
    // Most important first; within a priority, who waited longest.
    .sort((a, b) => RANK[a.item.priority] - RANK[b.item.priority] || a.at - b.at)
    .map((x) => x.item);

  return { summary: summarize(items, open, boughtBy, byCustomer, now), items };
}

function summarize(items: OverviewItem[], open: Conversation[], boughtBy: Map<string, Bought[]>, msgs: Map<string, Msg[]>, now: number): string {
  const people = items.filter((i) => i.priority !== "ignore");
  const waiting = people.filter((i) => i.category !== "feedback" && msgs.get(i.customer)?.at(-1)?.direction === "in");
  const buyers = waiting.filter((i) => boughtBy.has(i.customer));
  const ignored = items.length - people.length;
  const count = (cat: Category) => people.filter((i) => i.category === cat).length;
  const parts: string[] = [];
  if (!waiting.length) parts.push("Nobody is waiting for an answer.");
  else {
    parts.push(`${waiting.length} ${waiting.length === 1 ? "person is" : "people are"} waiting for an answer${buyers.length === waiting.length ? (waiting.length > 1 ? ", all customers" : ", a customer") : buyers.length ? `, ${buyers.length} of them customers` : ""}.`);
    const oldest = waiting
      .map((i) => ({ i, since: Math.min(...(msgs.get(i.customer) ?? []).filter((m) => m.direction === "in").map((m) => Date.parse(m.sent_at))) }))
      .sort((a, b) => a.since - b.since)[0];
    const days = Math.floor((now - oldest.since) / DAY);
    if (days >= 2) parts.push(`The oldest has waited ${days} days (${open.find((c) => c.customer === oldest.i.customer)?.name || oldest.i.customer}).`);
  }
  const issues = [
    [count("dispute"), "possible dispute", "possible disputes"],
    [count("refund"), "refund request", "refund requests"],
    [count("download"), "download problem", "download problems"],
  ] as const;
  const listed = issues.filter(([n]) => n > 0).map(([n, one, many]) => `${n} ${n === 1 ? one : many}`);
  if (listed.length) parts.push(`${listed.join(", ")}.`.replace(/^./, (c) => c.toUpperCase()));
  const replies = people.filter((i) => i.category === "feedback").length;
  if (replies) parts.push(`${replies} short ${replies === 1 ? "reply" : "replies"} to our emails, nothing to answer.`);
  if (ignored) parts.push(`${ignored} to ignore (spam, phishing, bounces).`);
  return parts.join(" ");
}
