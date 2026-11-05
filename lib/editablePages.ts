import { revalidatePath } from "next/cache";
import { funnel as drumKit } from "@/app/(funnels)/midi-drum-kit/funnel";
import { LANGS, paths, type Lang } from "@/app/(funnels)/midi-drum-kit/i18n";
import { codeTexts, TEXT_PAGES, type TextPage } from "@/app/(funnels)/midi-drum-kit/texts";
import { funnel as topHits } from "@/app/(funnels)/top-hits-midi-bundle/funnel";
import { LANDING as TH_LANDING, ORDER as TH_ORDER, THANKS } from "@/app/(funnels)/top-hits-midi-bundle/words";
import { funnel as famousBeats } from "@/app/(funnels)/famous-beats-bundle/funnel";
import { landingTemplate as famousLanding } from "@/app/(funnels)/famous-beats-bundle/landing";
import { ORDER as FB_ORDER } from "@/app/(funnels)/famous-beats-bundle/words";
import { funnel as jazz } from "@/app/(funnels)/jazz-midi-pack/funnel";
import { THANKS as JAZZ_THANKS } from "@/app/(funnels)/jazz-midi-pack/thanksWords";
import { CF_PATHS, type PageName } from "@/app/free/packs";
import { freeTemplate } from "@/app/free/render";
import { CURRENCIES } from "@/lib/geo";
import { htmlCode } from "@/lib/htmlTexts";
import { KIT_HOME } from "@/lib/liveUrl";
import { EDITABLE } from "@/lib/editableIndex";
import { revalidateDrumKitTexts, type Texts } from "@/lib/pageTexts";
import { leaves } from "@/lib/words";

// Every page whose words the dashboard edits (funnel map → Edit,
// app/funnels/[id]/texts), funnel by funnel: its texts as the code has them
// (key → text), where the editor shows it, its live address and which cached
// pages to rebuild after a save. The edits are rows of page_texts
// (funnel, page, lang, key) and each page reads its own:
//   - ClickFunnels clones (the Drum Kit's sales page and upsells): tNNN texts
//   - other HTML copies (Famous Beats' sales page, the free sign-up pages):
//     every block of words, found by lib/htmlTexts.ts
//   - React pages: the paths of the page's words object (lib/words.ts)
// The light list for the map's buttons is lib/editableIndex.ts; keep both in step.

export type EditablePage = {
  id: string;
  name: string;
  code: (lang: string) => Texts;
  /** The page as the editor's frame shows it (this site), or null: list only. */
  frame: (lang: string) => string | null;
  live: (lang: string) => string | null;
  revalidate: (lang: string) => void;
  /** What {name} in a text shows as in the frame (the frame is in euros). */
  vars?: Record<string, string>;
};
export type EditableFunnel = { id: string; name: string; langs: { lang: string; label: string }[]; pages: EditablePage[] };

const LABEL: Record<string, string> = { en: "English", fr: "French", es: "Spanish", de: "German", it: "Italian" };
const ENGLISH = [{ lang: "en", label: "English" }];
// React pages in the frame: the page itself, kept on this site for the signed-in
// owner (?edit=1, proxy.ts), in euros, not counted (?preview=1; a thank-you page
// then shows as for a buyer).
const inFrame = (path: string) => `${path}?edit=1&preview=1&origin=1&country=FR`;
const rebuild = (...pages: string[]) => () => {
  for (const currency of CURRENCIES) for (const p of pages) revalidatePath(`${p}/${currency}`);
};

function drumKitPages(): EditablePage[] {
  return TEXT_PAGES.map((p) => ({
    id: p.id,
    name: p.name,
    code: (lang) => codeTexts(p.id as TextPage, lang as Lang),
    frame: (lang) => {
      const at = paths(lang as Lang);
      if (p.id === "order") return inFrame(at.order);
      if (p.id === "thank-you") return inFrame(at.thankYou);
      return `/api/funnels/${drumKit.slug}/texts/frame?page=${p.id}&lang=${lang}`;
    },
    live: (lang) => {
      const at = paths(lang as Lang);
      const offer = drumKit.offers.findIndex((o) => o.id === p.id);
      return KIT_HOME + (p.id === "landing" ? at.landing : p.id === "order" ? at.order : p.id === "thank-you" ? at.thankYou : at.offers[offer]);
    },
    revalidate: (lang) => revalidateDrumKitTexts(lang),
  }));
}

