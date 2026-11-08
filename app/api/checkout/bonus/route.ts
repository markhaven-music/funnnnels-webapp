import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { BONUS_COOKIE, BONUS_COOKIE_AGE, bonusEnd, readStart, signStart } from "@/lib/bonusClock";

export const runtime = "nodejs";

// The Drum Kit order page's 5-minute bonus clock (lib/bonusClock.ts): the
// first call starts it, every later one returns the same end. `now` is the
// server's clock, so the page counts down right on a phone whose clock is off.
export async function POST(req: Request) {
  const jar = await cookies();
  const now = Date.now();
  // `next dev` only: ?reset=1 starts a fresh 5 minutes (testing the page again).
  const reset = process.env.NODE_ENV === "development" && new URL(req.url).searchParams.has("reset");
  const saved = reset ? null : readStart(jar.get(BONUS_COOKIE)?.value);
  const start = saved ?? now;
  const res = NextResponse.json({ end: bonusEnd(start), now }, { headers: { "cache-control": "no-store" } });
  if (saved === null) {
    res.cookies.set(BONUS_COOKIE, signStart(start), { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: BONUS_COOKIE_AGE });
  }
  return res;
}
