---
name: grind-funnel-page
description: Build or change a GRIND STUDIO funnel page (landing, order, upsell, thank-you) in funnnnels the way the Jazz MIDI Pack and MIDI Drum Kit pages are built. Load before touching any page a buyer sees.
---

# GRIND STUDIO funnel pages

Every rule below comes from a decision Mark made on a live page. When a rule and
a request conflict, the request wins; say which rule you are breaking.

## 1. Working rules

- Change only what was asked. An open request ("audit", "add some sections",
  "make it more convincing") is not a free hand: list the exact sections or
  lines you would add or change, with where they go, and get a yes first. Never
  rewrite copy in a section you were asked to restyle.
- Each funnel has a `BRIEF.md` next to its code (`app/(funnels)/<slug>/BRIEF.md`).
  Every claim on the page must be in it. Record each decision there, with the
  user's words.
- Verify before shipping: run the page locally (phone 375px and desktop 1280px),
  check the console and the server log, then commit and deploy to production
  without asking, then check the live page again. Routine in §11.
- The user tests on a phone first. Mobile layout is the reference; desktop is
  derived from it.
- Never fabricate: no invented reviews, numbers, quotes, claims, or screenshots.

## 2. Copy ("Diretto")

- Producer to producer, short sentences, no hype, no exclamation marks, no
  empty adjectives (premium, professional, unlock, next level), no fake
  urgency, no "worth $X" stacks, no success promises. Specs are the selling
  points. See `docs/copy-style.md` where it exists.
- Headlines say the problem or the promise at once. No eyebrow lines above the
  headlines (the small uppercase labels): removed on 2026-11-02.
