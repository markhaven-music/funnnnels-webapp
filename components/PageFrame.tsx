"use client";

import { useEffect, useRef } from "react";
import type { Layout } from "@/lib/pageLayout";

// Funnel map → Edit, "On the page": the page itself in a frame (same site, so
// this script reaches into it), every text it can edit outlined on hover and
// edited where it stands with a click.
//   - ClickFunnels' texts (tNNN): the frame's page marks them
//     (<!--fx:tNNN-->…<!--/fx-->, app/api/funnels/[id]/texts/frame); they're
//     edited as they look, bold and colours kept, saved as HTML.
//   - The copy's texts (order and thank-you pages, React): found by their
//     words; edited as they look, saved back with their marks (**bold**,
//     {c} = the currency sign; the frame shows euros).
// On ClickFunnels' pages the frame's page also marks every section (data-fs,
// lib/cfSections.ts) and every picture (data-fi): hovering a section shows
// its bar (drag it by its grip or move it with the arrows, hide it; a hidden
// section stays as a dimmed strip until it's shown again), a click on a
// picture asks for the file to put in its place. That is the page's layout
// (lib/pageLayout.ts): handed up with onLayout, shown again from `layout`.
// Links, buttons and forms in the frame do nothing: a click edits.

/** value: as typed now; shown: as the frame's page has it (saved or the code's); code: the code's. */
export type FrameText = { key: string; markup: boolean; value: string; shown: string; code: string };
/** A section of a ClickFunnels page: its id and the words it opens with. */
export type FrameSection = { id: string; label: string };
/** A picture clicked: its key (the src the code has), how many times it shows on the page, its width there. */
export type FrameImage = { key: string; count: number; width: number };

type Props = {
  src: string;
  width: number | null;
  /** The texts of the page, in the page's order, as they are now (draft, saved or the code's). */
  texts: FrameText[];
  onEdit: (key: string, value: string) => void;
  onSelect: (key: string | null) => void;
  onFound: (keys: string[]) => void;
  /** Bumped to show every text as typed now (after the list view, or a text put back). */
  sync: number;
  /** The page's sections in the code's order (none: a React page). */
  sections: FrameSection[];
  /** The page's layout as it is now (draft or saved). */
  layout: Layout;
  onLayout: (layout: Layout) => void;
  /** A picture clicked, or the selection ended. */
  onImage: (image: FrameImage | null) => void;
};

const STYLE = `
[data-fx]{cursor:text;outline:1px dashed transparent;outline-offset:3px}
html.fx-on [data-fx]:hover{outline:2px dashed #8b5cf6}
[data-fx][contenteditable="true"]{outline:2px solid #8b5cf6!important;background:rgba(139,92,246,.08)}
[data-fx].fx-changed{outline:1px dashed #f5b800}
a,button,label,summary,input,select,textarea{cursor:default}
html.fx-on [data-fs]:hover{outline:1px dashed rgba(139,92,246,.55);outline-offset:-1px}
.fs-bar{position:absolute;top:8px;left:8px;z-index:2147483000;display:flex;align-items:center;gap:3px;padding:4px;border-radius:4px;background:#141414;color:#fff;font:600 12px/1 Inter,"Inter Fallback",system-ui,sans-serif;text-align:left;box-shadow:0 4px 14px rgba(0,0,0,.35);white-space:nowrap;opacity:0;pointer-events:none;transition:opacity .12s}
html.fx-on [data-fs]:hover>.fs-bar,.fs-bar:focus-within,[data-fs].fs-hidden>.fs-bar{opacity:1;pointer-events:auto}
.fs-bar button{all:unset;box-sizing:border-box;display:inline-grid;place-items:center;min-width:24px;height:24px;padding:0 7px;border-radius:3px;background:#2b2b2b;color:#fff;cursor:pointer;font:inherit;line-height:1}
.fs-bar button:hover{background:#8b5cf6}
.fs-bar button:disabled{opacity:.35;cursor:default;background:#2b2b2b}
.fs-bar .fs-grip{cursor:grab;letter-spacing:-3px;font-size:15px;color:#aaa;padding:0 5px 0 3px}
.fs-bar .fs-grip:active{cursor:grabbing}
.fs-bar .fs-name{padding:0 6px;color:#d6d6d6;max-width:min(300px,40vw);overflow:hidden;text-overflow:ellipsis;font-weight:500}
.fs-bar .fs-num{color:#8b5cf6;font-weight:700}
.fs-bar .fs-tag{padding:0 6px;color:#f5b800}
[data-fs].fs-hidden{max-height:72px!important;min-height:72px;overflow:hidden!important;opacity:.45;filter:grayscale(1);outline:1px dashed #f5b800!important;outline-offset:-1px}
[data-fs].fs-dragging{opacity:.4}
[data-fs].fs-drop-top{box-shadow:inset 0 4px 0 0 #8b5cf6!important}
[data-fs].fs-drop-bottom{box-shadow:inset 0 -4px 0 0 #8b5cf6!important}
img[data-fi]{cursor:pointer}
html.fx-on img[data-fi]:hover{outline:2px dashed #22c55e;outline-offset:2px}
img[data-fi].fx-changed{outline:1px dashed #f5b800;outline-offset:2px}
img[data-fi].fx-sel{outline:2px solid #22c55e!important;outline-offset:2px}
`;

