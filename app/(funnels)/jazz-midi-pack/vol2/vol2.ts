// Jazz MIDI Pack Vol. 2: what the upsell page may say about it. Counted from ~/Desktop/Jazz MIDI Pack Vol. 2
// on 2026-11-15 (make_pack_vol2.py: 10,496 files parsed back, no empty file, no hanging note; its check()
// compares every progression with Vol. 1's in every key and rotation). groups.json and rolls.json beside
// this file come from the same run.
export const vol2 = {
  id: "vol2",
  name: "Jazz MIDI Pack Vol. 2",
  files: 10496,
  progressions: 82,
  voicings: 12,
  rhythms: 8,
  folders: [
    { name: "Progressions", files: 7872, what: "Every new progression × 12 voicings × 8 rhythms, best-sounding first." },
    { name: "Progressions in Every Key", files: 984, what: "Each one in all 12 keys, as voice-led pads." },
    { name: "Bass Lines", files: 246, what: "Walking, two-feel and bossa nova bass for each." },
    { name: "Combo Loops", files: 82, what: "Piano comping, walking bass and ride, two choruses." },
    { name: "Genre Loops", files: 1312, what: "Lofi, neo soul, trap soul and deep house, with chords, bass and drums as separate files." },
  ],
  // Qualities make_pack_vol2.py adds to the voicings (mp.Q.update): none of them is in a Vol. 1 file.
  colours: ["6/9", "9sus4", "13sus4", "maj7(#11)", "9(#11)", "minor-major 9"],
} as const;
