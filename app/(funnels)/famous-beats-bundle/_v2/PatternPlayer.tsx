"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import b from "../../jazz-midi-pack/browse.module.css";
import f from "./fbb.module.css";

// The pattern player, the Jazz pack browser's twin (2026-11-09, "add player that lets you hear
// every pattern"): pick one of the 32 packs (Prev / menu / Next, as on Jazz), then one of its 10
// songs; the file's first bar is drawn lane by lane from the real MIDI (rolls.json, read from the
// pack's .mid files) and the play button plays that song's preview from the pack (the pack's own
// drum render, 12 s). Or search all 320 by artist, song or BPM. The song list and the rolls
// (~100 KB) load when the player comes near the screen; audio only on a tap.

const DIR = "/funnels/famous-beats-bundle/beats";
const STOP_OTHERS = "fbb-play";

type Beat = { id: string; vol: number; bpm: number; artist: string; song: string };
type Roll = { f: string; k?: [number, number][]; s?: [number, number][]; h?: [number, number][]; o?: [number, number][]; p?: [number, number][] };

const LANES: [keyof Roll, string][] = [
  ["h", "Hats"],
  ["o", "Open hat"],
  ["s", "Snare"],
  ["k", "Kick"],
  ["p", "Perc"],
];

export function PatternPlayer({ start = "20-2094pologmartinandgina" }: { start?: string }) {
  const box = useRef<HTMLDivElement>(null);
  const audio = useRef<HTMLAudioElement>(null);
  const [beats, setBeats] = useState<Beat[] | null>(null);
  const [rolls, setRolls] = useState<Record<string, Roll>>({});
  const [vol, setVol] = useState(20);
  const [id, setId] = useState(start);
  const [q, setQ] = useState("");
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const node = box.current;
    if (!node) return;
    const io = new IntersectionObserver(
      (es) => {
        if (!es.some((e) => e.isIntersecting)) return;
        io.disconnect();
        fetch(`${DIR}/beats.json`).then((r) => r.json()).then(setBeats).catch(() => setBeats([]));
        fetch(`${DIR}/rolls.json`).then((r) => r.json()).then(setRolls).catch(() => {});
      },
      { rootMargin: "600px" },
    );
    io.observe(node);
    return () => io.disconnect();
  }, []);

  // Another player on the page started: this one stops.
  useEffect(() => {
    const on = (e: Event) => {
      if ((e as CustomEvent<string>).detail !== "pattern") {
        audio.current?.pause();
        setPlaying(false);
      }
    };
    window.addEventListener(STOP_OTHERS, on);
    return () => window.removeEventListener(STOP_OTHERS, on);
  }, []);

  const packs = useMemo(() => [...new Set((beats ?? []).map((x) => x.vol))].sort((a, z) => a - z), [beats]);
  const chips = useMemo(() => {
    if (!beats) return [];
    const t = q.trim().toLowerCase();
    if (t) return beats.filter((x) => `${x.artist} ${x.song} ${x.bpm}`.toLowerCase().includes(t)).slice(0, 24);
    return beats.filter((x) => x.vol === vol).sort((a, z) => a.bpm - z.bpm);
  }, [beats, q, vol]);
  const beat = beats?.find((x) => x.id === id);
  const roll = rolls[id];

  const play = (next: string) => {
    const a = audio.current;
    if (!a) return;
    window.dispatchEvent(new CustomEvent(STOP_OTHERS, { detail: "pattern" }));
    a.src = `${DIR}/${next}.mp3`;
    a.loop = true;
    void a.play();
    setPlaying(true);
  };
  const pick = (x: Beat) => {
    setId(x.id);
    setVol(x.vol);
    if (playing) play(x.id);
  };
  const toggle = () => {
    if (playing) {
      audio.current?.pause();
      setPlaying(false);
    } else play(id);
  };
  const go = (to: number) => {
    const v = packs.length ? packs[(packs.indexOf(vol) + to + packs.length) % packs.length] : vol;
    setVol(v);
    setQ("");
    const first = beats?.filter((x) => x.vol === v).sort((a, z) => a.bpm - z.bpm)[0];
    if (first) {
      setId(first.id);
      if (playing) play(first.id);
    }
  };

  return (
    <div className={b.player} ref={box}>
      <audio ref={audio} preload="none" />
      <div className={b.pick}>
        <div className={b.dim}>
          <span className={b.dimLabel} id="fbb-pack">
            Pack
          </span>
          <div className={b.stepper}>
            <button type="button" className={b.step} aria-label="Previous pack" onClick={() => go(-1)}>
              ‹ Prev
            </button>
            <select className={b.select} aria-labelledby="fbb-pack" value={vol} onChange={(e) => go(packs.indexOf(Number(e.target.value)) - packs.indexOf(vol))}>
              {(packs.length ? packs : [vol]).map((v) => (
                <option key={v} value={v}>
                  Famous Beats Vol.{v}
                </option>
              ))}
            </select>
            <button type="button" className={b.step} aria-label="Next pack" onClick={() => go(1)}>
              Next ›
            </button>
          </div>
        </div>
        <div className={b.dim}>
          <span className={b.dimLabel} id="fbb-search">
            Search
          </span>
          <label className={f.search}>
            <span className={f.srOnly}>Search all 320 songs</span>
            <input type="search" placeholder="Artist, song or BPM" value={q} onChange={(e) => setQ(e.target.value)} autoComplete="off" aria-labelledby="fbb-search" />
          </label>
        </div>
        <div className={b.dim}>
          <span className={b.dimLabel}>Song</span>
          <div className={b.chips} role="group" aria-label="Songs">
            {chips.map((x) => (
              <button key={x.id} type="button" className={b.chip} aria-pressed={x.id === id} onClick={() => pick(x)}>
                {x.song} · {x.artist}
              </button>
            ))}
            {beats && chips.length === 0 && <span className={f.none}>No song matches that.</span>}
          </div>
        </div>
      </div>

      <div className={f.viewer}>
        <div className={f.viewHead}>
          <button type="button" className={f.beatBtn} onClick={toggle} style={{ width: "auto" }}>
            <span className={f.clip}>
              <span className={f.disc} aria-hidden>
                {playing ? <span className={f.square} /> : <span className={f.triangle} />}
              </span>
            </span>
            <span className={f.beatName}>
              <b>{beat?.song ?? "Martin And Gina"}</b>
              <span>
                {beat?.artist ?? "Polo G"} · {beat?.bpm ?? 94} BPM
              </span>
            </span>
            <span className={f.srOnly}>{playing ? "Stop" : "Play"}</span>
          </button>
        </div>
        <div className={f.rollBody} aria-hidden>
          {LANES.filter(([k]) => roll?.[k]?.length).map(([k, name]) => (
            <div key={k} className={f.rollRow}>
              <span className={f.rollName}>{name}</span>
              <div className={f.rollLane}>
                {Array.from({ length: 16 }, (_, i) => (
                  <i key={i} className={i % 4 === 0 ? f.beatLine : f.stepLine} style={{ left: `${(i / 16) * 100}%` }} />
                ))}
                {(roll![k] as [number, number][]).map(([at, vel], i) => (
                  <b
                    key={i}
                    className={Math.abs(at * 4 - Math.round(at * 4)) > 0.04 ? f.rollOff : f.rollHit}
                    style={{ left: `${(at / 4) * 100}%`, height: `${Math.max(12, Math.round((vel / 127) * 100))}%` }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
        {roll && <p className={f.rollCap}>One bar of the file, lane by lane. Taller = harder, yellow = off the grid.</p>}
      </div>
      <p className={b.path}>
        <span className={b.pathLabel}>In the pack</span> Famous Beats Bundle / Famous Beats Vol.{beat?.vol ?? vol} / {roll?.f ?? "…"}
      </p>
    </div>
  );
}
