"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import s from "./fbb.module.css";

// The page's audio: the pack's own previews (each file played on a drum kit, 12 seconds,
// public/funnels/famous-beats-bundle/beats, made from the zip's WAV/MP3 previews on
// 2026-11-09). Nothing loads before a tap (docs/page-speed.md): one <audio> per player,
// preload="none", and the song list itself is fetched on the first scroll or tap.
// One clip plays at a time across the page.
const DIR = "/funnels/famous-beats-bundle/beats";
const STOP_OTHERS = "fbb-play";

type Beat = { id: string; vol: number; bpm: number; artist: string; song: string };

function useOnlyOne(id: string, stop: () => void) {
  useEffect(() => {
    const on = (e: Event) => {
      if ((e as CustomEvent<string>).detail !== id) stop();
    };
    window.addEventListener(STOP_OTHERS, on);
    return () => window.removeEventListener(STOP_OTHERS, on);
  }, [id, stop]);
}
const claim = (id: string) => window.dispatchEvent(new CustomEvent(STOP_OTHERS, { detail: id }));

function Disc({ playing }: { playing: boolean }) {
  return (
    <span className={s.disc} aria-hidden>
      {playing ? <span className={s.square} /> : <span className={s.triangle} />}
    </span>
  );
}

/** One beat with the round yellow play disc, its name beside it. */
export function BeatClip({ id, artist, song, bpm }: { id: string; artist: string; song: string; bpm: number }) {
  const el = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const stop = () => {
    el.current?.pause();
    if (el.current) el.current.currentTime = 0;
    setPlaying(false);
  };
  useOnlyOne(id, stop);
  return (
    <button
      type="button"
      className={s.beatBtn}
      onClick={() => {
        if (playing) return stop();
        claim(id);
        void el.current?.play();
        setPlaying(true);
      }}
    >
      <audio ref={el} src={`${DIR}/${id}.mp3`} preload="none" onEnded={() => setPlaying(false)} />
      <span className={s.clip}>
        <Disc playing={playing} />
      </span>
      <span className={s.beatName}>
        <b>{song}</b>
        <span>
          {artist} · {bpm} BPM
        </span>
      </span>
      <span className={s.srOnly}>{playing ? "Stop" : "Play"}</span>
    </button>
  );
}

const FIRST = 24;

/** All 320 songs: a search box and the list, each with a play disc. */
export function BeatBrowser({ words }: { words: { search: string; showAll: string; none: string } }) {
  const box = useRef<HTMLDivElement>(null);
  const el = useRef<HTMLAudioElement>(null);
  const [beats, setBeats] = useState<Beat[] | null>(null);
  const [q, setQ] = useState("");
  const [all, setAll] = useState(false);
  const [playing, setPlaying] = useState<string | null>(null);
  const stop = () => {
    el.current?.pause();
    setPlaying(null);
  };
  useOnlyOne("browse", stop);

  // The list (30 KB) loads when the section comes near, not with the page.
  useEffect(() => {
    const node = box.current;
    if (!node) return;
    const load = () => {
      fetch(`${DIR}/beats.json`)
        .then((r) => r.json())
        .then((b: Beat[]) => setBeats(b))
        .catch(() => setBeats([]));
    };
    const io = new IntersectionObserver(
      (es) => {
        if (es.some((e) => e.isIntersecting)) {
          io.disconnect();
          load();
        }
      },
      { rootMargin: "600px" },
    );
    io.observe(node);
    return () => io.disconnect();
  }, []);

  const shown = useMemo(() => {
    if (!beats) return [];
    const t = q.trim().toLowerCase();
    if (!t) return beats;
    return beats.filter((b) => `${b.artist} ${b.song} ${b.bpm}`.toLowerCase().includes(t));
  }, [beats, q]);
  const list = q || all ? shown : shown.slice(0, FIRST);

  const play = (id: string) => {
    const a = el.current;
    if (!a) return;
    if (playing === id) return stop();
    claim("browse");
    a.src = `${DIR}/${id}.mp3`;
    void a.play();
    setPlaying(id);
  };

  return (
    <div className={s.browser} ref={box}>
      <audio ref={el} preload="none" onEnded={() => setPlaying(null)} />
      <label className={s.search}>
        <span className={s.srOnly}>{words.search}</span>
        <input type="search" placeholder={words.search} value={q} onChange={(e) => setQ(e.target.value)} autoComplete="off" />
      </label>
      <ol className={s.beats}>
        {list.map((b) => (
          <li key={b.id}>
            <button type="button" className={s.beatBtn} onClick={() => play(b.id)}>
              <span className={s.clip}>
                <Disc playing={playing === b.id} />
              </span>
              <span className={s.beatName}>
                <b>{b.song}</b>
                <span>
                  {b.artist} · {b.bpm} BPM · Vol.{b.vol}
                </span>
              </span>
              <span className={s.srOnly}>{playing === b.id ? "Stop" : "Play"}</span>
            </button>
          </li>
        ))}
      </ol>
      {beats && q && shown.length === 0 && <p className={s.none}>{words.none}</p>}
      {beats && !q && !all && shown.length > FIRST && (
        <button type="button" className={s.more} onClick={() => setAll(true)}>
          {words.showAll}
        </button>
      )}
    </div>
  );
}
