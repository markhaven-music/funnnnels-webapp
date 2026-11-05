# Dashboard design

The rules for funnnnels' own screens (the dashboard, the funnel map, the
editor's chrome). Buyer pages follow their brand and
[page-speed.md](page-speed.md) instead.

## Rules

1. **A card's border is the colour of the card.** A card, panel, table, stat
   tile, notice or popover is told apart from the page by its fill (`--bg-1`
   on `--bg-0`), never by an outline of another colour. Write
   `border: 1px solid transparent`: the card's own background shows through
   it, and the 1 px keeps the layout from moving. A coloured state (connected,
   live, warning) goes in a badge or a tinted fill, not in the border.
   - Inputs, selects and text areas keep a visible border: it tells you where
     to type. Lines *inside* a card (table rows, a footer rule) stay too.
2. **Corners are nearly square.** No 10–18 px "default" rounding, no pills.
   - `--radius` 4 px: cards, panels, buttons, the search box.
   - `--radius-sm` 3 px: inputs, tabs, nav items, small icon tiles.
   - `--radius-xs` 2 px: chips, badges, tags, progress bars, bar-chart tops.
   - Circles only for dots (status, chart legend keys).
   - The logo tile is artwork and keeps its own corners.
3. **Pictures are Higgsfield glass renders.** Violet glass with a mint rim
   light on the dark page, transparent background, webp at 2× the size shown,
   in `public/funnels/dashboard/`. Not in a new top-level folder: `proxy.ts`
   takes an unknown first path segment for a launch product and redirects it
   off funnnnels.com.
4. **Numbers are real or absent.** A tile, chart or insight shows data from
   `lib/analytics.ts`, or nothing. No placeholder zeros, no made-up trends.
5. **Readable at a glance.** "I hate that it doesn't read well": contrast
   comes before mood.
   - Text is at least 4.5:1 on the card it sits on, the faintest (`--fg-3`)
     included. Labels and sub-lines use `--fg-2`; `--fg-3` is for the least
     important text only.
   - A card stands off the page by a clear step of fill (`--bg-1` on
     `--bg-0`), and a tile inside a card by another (`--fg-0` at 5%).
   - Chart lines are 2.5 px, text never under 11 px, and a picked or hovered
     thing changes its fill strongly enough to see from across the room.
   - One chart says one thing, big: tiles pick what it draws (WooCommerce
     style) instead of a second chart.
