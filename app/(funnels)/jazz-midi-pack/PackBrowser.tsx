"use client";

import { useEffect, useRef, useState } from "react";
import rolls from "./rolls.json";
import { start, toggle, type Roll } from "./piano";
import { Svg } from "./PlayableRoll";
import r from "./roll.module.css";
import b from "./browse.module.css";

// The whole pack, folder by folder, every file playable: the notes of all
// 3,536 files come from tools/extract_browse.py (public/funnels/jazz-midi-pack/
// browse). The folder tree (3 KB) loads when the browser nears the screen and
// a folder's files when it's opened, so the page carries none of it. A file
// plays on the grand piano sample like the other rolls; drums are drawn, not
// played.
type Node = { n: string; c?: Node[]; k?: number; f?: number };

const DIR = "/funnels/jazz-midi-pack/browse";
const count = (x: Node): number => x.f ?? (x.c ?? []).reduce((a, c) => a + count(c), 0);
const fmt = (n: number) => n.toLocaleString("en-US");

export function PackBrowser() {
  const root = useRef<HTMLDivElement>(null);
  const scope = useRef<HTMLDivElement>(null);
  const [tree, setTree] = useState<Node>();
  const [path, setPath] = useState<number[]>([]);
  const [files, setFiles] = useState<Record<number, Roll[]>>({});
  const [roll, setRoll] = useState<Roll>(rolls.ballad as Roll);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (es) => {
        if (!es.some((e) => e.isIntersecting)) return;
        io.disconnect();
        fetch(`${DIR}/index.json`)
          .then((res) => res.json())
          .then(setTree)
          .catch(() => {});
      },
      { rootMargin: "600px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const trail = tree ? path.reduce<Node[]>((acc, i) => [...acc, acc[acc.length - 1].c![i]], [tree]) : [];
  const here = trail[trail.length - 1];
  const k = here?.k;

  useEffect(() => {
    if (k === undefined || files[k]) return;
    fetch(`${DIR}/${k}.json`)
      .then((res) => res.json())
      .then((list: Roll[]) => setFiles((f) => ({ ...f, [k]: list })))
      .catch(() => {});
  }, [k, files]);

  // Play inside the tap itself (iOS), then show the file.
  function pick(f: Roll) {
    if (scope.current && f.notes.length) start(f, scope.current);
    setRoll(f);
  }

  const drumsOnly = roll.notes.length === 0;
  const list = k === undefined ? undefined : files[k];

  return (
    <div ref={root} className={b.browser}>
      <div ref={scope} className={`${r.scope} ${r.browse} ${r.brass} ${b.viewer}`}>
        <div className={r.head}>
          <button
            type="button"
            className={r.play}
            aria-pressed="false"
            disabled={drumsOnly}
            onClick={() => scope.current && toggle(roll, scope.current)}
          >
            <span className={r.ico} aria-hidden />
            <span className={r.lPlay}>{drumsOnly ? "Drums" : "Play"}</span>
            <span className={r.lStop}>Stop</span>
            <span className={r.lLoad}>Loading</span>
          </button>
          <span className={r.text}>
            <span className={b.now}>{roll.file}</span>
            {drumsOnly && <span className={r.file}>Drum MIDI: it plays through your drum kit in the DAW</span>}
          </span>
          <span className={r.meta}>{roll.bpm} bpm</span>
        </div>
        <Svg roll={roll} chordsRow={!drumsOnly} />
      </div>

      <nav className={b.crumbs} aria-label="Folder">
        <button type="button" onClick={() => setPath([])} aria-current={path.length === 0 ? "page" : undefined}>
          Jazz MIDI Pack
        </button>
        {trail.slice(1).map((n, i) => (
          <span key={i} className={b.crumb}>
            <span aria-hidden>/</span>
            <button
              type="button"
              onClick={() => setPath(path.slice(0, i + 1))}
              aria-current={i === path.length - 1 ? "page" : undefined}
            >
              {n.n}
            </button>
          </span>
        ))}
      </nav>

      <ul className={b.list}>
        {!tree && <li className={b.wait}>Opening the pack…</li>}
        {here?.c?.map((c, i) => (
          <li key={c.n}>
            <button type="button" className={b.row} onClick={() => setPath([...path, i])}>
              <span className={b.folder} aria-hidden />
              <span className={b.name}>{c.n}</span>
              <span className={b.count}>{fmt(count(c))} files</span>
            </button>
          </li>
        ))}
        {k !== undefined && !list && <li className={b.wait}>Loading the files…</li>}
        {list?.map((f) => (
          <li key={f.file}>
            <button
              type="button"
              className={`${b.row} ${f.file === roll.file ? b.on : ""}`}
              onClick={() => pick(f)}
            >
              <span className={f.notes.length ? b.tri : b.drum} aria-hidden />
              <span className={b.name}>{f.file.replace(/\.mid$/, "")}</span>
              <span className={b.count}>{f.bpm} bpm</span>
            </button>
          </li>
        ))}
      </ul>
      {tree && (
        <p className={b.total}>
          {fmt(count(tree))} files in {tree.c?.length} folders. Tap a folder, then a file.
        </p>
      )}
    </div>
  );
}
