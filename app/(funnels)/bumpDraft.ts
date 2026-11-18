// The order forms' side of dashboard → Products → Order bump words (components/BumpTextEditor.tsx):
// the editor shows the real order page in a frame and talks to it here, so the owner sees the
// words in the checkout as they type. Only inside a frame of our own site or of the dashboard
// (funnnnels.com sends these paths on to the brand's domain, so the two are on different hosts:
// with our own origin only, the live editor stayed empty), and nothing is saved from here.
//   fv-bump-show  { id }                    open step 2, bring the add-on on screen, answer fv-bump-current
//                                           with the box's look (colours, type, the red opener)
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

// The first colour up the tree that isn't see-through: what the words sit on.
function ground(el: HTMLElement | null): string {
  for (let n = el; n; n = n.parentElement) {
    const c = getComputedStyle(n).backgroundColor;
    if (c && c !== "transparent" && !/,\s*0\)$/.test(c)) return c;
  }
  return "#fff";
}

function current(el: HTMLElement) {
  const body = el.querySelector<HTMLElement>("[data-bump-b]");
  const paras = body ? [...body.children].map((p) => marks(p).trim()).filter(Boolean) : [];
  const oto = body?.querySelector<HTMLElement>("[data-bump-oto]");
  const strong = body?.querySelector<HTMLElement>("strong, b");
  const cs = body && getComputedStyle(body);
  const os = oto && getComputedStyle(oto);
  const look = cs && {
    bg: ground(body),
    fg: cs.color,
    font: cs.fontFamily,
    size: cs.fontSize,
    line: cs.lineHeight,
    weight: cs.fontWeight,
    strong: strong ? getComputedStyle(strong).color : cs.color,
    oto: oto?.textContent?.trim() ?? "",
    otoColor: os?.color ?? "",
    otoWeight: os?.fontWeight ?? "",
    otoLine: os?.textDecorationLine ?? "",
  };
  return { headline: el.querySelector("[data-bump-h]")?.textContent?.trim() ?? "", paras, look };
}

// The dashboard's hosts (proxy.ts DASHBOARD_HOSTS), and our own.
const FROM = new Set(["https://funnnnels.com", "https://www.funnnnels.com"]);
let editor = "";

let looking = "";
function show(id: string, tries = 0) {
  if (tries === 0 && looking === id) return;
  looking = id;
  const el = box(id);
  if (!el) {
    if (tries > 25) {
      looking = "";
      return void parent.postMessage({ type: "fv-bump-current", id, found: false }, editor);
    }
    // Step 1 still: the owner's own way to step 2 (OwnerSkip.tsx).
    document.querySelector<HTMLElement>("[data-owner-skip]")?.click();
    return void setTimeout(() => show(id, tries + 1), 300);
  }
  looking = "";
  el.scrollIntoView({ block: "center" });
  parent.postMessage({ type: "fv-bump-current", id, found: true, ...current(el) }, editor);
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
    if ((e.origin !== location.origin && !FROM.has(e.origin)) || e.source !== window.parent) return;
    editor = e.origin;
    const m = (e.data ?? {}) as Msg;
    if (m.type === "fv-bump-show" && m.id) show(m.id);
    if (m.type === "fv-bump-draft") draft(m);
  });
}

export {};
