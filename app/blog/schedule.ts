// When each post of the blog comes out (m.thegrind.studio/blog). A post is
// live from 00:00 UTC of its day: before that its page answers 404 (proxy.ts,
// which reads this file on every request, so it's exact) and it's left out of
// the blog's front page, the "Keep reading" lists, the links inside other
// posts and the sitemap (those pages are rebuilt every hour).
// To schedule a post: add its slug and day here, then write it in more.ts
// (or posts.ts). Nothing else to deploy on the day.
// Kept apart from the posts, with no imports: proxy.ts must stay small.
export const RELEASE: Record<string, string> = {
  // 2026-11-12: the first six
  "jazz-chord-progressions-for-producers": "2026-11-12",
  "lofi-chord-progressions": "2026-11-12",
  "neo-soul-chord-progressions": "2026-11-12",
  "how-to-make-chords-sound-jazzy": "2026-11-12",
  "ii-v-i-progression-explained": "2026-11-12",
  "just-the-two-of-us-chord-progression": "2026-11-12",
  // three a week, Monday, Wednesday, Friday
  "autumn-leaves-chords": "2026-11-16",
  "trap-soul-chords": "2026-11-18",
  "fly-me-to-the-moon-chords": "2026-11-20",
  "jazz-piano-voicings-for-producers": "2026-11-23",
  "blue-bossa-chords": "2026-11-25",
  "royal-road-chord-progression": "2026-11-27",
  "jazz-blues-chord-progression": "2026-11-30",
  "misty-chords": "2026-12-02",
  "deep-house-chords": "2026-12-04",
  "summertime-chords": "2026-12-07",
  "how-to-write-a-walking-bass-line": "2026-12-09",
  "girl-from-ipanema-chords": "2026-12-11",
  "my-funny-valentine-chords": "2026-12-14",
  "all-the-things-you-are-chords": "2026-12-16",
};

/** Today's day in UTC, "2026-11-12". */
export const today = (now = Date.now()) => new Date(now).toISOString().slice(0, 10);

/** Is this post out? Unknown slugs aren't. */
export const isLive = (slug: string, now = Date.now()) => slug in RELEASE && RELEASE[slug] <= today(now);
