// A price written into a funnel's words, said again at the price dashboard →
// Products set: "for just {c}25!!", "YOUR PRICE TODAY: €27", "27 €", "27&nbsp;€"
// (`{c}` is the funnels' currency mark, € or $ for the visitor). Only that
// exact amount next to a currency sign moves: "147 {c}", "€297", "27x faster"
// stay, and so does any math written around it ("90% off", "€0.08 per hit"):
// Products says which lines to reread. Unchanged prices leave the text as it is.

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** 27 → "27", 19.5 → "19.50" ("19,50" outside English). */
export function amount(n: number, lang = "en"): string {
  if (Number.isInteger(n)) return String(n);
  const s = n.toFixed(2);
  return lang === "en" ? s : s.replace(".", ",");
}

export function restate(text: string, from: number, to: number, lang = "en"): string {
  if (from === to || !text) return text;
  const f = esc(amount(from, lang));
  const t = amount(to, lang);
  const sign = "(€|\\$|\\{c\\})";
  return (
    text
      // €27 · $27 · {c}27 · € 27 (not €297, not €27.50 when the price was 27)
      .replace(new RegExp(`${sign}(\\s?)${f}(?![\\d]|[.,]\\d)`, "g"), (_, s: string, sp: string) => `${s}${sp}${t}`)
      // 27 € · 27&nbsp;€ · 27 {c} (not 147 €)
      .replace(new RegExp(`(?<![\\d.,])${f}(\\s|&nbsp;|\\u00a0|\\u202f)${sign}`, "g"), (_, sp: string, s: string) => `${t}${sp}${s}`)
  );
}
