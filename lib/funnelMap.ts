import { freePackStats, type FreePackRow } from "@/lib/freePacks";
import { resolveFunnel, upsellsOn, type Product } from "@/lib/funnels";
import { KIT_HOME, PRODUCT_TYPE } from "@/lib/liveUrl";
import { getFunnel } from "@/lib/store";

// The funnel map (/funnels/<id>, like ClickFunnels' funnel view): where the
// funnel starts, then each page in order with its live address, a picture
// and, for pages built in the editor, a link to edit it. Its numbers come from
// dashboard → Analytics (components/FunnelMap.tsx).

export type MapStepKind = "landing" | "order" | "upsell" | "thank-you" | "page";

export type MapStep = {
  kind: MapStepKind;
  name: string;
  path: string; // what the visitor sees after the domain, e.g. /fr/midi-drum-kit/order
  url: string; // the live page
  image: string | null; // a screenshot (tools/funnel-previews.sh)
  editUrl: string | null;
  // One-click upsells: which one, the page's visitor-count name, and whether
  // buyers are sent there yet (UPSELLS=on, lib/funnels.ts upsellsOn).
  offer?: { id: string; page: string; live: boolean };
  // Numbers worked out with the map, for a funnel Analytics doesn't count (Free packs).
  numbers?: MapNumber[];
};

export type MapNumber = { label: string; value: string; tone: "sky" | "amber" | "mint" | "accent" };

// lang: a language, or another way to split the funnel (Free packs: one tab per pack).
// summary: the tab's line under its name, when Analytics doesn't count the funnel.
export type MapLang = { lang: string; label: string; steps: MapStep[]; summary?: string };

export type FunnelMap = {
  id: string;
  name: string;
  status: string;
  /** The funnel's slug in Analytics, or null for builder funnels (not counted). */
  statsSlug: string | null;
  /** Hand-built funnels can get more languages (the + on the map). */
  canTranslate: boolean;
  langs: MapLang[];
  /** Where the numbers come from, when not from Analytics: a line under the map and a link. */
  numbersFrom?: { note: string; href: string; link: string };
};

const LANG_LABEL: Record<string, string> = { en: "English", fr: "French", es: "Spanish", de: "German", it: "Italian" };

// Every page is live on the brand domain, which forwards the funnels' paths
// here; never on the funnnnels.vercel.app origin, which a buyer must not see.
// One exception in the path: m.thegrind.studio/midi-drum-kit is still the old
// Astro page, so the MIDI Drum Kit's English sales page is /en/midi-drum-kit
// (its order, upsell and thank-you pages are /midi-drum-kit/…).
const landingPrefix = (slug: string, lang: string, prefix: string) => (slug === "midi-drum-kit" && lang === "en" ? "/en" : prefix);

// Screenshots in public/funnels/<slug>/ (tools/funnel-previews.sh), per language.
const SHOTS: Record<string, Record<string, { landing: string; order?: string; thanks?: string }>> = {
  "jazz-midi-pack": { en: { landing: "preview", order: "order" } },
  "top-hits-midi-bundle": { en: { landing: "preview", order: "order" } },
  "famous-beats-bundle": { en: { landing: "preview", order: "order" } },
  "midi-drum-kit": { fr: { landing: "preview", order: "order", thanks: "thanks" }, en: { landing: "preview-en", order: "order-en", thanks: "thanks-en" } },
};

