"use client";

import { memo, useEffect, useMemo, useRef, useState } from "react";
import { previewUrl } from "@/components/FunnelLanes";
import { I } from "@/components/icons";
import { ASTRO_FUNNEL, ME_PATH, STEPS } from "@/lib/beacon";
import type { Live, LiveEvent, LiveVisitor } from "@/lib/live";
import { KIT_HOME } from "@/lib/liveUrl";
import { landPath, MAP_COLS, MAP_ROWS, project } from "@/lib/worldDots";
import s from "./live.module.css";
import { VisitorStats } from "./VisitorStats";

// Dashboard → Live. From /api/live (lib/live.ts), asked every 5 s while this
// panel is open and the tab is in front: who is on a buyer page right now,
// where they are, which page, and what just happened.

const POLL_MS = 5_000;
// Where the funnel pages are, so the "don't count me" setting lands in their storage (app/api/checkout/me).
const ME_URL = `${KIT_HOME}${ME_PATH}`;

const STEP_LABEL: Record<string, string> = {
  landing: "Sales page",
  order: "Order page",
  checkout: "Checkout",
  "upsell-1": "Upsell 1",
  "upsell-2": "Upsell 2",
  "thank-you": "Thank-you page",
};

function pageLabel(funnel: string, page: string, path = "") {
  if (funnel === ASTRO_FUNNEL) return path || "/";
  if (funnel === "shop" && page === "landing") return !path || /^\/shop\/?$/.test(path) ? "Shop" : "Product page";
  if (funnel === "shop" && page === "order") return "Cart";
  return STEP_LABEL[page] ?? page;
}

// A page they're on, opened from here: in a new tab, not counted as a visit (?preview=1).
function PageLink({ url, children }: { url: string; children: React.ReactNode }) {
  if (!url) return <>{children}</>;
  return (
    <a className={s.link} href={previewUrl(url)} target="_blank" rel="noreferrer" title={url}>
      {children}
    </a>
  );
}

const flag = (cc: string) => (/^[A-Z]{2}$/.test(cc) ? String.fromCodePoint(...[...cc].map((c) => 0x1f1a5 + c.charCodeAt(0))) : "");

let regions: Intl.DisplayNames | null | undefined;
function countryName(cc: string) {
  if (!cc) return "";
  if (regions === undefined) {
    try {
      regions = new Intl.DisplayNames(["en"], { type: "region" });
    } catch {
      regions = null;
    }
  }
  try {
    return regions?.of(cc) ?? cc;
  } catch {
    return cc;
  }
}

const place = (city: string, country: string) => (city ? `${city}, ${countryName(country)}` : countryName(country) || "Somewhere");

