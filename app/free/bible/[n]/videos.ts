// MIDI DRUMS BIBLE launch: the four free videos (Product Launch Formula, launch 2026-12-21).
// Made with ~/Desktop/MIDI Drum Kit 2 Tools/launch/bible_video.py, voice Young Jamal (ElevenLabs).
// Copy follows the Grind Studio email tone (~/.claude/CLAUDE.md): simple words, "you", no metaphors.
export type Video = { n: number; wistiaId: string | null; title: string; out: string; lines: string[]; homework?: string[] };

export const VIDEOS: Video[] = [
  {
    n: 1,
    wistiaId: "d229dqt7yl",
    title: "Why your beats stay loops",
    out: "December 1",
    lines: [
      "A loop is 8 bars but a song is 3 minutes.",
      "Watch the video and listen to the drums. You will hear what top producers do after the loop.",
    ],
    homework: [
      "Open your best loop.",
      "Copy it to 16 bars.",
      "In bars 9 to 16, add more hats and an open hat.",
      "Take out the kick on the last beat before bar 9.",
      "Play it and hit reply to our email to tell us what you heard.",
    ],
  },
  { n: 2, wistiaId: null, title: "The whole song, in the drums", out: "December 8", lines: [] },
  { n: 3, wistiaId: null, title: "Video 3", out: "December 15", lines: [] },
  { n: 4, wistiaId: null, title: "December 21", out: "December 21", lines: [] },
];
