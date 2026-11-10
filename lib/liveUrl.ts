// Where visitors see a funnel. Code funnels live on their brand's domain
// (see FUNNEL_HOME in proxy.ts); launch-kit products (funnel type "Product",
// id = their slug) at KIT_HOME/<slug>; builder funnels on /p/<id>.
const CODE_FUNNELS: Record<string, string> = {
  "jazz-midi-pack": "https://m.thegrind.studio/jazz-midi-pack",
  "top-hits-midi-bundle": "https://m.thegrind.studio/top-hits-midi-bundle",
  "top-hits-chords": "https://m.thegrind.studio/top-hits-chords",
  "famous-beats-bundle": "https://m.thegrind.studio/famous-beats-bundle",
  "drunk-swing-grooves": "https://m.thegrind.studio/drunk-swing-grooves",
};

// The brand domain that forwards /<slug> of launch-kit products here
// (a rewrite per product in grind-studio-landing-pages/vercel.json).
export const KIT_HOME = "https://m.thegrind.studio";

export const PRODUCT_TYPE = "Product";

// The shop (dashboard → Shop, app/shop) at SHOP_HOME/shop: the brand domain,
// which forwards /shop here like the funnels (rewrites in
// grind-studio-landing-pages/vercel.json). The receipt, the reminder and the
// dashboard link there.
export const SHOP_HOME = KIT_HOME;
export const SHOP_URL = `${SHOP_HOME}/shop`;

/** A funnel whose page is rendered from code sections (Jazz) or the launch-kit template. */
export const isCodeFunnel = (id: string, type?: string) => id in CODE_FUNNELS || type === PRODUCT_TYPE;
export const liveUrl = (id: string, type?: string) =>
  CODE_FUNNELS[id] ?? (type === PRODUCT_TYPE ? `${KIT_HOME}/${id}` : `/p/${id}`);
