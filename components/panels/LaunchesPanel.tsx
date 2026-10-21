"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { I } from "@/components/icons";
import { KIT_HOME } from "@/lib/liveUrl";
import { PHASE_LABELS, STEP_LABELS, money, phaseAt, type Money, type Phase } from "@/lib/launch";
import type { DaySales, LaunchEmail, LaunchSummary } from "@/lib/products";
import c from "./launches.module.css";

// Dashboard → Launches: the launch playbook in one place.
//   create a product + its launch (prices, early-bird, real dates)
//   see the phase timeline, waitlist sign-ups and sales per day
//   upload the paid zips, open the page in the editor
//   edit the launch emails and their schedule
// Every date is real and enforced by the checkout's server (lib/launch.ts).

type Row = LaunchSummary & { waitlist: number | null };
type Detail = {
  launch: LaunchSummary;
  emails: LaunchEmail[];
  waitlist: number | null;
  sales: { days: DaySales[]; source: "stripe" | "none" };
};

const HOUR = 3600_000;

/** ISO → the value a datetime-local input wants, in this browser's time zone. */
function toLocal(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}
const fromLocal = (v: string) => (v ? new Date(v).toISOString() : "");

function when(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const prices = (m: Money) => `${money(m.eur, "eur")} / ${money(m.usd, "usd")}`;

function PhaseChip({ phase }: { phase: Phase }) {
  return <span className={`${c.chip} ${c[`chip_${phase}`]}`}>{PHASE_LABELS[phase]}</span>;
}

async function send<T>(url: string, method: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error ?? `Request failed (${res.status})`);
  return json as T;
}

