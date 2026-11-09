import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { BONUS_COOKIE, BONUS_COOKIE_AGE, bonusCookieFor, bonusEnd, readStart, signStart } from "@/lib/bonusClock";
import { botReason } from "@/lib/bots";
import { visitorCountry } from "@/lib/geo";
import { deviceOf } from "@/lib/live";
import { supabase } from "@/lib/supabase";

export const runtime = "nodejs";

// The 5-minute bonus clock of the Drum Kit's and (since 11-09) Jazz's order
// pages (lib/bonusClock.ts), one cookie per funnel (body.funnel, the Drum Kit if none): the
// first call starts it, every later one returns the same end. `now` is the
// server's clock, so the page counts down right on a phone whose clock is off.
export async function POST(req: Request) {
  const jar = await cookies();
  const now = Date.now();
  const body = await req.json().catch(() => ({}));
  const funnel = bonusCookieFor(body?.funnel) ? (body.funnel as string) : "midi-drum-kit";
  const name = bonusCookieFor(funnel) ?? BONUS_COOKIE;
  // `next dev` only: ?reset=1 starts a fresh 5 minutes (testing the page again).
  const reset = process.env.NODE_ENV === "development" && new URL(req.url).searchParams.has("reset");
  const saved = reset ? null : readStart(jar.get(name)?.value);
  const start = saved ?? now;
  const res = NextResponse.json({ end: bonusEnd(start), now }, { headers: { "cache-control": "no-store" } });
  if (saved === null) {
    res.cookies.set(name, signStart(start), { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: BONUS_COOKIE_AGE });
    // A new clock: counted for Analytics → 5-minute bonus (lib/analytics.ts bonusStats).
    // own: the owner's or a test device (?preview=1, the opt-out), left out there. Never blocks the page.
    if (!reset && !botReason(req)) {
      const { error } = await supabase()
        .from("bonus_clocks")
        .insert({
          started_at: new Date(start).toISOString(),
          funnel,
          device: deviceOf(req.headers.get("user-agent") ?? ""),
          country: visitorCountry(req.headers) || null,
          own: body?.own === true,
        });
      if (error) console.error("bonus clock: save failed", error);
    }
  }
  return res;
}
