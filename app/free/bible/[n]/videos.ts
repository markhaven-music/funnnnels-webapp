// MIDI DRUMS BIBLE launch: the four free videos (Product Launch Formula, launch 2026-12-21).
// Made with ~/Desktop/MIDI Drum Kit 2 Tools/launch/bible_video.py, voice Young Jamal (ElevenLabs).
// Copy follows the Grind Studio email tone (~/.claude/CLAUDE.md): simple words, "you", no metaphors.
export type Video = { n: number; wistiaId: string | null; title: string; out: string; lines: string[]; homework?: string[]; ask?: string; quick?: string[] };

export const VIDEOS: Video[] = [
  {
    n: 1,
    wistiaId: "nl6o2a0jlc",
    title: "Why your beats stay loops",
    out: "December 1",
    lines: [
      "A loop is 8 bars but a song is 3 minutes.",
      "Watch the video and listen to the drums. You will hear what top producers do after the loop.",
    ],
    ask: "Do you struggle to turn your loops into full songs?",
    quick: ["Yes, my beats stay loops", "Yes, I never finish a song", "Sometimes", "No, I finish my songs"],
  },
  { n: 2, wistiaId: null, title: "The whole song, in the drums", out: "December 8", lines: [], ask: "Do you struggle to make the parts after the hook?",
    quick: ["Yes, I only make the hook", "Yes, the intro and outro", "Yes, the switch-up", "No, I make every part"] },
  { n: 3, wistiaId: null, title: "Video 3", out: "December 15", lines: [] },
  { n: 4, wistiaId: null, title: "The pack comes out", out: "December 21", lines: [] },
];