const money = (n: number, currency: string) =>
  new Intl.NumberFormat(currency === "usd" ? "en-US" : "en-IE", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: n % 1 ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(n);

function span(ms: number) {
  const sec = Math.max(0, Math.floor(ms / 1000));
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ${String(sec % 60).padStart(2, "0")}s`;
  return `${Math.floor(min / 60)}h ${min % 60}m`;
}

function ago(ms: number) {
  const sec = Math.max(0, Math.floor(ms / 1000));
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  return min < 60 ? `${min}m ago` : `${Math.floor(min / 60)}h ${min % 60}m ago`;
}

const clock = (at: string) => new Date(at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

const midnight = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
};

export function LivePanel() {
  const [data, setData] = useState<Live | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fresh, setFresh] = useState<Set<string>>(new Set());
  const [now, setNow] = useState(() => Date.now());
  const skew = useRef(0); // server clock − this computer's
  const seen = useRef<Set<string> | null>(null);

  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout>;
    const load = async () => {
      if (document.visibilityState === "visible") {
        try {
          const r = await fetch(`/api/live?day=${encodeURIComponent(midnight())}`, { cache: "no-store" });
          if (!r.ok) throw new Error(`Live activity didn't load (${r.status}).`);
          const d = (await r.json()) as Live;
          if (!alive) return;
          skew.current = Date.parse(d.at) - Date.now();
          const ids = d.events.map((e) => e.id);
          const known = seen.current;
          setFresh(new Set(known ? ids.filter((id) => !known.has(id)) : []));
          seen.current = new Set([...(known ?? []), ...ids]);
          setData(d);
          setError(null);
        } catch (e) {
          if (alive) setError((e as Error).message);
        }
      }
      if (alive) timer = setTimeout(load, POLL_MS);
    };
    load();
    const tick = setInterval(() => setNow(Date.now() + skew.current), 1000);
    return () => {
      alive = false;
      clearTimeout(timer);
      clearInterval(tick);
    };
  }, []);

  const visitors = data?.visitors ?? [];
  const active = visitors.filter((v) => v.active);
  const sorted = useMemo(
    () => [
      ...visitors.filter((v) => v.active).sort((a, b) => Date.parse(b.since) - Date.parse(a.since)),
      ...visitors.filter((v) => !v.active).sort((a, b) => Date.parse(b.lastSeen) - Date.parse(a.lastSeen)),
    ],
    [visitors],
  );
  const pages = visitors.reduce((n, v) => n + v.views, 0);
  const fromStart = data?.since ? now - Date.parse(data.since) : 0;
  const updated = data ? now - Date.parse(data.at) : 0;

  return (
    <main className="main">
      <div className="page-head">
        <div>
          <h1 className="page-title">Live</h1>
          <p className="page-sub">Who&apos;s on your pages right now, where they are and what they do. Updates every 5 seconds.</p>
        </div>
        <div className={s.status}>
          <span className={`${s.liveBadge} ${error ? s.off : ""}`}>
            <span className={s.liveDot} />
            {error ? "RECONNECTING" : "LIVE"}
          </span>
          {data && <span className={s.updated}>updated {updated < 2000 ? "just now" : ago(updated)}</span>}
        </div>
      </div>

      {error && <div className={`${s.notice} ${s.bad}`}>{error}</div>}
      {data?.errors.map((e) => (
        <div key={e} className={`${s.notice} ${s.bad}`}>
          Couldn&apos;t read {e}
        </div>
      ))}
      {data && (!data.since || fromStart < 24 * 3600_000) && (
        <div className={s.notice}>
          <I.pulse size={14} />
          {data.since
            ? `Live visits are recorded since ${new Date(data.since).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}: nothing from before then is here.`
            : "No live visits recorded yet: they show up here as soon as someone opens a funnel page."}
        </div>
      )}

      <div className={`stats ${s.stats}`}>
        <Stat label="ON A PAGE NOW" value={data ? String(active.length) : "…"} color="var(--mint)" live={active.length > 0} />
        <Stat label="LAST 30 MIN" value={data ? String(visitors.length) : "…"} sub={data && visitors.length ? `${pages} page${pages === 1 ? "" : "s"}` : ""} color="var(--sky)" />
        <Stat label="CHECKOUTS TODAY" value={data ? String(data.today.checkouts) : "…"} color="var(--amber)" />
        <Stat
          label="ORDERS TODAY"
          value={data ? String(data.today.orders) : "…"}
          sub={data && data.today.revenue > 0 ? money(Math.round(data.today.revenue), "eur") : ""}
          color="var(--accent)"
        />
      </div>

      {/* What just happened comes first, beside where they are and which page. */}
      <div className={s.grid}>
        <section className={`${s.card} ${s.activity}`}>
          <div className={s.cardHead}>
            <div className={s.cardTitle}>
              Activity
              {fresh.size > 0 && <span className={s.count}>+{fresh.size} new</span>}
            </div>
            <div className={s.cardSub}>last 24 hours</div>
          </div>
          {!data ? (
            <div className={s.empty}>Loading…</div>
          ) : data.events.length === 0 ? (
            <div className={s.empty}>Nothing in the last 24 hours.</div>
          ) : (
            <ol className={s.stream}>
              {data.events.map((e, i) => {
                // Events from before today's midnight come under a "Yesterday" line.
                const day = new Date(e.at).toDateString();
                const split = day !== new Date(now).toDateString() && (i === 0 || new Date(data.events[i - 1].at).toDateString() !== day);
                return [
                  split && (
                    <li key={`day-${day}`} className={s.day}>
                      Yesterday
                    </li>
                  ),
                  <EventRow key={e.id} e={e} fresh={fresh.has(e.id)} />,
                ];
              })}
            </ol>
          )}
        </section>

        <div className={s.side}>
          <section className={s.card}>
            <div className={s.cardHead}>
              <div className={s.cardTitle}>Where they are</div>
              <div className={s.legend}>
                <span>
                  <i className={s.keyNow} /> on a page now
                </span>
                <span>
                  <i className={s.keyRecent} /> last 30 min
                </span>
              </div>
            </div>
            <WorldMap visitors={visitors} />
            <Countries visitors={visitors} />
          </section>

          <section className={s.card}>
            <div className={s.cardHead}>
              <div className={s.cardTitle}>Which page</div>
              <div className={s.legend}>
                <span>
                  <i className={s.keyNow} /> now
                </span>
                <span>
                  <i className={s.keyRecent} /> 30 min
                </span>
              </div>
            </div>
            <Pages visitors={visitors} />
          </section>
        </div>
      </div>

      <section className={`${s.card} ${s.block}`}>
        <div className={s.cardHead}>
          <div className={s.cardTitle}>
            Visitors <span className={s.count}>{active.length} now</span>
          </div>
          <div className={s.cardSub}>last 30 minutes</div>
        </div>
        {!data ? (
          <div className={s.empty}>Loading…</div>
        ) : sorted.length === 0 ? (
          <div className={s.empty}>No one in the last 30 minutes.</div>
        ) : (
          <div className={s.visitors}>
            {sorted.slice(0, 60).map((v) => (
              <VisitorRow key={v.id} v={v} now={now} />
            ))}
          </div>
        )}
      </section>

      <VisitorStats />

      <OwnVisits />
    </main>
  );
}

