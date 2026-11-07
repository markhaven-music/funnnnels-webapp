"use client";

import { useEffect, useState } from "react";
import { I } from "@/components/icons";
import { RangePicker, useRange } from "@/components/RangePicker";
import { rangeLength, type Range } from "@/lib/range";
import type { Count, VisitorStats as Stats } from "@/lib/visitorStats";
import s from "./live.module.css";

// Dashboard → Live → "Who they are": the visitors of today, yesterday, the
// last week or month, in the viewer's own days (lib/visitorStats.ts via /api/live/stats). Read again every minute.

const OFFERED: Range[] = ["today", "yesterday", "7d", "28d", "this-month"];

const DEVICE = {
  mobile: { label: "Phone", Icon: I.device_mobile },
  tablet: { label: "Tablet", Icon: I.device_tablet },
  desktop: { label: "Computer", Icon: I.device_desktop },
} as const;

const flag = (cc: string) => (/^[A-Z]{2}$/.test(cc) ? String.fromCodePoint(...[...cc].map((c) => 0x1f1a5 + c.charCodeAt(0))) : "");
let regions: Intl.DisplayNames | null = null;
let languages: Intl.DisplayNames | null = null;
try {
  regions = new Intl.DisplayNames(["en"], { type: "region" });
  languages = new Intl.DisplayNames(["en"], { type: "language" });
} catch {
  // old browser: codes instead of names
}
const countryName = (cc: string) => {
  try {
    return (cc && regions?.of(cc)) || cc || "Unknown";
  } catch {
    return cc;
  }
};
const langName = (l: string) => {
  try {
    return languages?.of(l) ?? l;
  } catch {
    return l;
  }
};
const pct = (n: number, of: number) => (of ? `${Math.round((n / of) * 100)}%` : "–");
const pct1 = (n: number, of: number) => (of ? `${((n / of) * 100).toFixed(n / of < 0.1 ? 1 : 0)}%` : "–");
const dur = (sec: number) => (sec < 60 ? `${sec}s` : `${Math.floor(sec / 60)}m ${String(sec % 60).padStart(2, "0")}s`);

