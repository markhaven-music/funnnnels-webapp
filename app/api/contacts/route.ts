import { NextResponse } from "next/server";
import { addContact, deleteContact, listContacts } from "@/lib/contacts";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ contacts: await listContacts() });
}

export async function POST(req: Request) {
  const body = await req.json();
  if (!body.email) {
    return NextResponse.json({ error: "email required" }, { status: 400 });
  }
  const contact = await addContact({
    email: body.email,
    name: body.name,
    source: body.source,
    tags: body.tags,
  });
  return NextResponse.json({ contact }, { status: 201 });
}

export async function DELETE(req: Request) {
  const { id } = await req.json();
  const ok = await deleteContact(id);
  return NextResponse.json({ ok }, { status: ok ? 200 : 404 });
}