// The owner's own visits: one link per browser turns them off (app/api/checkout/me).
function OwnVisits() {
  const [copied, setCopied] = useState(false);
  const copy = () =>
    navigator.clipboard
      ?.writeText(ME_URL)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
      })
      .catch(() => {});
  return (
    <section className={`${s.card} ${s.own}`}>
      <div className={s.ownText}>
        <div className={s.cardTitle}>Your own visits</div>
        <p>
          Open this link once on every phone and computer you use: from then on, that browser&apos;s visits to m.thegrind.studio (funnels and Astro
          landings) don&apos;t count here, in Analytics, or in Meta Pixel, Clarity and neo. Bots are never counted.
        </p>
      </div>
      <div className={s.ownActions}>
        <a className="btn" href={ME_URL} target="_blank" rel="noreferrer">
          Don&apos;t count this browser
        </a>
        <button type="button" className="btn" onClick={copy}>
          <I.copy size={13} /> {copied ? "Copied" : "Copy link"}
        </button>
      </div>
    </section>
  );
}

function Stat({ label, value, sub, color, live }: { label: string; value: string; sub?: string; color: string; live?: boolean }) {
  return (
    <div className="stat">
      <div className="stat-label">
        <span className={`lk ${live ? s.lkLive : ""}`} style={{ background: color }} />
        {label}
      </div>
      <div className="v">
        {value} {sub && <small>{sub}</small>}
      </div>
    </div>
  );
}

// The land never changes: drawn once.
const Land = memo(function Land() {
  const d = useMemo(landPath, []);
  return <path className={s.land} d={d} />;
});

function WorldMap({ visitors }: { visitors: LiveVisitor[] }) {
  // Visitors in the same place share a dot, a little bigger.
  const spots = useMemo(() => {
    const at = new Map<string, { x: number; y: number; now: number; recent: number; label: string }>();
    for (const v of visitors) {
      if (v.lat == null || v.lon == null) continue;
      const p = project(v.lat, v.lon);
      const key = `${Math.round(p.x * 2)}:${Math.round(p.y * 2)}`;
      const spot = at.get(key) ?? { ...p, now: 0, recent: 0, label: place(v.city, v.country) };
      if (v.active) spot.now++;
      else spot.recent++;
      at.set(key, spot);
    }
    // Live dots on top.
    return [...at.values()].sort((a, b) => a.now - b.now);
  }, [visitors]);

  return (
    <div className={s.map}>
      <svg viewBox={`0 0 ${MAP_COLS} ${MAP_ROWS}`} role="img" aria-label="World map of visitors">
        <Land />
        {spots.map((p) => {
          const n = p.now + p.recent;
          const r = 0.75 + Math.min(1.2, Math.sqrt(n - 1) * 0.35);
          return (
            <g key={`${p.x}:${p.y}`}>
              <title>{`${p.label} · ${p.now ? `${p.now} on a page now` : ""}${p.now && p.recent ? ", " : ""}${p.recent ? `${p.recent} earlier` : ""}`}</title>
              {p.now > 0 && <circle className={s.ping} cx={p.x} cy={p.y} r={r} />}
              <circle className={p.now > 0 ? s.spotNow : s.spotRecent} cx={p.x} cy={p.y} r={r} />
            </g>
          );
        })}
      </svg>
      {spots.length === 0 && <div className={s.mapEmpty}>No one in the last 30 minutes.</div>}
    </div>
  );
}

