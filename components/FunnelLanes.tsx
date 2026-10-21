"use client";

import Link from "next/link";
import { Fragment, useCallback, useEffect, useLayoutEffect, useRef, useState, type PointerEvent } from "react";
import { I } from "@/components/icons";
import { COLORS, type Variant } from "@/app/(funnels)/midi-drum-kit/abtest";
import type { Metrics, TestStats } from "@/lib/analytics";
import type { MapStep } from "@/lib/funnelMap";
import s from "./funnelLanes.module.css";

// The funnel map's A/B/C test as lanes (components/FunnelMap.tsx → Lanes):
// the visitors split at the start, then one column per variant through the
// pages the test changes (landing, order), the same page on the same row so
// the lanes read across, and each colour's result. The lanes then join: the
// upsells and the thank-you page are the same for everyone, so they're shown
// once, with every colour's visitors together and a line per colour.
// The canvas moves (drag, scroll) and zooms (ctrl/⌘ + scroll, pinch, the
// buttons); it opens as wide as the screen, Fit shows all of it.

const LABEL = 250; // the page column
const LANE = 290;
const GAP = 36;
const MIN_K = 0.2;
const MAX_K = 2;

const int = (n: number) => n.toLocaleString("en-US");
const eur = (n: number, digits = 0) =>
  new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR", minimumFractionDigits: digits, maximumFractionDigits: digits }).format(n);
const share = (p: number) => `${(p * 100).toFixed(p < 0.1 ? 1 : 0)}%`;
const name = (v: string) => v[0].toUpperCase() + v.slice(1);

type Row = { label: string; value: string };
// The number a step decides, as a ratio, to compare the lanes on.
type Key = { label: string; part: number; whole: number; money?: boolean };

function laneRows(step: MapStep, m: Metrics, hasOrderStep: boolean): Row[] {
  if (step.kind === "landing") {
    return hasOrderStep
      ? [
          { label: "Visitors", value: int(m.visitors) },
          { label: "Went to order page", value: int(m.orderViews) },
        ]
      : [
          { label: "Visitors", value: int(m.visitors) },
          { label: "Checkouts", value: int(m.checkouts) },
        ];
  }
  if (step.kind === "order") {
    return [
      { label: "Visitors", value: int(m.orderViews) },
      { label: "Checkouts", value: int(m.checkouts) },
      { label: "Orders", value: int(m.orders) },
    ];
  }
  if (step.kind === "upsell" && step.offer) {
    const o = m.offers[step.offer.id] ?? { orders: 0, revenue: 0 };
    return [
      { label: "Visitors", value: int(m.upsellViews[step.offer.page] ?? 0) },
      { label: "Took it", value: int(o.orders) },
      { label: "Revenue", value: eur(o.revenue) },
    ];
  }
  if (step.kind === "thank-you") {
    return [
      { label: "Visitors", value: int(m.thankYouViews) },
      { label: "Revenue", value: eur(m.revenue) },
    ];
  }
  return [];
}

function laneKey(step: MapStep, m: Metrics, hasOrderStep: boolean): Key | null {
  if (step.kind === "landing")
    return hasOrderStep
      ? { label: "Went to order page", part: m.orderViews, whole: m.visitors }
      : { label: "Started checkout", part: m.checkouts, whole: m.visitors };
  if (step.kind === "order") return { label: "Bought", part: m.ratedOrders, whole: m.orderViews };
  if (step.kind === "upsell" && step.offer)
    return { label: "Took it", part: m.offers[step.offer.id]?.orders ?? 0, whole: m.upsellViews[step.offer.page] ?? 0 };
  if (step.kind === "thank-you") return { label: "Revenue / visitor", part: m.ratedRevenue, whole: m.visitors || m.orderViews, money: true };
  return null;
}

// The pages the button-colour test changes; the lanes join after the last of them.
const tested = (st: MapStep) => st.kind === "landing" || st.kind === "order";

