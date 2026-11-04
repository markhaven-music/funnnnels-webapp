import { TEMPLATE as rolls } from "./cf/rolls";

// The Mystery Hooks opt-in page (2026-11-04, for the free-packs ad test): the
// Rolls page (ClickFunnels' clone, ./cf/rolls.ts) with the Hooks pack's own
// words, from ClickFunnels' Mystery Hooks page (./cf/mystery-hooks.ts: "17
// VocaSpace™ Hooks", "Drag-&-Drop WAV Files", "Leave Space For The Artists
// Voice", "Catchy Musical Hook", "No Generic Melodies") and its box picture.
// The Rolls page's "How To Use 'Rolls' in 3 Easy Steps" section is left out:
// its screenshots are the Drum Kit's MIDI files in FL Studio, not WAV hooks.
// Served at /free/hooks (m.thegrind.studio forwards /free/*).

function swap(html: string, from: RegExp | string, to: string): string {
  const out = html.replace(from, to);
  if (out === html) throw new Error(`free/hooks: "${String(from)}" not found in the Rolls page`);
  return out;
}

function withoutHowTo(html: string): string {
  const at = html.indexOf("How To Use");
  const open = '<div data-page-element="SectionContainer/V1"';
  const start = html.lastIndexOf(open, at);
  const end = html.indexOf(open, at);
  if (at < 0 || start < 0 || end < 0) throw new Error("free/hooks: the How To Use section wasn't found");
  return html.slice(0, start) + html.slice(end);
}

let html = rolls;
html = swap(html, /Download 96 Crazy MIDI Rolls/g, "Download 17 MYSTERY VocaSpace™ Hooks");
html = swap(
  html,
  /Download 96 (<b[^>]*><strike[^>]*>)Snare &amp; Hihat <span([^>]*)>MIDI<\/span> Rolls(<\/strike><\/b>) Now/g,
  "Download 17 $1MYSTERY <span$2>VocaSpace™</span> Hooks$3 Now",
);
html = swap(html, /96 Drag &amp; Drop (<b[^>]*>)MIDI Drums<\/b>/g, "17 Drag &amp; Drop $1WAV Hooks</b>");
html = swap(html, /(<b[^>]*>)Compatible<\/b> with All DAWs/g, "$1Leave Space</b> For The Artist's Voice");
html = swap(html, /Speed Up <\/b>Your Workflow/g, "Catchy </b>Musical Hooks");
html = swap(html, /(<b[^>]*>)From Basic<\/b> Rolls To&nbsp;<b[^>]*>Crazy<\/b>&nbsp;Rolls 🔥/g, "$1No Generic</b> Melodies 🔥");
html = swap(
  html,
  '<img width="1107" height="1107" class="elImage" src="/funnels/free/19722503.webp"',
  '<img width="994" height="994" class="elImage" src="/funnels/free/19903762.webp"',
);
html = withoutHowTo(html);

export const TEMPLATE = html;
