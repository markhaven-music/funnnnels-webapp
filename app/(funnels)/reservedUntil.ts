// When the "YOUR COPY IS RESERVED FOR" countdown ends for this visitor, kept in
// localStorage so a refresh (or a language / currency switch) carries on where it
// was instead of starting again at 10:00. One deadline per funnel; after a day a
// returning visitor gets a fresh ten minutes. No storage (private mode) → page load.
const DAY = 24 * 60 * 60 * 1000;

function funnelKey(path: string) {
  // /midi-drum-kit/order, /midi-drum-kit/fr/order/eur, /en/… → midi-drum-kit (the first segment that isn't a language)
  return path.split("/").find((p) => p.length > 2) || "order";
}

export function reservedUntil(duration: number): number {
  const now = Date.now();
  const key = `reserved-until:${funnelKey(location.pathname)}`;
  try {
    const saved = Number(localStorage.getItem(key));
    if (saved && saved > now - DAY && saved <= now + duration) return saved;
    localStorage.setItem(key, String(now + duration));
  } catch {}
  return now + duration;
}
