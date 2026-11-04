"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { previewUrl } from "@/components/FunnelLanes";
import { I } from "@/components/icons";
import { PageFrame, type FrameText } from "@/components/PageFrame";
import s from "./textsEditor.module.css";

// Funnel map → Edit on a page built in code (the MIDI Drum Kit), one page in
// one language. "On the page": the page itself, a click on a text edits it
// there (./PageFrame.tsx). "List": every text of the page in the page's order. ClickFunnels' texts (tNNN)
// are edited as they look, bold and colours kept; the copy's texts are plain
// with their marks (**bold**, {c} = € or $). Saving sends only what changed;
// a text put back as the code has it goes back to the code's.

type Props = {
  funnel: { id: string; name: string };
  page: string;
  lang: string;
  pages: { id: string; name: string }[];
  langs: { lang: string; label: string }[];
  code: Record<string, string>;
  edited: Record<string, string>;
  liveUrl: string | null;
  /** The page as the editor shows it (same site), or null: list only. */
  frameSrc: string | null;
};

const isMarkup = (key: string) => /^t\d{3}$/.test(key);
const plain = (html: string) => html.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();

export function TextsEditor({ funnel, page, lang, pages, langs, code, edited, liveUrl, frameSrc }: Props) {
  const router = useRouter();
  // key → the text as typed, for the texts touched since the last save.
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(edited);
  const [query, setQuery] = useState("");
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState("");
  // Bumped when a text is put back, so its field shows the code's text again.
  const [resets, setResets] = useState<Record<string, number>>({});
  const [view, setView] = useState<"page" | "list">(frameSrc ? "page" : "list");
  const [phone, setPhone] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [found, setFound] = useState<string[] | null>(null);
  const [sync, setSync] = useState(0);
  // The order form's two steps: its step 2 (add-ons, payment) has its own words.
  const [step2, setStep2] = useState(false);
  // What the frame's page showed when it loaded: the texts saved by then.
  const [loaded] = useState(edited);

  const keys = Object.keys(code);
  const current = (key: string) => draft[key] ?? saved[key] ?? code[key];
  const changes = useMemo(() => {
    const set: Record<string, string> = {};
    const reset: string[] = [];
    for (const [key, value] of Object.entries(draft)) {
      if (value === code[key]) {
        if (key in saved) reset.push(key);
      } else if (value !== saved[key]) set[key] = value;
    }
    return { set, reset, count: Object.keys(set).length + reset.length };
  }, [draft, saved, code]);

  const q = query.trim().toLowerCase();
  const shown = q ? keys.filter((k) => plain(current(k)).toLowerCase().includes(q) || k.toLowerCase().includes(q)) : keys;
  const editedCount = keys.filter((k) => (draft[k] ?? saved[k] ?? code[k]) !== code[k]).length;

  function edit(key: string, value: string) {
    setDraft((d) => ({ ...d, [key]: value }));
    setState("idle");
  }

  function putBack(key: string) {
    setDraft((d) => ({ ...d, [key]: code[key] }));
    setResets((r) => ({ ...r, [key]: (r[key] ?? 0) + 1 }));
    setSync((n) => n + 1);
    setState("idle");
  }

  const frameTexts: FrameText[] = keys.map((key) => ({ key, markup: isMarkup(key), value: current(key), shown: loaded[key] ?? code[key], code: code[key] }));
  const missing = found ? keys.filter((k) => !found.includes(k)).length : 0;

  function show(next: "page" | "list") {
    setView(next);
    // The list edits the same texts: the page shows them as typed there.
    if (next === "page") setSync((n) => n + 1);
    else setResets((r) => Object.fromEntries(keys.map((k) => [k, (r[k] ?? 0) + 1])));
  }

  async function save() {
    setState("saving");
    setError("");
    try {
      const res = await fetch(`/api/funnels/${funnel.id}/texts`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ page, lang, set: changes.set, reset: changes.reset }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Couldn't save.");
      const next = { ...saved, ...changes.set };
      for (const k of changes.reset) delete next[k];
      setSaved(next);
      setDraft({});
      setState("saved");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save.");
      setState("error");
    }
  }

  // Leaving with unsaved texts asks first.
  function go(href: string) {
    if (changes.count && !confirm("Leave without saving your changes?")) return;
    router.push(href);
  }
  const url = (p: string, l: string) => `/funnels/${funnel.id}/texts?page=${p}&lang=${l}`;

  return (
    <div className={s.page}>
      <header className={s.bar}>
        <Link href={`/funnels/${funnel.id}`} className={s.back} title="Back to the funnel map" onClick={(e) => {
          if (changes.count && !confirm("Leave without saving your changes?")) e.preventDefault();
        }}>
          <I.arrowLeft size={16} />
        </Link>
        <div className={s.title}>
          <span className={s.name}>{funnel.name}</span>
          <span className={s.sub}>Edit texts</span>
        </div>
        <div className={s.barRight}>
          {liveUrl && (
            <a href={previewUrl(liveUrl)} target="_blank" rel="noreferrer" className="btn" title="Not counted as a visit">
              <I.eye size={14} /> Open page
            </a>
          )}
          <button type="button" className="btn primary" disabled={!changes.count || state === "saving"} onClick={save}>
            {state === "saving" ? "Saving…" : changes.count ? `Save ${changes.count} change${changes.count > 1 ? "s" : ""}` : state === "saved" ? "Saved" : "Save"}
          </button>
        </div>
      </header>

      <nav className={s.picker}>
        <div className="tabs" role="tablist" aria-label="Page">
          {pages.map((p) => (
            <button key={p.id} type="button" className={`tab ${p.id === page ? "active" : ""}`} onClick={() => p.id !== page && go(url(p.id, lang))}>
              {p.name}
            </button>
          ))}
        </div>
        <div className="tabs" role="tablist" aria-label="Language">
          {langs.map((l) => (
            <button key={l.lang} type="button" className={`tab ${l.lang === lang ? "active" : ""}`} onClick={() => l.lang !== lang && go(url(page, l.lang))}>
              {l.label}
            </button>
          ))}
        </div>
      </nav>

      {frameSrc && (
        <div className={s.viewBar}>
          <div className="tabs" role="tablist" aria-label="View">
            <button type="button" className={`tab ${view === "page" ? "active" : ""}`} onClick={() => view !== "page" && show("page")}>
              On the page
            </button>
            <button type="button" className={`tab ${view === "list" ? "active" : ""}`} onClick={() => view !== "list" && show("list")}>
              List
            </button>
          </div>
          {view === "page" && (
            <>
              <div className="tabs" role="tablist" aria-label="Screen">
                <button type="button" className={`tab ${!phone ? "active" : ""}`} onClick={() => setPhone(false)}>
                  Desktop
                </button>
                <button type="button" className={`tab ${phone ? "active" : ""}`} onClick={() => setPhone(true)}>
                  Phone
                </button>
              </div>
              {page === "order" && (
                <div className="tabs" role="tablist" aria-label="Order form step">
                  <button type="button" className={`tab ${!step2 ? "active" : ""}`} onClick={() => step2 && (setFound(null), setSelected(null), setStep2(false))}>
                    Form step 1
                  </button>
                  <button type="button" className={`tab ${step2 ? "active" : ""}`} onClick={() => !step2 && (setFound(null), setSelected(null), setStep2(true))}>
                    Form step 2
                  </button>
                </div>
              )}
              <div className={s.hint}>
                {selected ? (
                  <>
                    <span className={s.key}>{isMarkup(selected) ? `Text ${Number(selected.slice(1))}` : selected}</span>
                    {current(selected) !== code[selected] && (
                      <button type="button" className={s.undo} onClick={() => putBack(selected)} title={`Put back: ${plain(code[selected])}`}>
                        <I.refresh size={12} /> Put back the original
                      </button>
                    )}
                    <span>Esc when done</span>
                  </>
                ) : (
                  <span>Click a text on the page to change it.</span>
                )}
                {missing > 0 && (
                  <button type="button" className={s.undo} onClick={() => show("list")} title="Texts the page doesn't show as text: the title for Google, form placeholders, words the page builds">
                    {missing} more in the list
                  </button>
                )}
              </div>
            </>
          )}
          {state === "saved" && <span className={s.okInline}>Saved. Live within a few seconds.</span>}
          {state === "error" && <span className={s.errInline}>{error}</span>}
        </div>
      )}

      {frameSrc && (
        <div className={s.stage} hidden={view !== "page"}>
          <PageFrame
            src={step2 ? `${frameSrc}&step=2` : frameSrc}
            width={phone ? 390 : null}
            texts={frameTexts}
            onEdit={edit}
            onSelect={setSelected}
            onFound={setFound}
            sync={sync}
          />
        </div>
      )}

      <main className={s.main} hidden={view !== "list"}>
        <div className={s.tools}>
          <label className={s.search}>
            <I.search size={14} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Find a text" />
          </label>
          <span className={s.count}>
            {keys.length} texts{editedCount ? ` · ${editedCount} changed from the original` : ""}
          </span>
        </div>
        {state === "saved" && <p className={s.ok}>Saved. The page shows the new texts within a few seconds.</p>}
        {state === "error" && <p className={s.err}>{error}</p>}
        {!keys.length && <p className={s.empty}>This page has no texts to edit in this language.</p>}

        <ol className={s.list}>
          {shown.map((key) => {
            const value = current(key);
            const changed = value !== code[key];
            return (
              <li key={key} className={s.row}>
                <div className={s.rowHead}>
                  <span className={s.key}>{isMarkup(key) ? `Text ${Number(key.slice(1))}` : key}</span>
                  {changed && <span className={s.tag}>changed</span>}
                  {key in draft && draft[key] !== (saved[key] ?? code[key]) && <span className={s.tagUnsaved}>not saved</span>}
                  {changed && (
                    <button type="button" className={s.undo} onClick={() => putBack(key)} title={`Put back: ${plain(code[key])}`}>
                      <I.refresh size={12} /> Put back the original
                    </button>
                  )}
                </div>
                {isMarkup(key) ? (
                  <RichText key={resets[key] ?? 0} html={value} onChange={(v) => edit(key, v)} />
                ) : (
                  <textarea
                    className={s.field}
                    value={value}
                    rows={Math.min(8, Math.max(1, Math.ceil(value.length / 45)))}
                    onChange={(e) => edit(key, e.target.value)}
                  />
                )}
              </li>
            );
          })}
        </ol>
        {keys.some(isMarkup) && (
          <p className={s.note}>Bold, colours and line breaks stay as on the page; Enter adds a line break. In the plain texts, **word** is bold and {"{c}"} is the currency sign.</p>
        )}
      </main>
    </div>
  );
}

// A ClickFunnels text as it looks (bold, struck, underlined), its words editable.
// Set once (the same object every render, or React writes it again and the
// typing is lost): React doesn't touch it after, so the caret stays where it is.
function RichText({ html, onChange }: { html: string; onChange: (html: string) => void }) {
  const first = useRef({ __html: html });
  return (
    <div
      className={`${s.field} ${s.rich}`}
      contentEditable
      suppressContentEditableWarning
      dangerouslySetInnerHTML={first.current}
      onInput={(e) => onChange(e.currentTarget.innerHTML)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          document.execCommand("insertLineBreak");
        }
      }}
      onPaste={(e) => {
        // Pasted words only, not the formatting of where they came from.
        e.preventDefault();
        document.execCommand("insertText", false, e.clipboardData.getData("text/plain"));
      }}
    />
  );
}