export function LaunchesPanel() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const { launches } = await send<{ launches: Row[] }>("/api/launches", "GET");
      setRows(launches);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
      setRows([]);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const now = Date.now();
  return (
    <main className="main">
      <div className="page-head">
        <div>
          <h1 className="page-title">Launches</h1>
          <p className="page-sub">
            Waitlist → cart open at the early-bird price → full price. Real dates, enforced at checkout.
          </p>
        </div>
        <div className="cta-group">
          <button type="button" className="btn primary" onClick={() => setCreating((v) => !v)}>
            <I.rocket size={14} /> New launch
          </button>
        </div>
      </div>

      {error && <p className={c.error}>{error}</p>}

      {creating && (
        <NewLaunch
          onCancel={() => setCreating(false)}
          onCreated={async (id) => {
            setCreating(false);
            await load();
            setSelected(id);
          }}
        />
      )}

      {rows === null ? (
        <p className="page-sub">Loading…</p>
      ) : rows.length === 0 && !creating ? (
        <div className={c.panel}>
          <p className={c.h2}>No launches yet</p>
          <p className={c.sub}>
            Click New launch: name the product, set its prices and dates, and it gets a waitlist page, a sales page
            with checkout, and the launch email schedule.
          </p>
        </div>
      ) : (
        <div className={c.grid}>
          {rows.map((r) => (
            <button
              key={r.id}
              type="button"
              className={`${c.card} ${selected === r.id ? c.cardOn : ""}`}
              onClick={() => setSelected(selected === r.id ? null : r.id)}
            >
              <span className={c.cardName}>{r.product.name}</span>
              <span className={c.mono}>/{r.product.slug}</span>
              <PhaseChip phase={phaseAt(r.launch, now)} />
              <span className={c.mono}>
                Cart opens {when(r.launch.cartOpenAt)} · {r.waitlist ?? "—"} on the waitlist
              </span>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <LaunchDetail
          key={selected}
          id={selected}
          onChanged={load}
          onDeleted={async () => {
            setSelected(null);
            await load();
          }}
        />
      )}
    </main>
  );
}

// ─── new launch ────────────────────────────────────────────────

function defaults() {
  const open = new Date(Date.now() + 7 * 24 * HOUR);
  open.setHours(18, 0, 0, 0);
  const start = new Date();
  start.setMinutes(0, 0, 0);
  // Three days of early-bird, same clock time (stays 18:00 across a DST change).
  const end = new Date(open);
  end.setDate(end.getDate() + 3);
  return { waitlistAt: start.toISOString(), cartOpenAt: open.toISOString(), earlyBirdEndAt: end.toISOString() };
}

type Form = {
  name: string;
  slug: string;
  tagline: string;
  price: Money;
  early: Money;
  waitlistAt: string;
  cartOpenAt: string;
  earlyBirdEndAt: string;
  bumpOn: boolean;
  bump: { name: string; pitch: string; price: Money };
};

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);

function NewLaunch({ onCancel, onCreated }: { onCancel: () => void; onCreated: (id: string) => void }) {
  const [f, setF] = useState<Form>(() => ({
    name: "",
    slug: "",
    tagline: "",
    price: { eur: 27, usd: 27 },
    early: { eur: 19, usd: 19 },
    ...defaults(),
    bumpOn: false,
    bump: { name: "", pitch: "", price: { eur: 9, usd: 9 } },
  }));
  const [slugTouched, setSlugTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { launch } = await send<{ launch: LaunchSummary }>("/api/launches", "POST", {
        product: { slug: f.slug, name: f.name, tagline: f.tagline, price: f.price, bump: f.bumpOn ? f.bump : null },
        launch: { waitlistAt: f.waitlistAt, cartOpenAt: f.cartOpenAt, earlyBirdEndAt: f.earlyBirdEndAt, early: f.early },
      });
      onCreated(launch.id);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <form className={`${c.panel} ${c.form}`} onSubmit={submit}>
      <div>
        <p className={c.h2}>New launch</p>
        <p className={c.sub}>
          Creates the product, its page (waitlist + sales sections, editable in the editor) and the launch emails.
        </p>
      </div>
      <ProductFields
        value={f}
        onChange={(next) => setF((cur) => ({ ...cur, ...next, slug: slugTouched ? next.slug ?? cur.slug : slugify(next.name ?? cur.name) }))}
        slug={{ value: f.slug, onChange: (v) => (setSlugTouched(true), setF((cur) => ({ ...cur, slug: slugify(v) }))) }}
      />
      <LaunchFields value={f} onChange={(next) => setF((cur) => ({ ...cur, ...next }))} />
      {error && <p className={c.error}>{error}</p>}
      <div className={c.actions}>
        <button type="submit" className="btn primary" disabled={busy}>
          {busy ? "Creating…" : "Create launch"}
        </button>
        <button type="button" className="btn ghost" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}

type ProductForm = Pick<Form, "name" | "tagline" | "price" | "bumpOn" | "bump">;

function MoneyInputs({ label, value, onChange }: { label: string; value: Money; onChange: (m: Money) => void }) {
  return (
    <>
      {(["eur", "usd"] as const).map((cur) => (
        <label key={cur} className={c.field}>
          {label} {cur === "eur" ? "€" : "$"}
          <input
            className={c.input}
            type="number"
            min="0"
            step="0.01"
            required
            value={Number.isNaN(value[cur]) ? "" : value[cur]}
            onChange={(e) => onChange({ ...value, [cur]: e.target.valueAsNumber })}
          />
        </label>
      ))}
    </>
  );
}

function ProductFields({
  value: f,
  onChange,
  slug,
}: {
  value: ProductForm;
  onChange: (next: Partial<Form>) => void;
  slug?: { value: string; onChange: (v: string) => void };
}) {
  return (
    <>
      <p className={c.legend}>Product</p>
      <div className={c.row}>
        <label className={c.field}>
          Name
          <input className={c.input} required value={f.name} placeholder="Neo Soul MIDI Pack" onChange={(e) => onChange({ name: e.target.value })} />
        </label>
        {slug && (
          <label className={c.field}>
            URL: {KIT_HOME.replace("https://", "")}/{slug.value || "…"}
            <input className={c.input} required value={slug.value} onChange={(e) => slug.onChange(e.target.value)} />
          </label>
        )}
      </div>
      <label className={c.field}>
        Tagline (one line, on the box and under the headline)
        <input className={c.input} value={f.tagline} onChange={(e) => onChange({ tagline: e.target.value })} />
      </label>
      <div className={c.row}>
        <MoneyInputs label="Full price" value={f.price} onChange={(price) => onChange({ price })} />
      </div>
      <label className={c.field} style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input type="checkbox" checked={f.bumpOn} onChange={(e) => onChange({ bumpOn: e.target.checked })} />
        Add-on in the checkout (order bump)
      </label>
      {f.bumpOn && (
        <>
          <div className={c.row}>
            <label className={c.field}>
              Add-on name
              <input className={c.input} required value={f.bump.name} onChange={(e) => onChange({ bump: { ...f.bump, name: e.target.value } })} />
            </label>
            <MoneyInputs label="Add-on" value={f.bump.price} onChange={(price) => onChange({ bump: { ...f.bump, price } })} />
          </div>
          <label className={c.field}>
            Add-on pitch (&ldquo;Lead sentence: the rest.&rdquo; — the lead goes bold)
            <textarea className={c.textarea} style={{ minHeight: 70 }} value={f.bump.pitch} onChange={(e) => onChange({ bump: { ...f.bump, pitch: e.target.value } })} />
          </label>
        </>
      )}
    </>
  );
}

type LaunchForm = Pick<Form, "early" | "waitlistAt" | "cartOpenAt" | "earlyBirdEndAt">;

function LaunchFields({ value: f, onChange }: { value: LaunchForm; onChange: (next: Partial<LaunchForm>) => void }) {
  const date = (key: "waitlistAt" | "cartOpenAt" | "earlyBirdEndAt", label: string) => (
    <label className={c.field}>
      {label}
      <input className={c.input} type="datetime-local" required value={toLocal(f[key])} onChange={(e) => onChange({ [key]: fromLocal(e.target.value) })} />
    </label>
  );
  const hours = Math.round((Date.parse(f.earlyBirdEndAt) - Date.parse(f.cartOpenAt)) / HOUR);
  return (
    <>
      <p className={c.legend}>Launch (your time zone)</p>
      <div className={c.row}>
        {date("waitlistAt", "Waitlist starts")}
        {date("cartOpenAt", "Cart opens")}
        {date("earlyBirdEndAt", `Early-bird ends${hours > 0 ? ` (${hours} h)` : ""}`)}
      </div>
      <div className={c.row}>
        <MoneyInputs label="Early-bird" value={f.early} onChange={(early) => onChange({ early })} />
      </div>
    </>
  );
}

// ─── one launch ────────────────────────────────────────────────

function LaunchDetail({ id, onChanged, onDeleted }: { id: string; onChanged: () => void; onDeleted: () => void }) {
  const [d, setD] = useState<Detail | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setD(await send<Detail>(`/api/launches/${id}`, "GET"));
    } catch (err) {
      setError((err as Error).message);
    }
  }, [id]);
  useEffect(() => {
    load();
  }, [load]);

  if (error) return <p className={c.error}>{error}</p>;
  if (!d) return <p className="page-sub">Loading launch…</p>;
  const { launch: l, emails, waitlist, sales } = d;
  const slug = l.product.slug;
  const orders = sales.days.reduce((n, x) => n + x.orders, 0);
  const eur = sales.days.reduce((n, x) => n + x.eur, 0);
  const usd = sales.days.reduce((n, x) => n + x.usd, 0);

  return (
    <>
      <div className={c.panel}>
        <div className={c.panelHead}>
          <div>
            <p className={c.h2}>{l.product.name}</p>
            <p className={c.sub}>
              {KIT_HOME.replace("https://", "")}/{slug} · <PhaseChip phase={phaseAt(l.launch, Date.now())} />
            </p>
          </div>
          <div className={c.links}>
            <Link href={`/funnels/${slug}/edit`} className="btn ghost">
              Edit page
            </Link>
            <a href={`/${slug}`} target="_blank" rel="noopener" className="btn ghost">
              Preview here <I.arrow size={12} />
            </a>
            <a href={`${KIT_HOME}/${slug}`} target="_blank" rel="noopener" className="btn ghost">
              Live URL <I.globe size={12} />
            </a>
          </div>
        </div>
        <Timeline l={l} />
      </div>

      <div className={c.stats}>
        <Stat label="WAITLIST" value={waitlist ?? "—"} />
        <Stat label="ORDERS (CARD)" value={sales.source === "none" ? "—" : orders} />
        <Stat label="REVENUE €" value={sales.source === "none" ? "—" : money(Math.round(eur * 100) / 100, "eur")} />
        <Stat label="REVENUE $" value={sales.source === "none" ? "—" : money(Math.round(usd * 100) / 100, "usd")} />
      </div>

      <div className={c.panel}>
        <p className={c.h2}>Sales per day</p>
        {sales.source === "none" ? (
          <p className={c.sub}>Stripe isn&rsquo;t connected on this deployment, so there are no sales to show.</p>
        ) : sales.days.length === 0 ? (
          <p className={c.sub}>No sales yet.</p>
        ) : (
          <SalesBars days={sales.days} />
        )}
        <p className={c.note} style={{ marginTop: 10 }}>
          Card payments from Stripe, by UTC day. PayPal sales show up here once orders are stored in the database.
        </p>
      </div>

      <Settings
        l={l}
        onSaved={async (next) => {
          setD((cur) => (cur ? { ...cur, ...next } : cur));
          onChanged();
        }}
      />
      <Files l={l} onSaved={load} />
      <Emails launchId={id} emails={emails} onSaved={(email) => setD((cur) => cur && { ...cur, emails: cur.emails.map((x) => (x.id === email.id ? email : x)) })} />
      <Danger l={l} onDeleted={onDeleted} />
    </>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className={c.stat}>
      <div className={c.statLabel}>{label}</div>
      <div className={c.statValue}>{value}</div>
    </div>
  );
}

