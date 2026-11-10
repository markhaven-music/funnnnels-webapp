import { after, NextResponse, type NextRequest } from "next/server";
import { COUNTRY_COOKIE, currencyFor, visitorCountry } from "@/lib/geo";
import { KIT_HOME } from "@/lib/liveUrl";
import { LANGS as DRUM_KIT_LANGS } from "@/app/(funnels)/midi-drum-kit/i18n";
import { CF_PATHS as FREE_PAGES, CF_REDIRECTS as FREE_REDIRECTS } from "@/app/free/packs";

// funnnnels.com is the dashboard, behind ADMIN_PASSWORD. Funnels are public
// but live on their brand's domain: m.thegrind.studio forwards /jazz-midi-pack
// here (rewrites in grind-studio-landing-pages/vercel.json, which also pass the
// visitor's country), so on funnnnels.com those paths redirect to the brand.
//
// Without ADMIN_PASSWORD the dashboard is open in `next dev` and locked in
// production, so a deploy that forgot the variable fails closed.

// Funnel slug → its public home. Only the dashboard hosts redirect; the
// *.vercel.app origin must keep serving the pages the brand domain forwards.
const FUNNEL_HOME: Record<string, string> = {
  "jazz-midi-pack": "https://m.thegrind.studio",
  "top-hits-midi-bundle": "https://m.thegrind.studio",
  "top-hits-chords": "https://m.thegrind.studio",
  "midi-drum-kit": "https://m.thegrind.studio",
  "famous-beats-bundle": "https://m.thegrind.studio",
  "drunk-swing-grooves": "https://m.thegrind.studio",
  account: "https://m.thegrind.studio", // the customer login (app/account)
  shop: "https://m.thegrind.studio", // the shop (app/shop)
  home: "https://m.thegrind.studio", // the homepage (app/home), the brand domain's /
  "terms-and-conditions": "https://m.thegrind.studio", // the legal pages (app/legal)
  "privacy-policy": "https://m.thegrind.studio",
  "refund-policy": "https://m.thegrind.studio",
  free: "https://m.thegrind.studio", // the free packs' pages and downloads (app/free)
};
// Terms, Privacy, Refund policy: served by app/legal at ClickFunnels' paths.
const LEGAL = new Set(["/terms-and-conditions", "/privacy-policy", "/refund-policy"]);
const CF_LOGIN = /^\/(customer-center|contacts\/sign_in)(\/.*)?$/;
const DASHBOARD_HOSTS = new Set(["funnnnels.com", "www.funnnnels.com"]);

// Funnel pages cached on the CDN once per currency (app/(funnels)/<slug>/[currency]).
// The visitor keeps the plain URL; the country comes from ?country= (the
// brand domain's rewrite sets it, and it lets you preview either price) or
// from Vercel's geo header, and also goes into a cookie for the checkout.
const CURRENCY_PAGES = new Set(["/jazz-midi-pack", "/jazz-midi-pack/order", "/jazz-midi-pack/offer", "/top-hits-midi-bundle", "/top-hits-midi-bundle/order", "/top-hits-midi-bundle/offer", "/top-hits-chords", "/top-hits-chords/order", "/top-hits-chords/offer", "/top-hits-chords/offer-2", "/famous-beats-bundle", "/famous-beats-bundle/order", "/famous-beats-bundle/offer", "/drunk-swing-grooves", "/drunk-swing-grooves/order", "/drunk-swing-grooves/offer", "/drunk-swing-grooves/offer-2", "/midi-drum-kit/bounce", "/home"]);

// Launch-kit products (dashboard → Launches) live at /<slug> and are served by
// app/(funnels)/[slug]: the page per currency, /<slug>/thank-you and
// /<slug>/download. Their slugs are in the database, so any first path segment
// that isn't one of the app's own routes counts as a product path: public,
// currency-rewritten, and a 404 if no such product exists. Keep this list in
// sync with RESERVED_SLUGS in lib/products.ts.
// Funnels sold in several languages: English at /<slug>, the others at
// /<lang>/<slug>. Their landing, order and thank-you pages are cached per
// language (and per currency) at /<slug>/<lang>/…, see localized().
const LOCALIZED: Record<string, readonly string[]> = { "midi-drum-kit": DRUM_KIT_LANGS };
const LANG_PREFIXES = new Set(["fr", "it", "de", "nl", "es"]);

