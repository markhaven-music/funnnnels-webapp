// The free lead magnets, moved from ClickFunnels on 2026-11-03 (it ends
// 2026-11-16): their pages (ClickFunnels' own, ./cf/*.ts, made by
// tools/cf_clone_free.mjs), the zips they hand out (R2, free/<file>) and what an
// opt-in does. ClickFunnels' paths are kept, so its old links, ads and emails
// work once www.thegrind.studio points here; proxy.ts maps them onto
// /free/<page>, and m.thegrind.studio forwards them (grind-studio-landing-pages/vercel.json).
//
// After an opt-in: the contact gets the opt-in's tags, the first email (the
// download link, ./firstEmail.ts) goes out at once, and the tag starts the
// follow-up sequence (db/free-leads.sql, dashboard → Automations).

/** The zips in R2 (ClickFunnels' files, same names). Public: anyone with the link may download. */
export const PACKS = {
  rolls: { key: "free/Grind_Studio_Snare_Hat_Rolls.zip" },
  bounce: { key: "free/GrindStudio_BounceMIDIPack.zip" },
  "mystery-hooks": { key: "free/GrindStudio_MYSTERY_Hooks_Pack.zip" },
} as const;
export type Pack = keyof typeof PACKS;
export const isPack = (p: unknown): p is Pack => typeof p === "string" && Object.hasOwn(PACKS, p);

/** The pages (./cf/<name>.ts). */
export const PAGES = ["rolls", "bounce", "mystery-hooks", "free-store", "free-store-access", "bounce-midi-pack", "mystery-dopaspace-hooks"] as const;
export type PageName = (typeof PAGES)[number];
export const isPage = (p: unknown): p is PageName => typeof p === "string" && (PAGES as readonly string[]).includes(p);

/** ClickFunnels' paths → our page. Both Rolls funnels ("[FREE] Rolls 2026" and "[FREE] Rolls") had the same page. */
export const CF_PATHS: Record<string, PageName> = {
  "/download-rolls-midi-drums--fb90f": "rolls",
  "/download-rolls-midi-drums": "rolls",
  "/download-bounce-midi-drums": "bounce",
  "/mystery-hooks-pack": "mystery-hooks",
  "/free-store": "free-store",
  "/free-store-access": "free-store-access",
  "/bounce-midi-pack": "bounce-midi-pack",
  "/mystery-dopaspace-hooks": "mystery-dopaspace-hooks",
};

/** The funnels' own addresses on ClickFunnels, which sent visitors on to their first page. */
export const CF_REDIRECTS: Record<string, string> = {
  "/free-midi-rolls-1a877": "/download-rolls-midi-drums--fb90f",
  "/midi-rolls-free": "/download-rolls-midi-drums",
  "/bounce-midi-pack-ig": "/download-bounce-midi-drums",
};

export type FreeOptin = {
  source: string;
  tags: readonly string[];
  // The email sent right after the opt-in (./firstEmail.ts), if any.
  firstEmail: "rolls" | "bounce" | null;
  // Where the visitor goes next.
  next: string;
};

// The page's form says which opt-in it is (data-optin on the page, `funnel` in
// the POST). Tags: ClickFunnels' (lead-rolls, bounce-pack-ig), which start the
// follow-ups; "lead" as on every funnnnels opt-in.
// next: ClickFunnels sent Rolls and Bounce opt-ins to a Drum Kit sales page
// ("WAIT!! Your Free Pack Is Secured…", its step 2); here the Drum Kit's own page.
export const OPTINS: Record<string, FreeOptin> = {
  "free-rolls": { source: "free-rolls", tags: ["lead", "lead-rolls"], firstEmail: "rolls", next: "/en/midi-drum-kit" },
  "free-bounce": { source: "free-bounce", tags: ["lead", "bounce-pack-ig"], firstEmail: "bounce", next: "/en/midi-drum-kit" },
  "free-store": { source: "free-store", tags: ["lead", "free-store"], firstEmail: null, next: "/free-store-access" },
};

/** Which opt-in a page's form is. */
export const PAGE_OPTIN: Partial<Record<PageName, string>> = { rolls: "free-rolls", bounce: "free-bounce", "free-store": "free-store" };
