// The launch playbook: phases, prices and the email sequence. Pure functions,
// safe in the browser and on the server, so the page's countdown and the
// checkout's price come from the same rules.
//
// Honest urgency only: every date here is real. The server charges the
// early-bird price only before `earlyBirdEndAt` (lib/funnels.ts orderAmount),
// and refuses to sell before `cartOpenAt`.
//
//   waitlist  (… → cartOpenAt)        the page collects emails for the waitlist
//   early     (cartOpenAt → earlyBirdEndAt)  checkout open at the early-bird price
//   open      (earlyBirdEndAt → …)    full price, the page stays up as an evergreen funnel

import type { Currency } from "@/lib/geo";

export type Money = { eur: number; usd: number }; // currency units, e.g. 27 or 19.5

export type Launch = {
  id: string;
  waitlistAt: string; // ISO
  cartOpenAt: string;
  earlyBirdEndAt: string;
  early: Money;
  waitlistTag: string;
};

export type Phase = "waitlist" | "early" | "open";

export const PHASE_LABELS: Record<Phase, string> = {
  waitlist: "Waitlist",
  early: "Cart open · early-bird",
  open: "Full price",
};

export function phaseAt(launch: Launch | null | undefined, now: number): Phase {
  if (!launch) return "open";
  if (now < Date.parse(launch.cartOpenAt)) return "waitlist";
  if (now < Date.parse(launch.earlyBirdEndAt)) return "early";
  return "open";
}

/** The next moment the phase changes, or null once it never will again. */
export function nextBoundary(launch: Launch | null | undefined, now: number): number | null {
  if (!launch) return null;
  for (const t of [Date.parse(launch.cartOpenAt), Date.parse(launch.earlyBirdEndAt)]) {
    if (now < t) return t;
  }
  return null;
}

/** The product's price at `now`: early-bird during the early phase, full otherwise. */
export function unitPrice(price: Money, launch: Launch | null | undefined, currency: Currency, now: number): number {
  return phaseAt(launch, now) === "early" && launch ? launch.early[currency] : price[currency];
}

export function money(amount: number, currency: Currency): string {
  const n = Number.isInteger(amount) ? String(amount) : amount.toFixed(2);
  return currency === "eur" ? `€${n}` : `$${n}`;
}

export const toCents = (units: number) => Math.round(units * 100);

// ─── launch emails ─────────────────────────────────────────────

export type EmailStep = "teaser-1" | "teaser-2" | "cart-open" | "proof" | "ends-tonight" | "last-hours";

export type LaunchEmailDraft = {
  step: EmailStep;
  subject: string;
  body: string;
  audienceTag: string;
  excludeTag: string | null;
  sendAt: string; // ISO
};

export const STEP_LABELS: Record<EmailStep, string> = {
  "teaser-1": "Waitlist teaser",
  "teaser-2": "Waitlist teaser 2",
  "cart-open": "Cart is open",
  proof: "Proof / demo",
  "ends-tonight": "Early-bird ends tonight",
  "last-hours": "Last hours",
};

const HOUR = 3600_000;

/**
 * The standard sequence, timed from the launch dates. Bodies are starting
 * points to edit in the dashboard: plain text, with {name}, {earlyprice},
 * {fullprice}, {deadline} and {link} filled in when sending.
 * Teasers go to the waitlist; from cart-open on, the waitlist minus buyers.
 */
export function playbookEmails(
  l: Pick<Launch, "waitlistAt" | "cartOpenAt" | "earlyBirdEndAt" | "waitlistTag">,
  slug: string,
): LaunchEmailDraft[] {
  const wait = Date.parse(l.waitlistAt);
  const open = Date.parse(l.cartOpenAt);
  const end = Date.parse(l.earlyBirdEndAt);
  const iso = (t: number) => new Date(t).toISOString();
  const buyers = `buyer-${slug}`;
  // Mid-launch proof halfway through the early-bird, the reminders 8h and 3h before it ends.
  const emails: LaunchEmailDraft[] = [
    {
      step: "teaser-1",
      subject: "{name} is coming (you're on the list)",
      body:
        "You're on the waitlist for {name}.\n\nHere's what it is: [one sentence on what it does for your track].\n\nThe cart opens {cartopen}. Waitlist gets the early-bird price: {earlyprice} instead of {fullprice}, until {deadline}.\n\nI'll email you the moment it opens.",
      audienceTag: l.waitlistTag,
      excludeTag: null,
      sendAt: iso(Math.max(wait, open - 3 * 24 * HOUR)),
    },
    {
      step: "teaser-2",
      subject: "Tomorrow: {name}",
      body:
        "Quick one: {name} opens tomorrow.\n\n[One real before/after or a preview link.]\n\nEarly-bird {earlyprice} until {deadline}, then {fullprice}.",
      audienceTag: l.waitlistTag,
      excludeTag: null,
      sendAt: iso(Math.max(wait, open - 24 * HOUR)),
    },
    {
      step: "cart-open",
      subject: "{name} is open: {earlyprice} early-bird",
      body:
        "It's live: {link}\n\n[What's inside, in three lines.]\n\nEarly-bird price {earlyprice} until {deadline}. After that it's {fullprice}.",
      audienceTag: l.waitlistTag,
      excludeTag: buyers,
      sendAt: iso(open),
    },
    {
      step: "proof",
      subject: "Hear what {name} does",
      body: "[A demo, a real file, or what a buyer made with it.]\n\n{link}\n\nEarly-bird {earlyprice} until {deadline}.",
      audienceTag: l.waitlistTag,
      excludeTag: buyers,
      sendAt: iso(open + (end - open) / 2),
    },
    {
      step: "ends-tonight",
      subject: "Early-bird ends tonight",
      body: "The {earlyprice} early-bird for {name} ends {deadline}. Then it's {fullprice}.\n\n{link}",
      audienceTag: l.waitlistTag,
      excludeTag: buyers,
      sendAt: iso(Math.max(open, end - 8 * HOUR)),
    },
    {
      step: "last-hours",
      subject: "3 hours left at {earlyprice}",
      body: "Last call: {name} goes to {fullprice} at {deadline}.\n\n{link}",
      audienceTag: l.waitlistTag,
      excludeTag: buyers,
      sendAt: iso(Math.max(open, end - 3 * HOUR)),
    },
  ];
  return emails;
}