- The guarantee is a **14-day quality guarantee**. Never "money back" (or "Geld zurück", "rimborsati"…) anywhere on the site, in any language (the user, 2026-11-08). If we can't fix a file: "you get a refund".
- Numbers are real and consistent across the page (the pack's count, the
  bonuses' count, the total only as "in total").
- Angles that sell: the Jazz page sells "the progressions everyone wants and
  nobody can write", never "26 progressions". The Drum Kit sells "stiff drums →
  bounce".
- Buyers are producers, beatmakers, songwriters: they do not know jazz names.
  Say what a thing does, then its name if needed ("voicings stacked in fourths",
  not "quartal").
- Price stated plainly, each visitor sees their currency (`{price}` token).
- Translations follow the English line by line, headline first, same
  highlights and numbers; only the guarantee wording may differ.

## 3. Palette

- One accent: **#f5b800** (the Drum Kit's yellow). One lighter shade
  (`#ffe14d`) only inside gradients (button gloss, price tags), one darker for a
  button's underside. Every highlighted word, number and icon uses #f5b800.
  Never a pale yellow for text, never two yellows side by side.
- Text white: body at 88 % white, muted at 62 %. No cream, beige, grey-blue.
- Backgrounds black: page `#070707`, alternating bands `#111`, hero `#000`.
  No navy, no coloured glows, no gradient text, no glassmorphism.
- Green ✓ and red ✗ only in the comparison chart and the before/after labels.
- The Jazz palette lives in `.jazz` (jazz.module.css); `.page` keeps the old
  brass for the shop and launch kits, which share the file. Shared styles
  (btn, checkout, box, roll) read `--y*` tokens with fallbacks.

## 4. Layout

- No boxes with visible borders or round corners, no dividers, no outlines:
  sections are set apart by space, type and tone. Corners 3-4px where a surface
  needs one. "Sembra AI slop" otherwise.
- Hero: centred like the Drum Kit's. Pre-title, headline, sub, the VSL, the
  bullets, the big CTA, the proof strip. Background plain black with one soft
  neutral light behind the video; no texture, no grid, no orbs (Apple-plain).
- Desktop uses the vertical space. People love to scroll. No dense 3- or
  4-column grids of text: folders, lists, steps, "after you pay" go one under
  the other with room around them.
- Two columns only as copy beside a visual (an image, the piano rolls, the
  seal), as the Drum Kit landing does. Each such block is a panel like the Drum
  Kit's folder and bonus cards: background #0d0c10, 12px corners, no border,
  the picture about 45 % of the width on the left, the copy on the right; on a
  phone the picture on top, full width inside the panel, then the copy. Never a
  heading or text that sticks on the side with the body on the other side: that
  was "ma che hai fatto".
- Bonuses: heading on top, then each bonus as one such panel: cover left (sticky
  on desktop) and name, text, list and playable files right, large type.
- No sticky bottom bar.
- Sections with a heading and nothing visual (letter, FAQ, reviews) stay one
  column, centred, max 760px wide.

## 5. Components

- CTA: one style, the big 3D "key" (lip, candy gloss, light sweep, pulsing
  glow, gentle breathing, sinks when pressed), text "Get the pack" with the
  price and "instant download" under it. Centred.
- Play buttons: the round yellow disc with a black triangle, a square while
  playing, on every roll and loop. The words "Play"/"Stop" are for screen
  readers only.
- Previews play the pack's real files on the page's synth: Sine (a pluck) or
  Piano (Salamander samples, fetched only when chosen), one picker above the
  before/after rolls and in the pack browser, the pick remembered per browser.
- Comparison chart, value stack with the struck price, five bonuses each with
  a strike-through value and "Free", the guarantee seal: as on the Jazz page.

## 6. Images

- Every image references the brand, the music or the kit (the box, the
  wordmark, a piano roll, a DAW). No generic objects. A picture beside copy
  shows what that copy says: steps get the folder path and the file's roll,
  "after you pay" gets the download list, a bonus gets its cover. When no
  real picture says it, build one from the pack's data in HTML rather than
  reuse a pretty but unrelated render. AI renders are fine for
  the box and scenes, always optimised webp in the sizes the page needs.
- Static files go under `public/funnels/<slug>/`; a new top-level folder would
  be taken as a launch-kit slug.
- VSL thumbnail: a frame of the video itself, chosen where a complete caption
  line and the rolls are on screen; never a designed poster or an AI image. The
  share image (`vsl-en-1600/960.webp`) is the same frame.

## 7. Social proof

- Real numbers only (producers with the Drum Kit, email list size, guarantee).
- Reviews: never invent one. Reuse of the 8 Drum Kit / Top Hits reviews on
  another product is the user's call, not ours. Extra entries go in the
  editor's draft as placeholders ("Write the review here.") and never live.
- Quotes from known producers are fine when checked word for word and linked
  to the interview, with a note that no artist is connected to GRIND STUDIO.
- "Social proof" to the user means names/logos + reviews, Drum Kit style, near
  the end of the page (after the guarantee).

## 8. VSL

- Made with `tools/jazz_vsl.py` (`voice | render | poster`), run with
  `/usr/bin/python3`. Script in `vsl/script-en.md`; voice "Aaron Sage" on
  ElevenLabs `eleven_v4`; numbers spelled out for the voice, shown as digits in
  the captions; every part checked with speech-to-text.
- No price amount and no "26" in a VSL; "Your price is right below this video".
- Wistia's own player in the hero (`Vsl.tsx`, `funnel.ts` `vsl.wistiaId`);
  player colour #f5b800; the still set with `new_still_media_id`.
- Keys only in the hopeful-nash worktree's `.env.local`, read into env, never
  printed.

## 9. Page speed

- 90+ on PageSpeed mobile (pagespeed.web.dev, the live URL) for every page a
  buyer sees; rules in `docs/page-speed.md`. Sections below the fold use
  `content-visibility: auto`; images lazy and sized; nothing fetched before a
  tap (samples, Stripe.js); a visitor keeps `/funnels/*` for a week.

## 10. Data and the editor

- A page is a list of section blocks in the `funnels` table (`pages` = draft,
  `published_pages` = live); `content.ts` holds the defaults and the fallback;
  `sections.tsx` renders each type on the page and in the editor; unknown
  types are skipped, so add a type to the DB before its deploy is safe.
- Every element of a section can be removed in the editor (`hide` keys,
  `Part`). The order page reads the landing's blocks (offer, guarantee,
  reviews) so one edit shows on both.
- Tracking: Clarity's `<Script id="clarity-tag">` (an id of `clarity` breaks
  it), the Live beacon on every landing, the owner's device not counted.

## 11. Shipping

- Work in the funnel's worktree. Before a deploy: `git rebase main` (other
  sessions commit and deploy too; `npx vercel ls funnnnels --environment
  production` first), typecheck, `npx vercel --prod --yes --force` with up to
  three tries (a flaky build error happens), then fast-forward `main` if its
  checkout is clean on the files touched; otherwise say so.
- Local dev for a worktree: a `jazz-polish`-style entry in both
  `.claude/launch.json` files and `turbopack: { root: process.cwd() }` in
  `next.config.ts`, both removed before the commit.
- Check the live page after every deploy: the change, the console, and that
  the other sessions' commits are in.
