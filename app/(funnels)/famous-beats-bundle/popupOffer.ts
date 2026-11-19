import { landingPopupJs } from "@/lib/landingPopup";
import { bumpFull } from "@/lib/bumpFull";
import { money } from "@/lib/launch";
import type { Currency } from "@/lib/geo";
import { FBB_LP } from "./landingTest";

// The landing pop-up (2026-11-19, "metti MIDI Drum Kit a 27 scontato da 297 in una popup di famous beats
// bundle landing page"): a tap on any button of the three landings in the test (fbb-jazz, fbb-v3, fbb-cf,
// ./landingTest.ts) opens the same pop-up, so the test stays fair: the MIDI Drum Kit at 27, its 297 struck
// (lib/bumpFull.ts, the number the Drum Kit's own pages state). Yes and No both go on to the order page;
// Yes arrives with the Drum Kit in the order (a summary line with Remove, never a tick box), then
// "Checking availability…" as before (lib/landingPopup.ts says how).
//
// The add-on is the funnel_items row famous-beats-bundle / drum-kit (dashboard → Products, its price
// there), so the card and PayPal routes price and check it like any add-on. No row: no pop-up.

export const FBB_POPUP = {
  /** The add-on (the funnel_items key in dashboard → Products). */
  item: "drum-kit",
  key: "fv_popup_fbb",
  image: "/funnels/midi-drum-kit/kit-box-v3-480.webp",
  since: "2026-11-19",
};

const WORDS = {
  title: "Never stare at an empty drum track again.",
  body: "The Famous Beats give you the grooves of the hits. The MIDI Drum Kit gives you your own: drums that already bounce, there the moment an idea hits you.",
  list: ["1,050 MIDI drum patterns in the style of Billboard producers", "Complete beats, patterns and fragments", "Drag into any DAW"],
  nowNote: "today",
  yes: "Yes, add the Drum Kit · {price}",
  no: "No thanks, just the bundle",
};

// The page's yellow (the Jazz-style pages and ClickFunnels' red page both have yellow buttons), black words.
const YELLOW = "--ac-g1:#ffd84d;--ac-g2:#f5b800;--ac-ink:#000;--ac-rgbc:245,184,0;--ac-ts:none";

/** The pop-up's script for a Famous Beats landing, at the add-on's price in `currency`. */
export function fbbPopupJs(price: number, currency: Currency): string {
  const now = money(price, currency);
  const full = bumpFull(FBB_POPUP.item, price);
  return landingPopupJs({
    key: FBB_POPUP.key,
    abCookie: FBB_LP.cookie,
    image: FBB_POPUP.image,
    title: WORDS.title,
    body: WORDS.body,
    list: WORDS.list,
    was: full ? money(full, currency) : undefined,
    now,
    nowNote: WORDS.nowNote,
    yes: WORDS.yes.replace("{price}", now),
    no: WORDS.no,
    vars: YELLOW,
  });
}
