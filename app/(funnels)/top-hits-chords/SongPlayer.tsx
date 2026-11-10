"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { start, stop, toggle, unlock, type PlayOpts, type Roll } from "../jazz-midi-pack/piano";
import { Svg } from "../jazz-midi-pack/PlayableRoll";
import { SoundPicker } from "../jazz-midi-pack/SoundPicker";
import r from "../jazz-midi-pack/roll.module.css";
import b from "../jazz-midi-pack/browse.module.css";
import first from "./rolls.json";
import t from "./th.module.css";

// The whole bundle as a player, the Jazz pack browser's twin (2026-11-10): pick one of
// the four genre folders, then a song (Prev / menu / Next), or search all of them by
// artist, song, key or BPM. The file's first 8 bars are drawn as a piano roll from the
// real MIDI and played on the page's synth (sine or piano, ../../jazz-midi-pack/piano.ts),
// looping until Stop. tools/extract_top_hits.py reads them from the pack into
// public/funnels/top-hits-midi-bundle/browse-v1: songs.json (the list, loaded when the
// player nears the screen) and 20 chunks of 50 files (one fetched when a song in it is
// picked), so the page itself carries only the first file.

const DIR = "/funnels/top-hits-midi-bundle/browse-v1";
// [artist, title, bpm, key, folder, chunk, index in chunk]
type Song = [string, string, number | null, string | null, number, number, number];
type List = { total: number; folders: string[]; songs: Song[] };
type Shown = { roll: Roll; artist: string; title: string; key: string | null; folder: string };

const FOLDERS = ["Modern Pop & Ballads", "Hiphop, Trap & Urban", "Dance & Electronic", "Vintage Classics, Rock & Country"];
const FIRST: Shown = { roll: first.blinding as Roll, artist: first.blinding.artist, title: first.blinding.song, key: "Fm", folder: FOLDERS[0] };
const OPTS: PlayOpts = { loop: true };
const fmt = (n: number) => n.toLocaleString("en-US");
const name = (s: Song) => (s[0] ? `${s[0]} - ${s[1]}` : s[1]);

