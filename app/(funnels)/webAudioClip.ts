"use client";

// Recordings (mp3, m4a) played through Web Audio instead of an <audio> element, for the funnel pages' demos.
//
// Why (2026-11-12, "le demo … non caricano (sono da iphone)"): for every <audio> Safari first asks for two bytes of
// the file (a Range request), and for a few seconds after such a request the CDN of m.thegrind.studio answers
// whole-file and range requests for the same file with that 2-byte partial response. On an iPhone the clips stayed
// silent. Here the file is fetched whole (asked again under another address if a partial answer comes back),
// decoded, and played with the context woken inside the tap, as the Drum Kit landing's pads always were.
//
// One recording plays at a time across the page: starting one stops the one before (its onEnd is called).

type AC = typeof AudioContext;
let ctx: AudioContext | null = null;
const buffers = new Map<string, Promise<AudioBuffer>>();

/** The page's audio context; call it inside the tap, before anything is awaited. */
export function audioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor = (window.AudioContext || (window as unknown as { webkitAudioContext?: AC }).webkitAudioContext) as AC | undefined;
    if (!Ctor) return null;
    ctx = new Ctor();
    try {
      // iOS: play with the ringer switch off too (Safari 16.4+)
      (navigator as unknown as { audioSession?: { type: string } }).audioSession!.type = "playback";
    } catch {
      // older browsers
    }
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

async function whole(url: string): Promise<ArrayBuffer> {
  let r = await fetch(url);
  if (r.status === 206 || !r.ok) r = await fetch(`${url}${url.includes("?") ? "&" : "?"}whole=1`);
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.arrayBuffer();
}

/** The decoded recording (fetched once per page). */
export function loadClip(url: string): Promise<AudioBuffer> {
  let p = buffers.get(url);
  if (!p) {
    p = whole(url).then((ab) => new Promise<AudioBuffer>((ok, no) => audioContext()!.decodeAudioData(ab, ok, no)));
    p.catch(() => buffers.delete(url));
    buffers.set(url, p);
  }
  return p;
}

export type Playing = { stop: () => void; position: () => number; duration: number };
let current: { stop: () => void } | null = null;

/** Stops whatever recording plays on the page. */
export function stopClip() {
  const c = current;
  current = null;
  c?.stop();
}

/**
 * Plays a recording from `offset` seconds; `loop` repeats it. onEnd: it finished, was stopped, or another one
 * started. Resolves to its handle, or null if something else started (or it failed) while it loaded.
 */
export async function playClip(url: string, opts: { offset?: number; loop?: boolean; onEnd?: () => void } = {}): Promise<Playing | null> {
  const c = audioContext();
  stopClip();
  if (!c) {
    opts.onEnd?.();
    return null;
  }
  let ended = false;
  const end = () => {
    if (ended) return;
    ended = true;
    opts.onEnd?.();
  };
  const waiting = { stop: end };
  current = waiting;
  let buf: AudioBuffer;
  try {
    buf = await loadClip(url);
  } catch {
    if (current === waiting) current = null;
    end();
    return null;
  }
  if (current !== waiting) return null;
  const src = c.createBufferSource();
  src.buffer = buf;
  src.loop = !!opts.loop;
  src.connect(c.destination);
  const off = (opts.offset ?? 0) % buf.duration;
  const t0 = c.currentTime;
  src.start(0, off);
  const handle: Playing = {
    stop: () => {
      try {
        src.stop();
      } catch {
        // already stopped
      }
      end();
    },
    position: () => (off + c.currentTime - t0) % buf.duration,
    duration: buf.duration,
  };
  src.onended = () => {
    if (current === handle) current = null;
    end();
  };
  current = handle;
  return handle;
}