/** The editable pages of a funnel ("free": the free packs' sign-up pages), or null. */
export function editableFunnel(id: string): EditableFunnel | null {
  if (id === drumKit.slug) {
    return { id, name: drumKit.product, langs: LANGS.map((lang) => ({ lang, label: LABEL[lang] })), pages: drumKitPages() };
  }
  if (id === topHits.slug) {
    const at = `/${topHits.slug}`;
    const vars = { c: "€", price: String(topHits.price.eur), email: topHits.support, days: String(topHits.guaranteeDays) };
    return {
      id,
      name: topHits.product,
      langs: ENGLISH,
      pages: [
        { id: "landing", name: "Sales page", code: () => leaves(TH_LANDING), frame: () => inFrame(at), live: () => KIT_HOME + at, revalidate: rebuild(at), vars },
        { id: "order", name: "Order page", code: () => leaves(TH_ORDER), frame: () => inFrame(`${at}/order`), live: () => KIT_HOME + `${at}/order`, revalidate: rebuild(`${at}/order`), vars },
        { id: "thank-you", name: "Thank-you page", code: () => leaves(THANKS), frame: () => inFrame(topHits.checkout.thankYou), live: () => KIT_HOME + topHits.checkout.thankYou, revalidate: () => {}, vars },
      ],
    };
  }
  if (id === famousBeats.slug) {
    const at = `/${famousBeats.slug}`;
    const vars = { c: "€", price: String(famousBeats.price.eur), email: famousBeats.support, days: String(famousBeats.guaranteeDays) };
    return {
      id,
      name: famousBeats.product,
      langs: ENGLISH,
      pages: [
        {
          id: "landing",
          name: "Sales page",
          code: () => htmlCode(famousLanding),
          frame: () => `/api/funnels/${famousBeats.slug}/texts/frame?page=landing&lang=en`,
          live: () => KIT_HOME + at,
          revalidate: rebuild(at),
        },
        { id: "order", name: "Order page", code: () => leaves(FB_ORDER), frame: () => inFrame(`${at}/order`), live: () => KIT_HOME + `${at}/order`, revalidate: rebuild(`${at}/order`), vars },
        { id: "thank-you", name: "Thank-you page", code: () => leaves(THANKS), frame: () => inFrame(famousBeats.checkout.thankYou), live: () => KIT_HOME + famousBeats.checkout.thankYou, revalidate: () => {}, vars },
      ],
    };
  }
  if (id === jazz.slug) {
    return {
      id,
      name: jazz.product,
      langs: ENGLISH,
      pages: [
        {
          id: "thank-you",
          name: "Thank-you page",
          code: () => leaves(JAZZ_THANKS),
          frame: () => inFrame(jazz.checkout.thankYou),
          live: () => KIT_HOME + jazz.checkout.thankYou,
          revalidate: () => {},
          vars: { files: jazz.counts.files.toLocaleString("en-US") },
        },
      ],
    };
  }
  if (id === "free") {
    const cfPath = (page: string) => Object.entries(CF_PATHS).find(([, p]) => p === page)?.[0] ?? `/free/${page}`;
    return {
      id,
      name: "Free packs",
      langs: ENGLISH,
      pages: EDITABLE.free.map((page) => ({
        id: page,
        name: FREE_NAMES[page] ?? page,
        code: () => htmlCode(freeTemplate(page as PageName)),
        frame: () => `/api/funnels/free/texts/frame?page=${page}&lang=en`,
        live: () => KIT_HOME + cfPath(page),
        revalidate: () => revalidatePath(`/free/${page}`),
      })),
    };
  }
  return null;
}

const FREE_NAMES: Record<string, string> = {
  rolls: "Rolls sign-up",
  bounce: "Bounce sign-up",
  hooks: "Mystery Hooks sign-up",
  "mystery-hooks": "Mystery Hooks (old)",
  "free-store": "Free Store",
  "free-store-access": "Free Store access",
  "bounce-midi-pack": "Bounce MIDI pack",
  "mystery-dopaspace-hooks": "Dopaspace hooks",
};
