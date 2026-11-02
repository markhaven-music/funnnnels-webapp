import { funnel } from "./funnel";
import s from "./jazz.module.css";

// The hero video (vsl/script-en.md, made with tools/jazz_vsl.py) in Wistia's
// own player, shown straight away with its thumbnail (the still set on the
// media). From 2026-10-30 it was briefly a plain <video> playing Wistia's MP4
// files; the user wanted Wistia's player back ("Wistia player back").
export function Vsl() {
  return (
    <div className={s.vsl}>
      <iframe
        src={`https://fast.wistia.net/embed/iframe/${funnel.vsl.wistiaId}?playerColor=f5b800&videoFoam=false`}
        title="Jazz MIDI Pack: same chords, played like a pianist"
        allow="autoplay; fullscreen"
        allowFullScreen
      />
    </div>
  );
}