export function SongPlayer() {
  const root = useRef<HTMLDivElement>(null);
  const scope = useRef<HTMLDivElement>(null);
  const chunks = useRef(new Map<number, Promise<Roll[]>>());
  const seq = useRef(0);
  const [list, setList] = useState<List>();
  const [tab, setTab] = useState(0);
  const [cur, setCur] = useState(-1); // index in list.songs
  const [q, setQ] = useState("");
  const [shown, setShown] = useState<Shown>(FIRST);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (es) => {
        if (!es.some((e) => e.isIntersecting)) return;
        io.disconnect();
        fetch(`${DIR}/songs.json`)
          .then((res) => res.json())
          .then((l: List) => {
            setList(l);
            setCur(l.songs.findIndex((s) => s[0] === FIRST.artist && s[1] === FIRST.title));
          })
          .catch(() => {});
      },
      { rootMargin: "600px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // The songs of the open folder, and where each sits in the whole list.
  const inTab = useMemo(() => (list ? list.songs.map((s, i) => [s, i] as const).filter(([s]) => s[4] === tab) : []), [list, tab]);
  const counts = useMemo(() => FOLDERS.map((_, f) => (list ? list.songs.filter((s) => s[4] === f).length : 0)), [list]);
  const found = useMemo(() => {
    // every word typed must be in the song's artist, title, BPM or key ("sza 89", "f#m 84")
    const words = q.toLowerCase().split(/\s+/).filter(Boolean);
    if (!list || !words.length) return null;
    return list.songs
      .map((s, i) => [s, i] as const)
      .filter(([s]) => {
        const hay = `${s[0]} ${s[1]} ${s[2] ?? ""} ${s[3] ?? ""}`.toLowerCase();
        return words.every((x) => hay.includes(x));
      })
      .slice(0, 30);
  }, [list, q]);

  function chunk(k: number) {
    let p = chunks.current.get(k);
    if (!p) {
      p = fetch(`${DIR}/${k}.json`).then((res) => res.json());
      chunks.current.set(k, p);
      p.catch(() => chunks.current.delete(k));
    }
    return p;
  }

  // Every choice plays what it picked: the audio starts inside the tap (iOS), the file
  // follows its chunk's fetch.
  function choose(i: number) {
    const s = list?.songs[i];
    if (!s) return;
    setCur(i);
    setTab(s[4]);
    unlock();
    stop();
    const my = ++seq.current;
    setLoading(true);
    chunk(s[5])
      .then((files) => {
        if (my !== seq.current) return;
        const roll = files[s[6]];
        setShown({ roll, artist: s[0], title: s[1], key: s[3], folder: FOLDERS[s[4]] });
        setLoading(false);
        if (scope.current) start(roll, scope.current, OPTS);
      })
      .catch(() => my === seq.current && setLoading(false));
  }
  const step = (by: number) => {
    if (!inTab.length) return;
    const at = inTab.findIndex(([, i]) => i === cur);
    choose(inTab[(Math.max(0, at) + by + inTab.length) % inTab.length][1]);
  };

  const { roll } = shown;
  return (
    <div ref={root} className={b.player}>
      <div className={`${b.tabs} ${t.tabs4}`} role="tablist" aria-label="Folders of the bundle">
        {FOLDERS.map((f, i) => (
          <button
            key={f}
            type="button"
            role="tab"
            aria-selected={i === tab}
            className={b.tab}
            onClick={() => {
              if (i === tab || !list) return;
              setQ("");
              const one = list.songs.findIndex((s) => s[4] === i);
              if (one >= 0) choose(one);
            }}
          >
            <span className={b.tabN}>{i + 1}</span>
            <span className={b.tabLabel}>{f}</span>
            <span className={b.tabCount}>{list ? `${fmt(counts[i])} files` : "…"}</span>
          </button>
        ))}
      </div>

      <div className={b.pick}>
        <div className={b.dim}>
          <span className={b.dimLabel} id="th-song">
            Song
          </span>
          <div className={b.stepper}>
            <button type="button" className={b.step} aria-label="Previous song" onClick={() => step(-1)}>
              ‹ Prev
            </button>
            <select className={b.select} aria-labelledby="th-song" value={cur} onChange={(e) => choose(Number(e.target.value))}>
              {inTab.length ? (
                inTab.map(([s, i]) => (
                  <option key={i} value={i}>
                    {name(s)}
                  </option>
                ))
              ) : (
                <option value={-1}>
                  {FIRST.artist} - {FIRST.title}
                </option>
              )}
            </select>
            <button type="button" className={b.step} aria-label="Next song" onClick={() => step(1)}>
              Next ›
            </button>
          </div>
        </div>
        <div className={b.dim}>
          <span className={b.dimLabel} id="th-search">
            Search
          </span>
          <label className={t.search}>
            <span className={t.srOnly}>Search all the progressions</span>
            <input type="search" placeholder="Artist, song, key or BPM" value={q} onChange={(e) => setQ(e.target.value)} autoComplete="off" aria-labelledby="th-search" />
          </label>
        </div>
        {found && (
          <div className={b.dim}>
            <span className={b.dimLabel}>Found</span>
            <div className={b.chips} role="group" aria-label="Songs found">
              {found.map(([s, i]) => (
                <button key={i} type="button" className={b.chip} aria-pressed={i === cur} onClick={() => choose(i)}>
                  {s[1]}
                  {s[0] ? ` · ${s[0]}` : ""}
                </button>
              ))}
              {found.length === 0 && <span className={t.none}>No song matches that.</span>}
            </div>
          </div>
        )}
      </div>

      <div ref={scope} className={`${r.scope} ${r.browse} ${r.brass} ${b.viewer}`}>
        <div className={r.head}>
          <button type="button" className={r.play} data-play aria-pressed="false" disabled={loading} onClick={() => scope.current && toggle(roll, scope.current, OPTS)}>
            <span className={r.ico} aria-hidden />
            <span className={r.lPlay}>{loading ? "Loading" : "Play"}</span>
            <span className={r.lStop}>Stop</span>
            <span className={r.lLoad}>Loading</span>
          </button>
          <span className={r.text}>
            <span className={b.now}>
              {shown.title}
              {shown.artist ? ` · ${shown.artist}` : ""}
            </span>
            <span className={r.file}>
              {roll.bpm} BPM{shown.key ? ` · ${shown.key}` : ""} · first {roll.beats / 4} bars
            </span>
          </span>
          <div className={`${b.sounds} ${t.sounds}`}>
            <SoundPicker />
          </div>
        </div>
        <Svg roll={roll} chordsRow={false} />
      </div>
      <p className={b.path}>
        <span className={b.pathLabel}>In the bundle</span> TOP HITS MIDI Bundle / {FOLDERS.indexOf(shown.folder) + 1}. {shown.folder} / {roll.file}
      </p>
    </div>
  );
}
