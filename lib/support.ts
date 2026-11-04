import { randomUUID } from "node:crypto";
import { ImapFlow } from "imapflow";
import { simpleParser, type AddressObject, type ParsedMail } from "mailparser";
import nodemailer from "nodemailer";
import sanitizeHtml from "sanitize-html";
import MailComposer from "nodemailer/lib/mail-composer";
import { supabase } from "@/lib/supabase";
import { ordersByEmail, type OrderRow } from "@/lib/sales";

// Dashboard → Support: support@thegrind.studio, a Namecheap Private Email
// mailbox, read over IMAP and answered over its SMTP (db/support.sql).
// The email job (/api/cron/email) copies new mail every minute; a reply is
// sent, saved to the mailbox's Sent folder and stored here at once, so the
// webmail and phone see the same conversation.
//
// Env: SUPPORT_EMAIL_USER (the address), SUPPORT_EMAIL_PASSWORD; optionally
// SUPPORT_IMAP_HOST / SUPPORT_SMTP_HOST (both mail.privateemail.com).

const IMAP_HOST = process.env.SUPPORT_IMAP_HOST || "mail.privateemail.com";
const SMTP_HOST = process.env.SUPPORT_SMTP_HOST || "mail.privateemail.com";
const FROM_NAME = "Grind Studio";
// The first copy of a folder goes back this far; later runs take what's new.
const FIRST_SYNC_DAYS = 60;
// At most this many emails per folder per run, so a run stays short; the
// rest come a minute later.
const PER_RUN = 40;
const MAX_HTML = 300_000;
const MAX_TEXT = 60_000;

function user(): string {
  return (process.env.SUPPORT_EMAIL_USER || "").trim().toLowerCase();
}

export function supportConfigured(): boolean {
  return Boolean(user() && process.env.SUPPORT_EMAIL_PASSWORD);
}

function imap(): ImapFlow {
  return new ImapFlow({
    host: IMAP_HOST,
    port: 993,
    secure: true,
    auth: { user: user(), pass: process.env.SUPPORT_EMAIL_PASSWORD! },
    logger: false,
    socketTimeout: 30_000,
  });
}

// ─── copying the mailbox ───────────────────────────────────────────

const first = (a: AddressObject | AddressObject[] | undefined) => (Array.isArray(a) ? a[0] : a)?.value[0];

function row(parsed: ParsedMail, folder: string, uidValidity: bigint, uid: number, date: Date | undefined) {
  const me = user();
  const from = parsed.from?.value[0];
  const to = first(parsed.to);
  const fromEmail = from?.address?.toLowerCase() ?? null;
  const toEmail = to?.address?.toLowerCase() ?? null;
  // Sent by the mailbox itself (from the Sent folder, or a copy in the inbox)?
  const out = folder !== "INBOX" || fromEmail === me;
  const customer = (out ? toEmail : fromEmail) ?? "";
  const text = (parsed.text ?? "").slice(0, MAX_TEXT);
  const html = typeof parsed.html === "string" ? parsed.html.slice(0, MAX_HTML) : null;
  const refs = Array.isArray(parsed.references) ? parsed.references.join(" ") : parsed.references ?? null;
  return {
    message_id: parsed.messageId || `${folder}:${uidValidity}:${uid}`,
    folder,
    uid,
    direction: out ? "out" : "in",
    customer,
    from_email: fromEmail,
    from_name: from?.name || null,
    to_email: toEmail,
    subject: parsed.subject ?? null,
    text_body: text,
    html_body: html,
    snippet: text.replace(/\s+/g, " ").trim().slice(0, 160),
    in_reply_to: parsed.inReplyTo ?? null,
    refs,
    sent_at: (parsed.date ?? date ?? new Date()).toISOString(),
    // What we send is read already.
    read_at: out ? new Date().toISOString() : null,
  };
}

async function syncFolder(client: ImapFlow, folder: string): Promise<number> {
  const db = supabase();
  const lock = await client.getMailboxLock(folder, { readOnly: true });
  try {
    const box = client.mailbox;
    if (!box) return 0;
    const validity = box.uidValidity;
    const { data: state } = await db.from("support_sync").select("*").eq("folder", folder).maybeSingle();
    let uids: number[];
    if (state && BigInt(state.uid_validity) === validity) {
      if (box.uidNext <= Number(state.last_uid) + 1) return 0;
      uids = (await client.search({ uid: `${Number(state.last_uid) + 1}:*` }, { uid: true })) || [];
      uids = uids.filter((u) => u > Number(state.last_uid));
    } else {
      // First copy, or the server renumbered the folder: start from a date;
      // message_id keeps what's already here from coming in twice.
      uids = (await client.search({ since: new Date(Date.now() - FIRST_SYNC_DAYS * 86_400_000) }, { uid: true })) || [];
    }
    uids.sort((a, b) => a - b);
    const batch = uids.slice(0, PER_RUN);
    if (!batch.length) {
      if (!state || BigInt(state.uid_validity) !== validity) {
        await db.from("support_sync").upsert({ folder, uid_validity: validity.toString(), last_uid: box.uidNext - 1, synced_at: new Date().toISOString() });
      }
      return 0;
    }
    const rows = [];
    for await (const msg of client.fetch(batch.join(","), { uid: true, source: true, internalDate: true }, { uid: true })) {
      if (!msg.source) continue;
      const parsed = await simpleParser(msg.source);
      const internal = msg.internalDate ? new Date(msg.internalDate) : undefined;
      const r = row(parsed, folder, validity, msg.uid, internal);
      if (r.customer) rows.push(r);
    }
    if (rows.length) {
      const { error } = await db.from("support_messages").upsert(rows, { onConflict: "message_id", ignoreDuplicates: true });
      if (error) throw error;
    }
    await db.from("support_sync").upsert({ folder, uid_validity: validity.toString(), last_uid: batch[batch.length - 1], synced_at: new Date().toISOString() });
    return rows.length;
  } finally {
    lock.release();
  }
}