function Timeline({ l }: { l: LaunchSummary }) {
  const t = [l.launch.waitlistAt, l.launch.cartOpenAt, l.launch.earlyBirdEndAt].map((x) => Date.parse(x));
  const now = Date.now();
  // The waitlist and the early-bird take the bar's width in proportion; full price is open-ended.
  const span = Math.max(t[2] - t[0], 1);
  const w = (a: number, b: number) => `${Math.max(((b - a) / span) * 78, 12)}%`;
  const nowAt = now < t[0] ? 0 : now > t[2] ? null : ((now - t[0]) / span) * 78;
  return (
    <>
      <div className={c.timeline}>
        <div className={`${c.seg} ${c.seg_waitlist}`} style={{ width: w(t[0], t[1]) }}>
          <b>Waitlist</b>
          <span>sign-ups</span>
        </div>
        <div className={`${c.seg} ${c.seg_early}`} style={{ width: w(t[1], t[2]) }}>
          <b>Early-bird</b>
          <span>{prices(l.launch.early)}</span>
        </div>
        <div className={`${c.seg} ${c.seg_open}`}>
          <b>Full price</b>
          <span>{prices(l.product.price)}</span>
        </div>
        {nowAt !== null && <span className={c.now} style={{ left: `${nowAt}%` }} title="Now" />}
      </div>
      <div className={c.dates}>
        <span>
          Waitlist starts <b>{when(l.launch.waitlistAt)}</b>
        </span>
        <span>
          Cart opens <b>{when(l.launch.cartOpenAt)}</b>
        </span>
        <span>
          Early-bird ends <b>{when(l.launch.earlyBirdEndAt)}</b>
        </span>
      </div>
    </>
  );
}