function Countries({ visitors }: { visitors: LiveVisitor[] }) {
  const rows = useMemo(() => {
    const by = new Map<string, { cc: string; now: number; recent: number }>();
    for (const v of visitors) {
      const row = by.get(v.country) ?? { cc: v.country, now: 0, recent: 0 };
      if (v.active) row.now++;
      row.recent++;
      by.set(v.country, row);
    }
    return [...by.values()].sort((a, b) => b.now - a.now || b.recent - a.recent).slice(0, 12);
  }, [visitors]);
  if (!rows.length) return null;
  return (
    <ul className={s.countries}>
      {rows.map((c) => (
        <li key={c.cc || "?"} title={`${c.now} on a page now, ${c.recent} in the last 30 minutes`}>
          <span className={s.flag}>{flag(c.cc)}</span>
          {countryName(c.cc) || "Unknown"}
          <span className={s.nums}>
            <b className={c.now ? s.nowNum : ""}>{c.now}</b> / {c.recent}
          </span>
        </li>
      ))}
    </ul>
  );
}

function Pages({ visitors }: { visitors: LiveVisitor[] }) {
  const funnels = useMemo(() => {
    const by = new Map<string, { slug: string; name: string; now: number; steps: Map<string, { now: number; recent: number; url: string }> }>();
    for (const v of visitors) {
      const f = by.get(v.funnel) ?? { slug: v.funnel, name: v.funnelName, now: 0, steps: new Map() };
      // The Astro landings are one page each, told apart by their path.
      const key = v.funnel === ASTRO_FUNNEL ? v.path || "/" : v.page;
      // Visitors come latest first: the step links to the page the latest one is on.
      const step = f.steps.get(key) ?? { now: 0, recent: 0, url: v.url };
      step.recent++;
      if (v.active) {
        step.now++;
        f.now++;
      }
      f.steps.set(key, step);
      by.set(v.funnel, f);
    }
    return [...by.values()].sort((a, b) => b.now - a.now || b.steps.size - a.steps.size);
  }, [visitors]);
  if (!funnels.length) return <div className={s.empty}>No one on a page in the last 30 minutes.</div>;
  const max = Math.max(...funnels.flatMap((f) => [...f.steps.values()].map((x) => x.recent)));
  return (
    <div className={s.pages}>
      {funnels.map((f) => (
        <div key={f.slug} className={s.funnel}>
          <div className={s.funnelHead}>
            {f.name}
            <span className={f.now ? s.nowNum : ""}>{f.now} now</span>
          </div>
          {[...f.steps.entries()]
            .sort(([a], [b]) => STEPS.indexOf(a as (typeof STEPS)[number]) - STEPS.indexOf(b as (typeof STEPS)[number]))
            .map(([page, n]) => (
              <div key={page} className={s.step}>
                <span className={s.stepName}>
                  <PageLink url={n.url}>{pageLabel(f.slug, page, page)}</PageLink>
                </span>
                <span className={s.bar}>
                  <span className={s.barRecent} style={{ width: `${(n.recent / max) * 100}%` }} />
                  <span className={s.barNow} style={{ width: `${(n.now / max) * 100}%` }} />
                </span>
                <span className={s.stepNums}>
                  <b className={n.now ? s.nowNum : ""}>{n.now}</b> / {n.recent}
                </span>
              </div>
            ))}
        </div>
      ))}
    </div>
  );
}

const DEVICE = { mobile: I.device_mobile, tablet: I.device_tablet, desktop: I.device_desktop } as const;

