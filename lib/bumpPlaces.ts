// The add-ons a funnel sells that are NOT tick boxes on its order page, and where they are
// instead. Everything else in dashboard → Products / the funnel map's "Prices & order bumps"
// (funnel_items, role bump) IS a tick box, in that list's order: the panel is the order page
// ("che senso ha questa lista?", 2026-11-19: Famous Beats' page kept its own list in code and
// the panel's order, Up/Down and add-ons changed nothing).
//
// These rows stay in funnel_items because the checkout only charges add-ons listed there
// (lib/funnels.ts pickedBumps): the pop-ups' Yes, a running 5-minute bonus. Read by the order
// pages (which leave them out), the panel (which says where they are) and moveItem (which
// moves a tick box past them).

export const NOT_A_TICK_BOX: Record<string, Record<string, string>> = {
  "famous-beats-bundle": {
    "emotional-keys": "Free bonus in the bundle, not a tick box",
    expansions: "Not on the order page (it was the 5-minute bonus, off)",
  },
  "top-hits-chords": {
    expansions: "Not on the order page (it was the 5-minute bonus, off)",
  },
  "midi-drum-kit": {
    wav: "Pop-up on the landing, not a tick box",
  },
  "jazz-midi-pack": {
    "record-samples": "Not on the order page (it was the 5-minute bonus, off)",
  },
};

/** Where an add-on is when it isn't a tick box; undefined when it is one. */
export const notATickBox = (funnel: string, key: string): string | undefined => NOT_A_TICK_BOX[funnel]?.[key];

/** A funnel's tick boxes, in the panel's order. */
export const tickBoxes = <T extends { id: string }>(funnel: string, bumps: readonly T[]): T[] => bumps.filter((b) => !notATickBox(funnel, b.id));
