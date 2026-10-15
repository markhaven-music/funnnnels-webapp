import box from "../jazz-midi-pack/box.module.css";

// The product as a box, drawn in CSS like the Jazz pack's: GRIND STUDIO
// wordmark, the name in two lines, the tagline. No image to make or upload.

/** "Neo Soul MIDI Pack" → ["Neo Soul", "MIDI PACK"]; short names keep their first word big. */
export function splitName(name: string): [string, string] {
  const words = name.trim().split(/\s+/);
  const cut = words.length > 2 ? words.length - 2 : 1;
  return [words.slice(0, cut).join(" "), words.slice(cut).join(" ").toUpperCase()];
}

export function KitBox({ name, tagline, size = "lg" }: { name: string; tagline: string; size?: "lg" | "md" }) {
  const [big, small] = splitName(name);
  // Long first lines shrink to stay on the box.
  const scale = Math.min(1, 7 / Math.max(big.length, 1));
  return (
    <div className={`${box.stage} ${box[size]}`} aria-label={`${name} by GRIND STUDIO`}>
      <div className={box.box}>
        <div className={box.front}>
          <span className={box.brand}>
            GRIND <Diamond /> STUDIO
          </span>
          <span className={box.name}>
            <span className={box.jazz}>
              <span style={{ fontSize: `${scale}em` }}>{big}</span>
            </span>
            {small && <span className={box.midi}>{small}</span>}
          </span>
          <span className={box.keys} aria-hidden>
            {Array.from({ length: 14 }, (_, i) => (
              <i key={i} className={[1, 2, 4, 5, 6, 8, 9, 11, 12, 13].includes(i) ? box.hasBlack : ""} />
            ))}
          </span>
          {tagline && <span className={box.stats}>{tagline}</span>}
          <span className={box.format}>MIDI FORMAT</span>
        </div>
        <div className={box.side} aria-hidden>
          <span>{name.toUpperCase()} · GRIND STUDIO</span>
        </div>
      </div>
      <span className={box.floor} aria-hidden />
    </div>
  );
}

function Diamond() {
  return (
    <svg viewBox="0 0 10 10" width="0.8em" height="0.8em" aria-hidden className={box.diamond}>
      <path d="M5 0 10 5 5 10 0 5z" fill="currentColor" />
    </svg>
  );
}
