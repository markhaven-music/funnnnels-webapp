import { createHmac, timingSafeEqual } from "node:crypto";
import { BONUS, BONUS_MS, BONUS_WORDS } from "@/app/(funnels)/midi-drum-kit/bonusTest";
import type { Lang } from "@/app/(funnels)/midi-drum-kit/i18n";
import { JAZZ_BONUS, JAZZ_BONUS_WORDS } from "@/app/(funnels)/jazz-midi-pack/fiveMinBonus";
import { FBB_BONUS, FBB_BONUS_WORDS } from "@/app/(funnels)/famous-beats-bundle/fiveMinBonus";
import { offeredBumps, type Bump, type Product } from "@/lib/funnels";

// The Drum Kit order page's 5-minute bonus (app/(funnels)/midi-drum-kit/bonusTest.ts):
// when this visitor's 5 minutes started, as a signed httpOnly cookie set by
// /api/checkout/bonus on their first visit to the order page. Kept six months,
// so coming back later (a refresh, the abandoned-checkout email) finds it over,
// not a fresh 5 minutes. The checkout routes give the bonus only while it runs.

export const BONUS_COOKIE = "fv_bonus";

/**
 * The funnels with a 5-minute bonus: the add-on it gives and the cookie its clock
 * lives in (one per funnel, so a Drum Kit visit doesn't use up the Jazz clock).
 * Jazz since 2026-11-09: the Record Samples (app/(funnels)/jazz-midi-pack/fiveMinBonus.ts).
 * Famous Beats since 2026-11-09: the MIDI Drum Kit Expansions (app/(funnels)/famous-beats-bundle/fiveMinBonus.ts),
 * given only once "expansions" is one of its add-ons in dashboard → Products.
 */
const BONUS_FUNNELS: Record<string, { item: string; cookie: string; expired: (lang: unknown) => string }> = {
  "midi-drum-kit": {
    item: BONUS.item,
    cookie: BONUS_COOKIE,
    expired: (lang) => BONUS_WORDS[typeof lang === "string" && lang in BONUS_WORDS ? (lang as Lang) : "en"].expired,
  },
  [JAZZ_BONUS.funnel]: { item: JAZZ_BONUS.item, cookie: JAZZ_BONUS.cookie, expired: () => JAZZ_BONUS_WORDS.expired },
  [FBB_BONUS.funnel]: { item: FBB_BONUS.item, cookie: FBB_BONUS.cookie, expired: () => FBB_BONUS_WORDS.expired },
};

/** The cookie holding a funnel's bonus clock (null: the funnel has no bonus). */
export const bonusCookieFor = (slug: unknown): string | null =>
  typeof slug === "string" && slug in BONUS_FUNNELS ? BONUS_FUNNELS[slug].cookie : null;
export const BONUS_COOKIE_AGE = 180 * 24 * 60 * 60;

function key(): Buffer {
  const secret = process.env.ACCOUNT_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new Error("ACCOUNT_SECRET (or SUPABASE_SERVICE_ROLE_KEY) is not set");
  return createHmac("sha256", secret).update("grind-bonus-v1").digest();
}
const mac = (body: string) => createHmac("sha256", key()).update(body).digest();

export function signStart(start: number): string {
  const body = String(start);
  return `${body}.${mac(body).toString("base64url")}`;
}

/** The start a cookie says (ms), or null if it's missing or not ours. */
export function readStart(value: string | undefined): number | null {
  if (!value || value.length > 100) return null;
  const [body, sig] = value.split(".");
  if (!body || !sig || !/^\d{13}$/.test(body)) return null;
  const want = mac(body);
  const got = Buffer.from(sig, "base64url");
  if (got.length !== want.length || !timingSafeEqual(got, want)) return null;
  return Number(body);
}

/** When the bonus ends for a start. */
export const bonusEnd = (start: number) => start + BONUS_MS;

/** Whether an order placed now still gets the bonus (with the grace for a click on time). */
export function bonusLive(value: string | undefined, now = Date.now()): boolean {
  const start = readStart(value);
  return start !== null && start <= now && now <= bonusEnd(start) + BONUS.graceMs;
}

/**
 * The free add-on an order gets: the bonus, if the page showed it (body.bonus)
 * and its 5 minutes are still running. Shown but over: `expired` is what to tell
 * the buyer, nothing is charged. An add-on the buyer ticked and pays for isn't given twice.
 */
export function orderBonus(
  f: Product,
  body: { bonus?: unknown; lang?: unknown },
  cookie: string | undefined,
  bumps: readonly Bump[],
  now = Date.now(),
): { item: Bump | null; expired: string | null } {
  const cfg = BONUS_FUNNELS[f.slug];
  if (!cfg || body.bonus !== true) return { item: null, expired: null };
  const item = offeredBumps(f).find((b) => b.id === cfg.item);
  if (!item || bumps.some((b) => b.id === item.id)) return { item: null, expired: null };
  if (!bonusLive(cookie, now)) return { item: null, expired: cfg.expired(body.lang) };
  return { item, expired: null };
}
