"use client";

import { useEffect, useRef, useState } from "react";
import { start, stop, unlock, type Roll } from "../piano";
import { SoundPicker } from "../SoundPicker";
import data from "./groups.json";
import p from "./player.module.css";

// Every progression of Vol. 2, playable (2026-11-16: "make sure they can listen to them", "show the buttons
// with the drums as first options cause they're more compelling"): one tab per group, a row per progression,
// its eight previews as buttons, the four drum loops first. A button plays a real file of the pack on loop,
// with its own drums for the genre loops and the soft beat under the others (piano.ts). Each progression's
// notes load on its first tap (public/funnels/jazz-midi-pack/vol2-v1/NN.json, ~6 KB gzipped), so the page
// carries none of them. vol2-v1: a new build gets a new folder (the brand domain caches these files).
const DIR = "/funnels/jazz-midi-pack/vol2-v1";
type Previews = Record<string, Roll>;
const cache = new Map<number, Promise<Previews>>();
// The tap that counts: a slower load from an earlier tap never starts over a later one.
let ticket = 0;
let pending: HTMLElement | null = null;

function load(n: number): Promise<Previews> {
  let got = cache.get(n);
  if (!got) {
    const url = `${DIR}/${String(n).padStart(2, "0")}.json`;
    const once = () => fetch(url).then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))));
    got = once().catch(() => new Promise((ok) => setTimeout(ok, 600)).then(once));
    cache.set(n, got);
    got.catch(() => cache.delete(n));
  }
  return got;
}

export function Vol2Player({ blurbs }: { blurbs: string[] }) {
  const [tab, setTab] = useState(0);
  const [failed, setFailed] = useState("");
  // stop whatever plays when the visitor switches group or leaves
  useEffect(() => () => stop(), []);
  const group = data.groups[tab];

  const play = (n: number, style: string, scope: HTMLElement) => {
    setFailed("");
    if (scope.getAttribute("data-state")) return stop();
    unlock(); // inside the tap (iOS), before the fetch
    stop();
    pending?.removeAttribute("data-state");
    const my = ++ticket;
    pending = scope;
    scope.setAttribute("data-state", "loading");
    load(n)
      .then((all) => {
        if (my !== ticket) return;
        pending = null;
        scope.removeAttribute("data-state");
        start(all[style], scope, { loop: true, beat: true });
      })
      .catch(() => {
        if (my !== ticket) return;
        pending = null;
        scope.removeAttribute("data-state");
        setFailed(`${n}`);
      });
  };

  return (
    <div className={p.player}>
      <div className={p.bar}>
        <div className={p.tabs} role="tablist" aria-label="Styles">
          {data.groups.map((g, i) => (
            <button
              key={g.title}
              type="button"
              role="tab"
              aria-selected={i === tab}
              className={p.tab}
              onClick={() => {
                stop();
                setTab(i);
              }}
            >
              {g.title} <span className={p.count}>{g.progs.length}</span>
            </button>
          ))}
        </div>
        <SoundPicker className={p.sound} />
      </div>
      <p className={p.blurb}>{blurbs[tab]}</p>
      <ol className={p.list}>
        {group.progs.map((prog) => (
          <li key={prog.n} className={p.row}>
            <div className={p.head}>
              <span className={p.num}>{String(prog.n).padStart(2, "0")}</span>
              <span className={p.name}>{prog.name}</span>
              <span className={p.meta}>
                {prog.key} · {prog.bars} bars
              </span>
            </div>
            <div className={p.styles}>
              {data.styles.map((s, i) => (
                <Style key={s.id} label={s.label} drums={i < 4} onPlay={(scope) => play(prog.n, s.id, scope)} />
              ))}
            </div>
            {failed === `${prog.n}` && <p className={p.failed}>That one didn’t load. Tap it again.</p>}
          </li>
        ))}
      </ol>
    </div>
  );
}

// One preview: its own scope, so piano.ts marks only this button as playing.
function Style({ label, drums, onPlay }: { label: string; drums: boolean; onPlay: (scope: HTMLElement) => void }) {
  const scope = useRef<HTMLSpanElement>(null);
  return (
    <span ref={scope} className={p.scope}>
      <button type="button" data-play aria-pressed="false" className={drums ? `${p.btn} ${p.drums}` : p.btn} onClick={() => scope.current && onPlay(scope.current)}>
        <span className={p.ico} aria-hidden />
        {label}
      </button>
    </span>
  );
}