export function VisitorStats() {
  const [range, setRange] = useRange("7d", "fv:live-range", OFFERED);
  const days = rangeLength(range) ?? 30;
  const [data, setData] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout>;
    setData((d) => (d?.range === range ? d : null));
    const load = async () => {
      if (document.visibilityState === "visible") {
        try {
          const r = await fetch(`/api/live/stats?range=${range}&tz=${new Date().getTimezoneOffset()}`, { cache: "no-store" });
          if (!r.ok) throw new Error(`Visitor stats didn't load (${r.status}).`);
          const d = (await r.json()) as Stats;
          if (alive) {
            setData(d);
            setError(null);
          }
        } catch (e) {
          if (alive) setError((e as Error).message);
        }
      }
      if (alive) timer = setTimeout(load, 60_000);
    };
    load();
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [range]);

  const total = data?.visitors ?? 0;
  const short = data?.since && Date.now() - Date.parse(data.since) < days * 24 * 3600_000;

  return (
    <section className={`${s.card} ${s.block}`}>
      <div className={s.cardHead}>
        <div className={s.cardTitle}>Who they are</div>
        <RangePicker value={range} onChange={setRange} ranges={OFFERED} offsetMin={-new Date().getTimezoneOffset()} />
      </div>

      {error && <div className={`${s.notice} ${s.bad}`}>{error}</div>}
      {!data ? (
        <div className={s.empty}>Loading…</div>
      ) : total === 0 ? (
        <div className={s.empty}>No visitors in this range.</div>
      ) : (
        <>
          {short && data.since && (
            <p className={s.statsNote}>
              Recorded since {new Date(data.since).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}: the range starts there.
            </p>
          )}

          <div className={s.kpis}>
            <Kpi label="Visitors" value={total.toLocaleString("en")} sub={`${data.pages.toLocaleString("en")} pages opened`} />
            <Kpi label="Pages per visitor" value={(data.pages / total).toFixed(1)} />
            <Kpi label="Came back" value={pct(data.returning, total)} sub={`${data.returning} returning`} />
            <Kpi label="Time on site" value={data.medianSeconds != null ? dur(data.medianSeconds) : "–"} sub="median, if they stayed 10 s +" />
          </div>

          <h3 className={s.statsH}>Phone or computer</h3>
          <div className={s.deviceTable}>
            <div className={s.deviceHead}>
              <span />
              <span>Visitors</span>
              <span>Order page</span>
              <span>Checkout</span>
              <span>Bought</span>
            </div>
            {data.devices.map((d) => {
              const k = DEVICE[d.device as keyof typeof DEVICE];
              return (
                <div key={d.device} className={s.deviceRow}>
                  <span className={s.deviceName}>
                    {k ? <k.Icon size={15} /> : null}
                    {k?.label ?? "Unknown"}
                  </span>
                  <span>
                    <b>{d.visitors}</b> <small>{pct(d.visitors, total)}</small>
                    <span className={s.miniBar}>
                      <span style={{ width: pct(d.visitors, total) }} />
                    </span>
                  </span>
                  <span>
                    <b>{d.order}</b> <small>{pct1(d.order, d.visitors)}</small>
                  </span>
                  <span>
                    <b>{d.checkout}</b> <small>{pct1(d.checkout, d.visitors)}</small>
                  </span>
                  <span>
                    <b>{d.bought}</b> <small>{pct1(d.bought, d.visitors)}</small>
                  </span>
                </div>
              );
            })}
          </div>

          <div className={s.statGrid}>
            <Bars title="Countries" rows={data.countries} total={total} label={(k) => `${flag(k)} ${countryName(k)}`} />
            <Bars
              title="Cities"
              rows={data.cities}
              total={total}
              label={(k) => {
                const [city, cc] = k.split("|");
                return `${flag(cc)} ${city}`;
              }}
            />
            <Bars title="Where they came from" rows={data.sources} total={total} />
            <Bars title="Ads" rows={data.ads} total={total} empty="No ad visits in this range." />
            <Bars title="Funnels" rows={data.funnels} total={total} />
            <Bars title="Page language" rows={data.langs} total={total} label={langName} />
            <Bars title="Pages per visit" rows={data.depth} total={total} label={(k) => `${k} page${k === "1" ? "" : "s"}`} />
            <Bars title="Time on site" rows={data.stay} total={total} />
          </div>

          <h3 className={s.statsH}>Hour of day <small>your time</small></h3>
          <Columns values={data.hours} labels={data.hours.map((_, h) => String(h))} every={3} />

          {days > 1 && data.perDay.length > 1 && (
            <>
              <h3 className={s.statsH}>Per day</h3>
              <Columns
                values={data.perDay.map((d) => d.n)}
                labels={data.perDay.map((d) => new Date(`${d.day}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short" }))}
                every={days > 7 ? 5 : 1}
              />
            </>
          )}
        </>
      )}
    </section>
  );
}

function Kpi({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className={s.kpi}>
      <div className={s.kpiLabel}>{label}</div>
      <div className={s.kpiValue}>{value}</div>
      {sub && <div className={s.kpiSub}>{sub}</div>}
    </div>
  );
}

function Bars({ title, rows, total, label = (k) => k, empty = "Nothing yet." }: { title: string; rows: Count[]; total: number; label?: (k: string) => string; empty?: string }) {
  const max = Math.max(1, ...rows.map((r) => r.n));
  return (
    <div className={s.statBox}>
      <h3 className={s.statsH}>{title}</h3>
      {rows.length === 0 || rows.every((r) => r.n === 0) ? (
        <div className={s.statEmpty}>{empty}</div>
      ) : (
        rows.map((r) => (
          <div key={r.key} className={s.statRow} title={`${r.n} of ${total}`}>
            <span className={s.statName}>{label(r.key)}</span>
            <span className={s.bar}>
              <span className={s.barRecent} style={{ width: `${(r.n / max) * 100}%` }} />
            </span>
            <span className={s.statNum}>
              <b>{r.n}</b> {pct(r.n, total)}
            </span>
          </div>
        ))
      )}
    </div>
  );
}

function Columns({ values, labels, every }: { values: number[]; labels: string[]; every: number }) {
  const max = Math.max(1, ...values);
  return (
    <div className={s.cols}>
      {values.map((n, i) => (
        <div key={labels[i]} className={s.col} title={`${labels[i]}: ${n}`}>
          <span className={s.colNum}>{n || ""}</span>
          <span className={s.colBar} style={{ height: `${(n / max) * 100}%` }} />
          <span className={s.colLabel}>{i % every === 0 ? labels[i] : ""}</span>
        </div>
      ))}
    </div>
  );
}