async function sentFolder(client: ImapFlow): Promise<string | null> {
  const boxes = await client.list();
  return (boxes.find((b) => b.specialUse === "\\Sent") ?? boxes.find((b) => /^(inbox\.)?sent( items| messages)?$/i.test(b.path)))?.path ?? null;
}

/** Copies new mail from INBOX and Sent. Returns how many emails came in. */
export async function syncSupport(): Promise<{ inbox: number; sent: number } | { skipped: string }> {
  if (!supportConfigured()) return { skipped: "SUPPORT_EMAIL_USER / SUPPORT_EMAIL_PASSWORD not set" };
  const client = imap();
  await client.connect();
  try {
    const inbox = await syncFolder(client, "INBOX");
    const sent = await sentFolder(client);
    return { inbox, sent: sent ? await syncFolder(client, sent) : 0 };
  } finally {
    await client.logout().catch(() => {});
  }
}

// ─── the dashboard ─────────────────────────────────────────────────

export type Conversation = {
  customer: string;
  name: string | null;
  subject: string | null;
  snippet: string | null;
  lastAt: string;
  lastDirection: "in" | "out";
  messages: number;
  unread: number;
  done: boolean;
};

export async function listConversations(): Promise<Conversation[]> {
  const db = supabase();
  const [{ data, error }, { data: threads }] = await Promise.all([
    db.from("support_messages").select("customer, direction, from_name, subject, snippet, sent_at, read_at").order("sent_at", { ascending: false }).limit(3000),
    db.from("support_threads").select("customer, done_at"),
  ]);
  if (error) throw error;
  const doneAt = new Map((threads ?? []).map((t) => [t.customer, t.done_at as string | null]));
  const byCustomer = new Map<string, Conversation & { lastInAt: string | null }>();
  for (const m of data ?? []) {
    let c = byCustomer.get(m.customer);
    if (!c) {
      c = { customer: m.customer, name: null, subject: m.subject, snippet: m.snippet, lastAt: m.sent_at, lastDirection: m.direction, messages: 0, unread: 0, done: false, lastInAt: null };
      byCustomer.set(m.customer, c);
    }
    c.messages += 1;
    if (m.direction === "in") {
      if (!m.read_at) c.unread += 1;
      if (!c.name && m.from_name) c.name = m.from_name;
      if (!c.lastInAt) c.lastInAt = m.sent_at;
    }
  }
  return [...byCustomer.values()].map(({ lastInAt, ...c }) => {
    const d = doneAt.get(c.customer);
    return { ...c, done: Boolean(d && (!lastInAt || Date.parse(lastInAt) <= Date.parse(d))) };
  });
}

export type SupportMessage = {
  id: number;
  direction: "in" | "out";
  fromEmail: string | null;
  fromName: string | null;
  toEmail: string | null;
  subject: string | null;
  text: string;
  html: string | null;
  sentAt: string;
};

export type Thread = { customer: string; done: boolean; messages: SupportMessage[]; orders: OrderRow[] };

/** One conversation, oldest first, with the customer's orders. Marks it read. */
export async function getThread(customer: string): Promise<Thread> {
  const db = supabase();
  const c = customer.toLowerCase();
  const [{ data, error }, { data: thread }, orders] = await Promise.all([
    db.from("support_messages").select("*").eq("customer", c).order("sent_at", { ascending: true }).limit(200),
    db.from("support_threads").select("done_at").eq("customer", c).maybeSingle(),
    ordersByEmail(c).catch(() => []),
  ]);
  if (error) throw error;
  const rows = data ?? [];
  if (rows.some((m) => m.direction === "in" && !m.read_at)) {
    await db.from("support_messages").update({ read_at: new Date().toISOString() }).eq("customer", c).is("read_at", null);
  }
  const lastIn = [...rows].reverse().find((m) => m.direction === "in");
  const done = Boolean(thread?.done_at && (!lastIn || Date.parse(lastIn.sent_at) <= Date.parse(thread.done_at)));
  return {
    customer: c,
    done,
    orders,
    messages: rows.map((m) => ({
      id: m.id,
      direction: m.direction,
      fromEmail: m.from_email,
      fromName: m.from_name,
      toEmail: m.to_email,
      subject: m.subject,
      text: m.text_body ?? "",
      html: m.html_body ? cleanHtml(m.html_body) : null,
      sentAt: m.sent_at,
    })),
  };
}

