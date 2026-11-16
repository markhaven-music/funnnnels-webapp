// Jazz MIDI Pack Vol. 2: what the upsell page may say about it. Counted from ~/Desktop/Jazz MIDI Pack Vol. 2
// (make_pack_vol2.py: 10,496 files parsed back, no empty file, no hanging note; its check() compares every
// progression with Vol. 1's in every key and rotation). groups.json beside this file and the previews in
// public/funnels/jazz-midi-pack/vol2-v1 come from the same build (vol2_page_data.py).
export const vol2 = {
  id: "vol2",
  // The page's video (tools/jazz_vol2_vsl.py, script ../vsl/script-upsell-vol2-en.md): 1:50, four Vol. 2 loops with
  // their drums, Wistia since 2026-11-16 (poster arbtaulrp0). Work files: ~/Desktop/Jazz MIDI Pack Tools/vsl-vol2.
  wistiaId: "g5g4tvedmi",
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
  // The four groups as the page says them (2026-11-16, "frame this Vol.2 emotionally … cater to the feelings of
  // the customer and their desires"): how each one feels, in groups.json's order. The pack's own README keeps
  // make_pack_vol2.py's plain descriptions.
  moods: [
    "The Rhodes at 2 a.m. Warm, a little sad, and you can’t stop nodding to it.",
    "Chords that lift you off your chair. Walk-ups, church endings, the moment a room goes quiet.",
    "Grit and swagger. Dominant chords that strut, and vamps you can ride for five minutes.",
    "Summer evenings and cities after dark. Every one of these puts you somewhere.",
  ],
} as const;
