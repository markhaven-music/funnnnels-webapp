import type { Currency } from "@/lib/geo";
import { beaconScript, PREVIEW_JS } from "@/lib/beacon";
import { ORIGIN_BOUNCE_JS } from "@/lib/originBounce";
import { AVAILABILITY_JS } from "@/lib/availability";

// A sales page of the Astro site, copied 1:1 by tools/astro_clone.mjs
// (<slug>/astro/<name>.ts), as a funnel serves it: our order page behind every
// button and our beacon in place of the Astro one. Its own scripts stay:
// Clarity, the Meta and OpenAI pixels, neo, and the one that carries
// fbclid/utm_* onto the buttons. They all skip a visitor with window.__fvMe
// set, which here is the owner's own browser (?me=1), a preview (?preview=1),
// or a test host.
//
// The euro page reads as the Astro one did ("€27 (about $30)"); the dollar
// one shows dollars only, the price the checkout charges there.

const OFF = String(/^(localhost|127\.0\.0\.1|\[::1\])$|\.localhost$|\.local$|\.vercel\.app$/);

export function astroHtml(template: string, o: { funnel: string; orderPage: string; currency: Currency; price: number }): string {
  const head =
    `${ORIGIN_BOUNCE_JS};\n` +
    `window.__fvMe = ${PREVIEW_JS} || ${OFF}.test(location.hostname);\n` +
    beaconScript({ funnel: o.funnel, page: "landing" }) +
    `;\n${AVAILABILITY_JS}`;
  let html = template
    .replaceAll("{{ORDER}}", o.orderPage)
    .replace("{{HEAD}}", head)
    .replaceAll("{{VALUE}}", String(o.price))
    .replaceAll("{{CUR}}", o.currency.toUpperCase());
  // A price changed in dashboard → Products: the new one, without the dollar
  // estimate made for €27 (list prices and per-unit figures stay as the page has them).
  if (o.price !== 27) html = textOnly(html, (t) => t.replace(/€27\b/g, `€${o.price}`).replace(/ \(about \$\d+\)/g, "").replace(/about \$\d+ · /g, ""));
  if (o.currency === "usd") html = textOnly(html, dollars);
  return html;
}

// The page outside its scripts.
const textOnly = (html: string, fn: (text: string) => string) =>
  html
    .split(/(<script[\s\S]*?<\/script>)/)
    .map((part, i) => (i % 2 ? part : fn(part)))
    .join("");

// "€27 (about $30)" → "$27", "about $30 · one payment" → "one payment", every
// other euro sign (a list price, the per-groove price) → "$". The scripts
// carry the currency in {{CUR}}.
const dollars = (text: string) =>
  text
    .replace(/€(\d+) \(about \$\d+\)/g, "$$$1")
    .replace(/about \$\d+ · /g, "")
    .replaceAll("€", "$");
