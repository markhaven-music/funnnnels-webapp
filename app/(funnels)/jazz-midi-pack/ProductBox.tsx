import s from "./shot.module.css";

// The product, from the real box artwork (GRIND STUDIO "MIDI JAZZ PACK").
// Renders made with Higgsfield and saved as webp in public/funnels/jazz-midi-pack:
// "hero" = the box with gold piano-roll notes and .mid files flying out,
// "box" = the box alone, background removed.
const DIR = "/funnels/jazz-midi-pack";

const SHOTS = {
  hero: { src: [600, 960], w: 960, h: 1315 },
  box: { src: [520, 900], w: 900, h: 1282 },
} as const;

export function ProductBox({ variant = "box", priority = false }: { variant?: "hero" | "box"; priority?: boolean }) {
  const shot = SHOTS[variant];
  return (
    <div className={`${s.stage} ${s[variant]}`}>
      <img
        className={s.img}
        src={`${DIR}/${variant}-${shot.src[0]}.webp`}
        srcSet={shot.src.map((w) => `${DIR}/${variant}-${w}.webp ${w}w`).join(", ")}
        sizes={variant === "hero" ? "(min-width: 1000px) 380px, 86vw" : "(min-width: 1000px) 360px, 64vw"}
        width={shot.w}
        height={shot.h}
        alt="Jazz MIDI Pack box by GRIND STUDIO: the most important jazz progressions, as MIDI files"
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        decoding="async"
      />
      {variant === "box" && <span className={s.floor} aria-hidden />}
    </div>
  );
}

/** A wide photo with the box in it: the DAW desk, the club stage. */
export function Scene({ name, alt, className }: { name: "daw" | "stage"; alt: string; className?: string }) {
  const sizes = name === "daw" ? [900, 1600] : [1100, 2200];
  const dims = name === "daw" ? [1600, 905] : [2200, 943];
  return (
    <img
      className={className}
      src={`${DIR}/${name}-${sizes[0]}.webp`}
      srcSet={sizes.map((w) => `${DIR}/${name}-${w}.webp ${w}w`).join(", ")}
      sizes={name === "daw" ? "(min-width: 1160px) 1120px, 100vw" : "100vw"}
      width={dims[0]}
      height={dims[1]}
      alt={alt}
      loading="lazy"
      decoding="async"
    />
  );
}