function SalesBars({ days }: { days: DaySales[] }) {
  const max = Math.max(...days.map((d) => d.orders), 1);
  return (
    <div className={c.bars} style={{ marginTop: 10 }}>
      {days.map((d) => (
        <div key={d.day} className={c.barRow}>
          <span className={c.mono}>{d.day}</span>
          <span className={c.barTrack}>
            <span className={c.barFill} style={{ display: "block", width: `${(d.orders / max) * 100}%` }} />
          </span>
          <span className={c.mono}>
            {d.orders} · {money(Math.round(d.eur * 100) / 100, "eur")} · {money(Math.round(d.usd * 100) / 100, "usd")}
          </span>
        </div>
      ))}
    </div>
  );
}

function Settings({ l, onSaved }: { l: LaunchSummary; onSaved: (next: Pick<Detail, "launch" | "emails">) => void }) {
  const initial = useMemo(
    () => ({
      name: l.product.name,
      tagline: l.product.tagline,
      price: l.product.price,
      bumpOn: Boolean(l.product.bump),
      bump: l.product.bump
        ? { name: l.product.bump.name, pitch: l.product.bump.pitch, price: l.product.bump.price }
        : { name: "", pitch: "", price: { eur: 9, usd: 9 } },
      early: l.launch.early,
      waitlistAt: l.launch.waitlistAt,
      cartOpenAt: l.launch.cartOpenAt,
      earlyBirdEndAt: l.launch.earlyBirdEndAt,
    }),
    [l],
  );
  const [f, setF] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const next = await send<Pick<Detail, "launch" | "emails">>(`/api/launches/${l.id}`, "PATCH", {
        product: { name: f.name, tagline: f.tagline, price: f.price, bump: f.bumpOn ? f.bump : null },
        launch: { waitlistAt: f.waitlistAt, cartOpenAt: f.cartOpenAt, earlyBirdEndAt: f.earlyBirdEndAt, early: f.early },
      });
      onSaved(next);
      setMsg({ ok: true, text: "Saved. The page and the checkout use the new values now." });
    } catch (err) {
      setMsg({ ok: false, text: (err as Error).message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className={`${c.panel} ${c.form}`} onSubmit={save}>
      <p className={c.h2}>Product &amp; dates</p>
      <ProductFields value={f} onChange={(next) => setF((cur) => ({ ...cur, ...next }))} />
      <LaunchFields value={f} onChange={(next) => setF((cur) => ({ ...cur, ...next }))} />
      <p className={c.note}>Changing a date moves the launch emails that haven&rsquo;t been sent along with it.</p>
      <div className={c.actions}>
        <button type="submit" className="btn primary" disabled={busy}>
          {busy ? "Saving…" : "Save"}
        </button>
        {msg && <span className={msg.ok ? c.ok : c.error}>{msg.text}</span>}
      </div>
    </form>
  );
}

function Files({ l, onSaved }: { l: LaunchSummary; onSaved: () => void }) {
  const items = [
    { key: "pack", label: l.product.name },
    ...(l.product.bump ? [{ key: l.product.bump.id, label: `${l.product.bump.name} (add-on)` }] : []),
  ];
  return (
    <div className={c.panel}>
      <p className={c.h2}>Paid files</p>
      <p className={c.sub} style={{ marginBottom: 12 }}>
        Zips go to a private bucket. Buyers get a 60-second download link on the thank-you page, only after Stripe or
        PayPal confirms the payment. Max 50 MB per file on the current Supabase plan.
      </p>
      <div className={c.files}>
        {items.map((it) => (
          <FileRow key={it.key} launchId={l.id} k={it.key} label={it.label} current={l.product.files[it.key]} onSaved={onSaved} />
        ))}
      </div>
    </div>
  );
}

function FileRow({ launchId, k, label, current, onSaved }: { launchId: string; k: string; label: string; current?: string; onSaved: () => void }) {
  const [state, setState] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File) {
    setError(null);
    setState(`Uploading ${file.name}…`);
    try {
      const target = await send<{ path: string; signedUrl: string }>(`/api/launches/${launchId}/files`, "POST", { key: k, filename: file.name });
      const put = await fetch(target.signedUrl, {
        method: "PUT",
        headers: { "content-type": "application/zip", "x-upsert": "true" },
        body: file,
      });
      if (!put.ok) {
        const j = await put.json().catch(() => ({}));
        throw new Error(j.message ?? j.error ?? `Upload failed (${put.status})`);
      }
      await send(`/api/launches/${launchId}/files`, "PUT", { key: k, path: target.path });
      setState(null);
      onSaved();
    } catch (err) {
      setError((err as Error).message);
      setState(null);
    }
  }

  return (
    <div className={c.fileRow}>
      <div>
        <div>{label}</div>
        <div className={c.mono}>{state ?? (current ? current.split("/").pop() : "No file yet: buyers would get an error")}</div>
        {error && <div className={c.error}>{error}</div>}
      </div>
      <label className="btn ghost" style={{ cursor: "pointer" }}>
        {current ? "Replace .zip" : "Upload .zip"}
        <input
          type="file"
          accept=".zip,application/zip"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) upload(file);
          }}
        />
      </label>
    </div>
  );
}

