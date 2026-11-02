// funnnnels.vercel.app is the origin m.thegrind.studio forwards the funnels'
// paths to (grind-studio-landing-pages/vercel.json). A buyer who lands on it
// directly (an old link, a search result) is sent to the same page on the
// brand domain, so the address never jumps between domains. In the browser,
// not in proxy.ts: through the brand domain's rewrite the request reaches us
// with the same host, but the address bar never shows it.
// Stays put: the dashboard (/, /funnels, /p, /unsubscribe) and ?origin=1,
// which only tools/funnel-previews.sh uses (it shoots the origin, where
// ?country= picks the currency). m.thegrind.studio/midi-drum-kit is still the
// old Astro page, so funnnnels' English Drum Kit page is /en/midi-drum-kit there.
export const ORIGIN_BOUNCE_JS = `(function(){var l=location;if(l.hostname!=="funnnnels.vercel.app"||/[?&]origin=1(?:&|$)/.test(l.search))return;var p=l.pathname,s=p.split("/")[1];if(s===""||s==="funnels"||s==="p"||s==="unsubscribe")return;if(p.replace(/\\/$/,"")==="/midi-drum-kit")p="/en/midi-drum-kit";l.replace("https://m.thegrind.studio"+p+l.search+l.hash)})()`;
