"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { previewUrl } from "@/components/FunnelLanes";
import { I } from "@/components/icons";
import s from "./textsEditor.module.css";

// Funnel map → Edit on a page built in code (the MIDI Drum Kit): every text of
// the page in one language, in the page's order. ClickFunnels' texts (tNNN)
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
};

const isMarkup = (key: string) => /^t\d{3}$/.test(key);
const plain = (html: string) => html.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();

export function TextsEditor({ funnel, page, lang, pages, langs, code, edited, liveUrl }: Props) {
  const router = useRouter();
  // key → the text as typed, for the texts touched since the last save.
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(edited);
  const [query, setQuery] = useState("");
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState("");
  // Bumped when a text is put back, so its field shows the code's text again.
  const [resets, setResets] = useState<Record<string, number>>({});

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
    setState("idle");
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

      <main className={s.main}>
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
