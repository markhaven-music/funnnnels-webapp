import { NextResponse } from "next/server";
import { importContacts, isEmail, type ImportRow } from "@/lib/contacts";

export const runtime = "nodejs";
export const maxDuration = 60;

// Dashboard → Contacts → Import: { rows: [{ email, name?, tags?, status? }], source, tag? }
// (the browser reads the CSV). Up to 50,000 rows at a time.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const extra = typeof body.tag === "string" && body.tag.trim() ? [body.tag.trim().slice(0, 80)] : [];
  const rows: ImportRow[] = (Array.isArray(body.rows) ? body.rows : [])
    .slice(0, 50_000)
    .map((r: Record<string, unknown>) => ({
      email: String(r.email ?? "").trim().toLowerCase(),
      name: typeof r.name === "string" ? r.name.slice(0, 120) : undefined,
      tags: [...(Array.isArray(r.tags) ? r.tags.filter((t): t is string => typeof t === "string").map((t) => t.trim().slice(0, 80)).filter(Boolean) : []), ...extra],
      status: r.status === "unsubscribed" ? "unsubscribed" : undefined,
    }))
    .filter((r: ImportRow) => isEmail(r.email));
  if (!rows.length) return NextResponse.json({ error: "No valid emails in the file." }, { status: 400 });
  const source = typeof body.source === "string" && body.source.trim() ? body.source.trim().slice(0, 80) : "import";
  const added = await importContacts(rows, source);
  return NextResponse.json({ valid: rows.length, added, updated: rows.length - added });
}
