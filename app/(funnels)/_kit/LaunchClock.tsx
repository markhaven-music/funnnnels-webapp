"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Currency } from "@/lib/geo";
import { money, nextBoundary, phaseAt, type Launch, type Money, type Phase } from "@/lib/launch";
import k from "./kit.module.css";

// The page is cached on the CDN, so the HTML can't know what time it is when
// a visitor opens it. This clock does: it starts at the moment the page was
// rendered (so the server HTML and the first browser render agree), switches
// to the visitor's clock after loading, and flips the phase the second a
// real launch date passes. Prices, countdowns and which sections show all
// read from it. The checkout's server makes the same call on its own clock.

type Clock = {
  phase: Phase;
  launch: Launch | null;
  price: Money;
  currency: Currency;
  editing: boolean;
  mounted: boolean;
};

const Ctx = createContext<Clock | null>(null);

export function useClock(): Clock {
  const c = useContext(Ctx);
  if (!c) throw new Error("useClock outside LaunchClock");
  return c;
}

// setTimeout can't wait longer than ~24.8 days.
const MAX_WAIT = 2 ** 31 - 1;

export function LaunchClock({
  launch,
  price,
  currency,
  renderedAt,
  editing = false,
  children,
}: {
  launch: Launch | null;
  price: Money;
  currency: Currency;
  renderedAt: number;
  editing?: boolean;
  children: ReactNode;
}) {
  const [now, setNow] = useState(renderedAt);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      const t = Date.now();
      setNow(t);
      const next = nextBoundary(launch, t);
      if (next !== null) timer = setTimeout(tick, Math.min(next - t + 50, MAX_WAIT));
    };
    tick();
    setMounted(true);
    // Back from a sleeping laptop or a background tab: re-check right away.
    const wake = () => document.visibilityState === "visible" && (clearTimeout(timer), tick());
    document.addEventListener("visibilitychange", wake);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", wake);
    };
  }, [launch]);

  const value: Clock = { phase: phaseAt(launch, now), launch, price, currency, editing, mounted };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** Children only in the given phases (in the editor: always). */
export function Phased({ show, children }: { show: Phase[]; children: ReactNode }) {
  const { phase, editing } = useClock();
  return <div hidden={!editing && !show.includes(phase)}>{children}</div>;
}

/** A price as text: right now, the early-bird or the full price. */
export function Price({ kind = "now" }: { kind?: "now" | "early" | "full" }) {
  const { launch, price, currency } = useClock();
  const now = useUnitPrice();
  const amount = kind === "now" ? now : kind === "early" && launch ? launch.early[currency] : price[currency];
  return <>{money(amount, currency)}</>;
}

/** The price in force now, as a number (for the checkout). Same rule as the server's. */
export function useUnitPrice(): number {
  const { phase, launch, price, currency } = useClock();
  return phase === "early" && launch ? launch.early[currency] : price[currency];
}

/**
 * A launch date. Server HTML and first render show UTC (they can't know the
 * visitor's zone); after loading it switches to the visitor's own time.
 */
export function When({ at }: { at: "cartOpen" | "deadline" }) {
  const { launch, mounted } = useClock();
  if (!launch) return null;
  const iso = at === "cartOpen" ? launch.cartOpenAt : launch.earlyBirdEndAt;
  return <span suppressHydrationWarning>{formatWhen(iso, mounted)}</span>;
}

export function formatWhen(iso: string, local: boolean): string {
  const d = new Date(iso);
  const opts: Intl.DateTimeFormatOptions = {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZoneName: "short",
    ...(local ? {} : { timeZone: "UTC" }),
  };
  return d.toLocaleString("en-GB", opts);
}

/** Time left until a launch date, ticking every second. Shows nothing once it's passed. */
export function Countdown({ to, className }: { to: "cartOpen" | "deadline"; className?: string }) {
  const { launch, mounted } = useClock();
  const target = launch ? Date.parse(to === "cartOpen" ? launch.cartOpenAt : launch.earlyBirdEndAt) : 0;
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    setNow(Date.now());
    return () => clearInterval(id);
  }, []);
  // Nothing in the cached HTML: the numbers would be wrong by the time anyone reads them.
  if (!launch || !mounted || now === null || now >= target) return null;
  const s = Math.floor((target - now) / 1000);
  const parts: [number, string][] = [
    [Math.floor(s / 86400), "d"],
    [Math.floor((s % 86400) / 3600), "h"],
    [Math.floor((s % 3600) / 60), "m"],
    [s % 60, "s"],
  ];
  const shown = parts[0][0] > 0 ? parts : parts.slice(1);
  return (
    <span className={`${k.countdown} ${className ?? ""}`} role="timer" aria-live="off">
      {shown.map(([n, u]) => (
        <span key={u} className={k.unit}>
          <b>{String(n).padStart(2, "0")}</b>
          {u}
        </span>
      ))}
    </span>
  );
}

/** Thin bar on top of the sales page during the early-bird: the real deadline and what happens after. */
export function EarlyBirdBar() {
  const { phase, launch, editing } = useClock();
  if (!launch || (phase !== "early" && !editing)) return null;
  return (
    <div className={k.bar}>
      <span>
        Early-bird: <b><Price kind="early" /></b> until <When at="deadline" />, then <Price kind="full" />.
      </span>
      <Countdown to="deadline" />
    </div>
  );
}
