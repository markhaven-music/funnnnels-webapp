import { supabase } from "@/lib/supabase";

// Contacts: everyone who gave us their email (opt-ins, checkouts, buyers,
// imports from ClickFunnels). `status` says whether the newsletter may reach
// them; tags say what they did, and a new tag can start a sequence (the
// start_sequences trigger, db/email.sql).

export type ContactStatus = "subscribed" | "unsubscribed" | "bounced" | "complained";

export type Contact = {
  id: string;
  email: string;
  name?: string;
  source?: string;
  tags?: string[];
  status: ContactStatus;
  lang?: string;
  createdAt: string;
};

type Row = {
  id: string;
  email: string;
  name: string | null;
  source: string | null;
  tags: string[];
  status: ContactStatus;
  lang: string | null;
  created_at: string;
};

function rowToContact(r: Row): Contact {
  return {
    id: r.id,
    email: r.email,
    name: r.name ?? undefined,
    source: r.source ?? undefined,
    tags: r.tags ?? [],
    status: r.status ?? "subscribed",
    lang: r.lang ?? undefined,
    createdAt: r.created_at,
  };
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isEmail(value: string): boolean {
  return value.length <= 254 && EMAIL.test(value);
}

/** Every contact, newest first (in pages: the API returns at most 1,000 rows at a time). */
export async function listContacts(): Promise<Contact[]> {
  const out: Contact[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase()
      .from("contacts")
      .select("id, email, name, source, tags, status, lang, created_at")
      .order("created_at", { ascending: false })
      .order("id")
      .range(from, from + 999);
    if (error) throw error;
    out.push(...(data as Row[]).map(rowToContact));
    if (!data || data.length < 1000) return out;
  }
}

export async function addContact(
  data: Omit<Contact, "id" | "createdAt" | "status"> & { status?: ContactStatus },
): Promise<Contact> {
  const id = Math.random().toString(36).slice(2, 10);
  const { data: row, error } = await supabase()
    .from("contacts")
    .insert({
      id,
      email: data.email.trim().toLowerCase(),
      name: data.name ?? null,
      source: data.source ?? null,
      tags: data.tags ?? [],
      lang: data.lang ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return rowToContact(row as Row);
}

// Public opt-ins: the same email signing up twice keeps one contact and
// collects the union of tags instead of creating a duplicate. Someone who
// unsubscribed stays unsubscribed.
export async function upsertContact(
  data: Omit<Contact, "id" | "createdAt" | "status">,
): Promise<Contact> {
  const email = data.email.trim().toLowerCase();
  const { data: existing, error } = await supabase()
    .from("contacts")
    .select("*")
    .eq("email", email)
    .maybeSingle();
  if (error) throw error;
  if (!existing) {
    try {
      return await addContact({ ...data, email });
    } catch (err) {
      // Two requests at once (the checkout's lead and its order): the other one won.
      if ((err as { code?: string }).code !== "23505") throw err;
      return upsertContact(data);
    }
  }
  const row = existing as Row;
  const tags = Array.from(new Set([...(row.tags ?? []), ...(data.tags ?? [])]));
  const { data: updated, error: upErr } = await supabase()
    .from("contacts")
    // The language they last used wins: someone who opted in on the English page and
    // then buys in Italian gets the Italian after-purchase sequence (start_sequences
    // picks it by contacts.lang, and this update sets lang together with the new tags).
    .update({ tags, name: row.name ?? data.name ?? null, lang: data.lang ?? row.lang ?? null, updated_at: new Date().toISOString() })
    .eq("id", row.id)
    .select("*")
    .single();
  if (upErr) throw upErr;
  return rowToContact(updated as Row);
}

export async function deleteContact(id: string): Promise<boolean> {
  const { error, count } = await supabase()
    .from("contacts")
    .delete({ count: "exact" })
    .eq("id", id);
  if (error) throw error;
  return (count ?? 0) > 0;
}

/** Newsletter off for this email (the unsubscribe link, the one-click header, the dashboard). */
export async function setContactStatus(email: string, status: ContactStatus): Promise<boolean> {
  const { data, error } = await supabase()
    .from("contacts")
    .update({ status, unsubscribed_at: status === "subscribed" ? null : new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("email", email.trim().toLowerCase())
    .select("id");
  if (error) throw error;
  return Boolean(data?.length);
}

export type ImportRow = { email: string; name?: string; tags?: string[]; status?: ContactStatus };

/** Bulk add (a CSV from ClickFunnels): new contacts in, tags merged, nobody re-subscribed, no sequence started. */
export async function importContacts(rows: ImportRow[], source: string): Promise<number> {
  let added = 0;
  for (let i = 0; i < rows.length; i += 1000) {
    const { data, error } = await supabase().rpc("import_contacts", { rows: rows.slice(i, i + 1000), source });
    if (error) throw error;
    added += Number(data ?? 0);
  }
  return added;
}

/** Every tag in use and how many contacts have it. */
export async function contactTags(): Promise<{ tag: string; contacts: number }[]> {
  const { data, error } = await supabase().rpc("contact_tags");
  if (error) throw error;
  return (data ?? []).map((r: { tag: string; contacts: number }) => ({ tag: r.tag, contacts: Number(r.contacts) }));
}

/** How many subscribed contacts a send to this tag (null: everyone) would reach. */
export async function audienceSize(tag: string | null, exclude: string | null): Promise<number> {
  const { data, error } = await supabase().rpc("audience_size", { p_tag: tag, p_exclude: exclude });
  if (error) throw error;
  return Number(data ?? 0);
}
