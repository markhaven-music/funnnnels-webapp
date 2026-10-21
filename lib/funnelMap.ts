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
};

export type MapLang = { lang: string; label: string; steps: MapStep[] };

export type FunnelMap = {
  id: string;
  name: string;
  status: string;
  /** The funnel's slug in Analytics, or null for builder funnels (not counted). */
  statsSlug: string | null;
  /** Hand-built funnels can get more languages (the + on the map). */
  canTranslate: boolean;
  langs: MapLang[];
};

const LANG_LABEL: Record<string, string> = { en: "English", fr: "French", es: "Spanish", de: "German", it: "Italian" };

// Where each language's pages are live. The brand domain forwards the funnels'
// paths here, except the MIDI Drum Kit in English: m.thegrind.studio/midi-drum-kit
// is still the old Astro page, so its funnnnels pages are on the origin.
const home = (slug: string, lang: string) =>
  slug === "midi-drum-kit" && lang === "en" ? "https://funnnnels.vercel.app" : KIT_HOME;

// Screenshots in public/funnels/<slug>/ (tools/funnel-previews.sh), per language.
const SHOTS: Record<string, Record<string, { landing: string; order?: string; thanks?: string }>> = {
  "jazz-midi-pack": { en: { landing: "preview", order: "order" } },
  "top-hits-midi-bundle": { en: { landing: "preview", order: "order" } },
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
      const base = home(f.slug, lang);
      const shots = SHOTS[f.slug]?.[lang] ?? SHOTS[f.slug]?.en;
      const img = (name?: string) => (name ? `/funnels/${f.slug}/${name}.webp` : null);
      const edit = editable.has(f.slug) ? `/funnels/${f.slug}/edit` : null;
      const step = (kind: MapStepKind, name: string, path: string, image: string | null, editUrl: string | null): MapStep => ({
        kind,
        name,
        path: `${prefix}${path}`,
        url: `${base}${prefix}${path}`,
        image,
        editUrl,
      });
      const steps = [
        // Launch-kit products sell on the landing itself (#buy): no order step.
        step("landing", f.checkout.orderPage ? "Sales page" : "Sales page + checkout", `/${f.slug}`, img(shots?.landing), edit),
        // Jazz's order page shows the same edited sections as its landing.
        ...(f.checkout.orderPage ? [step("order", "Order page", f.checkout.orderPage, img(shots?.order), edit)] : []),
        ...(f.offers ?? []).map((o, i) => ({
          ...step("upsell", `Upsell ${i + 1}: ${o.name}`, `/${f.slug}/${o.path}`, img(o.path), null),
          offer: { id: o.id, page: `upsell-${i + 1}`, live: upsellsOn(f) },
        })),
        step("thank-you", "Thank-you page", f.checkout.thankYou, img(shots?.thanks), null),
      ];
      return { lang, label: LANG_LABEL[lang] ?? lang.toUpperCase(), steps };
    }),
  };
}

export async function getFunnelMap(id: string): Promise<FunnelMap | null> {
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