/** Every colour's visitors together, for the pages they share. */
function together(ms: Metrics[]): Metrics {
  const add = (a: Record<string, number>, b: Record<string, number>) => {
    for (const [k, n] of Object.entries(b)) a[k] = (a[k] ?? 0) + n;
  };
  const out = { ...ms[0], upsellViews: { ...ms[0].upsellViews }, offers: {} as Metrics["offers"] };
  for (const key of Object.keys(out) as (keyof Metrics)[]) {
    if (typeof out[key] === "number") (out as Record<string, unknown>)[key] = ms.reduce((n, m) => n + (m[key] as number), 0);
  }
  out.upsellViews = {};
  for (const m of ms) {
    add(out.upsellViews, m.upsellViews);
    for (const [id, o] of Object.entries(m.offers)) {
      const t = (out.offers[id] ??= { orders: 0, eur: 0, usd: 0, revenue: 0 });
      t.orders += o.orders;
      t.eur += o.eur;
      t.usd += o.usd;
      t.revenue += o.revenue;
    }
  }
  return out;
}

/** Each lane's ratio on a row, how far it is from the lanes' average, and which lane is best. */
function compare(keys: (Key | null)[]) {
  const ratios = keys.map((k) => (k && k.whole > 0 ? k.part / k.whole : null));
  const known = ratios.filter((r): r is number => r !== null);
  const avg = known.length === keys.length && known.length > 1 ? known.reduce((a, b) => a + b, 0) / known.length : null;
  const max = known.length > 1 ? Math.max(...known) : null;
  return ratios.map((r) => ({
    ratio: r,
    delta: r !== null && avg ? r / avg - 1 : null,
    best: r !== null && max !== null && max > 0 && r === max,
  }));
}

/** Drag / scroll to move, ctrl/⌘ + scroll or pinch to zoom; as wide as the screen until the user moves it. */
function usePanZoom() {
  const viewport = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const [view, setView] = useState({ x: 0, y: 0, k: 1 });
  const touched = useRef(false);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ dist: number; mid: { x: number; y: number } } | null>(null);

  // "width": readable, from the top (scroll for the rest); "all": the whole map on the screen.
  const fit = useCallback((to: "width" | "all" = "width") => {
    const vp = viewport.current;
    const st = stage.current;
    if (!vp || !st) return;
    const pad = 32;
    const byWidth = (vp.clientWidth - pad * 2) / st.offsetWidth;
    const k = Math.max(MIN_K, Math.min(1, byWidth, to === "all" ? (vp.clientHeight - pad * 2) / st.offsetHeight : Infinity));
    const x = (vp.clientWidth - st.offsetWidth * k) / 2;
    const y = Math.max(pad, (vp.clientHeight - st.offsetHeight * k) / 2);
    setView({ x, y, k });
  }, []);

  const zoomAt = useCallback((px: number, py: number, factor: number) => {
    touched.current = true;
    setView((v) => {
      const k = Math.min(MAX_K, Math.max(MIN_K, v.k * factor));
      return { k, x: px - (px - v.x) * (k / v.k), y: py - (py - v.y) * (k / v.k) };
    });
  }, []);

  const zoomCenter = useCallback(
    (factor: number) => {
      const vp = viewport.current;
      if (vp) zoomAt(vp.clientWidth / 2, vp.clientHeight / 2, factor);
    },
    [zoomAt],
  );

  // Fitted on open and whenever the window or the content changes size, until the user moves it.
  useLayoutEffect(() => {
    fit();
    const ro = new ResizeObserver(() => !touched.current && fit());
    if (viewport.current) ro.observe(viewport.current);
    if (stage.current) ro.observe(stage.current);
    return () => ro.disconnect();
  }, [fit]);

  // The wheel needs a non-passive listener to keep the page from scrolling.
  useEffect(() => {
    const vp = viewport.current;
    if (!vp) return;
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = vp.getBoundingClientRect();
      if (e.ctrlKey || e.metaKey) zoomAt(e.clientX - r.left, e.clientY - r.top, Math.exp(-e.deltaY * 0.01));
      else {
        touched.current = true;
        setView((v) => ({ ...v, x: v.x - e.deltaX, y: v.y - e.deltaY }));
      }
    };
    vp.addEventListener("wheel", wheel, { passive: false });
    return () => vp.removeEventListener("wheel", wheel);
  }, [zoomAt]);

  const local = (e: PointerEvent) => {
    const r = viewport.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const twoFingers = () => {
    const [a, b] = [...pointers.current.values()];
    return { dist: Math.hypot(a.x - b.x, a.y - b.y), mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 } };
  };

  const handlers = {
    onPointerDown(e: PointerEvent) {
      // Links and buttons on the cards keep working.
      if ((e.target as HTMLElement).closest("a, button")) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      pointers.current.set(e.pointerId, local(e));
      if (pointers.current.size === 2) pinch.current = twoFingers();
    },
    onPointerMove(e: PointerEvent) {
      const last = pointers.current.get(e.pointerId);
      if (!last) return;
      const p = local(e);
      pointers.current.set(e.pointerId, p);
      touched.current = true;
      if (pointers.current.size === 1) {
        setView((v) => ({ ...v, x: v.x + p.x - last.x, y: v.y + p.y - last.y }));
      } else if (pointers.current.size === 2 && pinch.current) {
        const now = twoFingers();
        const prev = pinch.current;
        pinch.current = now;
        setView((v) => {
          const k = Math.min(MAX_K, Math.max(MIN_K, v.k * (prev.dist > 0 ? now.dist / prev.dist : 1)));
          const x = now.mid.x - (prev.mid.x - v.x) * (k / v.k);
          const y = now.mid.y - (prev.mid.y - v.y) * (k / v.k);
          return { k, x, y };
        });
      }
    },
    onPointerUp(e: PointerEvent) {
      pointers.current.delete(e.pointerId);
      if (pointers.current.size < 2) pinch.current = null;
    },
  };

  const refit = () => {
    touched.current = true;
    fit("all");
  };

  return { viewport, stage, view, handlers, zoomCenter, refit };
}

