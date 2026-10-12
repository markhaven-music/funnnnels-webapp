import s from "./box.module.css";

// The product, as a box: GRIND STUDIO wordmark, name, the real counts.
// Drawn in CSS so it stays sharp at any size (an AI render can replace it).
export function ProductBox({ size = "lg" }: { size?: "lg" | "md" }) {
  return (
    <div className={`${s.stage} ${s[size]}`} aria-label="Jazz MIDI Pack box by GRIND STUDIO: 3,536 MIDI files">
      <div className={s.box}>
        <div className={s.front}>
          <span className={s.brand}>
            GRIND <Diamond /> STUDIO
          </span>
          <span className={s.name}>
            <span className={s.jazz}>Jazz</span>
            <span className={s.midi}>MIDI PACK</span>
          </span>
          <span className={s.keys} aria-hidden>
            {Array.from({ length: 14 }, (_, i) => (
              <i key={i} className={[1, 2, 4, 5, 6, 8, 9, 11, 12, 13].includes(i) ? s.hasBlack : ""} />
            ))}
          </span>
          <span className={s.stats}>
            <b>3,536</b> MIDI files <span>·</span> <b>26</b> progressions <span>·</span> <b>13</b> voicings
          </span>
          <span className={s.format}>MIDI FORMAT</span>
        </div>
        <div className={s.side} aria-hidden>
          <span>JAZZ MIDI PACK · GRIND STUDIO</span>
        </div>
      </div>
      <span className={s.floor} aria-hidden />
    </div>
  );
}

function Diamond() {
  return (
    <svg viewBox="0 0 10 10" width="0.8em" height="0.8em" aria-hidden className={s.diamond}>
      <path d="M5 0 10 5 5 10 0 5z" fill="currentColor" />
    </svg>
  );
}
