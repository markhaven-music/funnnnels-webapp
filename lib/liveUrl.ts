// Where visitors see a funnel. Code funnels live on their brand's domain
// (see FUNNEL_HOME in proxy.ts); launch-kit products (funnel type "Product",
// id = their slug) at KIT_HOME/<slug>; builder funnels on /p/<id>.
const CODE_FUNNELS: Record<string, string> = {
  "jazz-midi-pack": "https://m.thegrind.studio/jazz-midi-pack",
};

// The brand domain that forwards /<slug> of launch-kit products here
// (a rewrite per product in grind-studio-landing-pages/vercel.json).
export const KIT_HOME = "https://m.thegrind.studio";

export const PRODUCT_TYPE = "Product";

/** A funnel whose page is rendered from code sections (Jazz) or the launch-kit template. */
export const isCodeFunnel = (id: string, type?: string) => id in CODE_FUNNELS || type === PRODUCT_TYPE;
export const liveUrl = (id: string, type?: string) =>
  CODE_FUNNELS[id] ?? (type === PRODUCT_TYPE ? `${KIT_HOME}/${id}` : `/p/${id}`);