/** The lines from the split to each lane, or (join) from each lane back to one. */
function Branches({ lanes, colors, join = false }: { lanes: number; colors: string[]; join?: boolean }) {
  const width = lanes * LANE + (lanes - 1) * GAP;
  const h = 56;
  const mid = width / 2;
  return (
    <svg className={s.branches} width={width} height={h} viewBox={`0 0 ${width} ${h}`} aria-hidden>
      {Array.from({ length: lanes }, (_, i) => {
        const lane = i * (LANE + GAP) + LANE / 2;
        const [from, to] = join ? [lane, mid] : [mid, lane];
        return (
          <path
            key={i}
            d={`M ${from} 0 C ${from} ${h * 0.55}, ${to} ${h * 0.45}, ${to} ${h}`}
            fill="none"
            stroke={colors[i]}
            strokeWidth={2.5}
          />
        );
      })}
    </svg>
  );
}

/** A page in the left column: its picture, name, address and links. */
function PageLabel({ step }: { step: MapStep }) {
  return (
    <div className={s.page}>
      <a href={step.url} target="_blank" rel="noreferrer" className={s.thumb} title="Open the page">
        {step.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={step.image} alt="" loading="lazy" draggable={false} />
        ) : (
          <span className={s.thumbEmpty}>{step.kind === "thank-you" ? <I.check size={18} /> : <I.page size={18} />}</span>
        )}
      </a>
      <div className={s.pageName}>
        {step.name}
        {step.offer && !step.offer.live && <span className={s.offTag}>Off until tested</span>}
      </div>
      <div className={s.path}>{step.path}</div>
      <div className={s.pageActions}>
        <a href={step.url} target="_blank" rel="noreferrer" className={s.btn}>
          <I.eye size={12} /> Open
        </a>
        {step.editUrl && (
          <Link href={step.editUrl} className={s.btn}>
            <I.brand size={12} /> Edit
          </Link>
        )}
      </div>
    </div>
  );
}

const ratioText = (key: Key, ratio: number | null) => (ratio === null ? "—" : key.money ? eur(ratio, 2) : share(ratio));

