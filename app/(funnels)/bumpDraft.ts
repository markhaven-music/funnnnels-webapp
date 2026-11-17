// The order forms' side of dashboard → Products → Order bump words (components/BumpTextEditor.tsx):
// the editor shows the real order page in a frame and talks to it here, so the owner sees the
// words in the checkout as they type. Only inside a frame of our own site, and only messages
// from our own origin; nothing is saved from here.
//   fv-bump-show  { id }                    open step 2, bring the add-on on screen, answer fv-bump-current
//   fv-bump-draft { id, headline, paras }   draw these words in its box (marks: **bold**, _italic_, __underline__)

type Msg = { type?: string; id?: string; headline?: string; paras?: string[] };

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const html = (s: string) =>
  esc(s)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/__(.+?)__/g, "<u>$1</u>")
    .replace(/(^|[^\w])_(.+?)_(?=[^\w]|$)/g, "$1<em>$2</em>");

// The box's words back as marks, for the editor's first draft.
function marks(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? "";
  if (!(node instanceof HTMLElement) || node.hasAttribute("data-bump-oto")) return "";
  const inner = [...node.childNodes].map(marks).join("");
  const tag = node.tagName;
  if (tag === "STRONG" || tag === "B") return `**${inner}**`;
  if (tag === "U") return `__${inner}__`;
  if (tag === "EM" || tag === "I") return `_${inner}_`;
  return inner;
}

const box = (id: string) => document.querySelector<HTMLElement>(`[data-bump="${CSS.escape(id)}"]`);

function current(el: HTMLElement) {
  const body = el.querySelector("[data-bump-b]");
  const paras = body ? [...body.children].map((p) => marks(p).trim()).filter(Boolean) : [];
  return { headline: el.querySelector("[data-bump-h]")?.textContent?.trim() ?? "", paras };
}

function show(id: string, tries = 0) {
  const el = box(id);
  if (!el) {
    if (tries > 40) return void parent.postMessage({ type: "fv-bump-current", id, found: false }, location.origin);
    // Step 1 still: the owner's own way to step 2 (OwnerSkip.tsx).
    document.querySelector<HTMLElement>("[data-owner-skip]")?.click();
    return void setTimeout(() => show(id, tries + 1), 300);
  }
  el.scrollIntoView({ block: "center" });
  parent.postMessage({ type: "fv-bump-current", id, found: true, ...current(el) }, location.origin);
}

function draft(m: Msg) {
  const el = m.id ? box(m.id) : null;
  if (!el) return;
  const h = el.querySelector("[data-bump-h]");
  if (h && typeof m.headline === "string") h.textContent = m.headline;
  const body = el.querySelector<HTMLElement>("[data-bump-b]");
  if (body && Array.isArray(m.paras)) {
    const oto = body.querySelector("[data-bump-oto]")?.outerHTML ?? "";
    const cls = body.firstElementChild?.className ?? "";
    body.innerHTML = m.paras.map((p, i) => `<span class="${esc(cls)}" style="display:block">${i === 0 && oto ? `${oto} ` : ""}${html(String(p))}</span>`).join("");
  }
}

if (typeof window !== "undefined" && window.parent !== window) {
  window.addEventListener("message", (e) => {
    if (e.origin !== location.origin || e.source !== window.parent) return;
    const m = (e.data ?? {}) as Msg;
    if (m.type === "fv-bump-show" && m.id) show(m.id);
    if (m.type === "fv-bump-draft") draft(m);
  });
}

export {};