const APP_SEGMENTS = new Set(["", "api", "funnels", "p", "account", "unsubscribe", "jazz-midi-pack", "top-hits-midi-bundle", "top-hits-chords", "midi-drum-kit", "famous-beats-bundle", "drunk-swing-grooves", "shop", "home", "legal", "terms-and-conditions", "privacy-policy", "refund-policy", "free", ...LANG_PREFIXES]);
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** /fr/midi-drum-kit/order → { slug, lang: "fr", page: "order" }; null for anything else. */
// The pages a localized funnel has after its /<lang>/<slug>.
const LOCAL_PAGES = ["", "order", "offer", "last-offer", "jazz-offer", "thank-you"] as const;

function localized(pathname: string): { slug: string; lang: string; page: (typeof LOCAL_PAGES)[number] } | null {
  const parts = pathname.replace(/\/$/, "").split("/");
  const lang = LANG_PREFIXES.has(parts[1]) ? parts[1] : "en";
  const at = lang === "en" ? 1 : 2;
  const slug = parts[at];
  const page = LOCAL_PAGES.find((p) => p === parts.slice(at + 1).join("/"));
  if (!LOCALIZED[slug]?.includes(lang) || page === undefined) return null;
  return { slug, lang, page };
}

// The shop (app/shop, dashboard → Shop): /shop, /shop/cart and
// /shop/<product> are cached per currency at /shop/<currency>[/…], like the
// funnels; its thank-you page and downloads aren't. Public; on the dashboard
// hosts it redirects to the brand domain (FUNNEL_HOME).
// Returns what follows /shop ("", "/cart", "/<product>"), or null.
function shopPage(pathname: string): string | null {
  const m = pathname.replace(/\/$/, "").match(/^\/shop(?:\/([a-z0-9]+(?:-[a-z0-9]+)*))?$/);
  if (!m || m[1] === "thank-you" || m[1] === "download") return null;
  return m[1] ? `/${m[1]}` : "";
}

function kitSlug(pathname: string): string | null {
  const seg = pathname.split("/")[1] ?? "";
  return !APP_SEGMENTS.has(seg) && SLUG.test(seg) ? seg : null;
}