export function Lanes({ test, steps, entryUrl }: { test: TestStats; steps: MapStep[]; entryUrl: string }) {
  const { viewport, stage, view, handlers, zoomCenter, refit } = usePanZoom();
  const hasOrderStep = steps.some((st) => st.kind === "order");
  const lanes = test.variants;
  const color = (v: string) => COLORS[v as Variant] ?? { from: "#bbb", to: "#999", edge: "#777", glow: "", text: "#fff" };
  const colors = lanes.map((l) => color(l.variant).to);
  const totalVisitors = lanes.reduce((n, l) => n + (l.full.visitors || l.full.orderViews), 0);
  const split = steps.findLastIndex(tested) + 1;
  const laneSteps = steps.slice(0, split);
  const sharedSteps = steps.slice(split);
  const all = together(lanes.map((l) => l.full));
  const span = { gridColumn: `2 / span ${lanes.length}` };
  const columns = `${LABEL}px repeat(${lanes.length}, ${LANE}px)`;
  const verdict =
    test.verdict === "winner" && test.leader
      ? `${name(test.leader)} wins`
      : test.verdict === "tie"
        ? "no clear winner"
        : test.verdict === "waiting"
          ? "waiting for visitors"
          : `${int(test.salesToGo)} sales to a reliable answer`;

  return (
    <div className={s.viewport} ref={viewport} {...handlers} onPointerCancel={handlers.onPointerUp}>
      <div
        className={s.stage}
        ref={stage}
        style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.k})`, gridTemplateColumns: columns, columnGap: GAP }}
      >
        {/* the split */}
        <div className={s.labelCell} />
        <section className={s.split} style={span}>
          <div className={s.splitHead}>
            <span className={s.dots} aria-hidden>
              {colors.map((c, i) => (
                <span key={i} style={{ background: c }} />
              ))}
            </span>
            A/B/C test · {test.name}
          </div>
          <div className={s.splitMeta}>
            {int(totalVisitors)} visitors{test.since ? ` since ${test.since}` : ""} · every language ·{" "}
            <Link href="/?nav=analytics" className={s.link}>
              {verdict}
            </Link>
          </div>
          <div className={s.url}>{entryUrl}</div>
        </section>

        <div className={s.labelCell} />
        <div style={span}>
          <Branches lanes={lanes.length} colors={colors} />
        </div>

        {/* the lanes' heads */}
        <div className={s.labelCell} />
        {lanes.map((l) => {
          const c = color(l.variant);
          const n = l.full.visitors || l.full.orderViews;
          return (
            <div key={l.variant} className={s.laneHead}>
              <span className={s.swatch} style={{ background: `linear-gradient(180deg, ${c.from}, ${c.to})` }} />
              <span className={s.laneName}>{name(l.variant)}</span>
              {test.leader === l.variant && <span className={s.leading}>leading</span>}
              <span className={s.laneShare}>{totalVisitors > 0 ? `${share(n / totalVisitors)} of visitors` : "no visitors yet"}</span>
            </div>
          );
        })}

        {/* a row per page the test changes */}
        {laneSteps.map((step) => {
          const keys = lanes.map((l) => laneKey(step, l.full, hasOrderStep));
          const cmp = compare(keys);
          return (
            <Fragment key={step.kind + step.path}>
              <div className={s.labelCell}>
                <PageLabel step={step} />
              </div>
              {lanes.map((l, i) => {
                const c = color(l.variant);
                const key = keys[i];
                const k = cmp[i];
                return (
                  <div key={l.variant} className={s.cell}>
                    <div className={s.connector} style={{ background: c.to }} aria-hidden />
                    <section className={s.node}>
                      <div className={s.nodeBar} style={{ background: `linear-gradient(90deg, ${c.from}, ${c.to})` }} />
                      {key && (
                        <div className={`${s.key} ${k.best ? s.keyBest : ""}`}>
                          <span className={s.keyLabel}>{key.label}</span>
                          <span className={s.keyValue}>
                            {ratioText(key, k.ratio)}
                            {k.best && <span className={s.best}>best</span>}
                          </span>
                          {k.delta !== null && (
                            <span className={`${s.delta} ${k.delta >= 0 ? s.up : s.down}`}>
                              {k.delta >= 0 ? "+" : "−"}
                              {Math.abs(Math.round(k.delta * 100))}% vs average
                            </span>
                          )}
                        </div>
                      )}
                      <dl className={s.rows}>
                        {laneRows(step, l.full, hasOrderStep).map((r) => (
                          <div key={r.label} className={s.row}>
                            <dt>{r.label}</dt>
                            <dd>{r.value}</dd>
                          </div>
                        ))}
                      </dl>
                    </section>
                  </div>
                );
              })}
            </Fragment>
          );
        })}

        {/* each colour's result, upsells included */}
        <div className={s.labelCell}>
          <div className={s.totalLabel}>
            Result per colour
            <span>Orders and revenue per visitor (upsells included), and how sure the test is about each colour</span>
          </div>
        </div>
        {lanes.map((l) => {
          const c = color(l.variant);
          const m = l.full;
          const n = m.visitors || m.orderViews;
          return (
            <div key={l.variant} className={s.cell}>
              <div className={s.connector} style={{ background: c.to }} aria-hidden />
              <section className={`${s.node} ${s.total}`}>
                <div className={s.nodeBar} style={{ background: `linear-gradient(90deg, ${c.from}, ${c.to})` }} />
                <dl className={s.rows}>
                  <div className={s.row}>
                    <dt>Orders / visitor</dt>
                    <dd>{n > 0 ? share(m.ratedOrders / n) : "—"}</dd>
                  </div>
                  <div className={s.row}>
                    <dt>Revenue / visitor</dt>
                    <dd>{n > 0 ? eur(m.ratedRevenue / n, 2) : "—"}</dd>
                  </div>
                  <div className={s.row}>
                    <dt>Revenue</dt>
                    <dd>{eur(m.revenue)}</dd>
                  </div>
                  <div className={s.row}>
                    <dt>Chance it&apos;s the best</dt>
                    <dd>{l.chanceBest == null || l.m.orders === 0 ? "—" : share(l.chanceBest)}</dd>
                  </div>
                </dl>
              </section>
            </div>
          );
        })}

        {/* the lanes join: the pages every colour shares */}
        {sharedSteps.length > 0 && (
          <>
            <div className={s.labelCell} />
            <div style={span}>
              <Branches lanes={lanes.length} colors={colors} join />
            </div>
          </>
        )}
        {sharedSteps.map((step, i) => {
          const key = laneKey(step, all, hasOrderStep);
          const byColour = lanes.map((l) => laneKey(step, l.full, hasOrderStep));
          return (
            <Fragment key={step.kind + step.path}>
              <div className={s.labelCell}>
                <PageLabel step={step} />
              </div>
              <div className={s.sharedCell} style={span}>
                {i > 0 && <div className={`${s.connector} ${s.sharedLine}`} aria-hidden />}
                <section className={`${s.node} ${s.shared}`}>
                  <div className={s.nodeBar} style={{ background: `linear-gradient(90deg, ${colors.join(", ")})` }} />
                  {key && (
                    <div className={s.key}>
                      <span className={s.keyLabel}>{key.label} · every colour</span>
                      <span className={s.keyValue}>{ratioText(key, key.whole > 0 ? key.part / key.whole : null)}</span>
                    </div>
                  )}
                  <dl className={s.rows}>
                    {laneRows(step, all, hasOrderStep).map((r) => (
                      <div key={r.label} className={s.row}>
                        <dt>{r.label}</dt>
                        <dd>{r.value}</dd>
                      </div>
                    ))}
                  </dl>
                  {key && (
                    <div className={s.byColour}>
                      {lanes.map((l, j) => {
                        const k = byColour[j];
                        return (
                          <span key={l.variant} className={s.colourStat}>
                            <span className={s.swatch} style={{ background: colors[j] }} />
                            {name(l.variant)} <b>{k ? ratioText(k, k.whole > 0 ? k.part / k.whole : null) : "—"}</b>
                          </span>
                        );
                      })}
                    </div>
                  )}
                </section>
              </div>
            </Fragment>
          );
        })}
      </div>

      <div className={s.tools} onPointerDown={(e) => e.stopPropagation()}>
        <button type="button" className={s.tool} onClick={() => zoomCenter(1 / 1.2)} title="Zoom out" aria-label="Zoom out">
          −
        </button>
        <span className={s.zoom}>{Math.round(view.k * 100)}%</span>
        <button type="button" className={s.tool} onClick={() => zoomCenter(1.2)} title="Zoom in" aria-label="Zoom in">
          +
        </button>
        <button type="button" className={`${s.tool} ${s.fit}`} onClick={refit} title="Show the whole map">
          Fit
        </button>
      </div>
      <div className={s.hint}>Drag or scroll to move · ctrl/⌘ + scroll or pinch to zoom</div>
    </div>
  );
}
