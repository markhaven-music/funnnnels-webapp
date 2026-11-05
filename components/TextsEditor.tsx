"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { previewUrl } from "@/components/FunnelLanes";
import { I } from "@/components/icons";
import { PageFrame, type FrameImage, type FrameSection, type FrameText } from "@/components/PageFrame";
import type { Layout } from "@/lib/pageLayout";
import s from "./textsEditor.module.css";

// Funnel map → Edit on a page built in code (the MIDI Drum Kit), one page in
// one language. "On the page": the page itself, a click on a text edits it
// there (./PageFrame.tsx); on ClickFunnels' pages a section's bar moves or
// hides it, a click on a picture replaces it, and the sales page's button
// colour is picked here (the page's layout, lib/pageLayout.ts). "List": every
// text of the page in the page's order. ClickFunnels' texts (tNNN) are edited
// as they look, bold and colours kept; the copy's texts are plain with their
// marks (**bold**, {c} = € or $). Saving sends only what changed; a text put
// back as the code has it goes back to the code's, and a layout back to the
// code's is deleted.

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
  /** The page's sections in the code's order (ClickFunnels' pages), each named by the words it opens with. */
  sections: FrameSection[];
  /** The page's saved layout: sections hidden or moved, pictures replaced, the button colour. */
  layout: Layout;
  /** The page runs the button-colour test (the sales page): its colour can be fixed here. */
  buttonColours: boolean;
};

const isMarkup = (key: string) => /^t\d{3}$/.test(key);
const plain = (html: string) => html.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();

// The button colours (app/(funnels)/midi-drum-kit/abtest.ts): the test, or one for everyone.
const BUTTONS = [
  ["", "Test: green, yellow or orange at random"],
  ["green", "Green for everyone"],
  ["yellow", "Yellow for everyone"],
  ["orange", "Orange for everyone"],
] as const;

/** The order with every section in it: the layout's first, then the code's. */
function fullOrder(order: string[] | undefined, code: string[]): string[] {
  const first = (order ?? []).filter((id, i, a) => code.includes(id) && a.indexOf(id) === i);
  return [...first, ...code.filter((id) => !first.includes(id))];
}

/** How many things differ between two layouts: the order, each section hidden or shown, the button, each picture. */
function layoutChanges(a: Layout, b: Layout, code: string[]): number {
  let n = fullOrder(a.order, code).join("\n") !== fullOrder(b.order, code).join("\n") ? 1 : 0;
  const ha = new Set(a.hidden ?? []);
  const hb = new Set(b.hidden ?? []);
  for (const id of new Set([...ha, ...hb])) if (ha.has(id) !== hb.has(id)) n++;
  if ((a.button ?? "") !== (b.button ?? "")) n++;
  const ia = a.images ?? {};
  const ib = b.images ?? {};
  for (const k of new Set([...Object.keys(ia), ...Object.keys(ib)])) if (ia[k]?.src !== ib[k]?.src) n++;
  return n;
}

/** The layout as saved: nothing the code does anyway. */
function toSave(l: Layout, code: string[]): Layout {
  const out: Layout = {};
  const order = fullOrder(l.order, code);
  if (order.join("\n") !== code.join("\n")) out.order = order;
  if (l.hidden?.length) out.hidden = l.hidden;
  if (l.button) out.button = l.button;
  if (l.images && Object.keys(l.images).length) out.images = l.images;
  return out;
}