const PUBLIC = [
  /^\/p\//, // pages published from the builder
  /^\/jazz-midi-pack(\/|$)/,
  /^\/top-hits-midi-bundle(\/|$)/,
  /^\/top-hits-chords(\/|$)/,
  /^\/midi-drum-kit(\/|$)/,
  /^\/famous-beats-bundle(\/|$)/,
  /^\/drunk-swing-grooves(\/|$)/,
  /^\/shop(\/|$)/, // the shop's pages, its thank-you page and downloads
  /^\/home(\/|$)/, // the homepage
  /^\/legal\/[a-z-]+$/, // the legal pages
  /^\/free\/[a-z-]+(\/[a-z-]+)?$/, // the free packs' pages and downloads (app/free)
  /^\/api\/checkout\/shop\/(intent|paypal)$/,
  /^\/funnels\/[^/]+\/.+\.[a-z0-9]+$/, // funnel assets in /public (audio, zips)
  /^\/api\/optin$/,
  /^\/api\/checkout\/(lead|intent|paypal|paypal\/return|view|here|me|upsell|owned|go|open|resume|bonus)$/, // go, open: a click on / an open of an email (lib/mail.ts); resume: its saved cart; here, me: dashboard → Live; bonus: the Drum Kit order page's 5-minute clock; owned: an upsell page asking if the buyer has it already
  /^\/account$/, // the customer login and its API
  /^\/api\/checkout\/account\/(login|verify|session)$/,
  // Email: Stripe's webhook, the email job (its own CRON_SECRET), unsubscribing.
  /^\/api\/webhooks\/stripe$/,
  /^\/api\/cron\/email$/,
  /^\/unsubscribe$/,
  /^\/api\/email\/unsubscribe$/,
  /^\/favicon\.ico$/,
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Stripe sends a card buyer back with ?payment_intent=…&redirect_status=succeeded
  // (to the first upsell, or the thank-you page): the order is recorded on
  // arrival, before any upsell, after the page is on its way (lib/stripeSales.ts).
  const paid = request.nextUrl.searchParams.get("payment_intent");
  if (paid && request.nextUrl.searchParams.get("redirect_status") === "succeeded") {
    after(() => import("@/lib/stripeSales").then((m) => m.recordStripePayment(paid)));
  }
  const host = (request.headers.get("host") ?? "").split(":")[0].toLowerCase();

  // The free packs' ClickFunnels pages (app/free/packs.ts), at their old paths,
  // served by app/free/<page>. The funnels' own addresses (which ClickFunnels
  // redirected to their first page) show that page in place: a redirect from
  // here would name this origin, not the brand domain that forwards to it.
  const plain = pathname.replace(/\/$/, "");
  const free = FREE_PAGES[FREE_REDIRECTS[plain] ?? plain];
  if (free) {
    if (DASHBOARD_HOSTS.has(host)) return NextResponse.redirect(`${KIT_HOME}${pathname}${request.nextUrl.search}`, 308);
    const url = request.nextUrl.clone();
    url.pathname = `/free/${free}`;
    return NextResponse.rewrite(url);
  }

  // ClickFunnels' customer login (www.thegrind.studio/customer-center, which
  // sent buyers on to /contacts/sign_in): its old links and bookmarks now open
  // ours, shown in place, since a redirect from here would leave the brand
  // domain that forwards to us.
  if (LEGAL.has(pathname.replace(/\/$/, ""))) {
    const url = request.nextUrl.clone();
    url.pathname = `/legal${pathname.replace(/\/$/, "")}`;
    return NextResponse.rewrite(url);
  }

  if (CF_LOGIN.test(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/account";
    return NextResponse.rewrite(url);
  }

  const slug = kitSlug(pathname);
  const loc = localized(pathname);
  const home = FUNNEL_HOME[loc?.slug ?? pathname.split("/")[1]] ?? (slug ? KIT_HOME : undefined);
  // The dashboard's editor (funnel map → Edit) shows a page here, in place,
  // with ?edit=1, to whoever is signed in to the dashboard.
  // Asked without the password, it asks for it (the browser sends the dashboard's again) instead of leaving.
  const wantsEdit = request.nextUrl.searchParams.get("edit") === "1" && DASHBOARD_HOSTS.has(host);
  if (home && wantsEdit && !isAdmin(request)) return challenge();
  const editing = wantsEdit && isAdmin(request);
  if (home && DASHBOARD_HOSTS.has(host) && !editing) {
    return NextResponse.redirect(`${home}${pathname}${request.nextUrl.search}`, 308);
  }

  if (loc) {
    const url = request.nextUrl.clone();
    if (loc.page === "thank-you") {
      url.pathname = `/${loc.slug}/${loc.lang}/thank-you`;
      return NextResponse.rewrite(url);
    }
    const country = visitorCountry(request.headers, request.nextUrl.searchParams.get("country"));
    url.pathname = `/${loc.slug}/${loc.lang}${loc.page ? `/${loc.page}` : ""}/${currencyFor(country)}`;
    const res = NextResponse.rewrite(url);
    res.cookies.set(COUNTRY_COOKIE, country, { path: "/", sameSite: "lax" });
    return res;
  }

  const shop = shopPage(pathname);
  if (shop !== null) {
    const country = visitorCountry(request.headers, request.nextUrl.searchParams.get("country"));
    const url = request.nextUrl.clone();
    url.pathname = `/shop/${currencyFor(country)}${shop}`;
    const res = NextResponse.rewrite(url);
    res.cookies.set(COUNTRY_COOKIE, country, { path: "/", sameSite: "lax" });
    return res;
  }

  const page = pathname.replace(/\/$/, "");
  if (CURRENCY_PAGES.has(page) || (slug && page === `/${slug}`)) {
    const country = visitorCountry(request.headers, request.nextUrl.searchParams.get("country"));
    const url = request.nextUrl.clone();
    url.pathname = `${page}/${currencyFor(country)}`;
    const res = NextResponse.rewrite(url);
    res.cookies.set(COUNTRY_COOKIE, country, { path: "/", sameSite: "lax" });
    return res;
  }

  if (slug || PUBLIC.some((re) => re.test(pathname))) return NextResponse.next();

  if (!process.env.ADMIN_PASSWORD && process.env.NODE_ENV === "production") {
    return new NextResponse("ADMIN_PASSWORD is not set", { status: 503 });
  }
  if (isAdmin(request)) return NextResponse.next();
  return challenge();
}

const challenge = () =>
  new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="funnnnels", charset="UTF-8"' },
  });

/** Signed in to the dashboard (its Basic password); anyone in `next dev` without ADMIN_PASSWORD. */
function isAdmin(request: NextRequest): boolean {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return process.env.NODE_ENV !== "production";
  const header = request.headers.get("authorization") ?? "";
  if (!header.startsWith("Basic ")) return false;
  try {
    const decoded = atob(header.slice(6));
    return decoded.slice(decoded.indexOf(":") + 1) === password;
  } catch {
    return false; // malformed header
  }
}

export const config = {
  // Funnel pictures, audio and zips in /public skip the proxy: they are public
  // anyway (PUBLIC above) and every run costs Vercel CPU time (free-plan limit).
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|funnels/[^/]+/.+\\.(?:webp|png|jpe?g|gif|svg|avif|ico|mp3|mp4|webm|wav|zip|mid|woff2?|pdf|txt)).*)"],
};
