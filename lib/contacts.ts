import { supabase } from "@/lib/supabase";

export type Contact = {
  id: string;
  email: string;
  name?: string;
  source?: string;
  tags?: string[];
  createdAt: string;
};

type Row = {
  id: string;
  email: string;
  name: string | null;
  source: string | null;
  tags: string[];
  created_at: string;
};

function rowToContact(r: Row): Contact {
  return {
    id: r.id,
    email: r.email,
    name: r.name ?? undefined,
    source: r.source ?? undefined,
    tags: r.tags ?? [],
    createdAt: r.created_at,
  };
}

export async function listContacts(): Promise<Contact[]> {
  const { data, error } = await supabase()
    .from("contacts")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as Row[]).map(rowToContact);
}

export async function addContact(
  data: Omit<Contact, "id" | "createdAt">,
): Promise<Contact> {
  const id = Math.random().toString(36).slice(2, 10);
  const { data: row, error } = await supabase()
    .from("contacts")
    .insert({
      id,
      email: data.email,
      name: data.name ?? null,
      source: data.source ?? null,
      tags: data.tags ?? [],
    })
    .select("*")
    .single();
  if (error) throw error;
  return rowToContact(row as Row);
}

// Public opt-ins: the same email signing up twice keeps one contact and
// collects the union of tags instead of creating a duplicate.
export async function upsertContact(
  data: Omit<Contact, "id" | "createdAt">,
): Promise<Contact> {
  const email = data.email.trim().toLowerCase();
  const { data: existing, error } = await supabase()
    .from("contacts")
    .select("*")
    .eq("email", email)
    .maybeSingle();
  if (error) throw error;
  if (!existing) return addContact({ ...data, email });
  const row = existing as Row;
  const tags = Array.from(new Set([...(row.tags ?? []), ...(data.tags ?? [])]));
  const { data: updated, error: upErr } = await supabase()
    .from("contacts")
    .update({ tags, name: row.name ?? data.name ?? null })
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
