import { Parser } from "htmlparser2";
import type { Layout, LayoutImage } from "@/lib/pageLayout";

// A page cloned from ClickFunnels (app/(funnels)/midi-drum-kit/cf/*.ts) cut
// into the sections a visitor scrolls through: the children of its .pageRoot,
// each under the id ClickFunnels gave it (its id-… class). The dashboard's
// editor hides them, moves them and swaps their pictures (lib/pageLayout.ts);
// the live page is put together here in that order, and the editor's frame
// gets every section and picture marked (data-fs, data-fi) so a click finds it.

export type CfSection = {
  id: string;
  /** The section's HTML, the template's placeholders ({{tNNN}}) still in. */
  html: string;
  /** The texts it shows, in order (tNNN). */
  texts: string[];
  images: number;
  /** The src of its first picture, for a section with no words. */
  image?: string;
};
export type CfSplit = { before: string; sections: CfSection[]; after: string };

const splits = new Map<string, CfSplit>();

/** The template's sections, cut once per template. */
export function splitSections(template: string): CfSplit {
  const hit = splits.get(template);
  if (hit) return hit;
  const sections: CfSection[] = [];
  let depth = 0;
  let root: number | null = null; // the depth of .pageRoot
  let closed = false; // past .pageRoot
  let firstStart = -1; // where the first section starts in the template
  let lastEnd = -1; // where the last one ends
  let cur: { id: string; start: number; texts: string[]; images: number; image?: string } | null = null;
  const parser = new Parser(
    {
      onopentag(tag, attrs) {
        depth++;
        if (closed) return;
        const cls = attrs.class ?? "";
        if (root === null) {
          if (/\bpageRoot\b/.test(cls)) root = depth;
          return;
        }
        if (depth === root + 1) cur = { id: /\bid-[\w-]+/.exec(cls)?.[0] ?? `s${sections.length}`, start: parser.startIndex, texts: [], images: 0 };
        if (cur && tag === "img") {
          cur.images++;
          cur.image ??= attrs.src;
        }
      },
      ontext(text) {
        if (cur) for (const m of text.matchAll(/\{\{(t\d{3})\}\}/g)) cur.texts.push(m[1]);
      },
      onclosetag() {
        if (root !== null && !closed) {
          if (depth === root + 1 && cur) {
            const end = parser.endIndex + 1;
            if (firstStart < 0) firstStart = cur.start;
            lastEnd = end;
            sections.push({ id: cur.id, texts: cur.texts, images: cur.images, image: cur.image, html: template.slice(cur.start, end) });
            cur = null;
          } else if (depth === root) closed = true;
        }
        depth--;
      },
    },
    { decodeEntities: false, recognizeSelfClosing: true },
  );
  parser.write(template);
  parser.end();
  const split: CfSplit = sections.length
    ? { before: template.slice(0, firstStart), sections, after: template.slice(lastEnd) }
    : { before: template, sections: [], after: "" };
  splits.set(template, split);
  return split;
}

/** The sections in the order the editor saved, the ones it doesn't mention after them in the code's order. */
export function sectionOrder(split: CfSplit, order: string[] | undefined): string[] {
  const ids = split.sections.map((s) => s.id);
  if (!order?.length) return ids;
  const known = new Set(ids);
  const first = order.filter((id, i) => known.has(id) && order.indexOf(id) === i);
  return [...first, ...ids.filter((id) => !first.includes(id))];
}

/**
 * The template with its sections in the layout's order, the hidden ones left
 * out. marks (the editor's frame): every section tagged data-fs with its id,
 * the hidden ones kept and tagged data-fs-hidden, so they can be shown again.
 */
export function applySections(template: string, layout: Layout, marks = false): string {
  const split = splitSections(template);
  if (!split.sections.length) return template;
  const hidden = new Set(layout.hidden ?? []);
  const byId = new Map(split.sections.map((s) => [s.id, s]));
  const parts = sectionOrder(split, layout.order).map((id) => {
    const s = byId.get(id)!;
    if (!marks) return hidden.has(id) ? "" : s.html;
    return s.html.replace(/^(\s*<[a-zA-Z][\w-]*)/, `$1 data-fs="${id}"${hidden.has(id) ? ' data-fs-hidden=""' : ""}`);
  });
  return split.before + parts.join("\n") + split.after;
}

const IMG = /<img\b[^>]*>/g;
const attr = (tag: string, name: string) => new RegExp(`\\s${name}="([^"]*)"`).exec(tag)?.[1];

/**
 * The pictures replaced in the editor: every <img> whose src is a key shows
 * the uploaded picture instead, in the old one's place (a width attribute
 * stays, a height attribute follows the new picture's shape, so nothing
 * moves). marks: every <img> tagged data-fi with the src the code has, the
 * key the editor saves under.
 */
export function swapImages(html: string, images: Record<string, LayoutImage>, marks = false): string {
  if (!marks && !Object.keys(images).length) return html;
  return html.replace(IMG, (tag) => {
    const src = attr(tag, "src");
    if (!src || src.startsWith("data:")) return tag;
    let out = tag;
    const to = images[src];
    if (to) {
      out = out.replace(/\ssrc="[^"]*"/, ` src="${to.src}"`);
      const w = Number(attr(tag, "width"));
      if (w > 0 && attr(tag, "height") !== undefined) out = out.replace(/\sheight="[^"]*"/, ` height="${Math.max(1, Math.round((w * to.h) / to.w))}"`);
    }
    if (marks) out = out.replace(/^<img\b/, `<img data-fi="${src}"`);
    return out;
  });
}

/** <link rel="preconnect"> to wherever the replaced pictures are served from (the storage CDN), for the first screen. */
export function imageOrigins(images: Record<string, LayoutImage>): string {
  const origins = new Set<string>();
  for (const i of Object.values(images)) {
    try {
      origins.add(new URL(i.src).origin);
    } catch {
      // a relative src: this site
    }
  }
  return [...origins].map((o) => `<link rel="preconnect" href="${o}">`).join("\n");
}
