"use client";

import { useCallback, useEffect, useState } from "react";
import { I } from "@/components/icons";
import type { Sequence, SequenceStep } from "@/lib/sequences";
import e from "./email.module.css";
import { FormatHelp, Preview, TagSelect, euros, useAudience, useEmailResults } from "./emailShared";

// Dashboard → Automations: the emails that send themselves.
//   Built in: the receipt after every order, the abandoned-checkout reminder.
//   Sequences: someone gets a tag (a checkout, a purchase, a form) → email 1,
//   then email 2 some hours later… until the end, or the exit tag.
// The database starts them (db/email.sql), lib/outbox.ts sends them.

async function call<T>(url: string, method = "GET", body?: unknown): Promise<T> {
  const r = await fetch(url, { method, cache: "no-store", headers: body ? { "content-type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error ?? `HTTP ${r.status}`);
  return d as T;
}

const BUILT_IN = [
  {
    id: null,
    name: "Receipt with the downloads",
    when: "5 minutes after every paid order, with the upsells bought right after it",
    detail: "In the buyer's language (EN, FR, ES, DE, IT). The links don't expire.",
  },
  {
    id: "reminder", // its numbers in dashboard → Email → Insights
    name: "Abandoned checkout",
    when: "after someone types their email at checkout and doesn't pay: MIDI Drum Kit 3 emails (15 min, then 6 h, then 18 h later), the other products 1 email after an hour",
    detail: "In their language, stopped as soon as they buy, never to an unsubscribed contact, given up after 3 days. The Drum Kit's words are ClickFunnels' (lib/abandonCopy.ts).",
  },
];

const LANG_NAMES: Record<string, string> = { en: "English", fr: "French", es: "Spanish", de: "German", it: "Italian" };

const delayLabel = (h: number) => (h === 0 ? "right away" : h % 24 === 0 ? `${h / 24} day${h === 24 ? "" : "s"} later` : `${h} hour${h === 1 ? "" : "s"} later`);

export function AutomationsPanel() {
  const [list, setList] = useState<Sequence[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<Sequence | "new" | null>(null);
  // Orders and revenue per sequence and for the reminder, all time (dashboard → Email → Insights).
  const results = useEmailResults();
  const sold = (id: string) => {
    const r = results.get(id);
    return r && r.clicked.orders + r.clicked.upsells > 0 ? `${euros(r.clicked.revenue)} from ${r.clicked.orders + r.clicked.upsells} order${r.clicked.orders + r.clicked.upsells === 1 ? "" : "s"}` : null;
  };

  const load = useCallback(async () => {
    try {
      setList((await call<{ sequences: Sequence[] }>("/api/sequences")).sequences);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  if (open) {
    return (
      <Editor
        s={open === "new" ? null : open}
        onDone={() => {
          setOpen(null);
          load();
        }}
      />
    );
  }

  return (
    <main className="main">
      <div className="page-head">
        <div>
          <h1 className="page-title">Automations</h1>
          <p className="page-sub">Emails that send themselves when someone buys, starts a checkout or gets a tag.</p>
        </div>
        <div className="cta-group">
          <button type="button" className="btn primary" onClick={() => setOpen("new")}>
            <I.plus size={14} /> New sequence
          </button>
        </div>
      </div>

      <div className={e.panel}>
        <div className={e.panelHead}>
          <h2 className={e.h2}>Always on</h2>
        </div>
        {BUILT_IN.map((b) => (
          <div key={b.name} className={e.step}>
            <div className={e.stepHead}>
              <span className={`${e.chip} ${e.chip_on}`}>on</span>
              <b>{b.name}</b>
              <span className={e.dim}>· {b.when}</span>
              {b.id && sold(b.id) && <span className={e.mono}>· {sold(b.id)}</span>}
            </div>
            <div className={e.hint} style={{ margin: 0 }}>
              {b.detail}
            </div>
          </div>
        ))}
      </div>

      <div className={e.panel}>
        <div className={e.panelHead}>
          <h2 className={e.h2}>Sequences</h2>
        </div>
        {!loading && list.length === 0 && <p className={e.hint}>None yet. A welcome series for new contacts, or a follow-up after a purchase, starts here.</p>}
        {list.map((s) => (
          <button key={s.id} type="button" className={e.rowButton} style={{ gridTemplateColumns: "60px minmax(0,2fr) minmax(0,1.4fr) 90px 160px 150px", borderRadius: "var(--radius-sm)" }} onClick={() => setOpen(s)}>
            <span className={`${e.chip} ${s.active ? e.chip_on : ""}`}>{s.active ? "on" : "off"}</span>
            <span className={`${e.cell} ${e.strong}`}>{s.name}</span>
            <span className={`${e.cell} ${e.dim}`}>
              when tagged {s.triggerTag}
              {s.lang ? ` · ${LANG_NAMES[s.lang] ?? s.lang} contacts` : ""}
              {s.exitTag ? ` · stops at ${s.exitTag}` : ""}
            </span>
            <span className={e.mono}>
              {s.steps.length} email{s.steps.length === 1 ? "" : "s"}
            </span>
            <span className={e.mono}>
              {s.running} in · {s.finished} done
            </span>
            <span className={e.mono}>{sold(s.id) ?? "—"}</span>
          </button>
        ))}
      </div>
    </main>
  );
}

function Editor({ s, onDone }: { s: Sequence | null; onDone: () => void }) {
  const [f, setF] = useState({
    name: s?.name ?? "",
    triggerTag: s?.triggerTag ?? "",
    exitTag: s?.exitTag ?? "",
    lang: s?.lang ?? "",
    active: s?.active ?? false,
    steps: s?.steps.length ? s.steps : ([{ delayHours: 0, subject: "", body: "" }] as SequenceStep[]),
  });
  const [openStep, setOpenStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const { tags } = useAudience(null, null);
  const step = f.steps[openStep];

  const setStep = (i: number, patch: Partial<SequenceStep>) => setF((x) => ({ ...x, steps: x.steps.map((st, j) => (j === i ? { ...st, ...patch } : st)) }));

  async function save(active = f.active) {
    setBusy(true);
    setError("");
    try {
      const body = { ...f, active, exitTag: f.exitTag || null, lang: f.lang || null };
      if (s) await call(`/api/sequences/${s.id}`, "PUT", body);
      else await call("/api/sequences", "POST", body);
      onDone();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="main">
      <div className="page-head">
        <div>
          <button type="button" className="btn ghost" onClick={onDone} style={{ marginBottom: 10 }}>
            ← Automations
          </button>
          <h1 className="page-title">{f.name || "New sequence"}</h1>
          <p className="page-sub">
            {s ? `${s.running} contacts in it now · ${s.finished} finished` : "Starts for everyone who gets the tag from the moment it's switched on (not for people who had it before)."}
          </p>
        </div>
        <div className="cta-group">
          {s && (
            <button
              type="button"
              className="btn ghost"
              onClick={async () => {
                if (!window.confirm("Delete this sequence? People in it stop getting its emails.")) return;
                await call(`/api/sequences/${s.id}`, "DELETE");
                onDone();
              }}
            >
              <I.trash size={14} /> Delete
            </button>
          )}
        </div>
      </div>

      <div className={e.panel}>
        <div className={e.fields}>
          <label className={e.label}>
            Name
            <input className={e.input} value={f.name} onChange={(ev) => setF({ ...f, name: ev.target.value })} placeholder="Welcome series" />
          </label>
          <label className={e.label}>
            Starts when a contact gets the tag
            <input className={e.input} list="seq-tags" value={f.triggerTag} onChange={(ev) => setF({ ...f, triggerTag: ev.target.value })} placeholder="buyer" />
          </label>
          <label className={e.label}>
            Stops when they get the tag (optional)
            <TagSelect value={f.exitTag || null} onChange={(v) => setF({ ...f, exitTag: v ?? "" })} tags={tags} none="Never stops early" />
          </label>
          <label className={e.label}>
            For contacts in
            <select className={e.input} value={f.lang} onChange={(ev) => setF({ ...f, lang: ev.target.value })}>
              <option value="">Every language</option>
              {Object.keys(LANG_NAMES).map((l) => (
                <option key={l} value={l}>
                  {LANG_NAMES[l]}
                </option>
              ))}
            </select>
          </label>
        </div>
        <datalist id="seq-tags">
          {tags.map((t) => (
            <option key={t.tag} value={t.tag} />
          ))}
        </datalist>
      </div>

      <div className={e.editor}>
        <div className={e.panel}>
          {f.steps.map((st, i) => (
            <div key={st.id ?? `new-${i}`} className={e.step} style={i === openStep ? { borderColor: "var(--accent-dim)" } : undefined}>
              <div className={e.stepHead}>
                <b>Email {i + 1}</b>
                <input
                  className={`${e.input} ${e.delay}`}
                  type="number"
                  min={0}
                  value={st.delayHours}
                  onChange={(ev) => setStep(i, { delayHours: Math.max(0, Number(ev.target.value) || 0) })}
                />
                <span className={e.dim}>hours {i === 0 ? "after the tag" : "after the email before"} ({delayLabel(st.delayHours)})</span>
                <span style={{ flex: 1 }} />
                {i !== openStep && (
                  <button type="button" className="btn ghost" onClick={() => setOpenStep(i)}>
                    Edit
                  </button>
                )}
                {f.steps.length > 1 && (
                  <button
                    type="button"
                    className="icon-btn"
                    title="Remove"
                    onClick={() => {
                      setF({ ...f, steps: f.steps.filter((_, j) => j !== i) });
                      setOpenStep(0);
                    }}
                  >
                    <I.trash size={13} />
                  </button>
                )}
              </div>
              {i === openStep ? (
                <>
                  <input className={e.input} style={{ width: "100%", marginBottom: 10 }} placeholder="Subject" value={st.subject} onChange={(ev) => setStep(i, { subject: ev.target.value })} />
                  <textarea className={e.stepTextarea} value={st.body} onChange={(ev) => setStep(i, { body: ev.target.value })} placeholder={"Hey {first_name},\n\n…"} />
                </>
              ) : (
                <div className={e.dim} style={{ fontSize: 13 }}>
                  {st.subject || "No subject yet"}
                </div>
              )}
            </div>
          ))}
          <button
            type="button"
            className="btn"
            onClick={() => {
              setF({ ...f, steps: [...f.steps, { delayHours: 24, subject: "", body: "" }] });
              setOpenStep(f.steps.length);
            }}
          >
            <I.plus size={13} /> Add an email
          </button>
          <FormatHelp />
          <div className={e.actions} style={{ marginTop: 16 }}>
            <button type="button" className="btn" disabled={busy} onClick={() => save()}>
              Save
            </button>
            {f.active ? (
              <button type="button" className="btn" disabled={busy} onClick={() => save(false)}>
                Save and switch off
              </button>
            ) : (
              <button type="button" className="btn primary" disabled={busy} onClick={() => save(true)}>
                Save and switch on
              </button>
            )}
          </div>
          {error && <p className={e.error}>{error}</p>}
        </div>
        <div className={e.panel}>
          <div className={e.panelHead}>
            <h2 className={e.h2}>Preview · email {openStep + 1}</h2>
          </div>
          {step && <Preview subject={step.subject} body={step.body} />}
        </div>
      </div>
    </main>
  );
}
