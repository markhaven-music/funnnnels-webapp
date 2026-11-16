// "John from United States got the MIDI Drum Kit · 2 hours ago ✓ verified by Grind Studio":
// the recent-buyer pop-up on the funnels' landings and order pages (app/(funnels)/SalesPop.tsx),
// built from real paid orders only (app/api/checkout/recent). Asked for 2026-11-16 from a
// ClickFunnels/Proof checkout ("riusciamo a mettere una icona a sinistra come quella su desktop?
// verified by Grind Studio"); on a phone it's a one-line pill ("su mobile non abbiamo spazio").
//
// OFF until the user switches it on ("costruiscila ma teniamola spenta per ora"): flip ON to
// true. While off, ?pop=1 on a page shows it for a look.
export const SALES_POP_ON = false;

// The product's box, left of the line (the 160px versions, ~10 KB each).
export const POP_ICON: Record<string, string> = {
  "midi-drum-kit": "/funnels/midi-drum-kit/kit-box-v3-160.webp",
  "jazz-midi-pack": "/funnels/jazz-midi-pack/box-160.webp",
  "famous-beats-bundle": "/funnels/famous-beats-bundle/box3d-160.webp",
  "top-hits-midi-bundle": "/funnels/top-hits-midi-bundle/box3d-160.webp",
  "top-hits-chords": "/funnels/top-hits-midi-bundle/box3d-160.webp",
  "drunk-swing-grooves": "/funnels/drunk-swing-grooves/pack-160.webp",
};

// The product's name in the line ("got the MIDI Drum Kit").
export const POP_PRODUCT: Record<string, string> = {
  "midi-drum-kit": "MIDI Drum Kit",
  "jazz-midi-pack": "Jazz MIDI Pack",
  "famous-beats-bundle": "Famous Beats Bundle",
  "top-hits-midi-bundle": "TOP HITS MIDI Bundle",
  "top-hits-chords": "TOP HITS MIDI Bundle",
  "drunk-swing-grooves": "Drunk Swing Grooves",
};

export type RecentBuyer = { name: string; country: string; ago: number /* minutes */ };
