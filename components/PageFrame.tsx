"use client";

import { useEffect, useRef } from "react";

// Funnel map → Edit, "On the page": the page itself in a frame (same site, so
// this script reaches into it), every text it can edit outlined on hover and
// edited where it stands with a click.
//   - ClickFunnels' texts (tNNN): the frame's page marks them
//     (<!--fx:tNNN-->…<!--/fx-->, app/api/funnels/[id]/texts/frame); they're
//     edited as they look, bold and colours kept, saved as HTML.
//   - The copy's texts (order and thank-you pages, React): found by their
//     words; edited as they look, saved back with their marks (**bold**,
//     {c} = the currency sign; the frame shows euros).
// Links, buttons and forms in the frame do nothing: a click edits.

/** value: as typed now; shown: as the frame's page has it (saved or the code's); code: the code's. */
export type FrameText = { key: string; markup: boolean; value: string; shown: string; code: string };

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
};

const STYLE = `
[data-fx]{cursor:text;outline:1px dashed transparent;outline-offset:3px}
html.fx-on [data-fx]:hover{outline:2px dashed #8b5cf6}
[data-fx][contenteditable="true"]{outline:2px solid #8b5cf6!important;background:rgba(139,92,246,.08)}
[data-fx].fx-changed{outline:1px dashed #f5b800}
a,button,label,summary,input,select,textarea{cursor:default}
`;

const norm = (s: string) => s.replace(/[  ​]/g, " ").replace(/\s+/g, " ").trim();

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
  let text = t.value.replace(/ /g, " ").replace(/\*\*\*\*/g, "");
  if (raw.includes("{c}")) text = text.replaceAll("€", "{c}");
  return text;
}

export function PageFrame({ src, width, texts, onEdit, onSelect, onFound, sync }: Props) {
  const frame = useRef<HTMLIFrameElement>(null);
  const els = useRef(new Map<string, HTMLElement>());
  // The text being typed in: never redrawn under the caret.
  const editing = useRef<HTMLElement | null>(null);
  // The latest props for the frame's listeners, set up once per load.
  const live = useRef({ texts, onEdit, onSelect, onFound });
  useEffect(() => {
    live.current = { texts, onEdit, onSelect, onFound };
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
      const all = [...doc.body.querySelectorAll<HTMLElement>("*")].filter((e) => !/^(SCRIPT|STYLE|NOSCRIPT|svg|path|TEMPLATE)$/.test(e.tagName) && !e.closest("[data-fx]"));
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

  function setup() {
    const doc = frame.current?.contentDocument;
    if (!doc?.body) return;
    els.current = new Map();
    editing.current = null;
    const style = doc.createElement("style");
    style.textContent = STYLE;
    doc.head.appendChild(style);
    doc.documentElement.classList.add("fx-on");
    // After a React page has hydrated (it'd warn about the marks otherwise); the observer below catches the rest.
    const win = doc.defaultView as (Window & typeof globalThis) | null;
    const first = () => {
      scan(doc);
      syncAll();
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

    // A click edits the text under it; links, buttons and forms do nothing.
    const stop = () => {
      if (!editing.current) return;
      editing.current.removeAttribute("contenteditable");
      editing.current = null;
      live.current.onSelect(null);
    };
    doc.addEventListener(
      "click",
      (e) => {
        const target = e.target as Element;
        if (target.closest("a,button,label,summary,[role=button]")) e.preventDefault();
        const el = target.closest<HTMLElement>("[data-fx]");
        if (el === editing.current) return;
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
      if (!editing.current) return;
      if (e.key === "Escape") {
        stop();
        return;
      }
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
