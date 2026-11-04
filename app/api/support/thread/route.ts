import { NextResponse } from "next/server";
import { getThread, reply, setDone } from "@/lib/support";
import { isEmail } from "@/lib/contacts";

export const runtime = "nodejs";
export const maxDuration = 60;

// One conversation (?c=<customer email>), read; POST answers it
// ({ c, text }) or marks it done / open ({ c, done }, or { cs: [...], done }
// for several at once).
export async function GET(req: Request) {
  const c = new URL(req.url).searchParams.get("c") ?? "";
  if (!isEmail(c)) return NextResponse.json({ error: "bad address" }, { status: 400 });
  return NextResponse.json(await getThread(c));
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { c?: string; cs?: string[]; text?: string; done?: boolean } | null;
  if (Array.isArray(body?.cs) && typeof body.done === "boolean") {
    const cs = body.cs.filter((x) => typeof x === "string" && isEmail(x)).slice(0, 500);
    if (!cs.length) return NextResponse.json({ error: "no addresses" }, { status: 400 });
    await setDone(cs, body.done);
    return NextResponse.json({ ok: true });
  }
  const c = body?.c ?? "";
  if (!isEmail(c)) return NextResponse.json({ error: "bad address" }, { status: 400 });
  try {
    if (typeof body?.done === "boolean") {
      await setDone(c, body.done);
      return NextResponse.json({ ok: true });
    }
    const text = body?.text?.trim();
    if (!text) return NextResponse.json({ error: "empty reply" }, { status: 400 });
    return NextResponse.json({ message: await reply(c, text) });
  } catch (err) {
    console.error("support reply failed", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
