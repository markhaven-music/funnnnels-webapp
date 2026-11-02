"use client";

import { useSyncExternalStore } from "react";
import { getSound, setSound, type Sound } from "./piano";
import s from "./roll.module.css";

const subscribe = (cb: () => void) => {
  window.addEventListener("jazz:sound", cb);
  return () => window.removeEventListener("jazz:sound", cb);
};
const server = (): Sound => "sine";

// Sine pluck or piano for every preview on the page ("dai possibilità di
// scegliere tra un pluck di sine o il suono di un piano"): one pick, shared by
// every picker, remembered per browser (piano.ts).
export function SoundPicker({ className }: { className?: string }) {
  const sound = useSyncExternalStore(subscribe, getSound, server);
  return (
    <div className={className ? `${s.sound} ${className}` : s.sound} role="group" aria-label="Preview sound">
      {(["sine", "piano"] as const).map((v) => (
        <button key={v} type="button" className={s.soundBtn} aria-pressed={sound === v} onClick={() => setSound(v)}>
          {v === "sine" ? "Sine" : "Piano"}
        </button>
      ))}
    </div>
  );
}