function Emails({ launchId, emails, onSaved }: { launchId: string; emails: LaunchEmail[]; onSaved: (e: LaunchEmail) => void }) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div className={c.panel}>
      <p className={c.h2}>Launch emails</p>
      <p className={c.sub} style={{ marginBottom: 12 }}>
        The playbook in order: waitlist teasers → cart is open → proof → early-bird ends tonight → last hours. From
        cart-open on, buyers of this product are left out.
      </p>
      <p className={c.notice}>
        A &ldquo;Scheduled&rdquo; email goes out at its time through Amazon SES (dashboard &rarr; Broadcasts sends the same way), to subscribed contacts with its tag. Keep it a draft until the copy is final.
      </p>
      <div className={c.emails}>
        {emails.map((e) => (
          <div key={e.id} className={c.email}>
            <button type="button" className={c.emailRow} onClick={() => setOpen(open === e.id ? null : e.id)}>
              <span className={c.mono}>{when(e.sendAt)}</span>
              <span>{STEP_LABELS[e.step] ?? e.step}</span>
              <span className={c.subject}>{e.subject}</span>
              <span className={c.chip}>{e.status}</span>
            </button>
            {open === e.id && <EmailEditor launchId={launchId} email={e} onSaved={onSaved} />}
          </div>
        ))}
      </div>
    </div>
  );
}

