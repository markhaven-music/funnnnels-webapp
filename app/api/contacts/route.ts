import { NextResponse } from "next/server";
import { addContact, deleteContact, listContacts, setContactStatus } from "@/lib/contacts";

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

// { email, status: "subscribed" | "unsubscribed" }: switch the newsletter on or off for one contact.
export async function PATCH(req: Request) {
  const { email, status } = await req.json().catch(() => ({}));
  if (typeof email !== "string" || (status !== "subscribed" && status !== "unsubscribed")) {
    return NextResponse.json({ error: "email and status required" }, { status: 400 });
  }
  const ok = await setContactStatus(email, status);
  return NextResponse.json({ ok }, { status: ok ? 200 : 404 });
}