function codeMap(f: Product, editable: Set<string>): FunnelMap {
  // The translations first for the funnels sold in several languages: they're the ones live on the brand domain.
  const langs = f.langs ? [...f.langs].sort((a, b) => (a === "en" ? 1 : b === "en" ? -1 : 0)) : ["en"];
  return {
    id: f.slug,
    name: f.product,
    status: "live",
    statsSlug: f.slug,
    canTranslate: f.kind === "code",
    langs: langs.map((lang) => {
      const prefix = lang === "en" ? "" : `/${lang}`;
      const shots = SHOTS[f.slug]?.[lang] ?? SHOTS[f.slug]?.en;
      const img = (name?: string) => (name ? `/funnels/${f.slug}/${name}.webp` : null);
      const edit = editable.has(f.slug) ? `/funnels/${f.slug}/edit` : null;
      // The MIDI Drum Kit's pages are code: their words are edited page by page (app/funnels/[id]/texts).
      const texts = (page: string) => (f.slug === "midi-drum-kit" ? `/funnels/${f.slug}/texts?page=${page}&lang=${lang}` : null);
      const step = (kind: MapStepKind, name: string, path: string, image: string | null, editUrl: string | null): MapStep => {
        const at = `${kind === "landing" ? landingPrefix(f.slug, lang, prefix) : prefix}${path}`;
        return { kind, name, path: at, url: `${KIT_HOME}${at}`, image, editUrl };
      };
      const steps = [
        // Launch-kit products sell on the landing itself (#buy): no order step.
        step("landing", f.checkout.orderPage ? "Sales page" : "Sales page + checkout", `/${f.slug}`, img(shots?.landing), edit ?? texts("landing")),
        // Jazz's order page shows the same edited sections as its landing.
        ...(f.checkout.orderPage ? [step("order", "Order page", f.checkout.orderPage, img(shots?.order), edit ?? texts("order"))] : []),
        ...(f.offers ?? []).map((o, i) => ({
          ...step("upsell", `Upsell ${i + 1}: ${o.name}`, `/${f.slug}/${o.path}`, img(o.path), texts(o.id)),
          offer: { id: o.id, page: `upsell-${i + 1}`, live: upsellsOn(f) },
        })),
        step("thank-you", "Thank-you page", f.checkout.thankYou, img(shots?.thanks), texts("thank-you")),
      ];
      return { lang, label: LANG_LABEL[lang] ?? lang.toUpperCase(), steps };
    }),
  };
}

// ─── Free packs ────────────────────────────────────────────────────
// The free lead magnets (app/free) as one funnel, a tab per pack: its sign-up
// page, then the MIDI Drum Kit's pages, where the sign-up sends people
// (app/free/packs.ts next, with ?free=<pack> for the "Your Free Pack Is
// Secured" bar). Its numbers are dashboard → Free packs' (lib/freePacks.ts):
// sign-ups, what the Meta ads cost, and which of those people opened a
// checkout and bought, over the last 30 days. Upsells aren't counted per pack.
export const FREE_PACKS_ID = "free-packs";
const FREE_PACK_DAYS = 30;
const FREE_PACK_TABS = [
  { tab: "rolls", optin: "free-rolls", label: "Rolls", page: "/download-rolls-midi-drums", shot: "optin-rolls" },
  { tab: "bounce", optin: "free-bounce", label: "Bounce", page: "/download-bounce-midi-drums", shot: "optin-bounce" },
  { tab: "hooks", optin: "free-hooks", label: "Mystery Hooks", page: "/free/hooks", shot: "optin-hooks" },
] as const;

const intText = (n: number) => n.toLocaleString("en-US");
const share = (hit: number, of: number) => (of > 0 ? ` (${((hit / of) * 100).toFixed(hit / of < 0.1 ? 1 : 0)}%)` : "");
const money = (cents: number, currency: string) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase(), maximumFractionDigits: 0 }).format(cents / 100);
/** Sales in dollars and euros, each only when there is some; "$0" when none. */
const revenueText = (r: FreePackRow["revenue"]) => [r.usd ? money(r.usd, "usd") : "", r.eur ? money(r.eur, "eur") : ""].filter(Boolean).join(" + ") || "$0";

