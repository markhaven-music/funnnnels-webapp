"use client";

import { useEffect, useRef, useState } from "react";
import rolls from "./rolls.json";
import { start, stop, toggle, unlock, type Roll } from "./piano";
import { Svg } from "./PlayableRoll";
import r from "./roll.module.css";
import b from "./browse.module.css";

// The whole pack as a player: pick one of the five folders, then what the
// folder varies (Progression · Voicing · Rhythm, Progression · Key, …), and
// that file plays, drawn as a piano roll, with its place in the pack under it.
// The notes of all 3,536 files come from tools/extract_browse.py
// (public/funnels/jazz-midi-pack/browse): pack.json (the choices, ≈22 KB
// gzipped) loads when the player nears the screen and a folder's files when
// one of them is picked, so the page carries none of it. Drums are drawn, not
// played (the player has only the sine synth).
type Dim = { label: string; opts: string[] };
type Folder = { label: string; folder: string; what: string; dims: Dim[]; files: Record<string, [number, number]> };
type Pack = { total: number; folders: Folder[]; paths: string[] };
type Shown = { roll: Roll; labels: string[]; path: string };

const DIR = "/funnels/jazz-midi-pack/browse";
const FIRST: Shown = {
  roll: rolls.ballad as Roll,
  labels: ["ii-V-I Major", "Best Voicing", "Ballad Arpeggios"],
  path: "1 Chords in Original Key/01 ii-V-I Major/01 Best Voicing",
};
const fmt = (n: number) => n.toLocaleString("en-US");
// Short choices (keys, parts, genres, rhythms) as buttons; long lists as a menu.
const asChips = (d: Dim) => d.opts.length <= 8 || d.opts.every((o) => o.length <= 3);

export function PackBrowser() {
  const root = useRef<HTMLDivElement>(null);
  const scope = useRef<HTMLDivElement>(null);
  const chunks = useRef(new Map<number, Promise<Roll[]>>());
  const seq = useRef(0);
  const [pack, setPack] = useState<Pack>();
  const [tab, setTab] = useState(0);
  const [sel, setSel] = useState<number[][]>([]);
  const [shown, setShown] = useState<Shown>(FIRST);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (es) => {
        if (!es.some((e) => e.isIntersecting)) return;
        io.disconnect();
        fetch(`${DIR}/pack.json`)
          .then((res) => res.json())
          .then((p: Pack) => {
            setSel(p.folders.map((f) => f.dims.map(() => 0)));
            setPack(p);
          })
          .catch(() => {});
      },
      { rootMargin: "600px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  function chunk(k: number) {
    let p = chunks.current.get(k);
    if (!p) {
      p = fetch(`${DIR}/${k}.json`).then((res) => res.json());
      chunks.current.set(k, p);
      p.catch(() => chunks.current.delete(k));
    }
    return p;
  }

  // Every choice plays what it picked: the audio starts inside the tap (iOS),
  // the file follows its folder's fetch.
  function choose(t: number, s: number[]) {
    if (!pack) return;
    const folder = pack.folders[t];
    const at = folder.files[s.join(".")];
    setTab(t);
    setSel((all) => all.map((x, i) => (i === t ? s : x)));
    if (!at) return;
    unlock();
    stop();
    const my = ++seq.current;
    setLoading(true);
    chunk(at[0])
      .then((list) => {
        if (my !== seq.current) return;
        const f = list[at[1]];
        setShown({ roll: f, labels: folder.dims.map((d, i) => d.opts[s[i]]), path: pack.paths[at[0]] });
        setLoading(false);
        if (f.notes.length && scope.current) start(f, scope.current);
      })
      .catch(() => my === seq.current && setLoading(false));
  }

  const folder = pack?.folders[tab];
  const cur = sel[tab] ?? [];
  const { roll } = shown;
  const drumsOnly = roll.notes.length === 0;

  return (
    <div ref={root} className={b.player}>
      <div className={b.tabs} role="tablist" aria-label="Folders of the pack">
        {(pack?.folders ?? []).map((f, i) => (
          <button
            key={f.label}
            type="button"
            role="tab"
            aria-selected={i === tab}
            className={b.tab}
            onClick={() => i !== tab && choose(i, sel[i])}
          >
            <span className={b.tabN}>{i + 1}</span>
            <span className={b.tabLabel}>{f.label}</span>
            <span className={b.tabCount}>{fmt(Object.keys(f.files).length)} files</span>
          </button>
        ))}
        {!pack && <span className={b.wait}>Opening the pack…</span>}
      </div>

      {folder && (
        <div className={b.pick}>
          <p className={b.what}>{folder.what}</p>
          {folder.dims.map((d, di) => (
            <div key={d.label} className={b.dim}>
              <span className={b.dimLabel} id={`dim-${tab}-${di}`}>
                {d.label}
              </span>
              {asChips(d) ? (
                <div className={b.chips} role="group" aria-labelledby={`dim-${tab}-${di}`}>
                  {d.opts.map((o, oi) => (
                    <button
                      key={o}
                      type="button"
                      className={b.chip}
                      aria-pressed={cur[di] === oi}
                      onClick={() => choose(tab, cur.map((x, i) => (i === di ? oi : x)))}
                    >
                      {o}
                    </button>
                  ))}
                </div>
              ) : (
                <select
                  className={b.select}
                  aria-labelledby={`dim-${tab}-${di}`}
                  value={cur[di] ?? 0}
                  onChange={(e) => choose(tab, cur.map((x, i) => (i === di ? Number(e.target.value) : x)))}
                >
                  {d.opts.map((o, oi) => (
                    <option key={o} value={oi}>
                      {o}
                    </option>
                  ))}
                </select>
              )}
            </div>
          ))}
        </div>
      )}

      <div ref={scope} className={`${r.scope} ${r.browse} ${r.brass} ${b.viewer}`}>
        <div className={r.head}>
          <button
            type="button"
            className={r.play}
            aria-pressed="false"
            disabled={drumsOnly || loading}
            onClick={() => scope.current && toggle(roll, scope.current)}
          >
            <span className={r.ico} aria-hidden />
            <span className={r.lPlay}>{loading ? "Loading" : drumsOnly ? "Drums" : "Play"}</span>
            <span className={r.lStop}>Stop</span>
            <span className={r.lLoad}>Loading</span>
          </button>
          <span className={r.text}>
            <span className={b.now}>{shown.labels.join(" · ")}</span>
            <span className={r.file}>
              {drumsOnly ? "Drum MIDI: it plays through your drum kit in the DAW" : `${roll.bpm} bpm`}
            </span>
          </span>
        </div>
        <Svg roll={roll} chordsRow={!drumsOnly} />
      </div>
      <p className={b.path}>
        <span className={b.pathLabel}>In the pack</span> Jazz MIDI Pack / {shown.path.split("/").join(" / ")} / {roll.file}
      </p>
    </div>
  );
}