// Shown in a sandboxed frame without scripts; cleaned all the same.
function cleanHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [...sanitizeHtml.defaults.allowedTags, "img", "font", "center", "span", "div"],
    allowedAttributes: {
      "*": ["style", "align", "width", "height", "bgcolor", "color", "valign", "colspan", "rowspan", "border", "cellpadding", "cellspacing", "dir"],
      a: ["href", "name"],
      img: ["src", "alt", "width", "height", "style"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    allowedSchemesByTag: { img: ["http", "https", "data"] },
  });
}

export async function setDone(customers: string | string[], done: boolean): Promise<void> {
  const at = done ? new Date().toISOString() : null;
  const rows = [customers].flat().map((c) => ({ customer: c.toLowerCase(), done_at: at }));
  const { error } = await supabase().from("support_threads").upsert(rows);
  if (error) throw error;
}

// ─── replying ──────────────────────────────────────────────────────

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function htmlOf(reply: string, quoted: { who: string; when: string; text: string } | null): string {
  const paras = esc(reply.trim())
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 12px">${p.replace(/\n/g, "<br>")}</p>`)
    .join("");
  const quote = quoted
    ? `<div style="margin-top:20px;color:#666">On ${esc(quoted.when)}, ${esc(quoted.who)} wrote:</div><blockquote style="margin:6px 0 0;padding-left:12px;border-left:2px solid #ccc;color:#666">${esc(quoted.text.trim()).replace(/\n/g, "<br>")}</blockquote>`
    : "";
  return `<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.5;color:#111">${paras}${quote}</div>`;
}

/** Answers the conversation's last incoming email. */
export async function reply(customer: string, body: string): Promise<SupportMessage> {
  if (!supportConfigured()) throw new Error("Support email is not set up (SUPPORT_EMAIL_USER, SUPPORT_EMAIL_PASSWORD).");
  const c = customer.toLowerCase();
  const db = supabase();
  const { data: last } = await db.from("support_messages").select("*").eq("customer", c).eq("direction", "in").order("sent_at", { ascending: false }).limit(1).maybeSingle();
  const subjectBase = last?.subject?.trim() || "Your message to Grind Studio";
  const subject = /^re:/i.test(subjectBase) ? subjectBase : `Re: ${subjectBase}`;
  const when = last ? new Date(last.sent_at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }) + " UTC" : "";
  const who = last ? (last.from_name ? `${last.from_name} <${last.from_email}>` : last.from_email ?? c) : c;
  const quoted = last ? { who, when, text: last.text_body ?? "" } : null;
  const text = body.trim() + (quoted ? `\n\nOn ${when}, ${who} wrote:\n${quoted.text.trim().split("\n").map((l: string) => `> ${l}`).join("\n")}` : "");
  const messageId = `<${randomUUID()}@${user().split("@")[1] || "thegrind.studio"}>`;
  const refs = [last?.refs, last?.message_id].filter((x) => x && !String(x).includes(":")).join(" ").trim() || undefined;

  const mail = {
    from: { name: FROM_NAME, address: user() },
    to: last?.from_name ? { name: last.from_name, address: c } : c,
    subject,
    text,
    html: htmlOf(body, quoted),
    messageId,
    inReplyTo: last && !last.message_id.includes(":") ? last.message_id : undefined,
    references: refs,
    date: new Date(),
  };
  const raw = await new MailComposer(mail).compile().build();

  const smtp = nodemailer.createTransport({ host: SMTP_HOST, port: 465, secure: true, auth: { user: user(), pass: process.env.SUPPORT_EMAIL_PASSWORD! } });
  await smtp.sendMail({ envelope: { from: user(), to: c }, raw });

  // Saved to the mailbox's Sent folder, so the webmail shows it too. A
  // failure here doesn't undo the send.
  const client = imap();
  try {
    await client.connect();
    const sent = await sentFolder(client);
    if (sent) await client.append(sent, raw, ["\\Seen"]);
  } catch (err) {
    console.error("support: couldn't save the reply to Sent", err);
  } finally {
    await client.logout().catch(() => {});
  }

  const now = new Date().toISOString();
  const { data: saved, error } = await db
    .from("support_messages")
    .upsert(
      {
        message_id: messageId,
        folder: "sent",
        direction: "out",
        customer: c,
        from_email: user(),
        from_name: FROM_NAME,
        to_email: c,
        subject,
        text_body: body.trim(),
        html_body: null,
        snippet: body.replace(/\s+/g, " ").trim().slice(0, 160),
        in_reply_to: mail.inReplyTo ?? null,
        refs: refs ?? null,
        sent_at: now,
        read_at: now,
      },
      { onConflict: "message_id" },
    )
    .select()
    .single();
  if (error) throw error;
  return { id: saved.id, direction: "out", fromEmail: user(), fromName: FROM_NAME, toEmail: c, subject, text: body.trim(), html: null, sentAt: now };
}
