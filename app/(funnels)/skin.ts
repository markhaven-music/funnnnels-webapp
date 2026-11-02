// A page drawn in its own style over a shared template: each class of the
// template's stylesheet (a CSS module) joined by the skin's class of the same
// name, if it has one. The Famous Beats Bundle's order page wears its landing's
// look over TOP HITS' order template this way.

export type Styles = Readonly<Record<string, string>>;

export const withSkin = (base: Styles, skin?: Styles): Styles =>
  skin ? Object.fromEntries([...new Set([...Object.keys(base), ...Object.keys(skin)])].map((k) => [k, [base[k], skin[k]].filter(Boolean).join(" ")])) : base;
