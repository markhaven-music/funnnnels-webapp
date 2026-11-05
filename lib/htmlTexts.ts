import { createHash } from "node:crypto";
import { parseDocument } from "htmlparser2";
import type { ChildNode, Element } from "domhandler";

// The words of a page that is one HTML document copied from elsewhere (the
// Famous Beats landing from the Astro site, the free packs' ClickFunnels pages),
// made editable from the dashboard without tagging them by hand: every block
// whose content is only text and inline formatting (a heading, a paragraph, a
// button's label, a list item) is one text, keyed by its words as the code has
// them ("h" + 8 hex of their hash, "-2" for the second block with the same
// words). An edit replaces the block's content; a change to the code's words
// makes a new key, and the old edit is left unused rather than put on the
// wrong block.

export type HtmlText = { key: string; html: string; start: number; end: number };

// Tags that sit inside a line of text.
const INLINE = new Set(["a", "abbr", "b", "br", "code", "em", "font", "i", "mark", "s", "small", "span", "strike", "strong", "sub", "sup", "u", "wbr"]);
// Never words a visitor reads.
const SKIP = new Set(["script", "style", "noscript", "template", "svg", "head", "title", "textarea", "select", "option", "iframe"]);

const isElement = (n: ChildNode): n is Element => n.type === "tag" || n.type === "script" || n.type === "style";
const hasWords = (s: string) => /[\p{L}\p{N}]/u.test(s.replace(/&[a-z]+;|&#\d+;/gi, ""));

/** Only text and inline tags (that hold no skipped tag) below this node. */
function inlineOnly(n: ChildNode): boolean {
  if (n.type === "text" || n.type === "comment") return true;
  if (!isElement(n)) return false;
  if (!INLINE.has(n.name)) return false;
  return n.children.every(inlineOnly);
}

const cache = new Map<string, HtmlText[]>();

/** The page's texts, in the page's order. */
export function htmlTexts(html: string): HtmlText[] {
  const hit = cache.get(html);
  if (hit) return hit;
  const doc = parseDocument(html, { withStartIndices: true, withEndIndices: true, decodeEntities: false });
  const out: HtmlText[] = [];
  const seen = new Map<string, number>();
  const add = (start: number, end: number) => {
    const raw = html.slice(start, end);
    if (!hasWords(raw.replace(/<[^>]*>/g, ""))) return;
    const lead = raw.length - raw.trimStart().length;
    const trail = raw.length - raw.trimEnd().length;
    const inner = raw.trim();
    const hash = createHash("sha1").update(inner).digest("hex").slice(0, 8);
    const n = (seen.get(hash) ?? 0) + 1;
    seen.set(hash, n);
    out.push({ key: n === 1 ? `h${hash}` : `h${hash}-${n}`, html: inner, start: start + lead, end: end - trail });
  };
  const walk = (nodes: ChildNode[]) => {
    // A run of text and inline tags among blocks is one text.
    let run: ChildNode[] = [];
    const flush = () => {
      if (run.length) add(run[0].startIndex!, run[run.length - 1].endIndex! + 1);
      run = [];
    };
    for (const n of nodes) {
      if (isElement(n) && SKIP.has(n.name)) {
        flush();
        continue;
      }
      if (inlineOnly(n)) {
        if (n.type !== "comment" || run.length) run.push(n);
        continue;
      }
      flush();
      if (isElement(n)) walk(n.children);
    }
    flush();
  };
  walk(doc.children);
  cache.set(html, out);
  return out;
}

/** key → the code's words (HTML), in the page's order. */
export function htmlCode(html: string): Record<string, string> {
  return Object.fromEntries(htmlTexts(html).map((t) => [t.key, t.html]));
}

/**
 * The page with the dashboard's edits in place of the code's words. marks: each
 * text between <!--fx:key--> and <!--/fx-->, for the editor's frame
 * (components/PageFrame.tsx); never on a live page.
 */
export function applyHtmlTexts(html: string, edits: Record<string, string>, marks = false): string {
  const texts = htmlTexts(html);
  if (!marks && !texts.some((t) => t.key in edits)) return html;
  let out = "";
  let at = 0;
  for (const t of texts) {
    const words = edits[t.key] ?? t.html;
    out += html.slice(at, t.start) + (marks ? `<!--fx:${t.key}-->${words}<!--/fx-->` : words);
    at = t.end;
  }
  return out + html.slice(at);
}
