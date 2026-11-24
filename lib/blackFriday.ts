// Black Friday 2026 ("vorrei switchare a 9.99 per black friday con un timer e vedere che succede.
// solo prezzo iniziale ma voglio anche misurare conversioni vs prima", 2026-11-24; every front-end,
// "fino al black friday e se va bene allunghiamo a monday").
// The price itself lives in funnel_items (dashboard → Products): set to 999 at BF_FROM, put back
// by the pg_cron job `black-friday-close` at BF_ENDS (db/black-friday-2026.sql). To extend to
// Cyber Monday: move BF_ENDS here AND reschedule that job.
// Measured in Analytics as a before/after per funnel (lib/analytics.ts bfTest).

/** When the €9.99 prices went live (UTC). */
export const BF_FROM = "2026-11-24T13:31:00Z";
/** Friday 28 November, 23:59 Italy (UTC). */
export const BF_ENDS = "2026-11-28T22:59:00Z";
export const BF_ENDS_MS = Date.parse(BF_ENDS);
/** The funnels whose main product is €9.99 until BF_ENDS, and the price they go back to (euro = dollar). */
export const BF_FUNNELS: Record<string, number> = {
  "midi-drum-kit": 27,
  "jazz-midi-pack": 27,
  "famous-beats-bundle": 27,
  "top-hits-midi-bundle": 97,
  "top-hits-chords": 97,
};

/** The deal and its clock as plain HTML, for the pages built as strings (the Drum Kit landing's red sticky bar). Empty once over. */
export function bfDealHtml(regular: string, sale: string, lang = "en"): string {
  if (Date.now() > BF_ENDS_MS) return "";
  const it = lang === "it";
  const deal = it ? "OFFERTA BLACK FRIDAY" : "BLACK FRIDAY DEAL";
  const limited = it ? "Solo per pochi giorni" : "Limited time only";
  const ends = it ? "Finisce tra" : "Ends in";
  return `<span style="display:block;font-size:clamp(15px,2.2vw,19px);line-height:1.4"><b style="font-weight:900">${deal}</b><span style="white-space:nowrap"> · <s style="opacity:.75">${regular}</s> <b style="font-weight:900">${sale}</b></span> <span style="display:inline-block">· ${limited} · ${ends} <b id="bf-clock" style="font-variant-numeric:tabular-nums;white-space:nowrap">–d ––h ––m ––s</b></span></span><script>(function(){var e=${BF_ENDS_MS},el=document.getElementById("bf-clock");function p(n){return(n<10?"0":"")+n}function t(){var s=Math.max(0,Math.floor((e-Date.now())/1e3));el.textContent=Math.floor(s/86400)+"d "+p(Math.floor(s%86400/3600))+"h "+p(Math.floor(s%3600/60))+"m "+p(s%60)+"s"}t();setInterval(t,1e3)})();</script>`;
}

/** While the sale runs, a front-end's buy button says the deal ("scrivi black friday anche sui bottoni", 2026-11-24):
 * any button that goes to one of the BF funnels' order pages. Upsell and other buttons keep their words. */
export function bfLabel(label: string, href = "", lang = "en"): string {
  if (Date.now() > BF_ENDS_MS) return label;
  if (href && !new RegExp(`/(${Object.keys(BF_FUNNELS).join("|")})/order`).test(href)) return label;
  const upper = label === label.toUpperCase();
  const deal = lang === "it" ? "Prendi l'offerta Black Friday" : "Get the Black Friday deal";
  return upper ? deal.toUpperCase() + (label.endsWith("!") ? "!" : "") : deal;
}
