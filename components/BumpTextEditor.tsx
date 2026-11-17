"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// Dashboard → Products → Order bump words. One headline and one text per product (English and
// Italian), said on every order form that sells it as a tick-box add-on ("quando lo modifico poi
// viene cambiato ovunque il prodotto sia come order bump"). On the right the real order page of
// one of those funnels in a phone-wide frame, redrawn as you type ("un anteprima mentre lo
// modifico reale in contesto nel widget checkout"): the page listens in app/(funnels)/bumpDraft.ts.
//
// The text is kept as paragraphs with marks (**bold**, _italic_, __underline__) and two
// placeholders, {price} and {full}, that each checkout fills with its own numbers (lib/bumpText.ts).

type Lang = "en" | "it";
type Use = { funnel: string; funnelName: string; key: string; price: number; full: number; pages: Partial<Record<Lang, string>> };
type Text = { headline: string; body: string };
type Loaded = { texts: Partial<Record<Lang, Text>>; uses: Use[] };

const LANG_NAME: Record<Lang, string> = { en: "English", it: "Italiano" };

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const inlineHtml = (s: string) =>
  esc(s)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/__(.+?)__/g, "<u>$1</u>")
    .replace(/(^|[^\w])_(.+?)_(?=[^\w]|$)/g, "$1<em>$2</em>");