async function freePacksMap(): Promise<FunnelMap> {
  const kit = await resolveFunnel("midi-drum-kit");
  const kitSteps = kit ? (codeMap(kit, new Set()).langs.find((l) => l.lang === "en")?.steps ?? []) : [];
  const stats = await freePackStats(FREE_PACK_DAYS).catch((err) => {
    console.error("funnel map free-packs: the numbers couldn't be read", err);
    return null;
  });
  return {
    id: FREE_PACKS_ID,
    name: "Free packs",
    status: "live",
    statsSlug: null,
    canTranslate: false,
    numbersFrom: {
      note: `Numbers for the last ${FREE_PACK_DAYS} days: sign-ups, then what those people did after signing up (checkouts and orders of any product); ad spend from Meta.`,
      href: "/?nav=free-packs",
      link: "Every person and ad in Free packs",
    },
    langs: FREE_PACK_TABS.map((t) => {
      const row = stats?.packs.find((p) => p.key === t.optin);
      const spend = stats?.spend.connected ? stats.spend.byPack[t.label] : undefined;
      const currency = stats?.spend.connected ? stats.spend.currency : "usd";
      const leads = row?.leads ?? 0;
      const fresh = row?.checkout.of ?? 0; // sign-ups who hadn't bought before
      const optinNumbers: MapNumber[] = stats
        ? [
            ...(spend ? [{ label: "Ad clicks", value: intText(spend.clicks), tone: "sky" as const }] : []),
            { label: "Sign-ups", value: intText(leads) + (spend ? share(leads, spend.clicks) : ""), tone: "amber" },
            ...(spend
              ? [
                  { label: "Ad spend", value: money(Math.round(spend.spend * 100), currency), tone: "accent" as const },
                  // Over new sign-ups, as dashboard → Free packs counts it.
                  { label: "Cost / sign-up", value: fresh ? money(Math.round((spend.spend / fresh) * 100), currency) : "—", tone: "accent" as const },
                ]
              : []),
          ]
        : [];
      const steps: MapStep[] = [
        {
          kind: "page",
          name: `Sign-up page: free ${t.label} pack`,
          path: t.page,
          url: `${KIT_HOME}${t.page}`,
          image: `/funnels/free/${t.shot}.webp`,
          editUrl: null,
          numbers: optinNumbers,
        },
        ...kitSteps.map((st): MapStep => {
          if (st.kind === "landing") {
            const path = `${st.path}?free=${t.tab}`;
            return { ...st, name: "MIDI Drum Kit sales page", path, url: `${KIT_HOME}${path}`, numbers: undefined };
          }
          if (st.kind === "order" && row) {
            return { ...st, name: "MIDI Drum Kit order page", numbers: [{ label: "Opened checkout", value: intText(row.checkout.hit) + share(row.checkout.hit, fresh), tone: "amber" }] };
          }
          if (st.kind === "thank-you" && row) {
            return {
              ...st,
              numbers: [
                { label: "Bought", value: intText(row.boughtSoFar) + share(row.boughtSoFar, fresh), tone: "mint" },
                { label: "Revenue", value: revenueText(row.revenue), tone: "accent" },
              ],
            };
          }
          return st;
        }),
      ];
      const summary = stats
        ? [`${intText(leads)} sign-ups`, `${intText(row?.boughtSoFar ?? 0)} bought`, ...(spend ? [`${money(Math.round(spend.spend * 100), currency)} ads`] : [])].join(" · ")
        : "numbers unavailable";
      return { lang: t.tab, label: t.label, steps, summary };
    }),
  };
}

export async function getFunnelMap(id: string): Promise<FunnelMap | null> {
  if (id === FREE_PACKS_ID) return freePacksMap();
  const row = await getFunnel(id).catch(() => null);
  const product = await resolveFunnel(id).catch(() => undefined);
  if (product) {
    // Pages with sections in the editor: Jazz (a row in `funnels`) and launch-kit products.
    const editable = new Set<string>(row || product.kind === "kit" ? [product.slug] : []);
    return codeMap(product, editable);
  }
  if (!row) return null;
  // A builder funnel: its pages, published at /p/<id>.
  return {
    id: row.id,
    name: row.name,
    status: row.status,
    statsSlug: row.type === PRODUCT_TYPE ? row.id : null,
    canTranslate: false,
    langs: [
      {
        lang: "en",
        label: "Pages",
        steps: row.pages.map((p) => ({
          kind: "page" as const,
          name: p.name,
          path: `/p/${row.id}`,
          url: `/p/${row.id}`,
          image: null,
          editUrl: `/funnels/${row.id}/edit`,
        })),
      },
    ],
  };
}