function EmailEditor({ launchId, email, onSaved }: { launchId: string; email: LaunchEmail; onSaved: (e: LaunchEmail) => void }) {
  const [f, setF] = useState({ subject: email.subject, body: email.body, audienceTag: email.audienceTag, sendAt: email.sendAt, status: email.status });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const locked = email.status === "sent" || email.status === "sending";

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const { email: next } = await send<{ email: LaunchEmail }>(`/api/launches/${launchId}/emails/${email.id}`, "PATCH", f);
      onSaved(next);
      setMsg({ ok: true, text: "Saved." });
    } catch (err) {
      setMsg({ ok: false, text: (err as Error).message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className={`${c.form} ${c.emailEdit}`} onSubmit={save}>
      <div className={c.row}>
        <label className={c.field}>
          Send at (your time zone)
          <input className={c.input} type="datetime-local" disabled={locked} value={toLocal(f.sendAt)} onChange={(e) => setF({ ...f, sendAt: fromLocal(e.target.value) })} />
        </label>
        <label className={c.field}>
          To contacts tagged
          <input className={c.input} disabled={locked} value={f.audienceTag} onChange={(e) => setF({ ...f, audienceTag: e.target.value })} />
        </label>
        <label className={c.field}>
          Status
          <select className={c.select} disabled={locked} value={f.status} onChange={(e) => setF({ ...f, status: e.target.value as LaunchEmail["status"] })}>
            <option value="draft">Draft</option>
            <option value="scheduled">Scheduled</option>
            <option value="skipped">Skip</option>
          </select>
        </label>
      </div>
      <label className={c.field}>
        Subject
        <input className={c.input} disabled={locked} value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value })} />
      </label>
      <label className={c.field}>
        Body (plain text; {"{name} {earlyprice} {fullprice} {cartopen} {deadline} {link}"} are filled in when sending)
        <textarea className={c.textarea} disabled={locked} value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} />
      </label>
      {email.excludeTag && <p className={c.note}>Leaves out contacts tagged {email.excludeTag}.</p>}
      {!locked && (
        <div className={c.actions}>
          <button type="submit" className="btn primary" disabled={busy}>
            {busy ? "Saving…" : "Save email"}
          </button>
          {msg && <span className={msg.ok ? c.ok : c.error}>{msg.text}</span>}
        </div>
      )}
    </form>
  );
}

function Danger({ l, onDeleted }: { l: LaunchSummary; onDeleted: () => void }) {
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  return (
    <div className={c.panel}>
      <p className={c.h2}>Delete product</p>
      <p className={c.sub} style={{ marginBottom: 12 }}>
        Removes {l.product.name}, its launch, emails, page and uploaded zips. Contacts stay. Only for test products and
        launches that never happened: buyers&rsquo; download links stop working.
      </p>
      {confirm ? (
        <div className={c.actions}>
          <button
            type="button"
            className={`btn ghost ${c.danger}`}
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              await send(`/api/launches/${l.id}`, "DELETE").catch(() => {});
              onDeleted();
            }}
          >
            <I.trash size={13} /> {busy ? "Deleting…" : "Delete forever"}
          </button>
          <button type="button" className="btn ghost" onClick={() => setConfirm(false)}>
            Cancel
          </button>
        </div>
      ) : (
        <button type="button" className={`btn ghost ${c.danger}`} onClick={() => setConfirm(true)}>
          Delete…
        </button>
      )}
    </div>
  );
}