const toHtml = (body: string) =>
  body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${inlineHtml(p)}</p>`)
    .join("") || "<p><br></p>";

// The editable box's content back as marks; each block is a paragraph.
function inlineMarks(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return (node.textContent ?? "").replace(/ /g, " ");
  if (!(node instanceof HTMLElement)) return "";
  if (node.tagName === "BR") return "";
  const inner = [...node.childNodes].map(inlineMarks).join("");
  if (!inner.trim()) return inner;
  const st = node.style;
  const bold = node.tagName === "B" || node.tagName === "STRONG" || st.fontWeight === "bold" || Number(st.fontWeight) >= 600;
  const italic = node.tagName === "I" || node.tagName === "EM" || st.fontStyle === "italic";
  const under = node.tagName === "U" || st.textDecoration.includes("underline");
  // Marks hug the words: the spaces stay outside them.
  const [, lead, core, tail] = inner.match(/^(\s*)([\s\S]*?)(\s*)$/)!;
  let out = core;
  if (under) out = `__${out}__`;
  if (italic) out = `_${out}_`;
  if (bold) out = `**${out}**`;
  return lead + out + tail;
}
function toMarks(root: HTMLElement): string {
  const blocks: string[] = [];
  let loose = "";
  for (const n of root.childNodes) {
    if (n instanceof HTMLElement && (n.tagName === "P" || n.tagName === "DIV")) {
      if (loose.trim()) blocks.push(loose.trim());
      loose = "";
      blocks.push(inlineMarks(n).trim());
    } else loose += inlineMarks(n);
  }
  if (loose.trim()) blocks.push(loose.trim());
  return blocks.filter(Boolean).join("\n\n");
}

const amount = (n: number, lang: Lang) => (Number.isInteger(n) ? String(n) : lang === "en" ? n.toFixed(2) : n.toFixed(2).replace(".", ","));
const said = (n: number, lang: Lang) => (lang === "en" ? `€${amount(n, lang)}` : `${amount(n, lang)} €`);
/** {price} and {full} as this checkout says them (the preview is in euros). */
const fill = (s: string, u: Use, lang: Lang) => s.replaceAll("{price}", said(u.price, lang)).replaceAll("{full}", said(u.full, lang));
/** The page's own words with its numbers turned back into placeholders, for a first draft. */
function unfill(s: string, u: Use, lang: Lang) {
  const swap = (text: string, n: number, token: string) => {
    const a = amount(n, lang).replace(".", "\\.");
    return text.replace(new RegExp(`€\\s?${a}(?![\\d.,]\\d)|(?<![\\d.,])${a}\\s?€`, "g"), token);
  };
  return swap(u.full !== u.price ? swap(s, u.full, "{full}") : s, u.price, "{price}");
}

export function BumpTextEditor({ product, name, onClose }: { product: string; name: string; onClose: () => void }) {
  const [data, setData] = useState<Loaded | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lang, setLang] = useState<Lang>("en");
  const [funnel, setFunnel] = useState("");
  const [drafts, setDrafts] = useState<Partial<Record<Lang, Text>>>({});
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [found, setFound] = useState<boolean | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    fetch(`/api/products/bump-text?product=${encodeURIComponent(product)}`)
      .then((r) => r.json())
      .then((d: Loaded & { error?: string }) => {
        if (d.error) return setError(d.error);
        setData(d);
        setDrafts(d.texts);
        setFunnel(d.uses[0]?.funnel ?? "");
      })
      .catch(() => setError("Couldn't load."));
  }, [product]);

  // The funnels that have an order page in this language.
  const uses = useMemo(() => (data?.uses ?? []).filter((u) => u.pages[lang]), [data, lang]);
  const use = uses.find((u) => u.funnel === funnel) ?? uses[0];
  const text = drafts[lang];
  const src = use ? `${use.pages[lang]}?preview=1` : null;

  const send = useCallback(
    (t: Text | undefined) => {
      if (!use || !t) return;
      const paras = t.body.split(/\n\s*\n/).map((p) => fill(p.trim(), use, lang)).filter(Boolean);
      frame.current?.contentWindow?.postMessage({ type: "fv-bump-draft", id: use.key, headline: fill(t.headline, use, lang), paras }, location.origin);
    },
    [use, lang],
  );

  // The frame answers with the words the page has now: the first draft when nothing is saved.
  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (e.origin !== location.origin || e.source !== frame.current?.contentWindow) return;
      const m = e.data as { type?: string; found?: boolean; headline?: string; paras?: string[] };
      if (m?.type !== "fv-bump-current" || !use) return;
      setFound(Boolean(m.found));
      if (!m.found) return;
      setDrafts((d) => {
        if (d[lang]) {
          send(d[lang]);
          return d;
        }
        const own = { headline: unfill(m.headline ?? "", use, lang), body: (m.paras ?? []).map((p) => unfill(p, use, lang)).join("\n\n") };
        return { ...d, [lang]: own };
      });
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [use, lang, send]);

  // Ask the page for the add-on until it answers: it listens only once it has loaded and come alive.
  useEffect(() => {
    if (!src || !use || found !== null) return;
    let n = 0;
    const ask = setInterval(() => {
      if (++n > 40) return clearInterval(ask);
      frame.current?.contentWindow?.postMessage({ type: "fv-bump-show", id: use.key }, location.origin);
    }, 700);
    return () => clearInterval(ask);
  }, [src, use, found]);

  // The editable box follows the language's text when it changes from outside (load, language, first draft).
  const shown = useRef("");
  useEffect(() => {
    const body = text?.body ?? "";
    if (box.current && shown.current !== `${lang}:${body}`) {
      box.current.innerHTML = toHtml(body);
      shown.current = `${lang}:${body}`;
    }
  }, [text, lang]);

  // The newest drafts, for two edits that land before the next draw.
  const latest = useRef(drafts);
  useEffect(() => {
    latest.current = drafts;
  }, [drafts]);
  function change(next: Partial<Text>) {
    const now = latest.current[lang];
    const t = { headline: now?.headline ?? "", body: now?.body ?? "", ...next };
    if (next.body !== undefined) shown.current = `${lang}:${next.body}`;
    latest.current = { ...latest.current, [lang]: t };
    setDrafts(latest.current);
    setMsg(null);
    send(t);
  }

  const cmd = (name: string, value?: string) => {
    box.current?.focus();
    document.execCommand(name, false, value);
    if (box.current) change({ body: toMarks(box.current) });
  };

  async function save(t: Text) {
    setBusy(true);
    setMsg(null);
    try {
      const r = await fetch("/api/products/bump-text", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ product, lang, ...t }) });
      const d = (await r.json()) as { error?: string; forms?: number };
      if (!r.ok || d.error) throw new Error(d.error ?? "Couldn't save.");
      const cleared = !t.headline.trim() && !t.body.trim();
      setMsg({ ok: true, text: cleared ? "Removed. Each order form says its own words again." : `Saved. Live on ${d.forms} order form${d.forms === 1 ? "" : "s"}.` });
      if (cleared) {
        setDrafts((d2) => ({ ...d2, [lang]: undefined }));
        frame.current?.contentWindow?.location.reload();
      }
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "Couldn't save." });
    } finally {
      setBusy(false);
    }
  }

  const tool: React.CSSProperties = { minWidth: 34, height: 32, padding: "0 9px", border: "1px solid var(--line)", borderRadius: "var(--radius-sm)", background: "var(--bg-2)", color: "var(--fg-0)", font: "600 13px/1 var(--font-sans)", cursor: "pointer" };
  const label: React.CSSProperties = { display: "block", margin: "0 0 6px", font: "600 12px/1.2 var(--font-sans)", letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--fg-2)" };
  const hold = (fn: () => void) => (e: React.MouseEvent) => {
    e.preventDefault(); // keep the selection in the text
    fn();
  };

  return (
    <div role="dialog" aria-label={`Order bump words: ${name}`} style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", background: "var(--bg-0)", color: "var(--fg-0)" }}>
      <div style={{ flex: "1 1 0", minWidth: 0, overflowY: "auto", padding: "22px 28px 40px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ font: "600 12px/1.2 var(--font-sans)", letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--fg-2)" }}>Order bump words</div>
            <div style={{ font: "700 22px/1.25 var(--font-sans)" }}>{name}</div>
          </div>
          <button type="button" className="btn" onClick={onClose}>
            Close
          </button>
        </div>

        {error && <p style={{ color: "var(--rose)" }}>{error}</p>}
        {data && !data.uses.length && <p style={{ color: "var(--fg-1)" }}>This product isn&rsquo;t a tick-box add-on on any order form yet. Add it to a funnel as an add-on first.</p>}

        {data && data.uses.length > 0 && (
          <>
            <p style={{ margin: "0 0 18px", maxWidth: 640, color: "var(--fg-1)", lineHeight: 1.5 }}>
              One text for this product. Saved, it replaces the words on every order form where it is an add-on ({data.uses.map((u) => u.funnelName).join(", ")}). Until you save, each form keeps its own.
            </p>

            <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
              {(Object.keys(LANG_NAME) as Lang[]).map((l) => (
                <button key={l} type="button" className={`btn ghost${l === lang ? " is-on" : ""}`} onClick={() => (setLang(l), setMsg(null), setFound(null))}>
                  {LANG_NAME[l]}
                  {data.texts[l] ? " · saved" : ""}
                </button>
              ))}
            </div>

            {!uses.length ? (
              <p style={{ color: "var(--fg-1)" }}>No order form that sells it has an {LANG_NAME[lang]} page: only the MIDI Drum Kit&rsquo;s order page is translated.</p>
            ) : (
              <div style={{ maxWidth: 640 }}>
                <label style={label} htmlFor="bump-headline">
                  Headline
                </label>
                <input
                  id="bump-headline"
                  value={text?.headline ?? ""}
                  onChange={(e) => change({ headline: e.target.value })}
                  style={{ width: "100%", height: 42, padding: "0 12px", marginBottom: 18, border: "1px solid var(--line)", borderRadius: "var(--radius)", background: "var(--bg-1)", color: "var(--fg-0)", font: "600 16px/1 var(--font-sans)" }}
                />

                <span style={label}>Text</span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                  <button type="button" title="Bold" style={{ ...tool, fontWeight: 800 }} onMouseDown={hold(() => cmd("bold"))}>
                    B
                  </button>
                  <button type="button" title="Italic" style={{ ...tool, fontStyle: "italic" }} onMouseDown={hold(() => cmd("italic"))}>
                    I
                  </button>
                  <button type="button" title="Underline" style={{ ...tool, textDecoration: "underline" }} onMouseDown={hold(() => cmd("underline"))}>
                    U
                  </button>
                  <button type="button" title="Remove formatting" style={tool} onMouseDown={hold(() => cmd("removeFormat"))}>
                    Plain
                  </button>
                  <span style={{ width: 8 }} />
                  <button type="button" title="Undo" style={tool} onMouseDown={hold(() => cmd("undo"))}>
                    Undo
                  </button>
                  <button type="button" title="Redo" style={tool} onMouseDown={hold(() => cmd("redo"))}>
                    Redo
                  </button>
                  <span style={{ width: 8 }} />
                  <button type="button" title="What this checkout charges" style={tool} onMouseDown={hold(() => cmd("insertText", "{price}"))}>
                    + price
                  </button>
                  <button type="button" title="The full price, struck through on the box" style={tool} onMouseDown={hold(() => cmd("insertText", "{full}"))}>
                    + full price
                  </button>
                </div>
                <style>{".fv-bump-box p{margin:0 0 12px}.fv-bump-box p:last-child{margin-bottom:0}"}</style>
                <div
                  ref={box}
                  className="fv-bump-box"
                  contentEditable
                  suppressContentEditableWarning
                  role="textbox"
                  aria-multiline
                  aria-label="Text"
                  onInput={(e) => change({ body: toMarks(e.currentTarget) })}
                  onPaste={(e) => {
                    e.preventDefault();
                    document.execCommand("insertText", false, e.clipboardData.getData("text/plain"));
                  }}
                  style={{ minHeight: 200, padding: "12px 14px", border: "1px solid var(--line)", borderRadius: "var(--radius)", background: "var(--bg-1)", color: "var(--fg-0)", font: "400 16px/1.55 var(--font-sans)", outline: "none", whiteSpace: "pre-wrap" }}
                />
                <p style={{ margin: "8px 0 0", color: "var(--fg-2)", fontSize: 13, lineHeight: 1.5 }}>
                  Enter starts a new paragraph. <b>{"{price}"}</b> and <b>{"{full}"}</b> become each checkout&rsquo;s own numbers
                  {use ? ` (here ${said(use.price, lang)} and ${said(use.full, lang)})` : ""}, so the same text fits every funnel.
                </p>

                <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 20, flexWrap: "wrap" }}>
                  <button type="button" className="btn primary" disabled={busy || !text} onClick={() => text && save(text)}>
                    {busy ? "Saving…" : "Save everywhere"}
                  </button>
                  {data.texts[lang] && (
                    <button type="button" className="btn ghost" disabled={busy} onClick={() => save({ headline: "", body: "" })}>
                      Back to each form&rsquo;s own words
                    </button>
                  )}
                  {msg && <span style={{ color: msg.ok ? "var(--mint)" : "var(--rose)", fontWeight: 600 }}>{msg.text}</span>}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* The real order page, phone-wide. */}
      <div style={{ flex: "none", width: 430, display: "flex", flexDirection: "column", padding: "22px 20px", background: "var(--bg-1)" }}>
        <span style={label}>Preview: the real order page</span>
        {uses.length > 1 && (
          <select
            value={use?.funnel ?? ""}
            onChange={(e) => (setFunnel(e.target.value), setFound(null))}
            style={{ height: 36, marginBottom: 10, padding: "0 8px", border: "1px solid var(--line)", borderRadius: "var(--radius)", background: "var(--bg-2)", color: "var(--fg-0)", font: "500 14px/1 var(--font-sans)" }}
          >
            {uses.map((u) => (
              <option key={u.funnel} value={u.funnel}>
                {u.funnelName} · {said(u.price, lang)}
              </option>
            ))}
          </select>
        )}
        {uses.length === 1 && use && (
          <p style={{ margin: "0 0 10px", color: "var(--fg-1)", fontSize: 14 }}>
            {use.funnelName} · {said(use.price, lang)}
          </p>
        )}
        {src ? (
          <iframe
            key={src}
            ref={frame}
            src={src}
            title="Order page preview"
            style={{ flex: 1, width: 390, minHeight: 0, border: 0, borderRadius: "var(--radius)", background: "#fff" }}
          />
        ) : (
          <div style={{ flex: 1 }} />
        )}
        {found === false && <p style={{ margin: "8px 0 0", color: "var(--amber)", fontSize: 13 }}>This order form doesn&rsquo;t show the add-on as a tick box right now (hidden, or offered another way).</p>}
      </div>
    </div>
  );
}
