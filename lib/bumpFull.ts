// What each order-form add-on costs at full price, shown struck through beside
// today's price in every tick-box ("a tutti gli order bump metti il prezzo
// originale sbarrato e il prezzo affianco", 2026-11-17). Only numbers our own
// pages already state: the Expansions' "Usually 81" (the owner, 2026-11-17:
// "usually €81 (not 147)"), HUSTLE's "31 MIDI packs at 29, total 899", TOP
// HITS' regular price (97), Famous Beats' "€97 Value", the Jazz MIDI Pack's
// value stack (97) and its bonuses' values (Emotional Keys 27, Jazz Record
// Samples 7), the MIDI Drum Kit's 297. Pounds and francs take the same number.
// An add-on with no stated full price (Drunk Swing Grooves, the WAV loops)
// shows today's price alone: never an invented one.
const FULL: Record<string, number> = {
  expansions: 81,
  hustle: 899,
  "top-hits": 97,
  "famous-beats": 97,
  "jazz-pack": 97,
  "drum-kit": 297,
  "emotional-keys": 27,
  "record-samples": 7,
};

/** The add-on's full price when it is above what it costs here, else null (nothing to strike). */
export function bumpFull(id: string, price: number): number | null {
  const full = FULL[id];
  return full && full > price ? full : null;
}