function VisitorRow({ v, now }: { v: LiveVisitor; now: number }) {
  const Device = DEVICE[v.device as keyof typeof DEVICE];
  return (
    <div className={`${s.visitor} ${v.active ? "" : s.gone}`}>
      <div className={s.where}>
        <span className={v.active ? s.dotNow : s.dotGone} />
        <span className={s.flag}>{flag(v.country)}</span>
        <div className={s.cell}>
          <div className={s.main}>{place(v.city, v.country)}</div>
          <div className={s.small}>
            {Device && <Device size={12} />}
            {v.device || "device unknown"}
            {v.returning && <span className={s.tag}>returning</span>}
          </div>
        </div>
      </div>
      <div className={s.cell}>
        <div className={s.main}>
          <PageLink url={v.url}>{pageLabel(v.funnel, v.page, v.path)}</PageLink>
        </div>
        <div className={s.small}>
          {v.funnelName}
          {v.lang && v.lang !== "en" && <code>{v.lang.toUpperCase()}</code>}
        </div>
      </div>
      <div className={s.cell}>
        <div className={s.main}>{v.source || "—"}</div>
        {v.campaign && (
          <div className={`${s.small} ${s.campaign}`} title={v.campaign}>
            {v.campaign}
          </div>
        )}
      </div>
      <div className={`${s.cell} ${s.time}`}>
        <div className={s.main}>{v.active ? span(now - Date.parse(v.since)) : `left ${ago(now - Date.parse(v.leftAt ?? v.lastSeen))}`}</div>
        <div className={s.small}>
          {v.views} page{v.views === 1 ? "" : "s"}
        </div>
      </div>
    </div>
  );
}

const KIND = {
  view: { Icon: I.eye, color: "var(--sky)" },
  checkout: { Icon: I.receipt, color: "var(--amber)" },
  order: { Icon: I.bag, color: "var(--mint)" },
  upsell: { Icon: I.plus, color: "var(--mint)" },
  click: { Icon: I.mail, color: "var(--accent)" },
} as const;

function EventRow({ e, fresh }: { e: LiveEvent; fresh: boolean }) {
  const { Icon, color } = KIND[e.kind];
  const lang = e.lang && e.lang !== "en" ? ` ${e.lang.toUpperCase()}` : "";
  let text: React.ReactNode;
  switch (e.kind) {
    case "view":
      text = (
        <>
          <span className={s.flag}>{flag(e.country)}</span>
          <b>{place(e.city, e.country)}</b> opened{" "}
          <b>
            <PageLink url={e.url}>{pageLabel(e.funnel, e.page, e.path)}</PageLink>
          </b>
          <span className={s.muted}>
            {" "}
            · {e.funnelName}
            {lang}
          </span>
          {e.page === "landing" && e.source && (
            <span className={s.src} title={e.campaign || undefined}>
              {e.source}
            </span>
          )}
        </>
      );
      break;
    case "checkout":
      text = (
        <>
          <b>{e.who}</b> started checkout
          <span className={s.muted}>
            {" "}
            · {e.funnelName}
            {lang}
          </span>
        </>
      );
      break;
    case "order":
    case "upsell":
      text = (
        <>
          {e.country && <span className={s.flag}>{flag(e.country)}</span>}
          <b>{e.who}</b> {e.kind === "order" ? "bought" : "took the upsell"} <b>{e.kind === "order" ? e.funnelName : e.offer}</b>{" "}
          <span className={s.amount}>{money(e.amount, e.currency)}</span>
        </>
      );
      break;
    case "click": {
      let where = e.url;
      try {
        const u = new URL(e.url);
        where = u.hostname.replace(/^www\./, "") + (u.pathname === "/" ? "" : u.pathname);
      } catch {}
      text = (
        <>
          <b>{e.who}</b> clicked an email
          <span className={s.muted}>
            {" "}
            · <PageLink url={e.url}>{where}</PageLink>
          </span>
        </>
      );
      break;
    }
  }
  return (
    <li className={`${s.event} ${fresh ? s.fresh : ""}`}>
      <span className={s.clock} title={new Date(e.at).toLocaleString("en-GB")}>
        {clock(e.at)}
      </span>
      <span className={s.kind} style={{ color }}>
        <Icon size={13} />
      </span>
      <span className={s.what}>{text}</span>
    </li>
  );
}
