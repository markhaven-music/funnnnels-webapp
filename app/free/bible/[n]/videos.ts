// MIDI DRUMS BIBLE launch: the four free videos (Product Launch Formula, launch 2026-12-21).
// Made with ~/Desktop/MIDI Drum Kit 2 Tools/launch/bible_video.py, voice Young Jamal (ElevenLabs).
// Copy follows the Grind Studio email tone (~/.claude/CLAUDE.md): simple words, "you", no metaphors.
export type Video = { n: number; wistiaId: string | null; title: string; out: string; lines: string[]; homework?: string[]; ask?: string };

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
    ask: "How long are your beats right now? Tell me below.",
  },
  { n: 2, wistiaId: null, title: "The whole song, in the drums", out: "December 8", lines: [], ask: "Which part of the song do you never make? Tell me below." },
  { n: 3, wistiaId: null, title: "Video 3", out: "December 15", lines: [] },
  { n: 4, wistiaId: null, title: "The pack comes out", out: "December 21", lines: [] },
];