export function TextsEditor({ funnel, page, lang, pages, langs, code, edited, liveUrl, frameSrc, sections, layout, buttonColours }: Props) {
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
  // The page's layout as it is now and as saved (lib/pageLayout.ts).
  const [draftLayout, setDraftLayout] = useState<Layout>(layout);
  const [savedLayout, setSavedLayout] = useState<Layout>(layout);
  // The picture clicked on the page, and the one being uploaded (its key).
  const [image, setImage] = useState<FrameImage | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const codeOrder = useMemo(() => sections.map((x) => x.id), [sections]);

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
    const layoutCount = layoutChanges(draftLayout, savedLayout, codeOrder);
    return { set, reset, layout: layoutCount > 0, count: Object.keys(set).length + reset.length + layoutCount };
  }, [draft, saved, code, draftLayout, savedLayout, codeOrder]);

  const q = query.trim().toLowerCase();
  const shown = q ? keys.filter((k) => plain(current(k)).toLowerCase().includes(q) || k.toLowerCase().includes(q)) : keys;
  const editedCount = keys.filter((k) => (draft[k] ?? saved[k] ?? code[k]) !== code[k]).length;
  const hiddenCount = draftLayout.hidden?.length ?? 0;
  const replaced = image ? draftLayout.images?.[image.key] : undefined;

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

  function setLayout(next: Layout) {
    setDraftLayout(next);
    setState("idle");
  }

  // A picture clicked on the page: the file to put in its place is asked for at once.
  function pickImage(img: FrameImage | null) {
    setImage(img);
    if (img && !uploading) fileInput.current?.click();
  }

  async function upload(file: File) {
    if (!image) return;
    const key = image.key;
    setUploading(key);
    setState("idle");
    setError("");
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("width", String(Math.round(image.width)));
      const res = await fetch(`/api/funnels/${funnel.id}/images`, { method: "POST", body });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Couldn't upload the picture.");
      setDraftLayout((l) => ({ ...l, images: { ...(l.images ?? {}), [key]: { src: data.src, w: data.w, h: data.h } } }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't upload the picture.");
      setState("error");
    } finally {
      setUploading(null);
    }
  }

  function putBackImage(key: string) {
    setDraftLayout((l) => {
      const images = { ...(l.images ?? {}) };
      delete images[key];
      return { ...l, images };
    });
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
      if (Object.keys(changes.set).length || changes.reset.length) {
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
      }
      if (changes.layout) {
        const wanted = toSave(draftLayout, codeOrder);
        const res = await fetch(`/api/funnels/${funnel.id}/layout`, {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ page, lang, layout: wanted }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error ?? "Couldn't save the layout.");
        setSavedLayout((data.layout as Layout | undefined) ?? wanted);
      }
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
          <span className={s.sub}>Edit page</span>
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

      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) upload(file);
        }}
      />

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
              {buttonColours && (
                <label className={s.pick} title="The colour of the page's buttons. One colour ends the test on this page: every visitor sees it, and the order page follows.">
                  <span>Button</span>
                  <select value={draftLayout.button ?? ""} onChange={(e) => setLayout({ ...draftLayout, button: e.target.value || undefined })}>
                    {BUTTONS.map(([v, label]) => (
                      <option key={v} value={v}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <div className={s.hint}>
                {image ? (
                  <>
                    <span className={s.key}>Picture{image.count > 1 ? ` · shows ${image.count} times on the page` : ""}</span>
                    {uploading === image.key ? (
                      <span>Uploading…</span>
                    ) : (
                      <>
                        {replaced && (
                          <button type="button" className={s.undo} onClick={() => putBackImage(image.key)} title="Show the code's picture again">
                            <I.refresh size={12} /> Put back the original
                          </button>
                        )}
                        <button type="button" className={s.undo} onClick={() => fileInput.current?.click()}>
                          {replaced ? "Choose another file" : "Choose a file"}
                        </button>
                        <span>Esc when done</span>
                      </>
                    )}
                  </>
                ) : selected ? (
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
                  <span>{sections.length ? "Click a text to change it, a picture to replace it. Hover a section for its bar: move it, hide it." : "Click a text on the page to change it."}</span>
                )}
                {hiddenCount > 0 && (
                  <span className={s.key}>
                    {hiddenCount} hidden section{hiddenCount > 1 ? "s" : ""}
                  </span>
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
            sections={sections}
            layout={draftLayout}
            onLayout={setLayout}
            onImage={pickImage}
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