const norm = (s: string) => s.replace(/[  ​]/g, " ").replace(/\s+/g, " ").trim();

/** How a copy text shows on the page (euros). */
export function copyDisplay(raw: string): string {
  const esc = raw.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return esc
    .replace(/\*\*([\s\S]+?)\*\*/g, "<b>$1</b>")
    .replaceAll("{c}", "€")
    .replace(/\n/g, "<br>");
}

/** A copy text back from how it shows: <b> → **, line breaks → \n, € → {c} where the code had {c}. */
function copyFromHtml(html: string, raw: string, doc: Document): string {
  const marked = html
    .replace(/<(b|strong)\b[^>]*>([\s\S]*?)<\/\1>/gi, "**$2**")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "");
  const t = doc.createElement("textarea");
  t.innerHTML = marked;
  let text = t.value.replace(/ /g, " ").replace(/\*\*\*\*/g, "");
  if (raw.includes("{c}")) text = text.replaceAll("€", "{c}");
  return text;
}

/** The page's sections as they stand, top to bottom. */
const sectionEls = (doc: Document) => [...doc.querySelectorAll<HTMLElement>("[data-fs]")];

export function PageFrame({ src, width, texts, onEdit, onSelect, onFound, sync, sections, layout, onLayout, onImage }: Props) {
  const frame = useRef<HTMLIFrameElement>(null);
  const els = useRef(new Map<string, HTMLElement>());
  // The text being typed in: never redrawn under the caret.
  const editing = useRef<HTMLElement | null>(null);
  // The picture selected (its key), outlined on every copy of it.
  const picked = useRef<string | null>(null);
  // The latest props for the frame's listeners, set up once per load.
  const live = useRef({ texts, onEdit, onSelect, onFound, sections, layout, onLayout, onImage });
  useEffect(() => {
    live.current = { texts, onEdit, onSelect, onFound, sections, layout, onLayout, onImage };
  });

  // Changed texts outlined in yellow.
  useEffect(() => {
    for (const t of texts) els.current.get(t.key)?.classList.toggle("fx-changed", t.value !== t.code);
  }, [texts]);

  useEffect(() => {
    if (sync) syncAll();
    // Only when asked: `texts` changes on every keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sync]);

  // The layout as it is now, on the page: sections in order, hidden ones dimmed, pictures swapped, the button colour.
  useEffect(() => {
    syncLayout();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout]);

  // A page that finished loading before this mounted (the frame starts with the
  // HTML, React a moment later) gets set up now; onLoad takes the later ones.
  useEffect(() => {
    const doc = frame.current?.contentDocument;
    if (doc?.readyState === "complete" && doc.body?.childElementCount && !doc.documentElement.classList.contains("fx-on")) setup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The editable texts on the page now: ClickFunnels' marks once, the copy's
  // texts again whenever the page draws more (React pages: after they load,
  // the order form's step 2).
  function scan(doc: Document) {
    for (const [key, el] of els.current) if (!el.isConnected) els.current.delete(key);
    const byKey = new Map(live.current.texts.map((t) => [t.key, t]));

    // ClickFunnels' texts: between their marks.
    const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_COMMENT);
    const starts: Comment[] = [];
    for (let n = walker.nextNode(); n; n = walker.nextNode()) if (/^fx:t\d{3}$/.test((n as Comment).data)) starts.push(n as Comment);
    for (const start of starts) {
      const key = start.data.slice(3);
      const inside: Node[] = [];
      let end: Node | null = start.nextSibling;
      while (end && !(end.nodeType === 8 && (end as Comment).data === "/fx")) {
        inside.push(end);
        end = end.nextSibling;
      }
      if (!end) continue;
      const parent = start.parentElement!;
      const blank = (n: Node) => n.nodeType === 3 && !n.textContent?.trim();
      const alone = [...parent.childNodes].every((n) => n === start || n === end || inside.includes(n) || blank(n));
      let el: HTMLElement;
      if (alone && parent !== doc.body) {
        el = parent;
      } else {
        el = doc.createElement("span");
        parent.insertBefore(el, start);
        for (const n of inside) el.appendChild(n);
      }
      start.remove();
      end.parentNode?.removeChild(end);
      if (!byKey.has(key) || els.current.has(key)) continue;
      el.dataset.fx = key;
      els.current.set(key, el);
    }

    // The copy's texts: the innermost element whose words are the text's, page order.
    const copies = live.current.texts.filter((t) => !t.markup && !els.current.has(t.key));
    if (copies.length) {
      const all = [...doc.body.querySelectorAll<HTMLElement>("*")].filter(
        (e) => !/^(SCRIPT|STYLE|NOSCRIPT|svg|path|TEMPLATE)$/.test(e.tagName) && !e.closest("[data-fx]") && !e.closest(".fs-bar"),
      );
      const words = new Map(all.map((e) => [e, norm(e.textContent ?? "")]));
      const taken = new Set<HTMLElement>();
      for (const t of copies) {
        const want = norm(copyDisplay(t.shown).replace(/<br>/g, " ").replace(/<[^>]+>/g, "").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&"));
        if (want.length < 2) continue;
        const el = all.find(
          (e) => !taken.has(e) && words.get(e) === want && ![...e.children].some((c) => words.get(c as HTMLElement) === want) && !e.querySelector("[data-fx]"),
        );
        if (!el) continue;
        taken.add(el);
        el.dataset.fx = t.key;
        els.current.set(t.key, el);
      }
    }
    live.current.onFound([...els.current.keys()]);
  }

  // Every section gets its bar: grip, number and name, arrows, Hide / Show.
  function setupSections(doc: Document) {
    const labels = new Map(live.current.sections.map((s) => [s.id, s.label]));
    const win = doc.defaultView;
    for (const el of sectionEls(doc)) {
      if (el.querySelector(":scope > .fs-bar")) continue;
      // The bar sits in the section's corner; a sticky or positioned section already places it.
      if (win?.getComputedStyle(el).position === "static") el.style.position = "relative";
      el.classList.toggle("fs-hidden", el.hasAttribute("data-fs-hidden"));
      const bar = doc.createElement("div");
      bar.className = "fs-bar";
      bar.innerHTML =
        '<button type="button" class="fs-grip" draggable="true" title="Drag to move this section">⋮⋮</button>' +
        '<span class="fs-name"><span class="fs-num"></span> · <span class="fs-label"></span></span>' +
        '<span class="fs-tag" hidden>Hidden</span>' +
        '<button type="button" data-act="up" title="Move up">↑</button>' +
        '<button type="button" data-act="down" title="Move down">↓</button>' +
        '<button type="button" data-act="hide">Hide</button>';
      bar.querySelector(".fs-label")!.textContent = labels.get(el.dataset.fs!) ?? "Section";
      el.prepend(bar);
    }
    refreshBars(doc);
  }

  // The bars say where each section stands now.
  function refreshBars(doc: Document) {
    const all = sectionEls(doc);
    all.forEach((el, i) => {
      const bar = el.querySelector<HTMLElement>(":scope > .fs-bar");
      if (!bar) return;
      const hidden = el.classList.contains("fs-hidden");
      bar.querySelector<HTMLElement>(".fs-num")!.textContent = String(i + 1);
      bar.querySelector<HTMLElement>(".fs-tag")!.hidden = !hidden;
      const hide = bar.querySelector<HTMLButtonElement>("[data-act=hide]")!;
      hide.textContent = hidden ? "Show" : "Hide";
      hide.title = hidden ? "Show this section again" : "Hide this section (it stays here, dimmed, until you show it)";
      bar.querySelector<HTMLButtonElement>("[data-act=up]")!.disabled = i === 0;
      bar.querySelector<HTMLButtonElement>("[data-act=down]")!.disabled = i === all.length - 1;
    });
  }

  // The layout as the page stands now, handed up.
  function emitLayout(doc: Document) {
    const all = sectionEls(doc);
    live.current.onLayout({
      ...live.current.layout,
      order: all.map((e) => e.dataset.fs!),
      hidden: all.filter((e) => e.classList.contains("fs-hidden")).map((e) => e.dataset.fs!),
    });
  }

  function move(doc: Document, el: HTMLElement, dir: -1 | 1) {
    const all = sectionEls(doc);
    const j = all.indexOf(el) + dir;
    if (j < 0 || j >= all.length) return;
    if (dir < 0) all[j].before(el);
    else all[j].after(el);
    emitLayout(doc);
    refreshBars(doc);
    el.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }

  function setHidden(doc: Document, el: HTMLElement, hidden: boolean) {
    el.classList.toggle("fs-hidden", hidden);
    emitLayout(doc);
    refreshBars(doc);
  }

  function pickImage(doc: Document, key: string | null) {
    picked.current = key;
    for (const img of doc.querySelectorAll<HTMLImageElement>("img[data-fi]")) img.classList.toggle("fx-sel", key !== null && img.dataset.fi === key);
  }

  function setup() {
    const doc = frame.current?.contentDocument;
    if (!doc?.body) return;
    els.current = new Map();
    editing.current = null;
    picked.current = null;
    const style = doc.createElement("style");
    style.textContent = STYLE;
    doc.head.appendChild(style);
    doc.documentElement.classList.add("fx-on");
    setupSections(doc);
    // After a React page has hydrated (it'd warn about the marks otherwise); the observer below catches the rest.
    const win = doc.defaultView as (Window & typeof globalThis) | null;
    const first = () => {
      scan(doc);
      syncAll();
      syncLayout();
    };
    if (win?.requestIdleCallback) win.requestIdleCallback(first, { timeout: 1500 });
    else setTimeout(first, 500);
    let timer: ReturnType<typeof setTimeout> | undefined;
    new MutationObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        scan(doc);
        syncAll();
      }, 250);
    }).observe(doc.body, { childList: true, subtree: true });

    // A click edits the text under it, picks the picture under it or works a
    // section's bar; links, buttons and forms do nothing.
    const stop = () => {
      if (editing.current) {
        editing.current.removeAttribute("contenteditable");
        editing.current = null;
        live.current.onSelect(null);
      }
      if (picked.current !== null) {
        pickImage(doc, null);
        live.current.onImage(null);
      }
    };
    doc.addEventListener(
      "click",
      (e) => {
        const target = e.target as Element;
        const act = target.closest<HTMLElement>(".fs-bar [data-act]");
        if (act) {
          e.preventDefault();
          stop();
          const section = act.closest<HTMLElement>("[data-fs]")!;
          if (act.dataset.act === "hide") setHidden(doc, section, !section.classList.contains("fs-hidden"));
          else move(doc, section, act.dataset.act === "up" ? -1 : 1);
          return;
        }
        if (target.closest(".fs-bar")) {
          e.preventDefault();
          return;
        }
        if (target.closest("a,button,label,summary,[role=button]")) e.preventDefault();
        const img = target.closest<HTMLImageElement>("img[data-fi]");
        if (img && !target.closest("[data-fx]")) {
          stop();
          const key = img.dataset.fi!;
          pickImage(doc, key);
          live.current.onImage({ key, count: doc.querySelectorAll(`img[data-fi="${key}"]`).length, width: img.getBoundingClientRect().width || img.width || 0 });
          return;
        }
        const el = target.closest<HTMLElement>("[data-fx]");
        if (el && el === editing.current) return;
        stop();
        if (!el) return;
        editing.current = el;
        el.contentEditable = "true";
        el.focus();
        live.current.onSelect(el.dataset.fx!);
      },
      true,
    );
    doc.addEventListener("submit", (e) => e.preventDefault(), true);
    doc.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        stop();
        return;
      }
      if (!editing.current) return;
      if (e.key === "Enter") {
        e.preventDefault();
        doc.execCommand("insertLineBreak");
      }
    });
    doc.addEventListener("paste", (e) => {
      if (!editing.current) return;
      e.preventDefault();
      doc.execCommand("insertText", false, e.clipboardData?.getData("text/plain") ?? "");
    });
    doc.addEventListener("input", (e) => {
      const el = (e.target as Element).closest?.<HTMLElement>("[data-fx]");
      if (!el) return;
      const key = el.dataset.fx!;
      el.dataset.fxDirty = "1";
      const t = live.current.texts.find((x) => x.key === key);
      if (!t) return;
      live.current.onEdit(key, t.markup ? el.innerHTML : copyFromHtml(el.innerHTML, t.code, doc));
    });

    // A section dragged by its grip drops above or below the section under the pointer.
    let dragging: string | null = null;
    const clearDrop = () => {
      dragging = null;
      for (const el of doc.querySelectorAll(".fs-drop-top,.fs-drop-bottom,.fs-dragging")) el.classList.remove("fs-drop-top", "fs-drop-bottom", "fs-dragging");
    };
    doc.addEventListener("dragstart", (e) => {
      const grip = (e.target as Element).closest?.(".fs-grip");
      if (!grip) {
        e.preventDefault(); // pictures and selected words don't drag
        return;
      }
      const section = grip.closest<HTMLElement>("[data-fs]")!;
      dragging = section.dataset.fs!;
      section.classList.add("fs-dragging");
      e.dataTransfer?.setData("text/plain", dragging);
      if (e.dataTransfer) e.dataTransfer.effectAllowed = "move";
    });
    doc.addEventListener("dragover", (e) => {
      if (!dragging) return;
      const over = (e.target as Element).closest?.<HTMLElement>("[data-fs]");
      if (!over || over.dataset.fs === dragging) return;
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
      const r = over.getBoundingClientRect();
      const top = e.clientY < r.top + r.height / 2;
      for (const el of doc.querySelectorAll(".fs-drop-top,.fs-drop-bottom")) if (el !== over) el.classList.remove("fs-drop-top", "fs-drop-bottom");
      over.classList.toggle("fs-drop-top", top);
      over.classList.toggle("fs-drop-bottom", !top);
    });
    doc.addEventListener("drop", (e) => {
      if (!dragging) return;
      e.preventDefault();
      const over = (e.target as Element).closest?.<HTMLElement>("[data-fs]");
      const moved = doc.querySelector<HTMLElement>(`[data-fs="${dragging}"]`);
      if (over && moved && over !== moved) {
        if (over.classList.contains("fs-drop-top")) over.before(moved);
        else over.after(moved);
        emitLayout(doc);
        refreshBars(doc);
      }
      clearDrop();
    });
    doc.addEventListener("dragend", clearDrop);
  }

  // Every text found shows as typed now (typed in the list, put back, or typed before a reload).
  function syncAll() {
    const doc = frame.current?.contentDocument;
    if (!doc) return;
    for (const t of live.current.texts) {
      const el = els.current.get(t.key);
      if (!el || el === editing.current) continue;
      // Untouched texts stay as the page drew them.
      if (t.value !== t.shown || el.dataset.fxDirty) {
        const now = t.markup ? el.innerHTML : copyFromHtml(el.innerHTML, t.code, doc);
        if (now !== t.value) el.innerHTML = t.markup ? t.value : copyDisplay(t.value);
        el.dataset.fxDirty = "1";
      }
      el.classList.toggle("fx-changed", t.value !== t.code);
    }
  }

  // The page laid out as `layout` says: the sections in its order (the ones it
  // doesn't name after them, in the code's order), the hidden ones dimmed, every
  // picture replaced shown in the old one's place (its height following the new
  // shape, as the live page does), the buttons in the colour picked.
  function syncLayout() {
    const doc = frame.current?.contentDocument;
    if (!doc?.body) return;
    const { layout: l, sections: code } = live.current;
    const all = sectionEls(doc);
    if (all.length) {
      const have = new Map(all.map((e) => [e.dataset.fs!, e]));
      const first = (l.order ?? []).filter((id, i, a) => have.has(id) && a.indexOf(id) === i);
      const rest = [...code.map((s) => s.id), ...have.keys()].filter((id, i, a) => have.has(id) && !first.includes(id) && a.indexOf(id) === i);
      const want = [...first, ...rest];
      if (want.join("\n") !== all.map((e) => e.dataset.fs!).join("\n")) {
        const parent = all[0].parentElement!;
        for (const id of want) parent.appendChild(have.get(id)!);
      }
      const hidden = new Set(l.hidden ?? []);
      for (const el of all) el.classList.toggle("fs-hidden", hidden.has(el.dataset.fs!));
      refreshBars(doc);
    }
    const images = l.images ?? {};
    for (const img of doc.querySelectorAll<HTMLImageElement>("img[data-fi]")) {
      const key = img.dataset.fi!;
      const to = images[key];
      if (img.dataset.fih === undefined) img.dataset.fih = img.getAttribute("height") ?? "";
      const src = to ? to.src : key;
      if (img.getAttribute("src") !== src) img.setAttribute("src", src);
      const w = Number(img.getAttribute("width"));
      if (img.dataset.fih) img.setAttribute("height", to && w > 0 ? String(Math.max(1, Math.round((w * to.h) / to.w))) : img.dataset.fih);
      img.classList.toggle("fx-changed", !!to);
    }
    if (l.button) doc.documentElement.setAttribute("data-ab-btn", l.button);
    else doc.documentElement.removeAttribute("data-ab-btn");
  }

  return (
    <iframe
      ref={frame}
      src={src}
      title="The page"
      onLoad={setup}
      style={{ width: width ? `${width}px` : "100%", height: "100%", border: 0, background: "#fff", display: "block", margin: "0 auto" }}
    />
  );
}
