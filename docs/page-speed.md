# Fast funnel pages

Every funnel page is built to score 90+ on Google PageSpeed **mobile**. A slow
landing loses buyers before the first word is read. These are the rules, learnt
on the MIDI Drum Kit landing, a ClickFunnels clone. It went from 59 (LCP 9.2 s)
to 82–90 (FCP 1.1 s, LCP 3.4 s); rule 11 is the next step.

## How to measure

- Measure on **pagespeed.web.dev → Mobile**, at the address the ads use
  (`m.thegrind.studio/...`), after the deploy. A local Lighthouse run is not
  enough. Google's emulated phone is far slower than this Mac: the same page
  scored 95 locally and 64–71 on Google.
- For a quick local stand-in, run
  `npx lighthouse <url> --throttling.cpuSlowdownMultiplier=10`. It gets close to
  Google's numbers.
- Scores move by ±7 between runs. Run 2–3 times before you draw a conclusion.
- What the score is made of: TBT 30 %, LCP 25 %, CLS 25 %, FCP 10 %,
  Speed Index 10 %. LCP is the usual loser.
- SEO 54 on an ad landing is the `noindex`. It's intentional and doesn't touch
  speed or ads.

## Rules

1. **Nothing blocks the first paint.**
   - Third-party stylesheets (Google Fonts, Font Awesome) load without
     blocking: `media="print" onload="this.media='all'"`, plus a `<noscript>`
     copy.
   - Fonts use `display=swap`.
   - Add a preconnect to `fonts.gstatic.com`.
2. **The first screen's picture is found at once.**
   - Preload the hero background or video thumbnail with `fetchpriority="high"`,
     and never lazy-load it.
   - Below the first screen, every image gets `loading="lazy" decoding="async"`.
3. **No video player on load.**
   - Show the video's thumbnail (webp) with the same play button and colour.
   - Load the player (Wistia ≈ 320 KB of script) on the tap, and only then.
     Loading it a few seconds after the page counts against the score too:
     the English VSL's player cost ≈760 ms of the phone's processor and kept
     the Spanish page at 80–83.
4. **Trackers load after the page has shown.** This covers the Meta Pixel,
   Clarity, neo and any third party.
   - Put their stub and queue inline, so `fbq(...)` and `clarity(...)` calls
     are kept.
   - Load their scripts on the `load` event. See `AFTER_LOAD` in
     `app/(funnels)/midi-drum-kit/landing.ts`.
   - They cost about 1 s of a phone's processor, which is the LCP.
5. **Long pages are drawn a screen at a time.**
   - Give the sections after the first screen
     `content-visibility:auto; contain-intrinsic-size:auto 900px`.
   - Check first that nothing inside them is `position: fixed` or overflows the
     section: it would be clipped.
6. **No icon font for a few icons.** Draw them with inline SVG or CSS masks of
   the same shapes. Font Awesome is a stylesheet plus an ≈80 KB font
   (`faCss` in `landing.ts`).
7. **Images.**
   - Use webp, at most 2× the size they're shown at.
   - Give each one `width` and `height`, so nothing jumps (CLS).
   - Every `<img>` has an `alt`. Use `alt=""` when it's only a picture.
8. **No dead requests.** Drop what the original builder loads and this site
   doesn't have: ClickFunnels' `modulepreload` chunks, its loaders, its
   tracking.
9. **Static pages, from the CDN.**
   - Landings and upsells are `force-static` routes, so Vercel serves them
     from its edge.
   - Check `x-vercel-cache: HIT` with
     `curl -sI <url> | grep -i x-vercel-cache`.
10. **Pictures are cached.** `/funnels/*` is kept a week by the browser
    (`next.config.ts`). A picture whose content changes gets a new file name;
    the same picture made lighter can keep its name.
11. **Keep the HTML small.** A ClickFunnels clone carries about 400 KB of CSS
    and 2,000+ elements. If a page is still slow after rules 1–10, the next
    lever is removing the unused CSS at clone time (`tools/cf_clone.mjs`).
12. **Pictures at the size they're shown.**
    - No more than 2–3× the width they take on screen.
    - A 700 px logo shown at 100 px wastes 20–40 KB on a phone's connection.
    - Use `dwebp` + `cwebp -resize <w> 0 -q 80`.
13. **A stand-in font the size of the web font.** Web fonts load after the
    first paint (rule 1), so the first screen is drawn in a stand-in font and
    re-wraps when Poppins or Inter arrive. Big headlines then push everything
    down or up: the Spanish page lost 15 points to it (CLS 0.18), while
    English and French happened to wrap the same.
    - Give each web font a `"<font> Fallback"` face: Arial, or Liberation Sans
      on Linux, with `size-adjust` and `ascent`/`descent`/`line-gap-override`.
    - Take the numbers from Next:
      `getFallbackFontOverrideMetrics("Poppins")` in
      `next/dist/compiled/@next/font/dist/google/get-fallback-font-override-metrics.js`.
    - Put it after the web font in every stack: `"Poppins", "Poppins Fallback", sans-serif`.
    - `FALLBACK_FONTS` in `landing.ts`. A new language or headline gets a
      PageSpeed run: a text that wraps badly shows up as CLS, not on a fast Mac.

All of this is already applied to cloned pages by `faster()` in
`app/(funnels)/midi-drum-kit/landing.ts`. Run every new ClickFunnels clone
through it.
