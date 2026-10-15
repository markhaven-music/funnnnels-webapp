"use client";

import { useMemo, useState } from "react";
import songs from "./songs.json";
import s from "./landing.module.css";

// The searchable list of every progression in the pack, as on ClickFunnels:
// stats banner, search box, one card per artist. songs.json was read off the
// ClickFunnels page: [artist, [[song, bpm], …]].
type Artist = [string, [string, number | null][]];
const ALL = songs as Artist[];

export function Tracklist() {
  const [q, setQ] = useState("");
  const needle = q.trim().toLowerCase();
  const shown = useMemo(() => {
    if (!needle) return ALL;
    return ALL.flatMap(([artist, list]): Artist[] => {
      if (artist.toLowerCase().includes(needle)) return [[artist, list]];
      const hits = list.filter(([song]) => song.toLowerCase().includes(needle));
      return hits.length ? [[artist, hits]] : [];
    });
  }, [needle]);
  const count = shown.reduce((n, [, list]) => n + list.length, 0);

  return (
    <div className={s.tracklist}>
      <div className={s.banner}>
        <div className={s.bannerInner}>
          <span className={s.stat}><strong>1000</strong><span>PROGRESSIONS</span></span>
          <span className={s.divider} />
          <span className={s.stat}><strong>496</strong><span>ARTISTS</span></span>
          <span className={s.divider} />
          <span className={s.stat}><strong>100%</strong><span>TOP HITS</span></span>
        </div>
      </div>
      <div className={`${s.searchWrap} ${q ? s.hasValue : ""}`}>
        <svg className={s.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          className={s.search}
          placeholder="Search artist or song..."
          aria-label="Search tracklist"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button type="button" className={s.clear} aria-label="Clear search" onClick={() => setQ("")}>
          ×
        </button>
      </div>
      {needle && shown.length > 0 && (
        <div className={s.resultBar}>
          {count} {count === 1 ? "progression" : "progressions"} found
        </div>
      )}
      <div className={s.grid}>
        {shown.map(([artist, list]) => (
          <div key={artist} className={s.artist}>
            <div className={s.artistHead}>
              <h3 className={s.artistName}>{artist}</h3>
              <span className={s.artistCount}>{list.length}</span>
            </div>
            <ul className={s.songs}>
              {list.map(([song, bpm], i) => (
                <li key={i} className={s.song}>
                  <span className={s.songName}>{song}</span>
                  {bpm && <span className={s.bpm}>{bpm} BPM</span>}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      {shown.length === 0 && <p className={s.empty}>No progressions match your search. Try another artist or song.</p>}
    </div>
  );
}
