// The free lead magnets' pages (Rolls, Bounce, Mystery Hooks, the Free Store)
// copied 1:1 from ClickFunnels into app/free/cf/<name>.ts: ClickFunnels' own
// HTML and CSS without its scripts, with
//   - its pictures in public/funnels/free/<id>.webp, at twice the width they're shown at,
//   - only the CSS rules the page uses (ClickFunnels ships ≈210 KB of it),
//   - every link to www.thegrind.studio made relative, the zips pointing at
//     /free/download/<pack>, the "MIDI Drum Kit (90% off)" link at /en/midi-drum-kit,
//   - the opt-in buttons marked data-optin, the cart and the "Working…" pop-ups gone.
// app/free/render.ts adds the form's script, the icons and the speed-ups.
//
//   node tools/cf_clone_free.mjs            (all pages)
//   node tools/cf_clone_free.mjs rolls      (one)
//
// Needs puppeteer-core and Chrome (the page is laid out in a headless browser,
// with ClickFunnels' scripts stripped first), cwebp and gif2webp.

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import puppeteer from "puppeteer-core";

const ROOT = process.env.FUNNNNELS_ROOT ?? new URL("..", import.meta.url).pathname;
const ORIGIN = "https://www.thegrind.studio";
const OUT = `${ROOT}/app/free/cf`;
const IMG_DIR = `${ROOT}/public/funnels/free`;

// name → ClickFunnels page.
const PAGES = {
  rolls: "/download-rolls-midi-drums--fb90f",
  bounce: "/download-bounce-midi-drums",
  "mystery-hooks": "/mystery-hooks-pack",
  "free-store": "/free-store",
  "free-store-access": "/free-store-access",
  "bounce-midi-pack": "/bounce-midi-pack",
  "mystery-dopaspace-hooks": "/mystery-dopaspace-hooks",
};

// ClickFunnels' zip links → our download route (app/free/download/[pack]).
const ZIPS = {
  "Grind_Studio_Snare_Hat_Rolls.zip": "/free/download/rolls",
  "GrindStudio_BounceMIDIPack.zip": "/free/download/bounce",
  "GrindStudio_MYSTERY_Hooks_Pack.zip": "/free/download/mystery-hooks",
};

const only = process.argv[2];
mkdirSync(OUT, { recursive: true });
mkdirSync(IMG_DIR, { recursive: true });
const cssCache = new Map();
const browser = await puppeteer.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: "new" });

for (const [name, path] of Object.entries(PAGES)) {
  if (only && only !== name) continue;
  let html = await (await fetch(ORIGIN + path, { headers: { "user-agent": "Mozilla/5.0" } })).text();

  // ── text-level cleanup ──
  html = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, "");
  html = html.replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/g, "");
  html = html.replace(/\sintegrity="[^"]*"/g, "");
  // The phone field's flag picker only exists with its script: a plain field without it.
  html = html.replace(/<link[^>]+intl-tel-input[^>]*>/g, "");
  for (const m of [...html.matchAll(/<link[^>]+href="(\/assets\/[^"]+\.css)"[^>]*>/g)]) {
    if (!cssCache.has(m[1])) cssCache.set(m[1], await (await fetch(ORIGIN + m[1])).text());
    html = html.replace(m[0], () => `<style data-cf-sheet="${m[1].split("/").pop()}">${cssCache.get(m[1])}</style>`);
  }

  const page = await browser.newPage();
  await page.setJavaScriptEnabled(false);
  await page.setViewport({ width: 1366, height: 900 });
  await page.setContent(html, { waitUntil: "networkidle0", timeout: 90000 });

  // How wide each picture is shown, on a computer and on a phone.
  const widths = {};
  for (const w of [1366, 390]) {
    await page.setViewport({ width: w, height: 900 });
    const seen = await page.evaluate(() =>
      [...document.querySelectorAll("img")].map((i) => [i.getAttribute("data-src") || i.getAttribute("src") || "", i.getBoundingClientRect().width]),
    );
    for (const [src, px] of seen) widths[src] = Math.max(widths[src] ?? 0, px);
  }

  const { template, stray } = await page.evaluate((ZIPS) => {
    const d = document;
    // ClickFunnels' things that only work with its scripts, or carry its tracking.
    d.querySelectorAll('[data-page-element="CartReviewModal"], .otoloading, img[src*="facebook.com/tr"], link[rel="preload"], link[rel="prefetch"], link[rel="modulepreload"], meta[name="csrf-token"], meta[name="csrf-param"], form#cfAR').forEach((e) => e.remove());
    d.querySelectorAll('meta[property^="og:"], meta[name^="twitter:"], meta[property^="twitter:"], link[rel="canonical"]').forEach((e) => e.remove());
    // Pop-ups with nothing in them (the "Working…" box): gone. The Free Store's
    // opt-in pop-up stays (app/free/render.ts opens it).
    d.querySelectorAll('[data-page-element="ModalContainer/V1"]').forEach((m) => { if (!m.querySelector("input")) m.remove(); });
    // lazysizes: the real src straight away.
    d.querySelectorAll("img[data-src]").forEach((i) => { i.setAttribute("src", i.getAttribute("data-src")); i.removeAttribute("data-src"); i.classList.remove("lazyload"); });
    for (const a of d.querySelectorAll("a[href]")) {
      const href = a.getAttribute("href");
      const zip = Object.keys(ZIPS).find((z) => href.endsWith("/" + z));
      if (zip) a.setAttribute("href", ZIPS[zip]);
      else if (/^https:\/\/www\.thegrind\.studio\/midi-drum-kit-offer/.test(href)) a.setAttribute("href", "/en/midi-drum-kit");
      else if (/^https:\/\/www\.thegrind\.studio\//.test(href)) a.setAttribute("href", href.replace("https://www.thegrind.studio", ""));
      else if (href === "#submit-form") { a.setAttribute("data-optin", ""); a.setAttribute("href", "#"); }
      else if (href === "#open-popup") a.setAttribute("data-open-popup", "");
      else if (href === "#open-cart") a.setAttribute("href", "/free-store");
      else if (href === "#add-to-cart") a.setAttribute("href", "/free-store#access");
    }
    // Text left in the page, to check nothing is lost.
    const stray = [];
    const walk = d.createTreeWalker(d.body, NodeFilter.SHOW_TEXT);
    for (let t; (t = walk.nextNode()); ) if (t.textContent.trim() && !t.parentElement.closest("style")) stray.push(t.textContent.trim());

    // Only the CSS rules something on the page matches (hover, focus, open
    // states and the pop-up's included), at every width; @font-face and
    // @keyframes kept whole.
    const used = (sel) =>
      sel.split(",").some((s) => {
        const base = s.replace(/::?[a-z-]+(\([^)]*\))?/g, (m) => (/^:(not|is|where|has|nth-|first-child|last-child|only-child|empty|root)/.test(m) ? m : "")).trim();
        if (!base || base === "*" || /^(html|body|:root)$/.test(base)) return true;
        if (/elModalOpen|forceShow|active|open|show|navigator|elNavigator|selected/i.test(s)) return d.querySelector(base.replace(/\.(elModalOpen|forceShow|active|open|show|selected)\b/g, "")) !== null;
        try { return d.querySelector(base) !== null; } catch { return true; }
      });
    const keep = (rules) => {
      let out = "";
      for (const r of rules) {
        if (r instanceof CSSStyleRule) { if (used(r.selectorText)) out += r.cssText; }
        else if (r instanceof CSSMediaRule) { const inner = keep(r.cssRules); if (inner) out += `@media ${r.conditionText}{${inner}}`; }
        else if (r instanceof CSSSupportsRule) { const inner = keep(r.cssRules); if (inner) out += `@supports ${r.conditionText}{${inner}}`; }
        else if (r instanceof CSSImportRule) continue;
        else out += r.cssText;
      }
      return out;
    };
    for (const s of d.querySelectorAll("style")) {
      try { s.textContent = keep(s.sheet.cssRules); } catch { /* keep as is */ }
      if (!s.textContent.trim()) s.remove();
    }
    d.title = d.title.trim();
    return { template: "<!DOCTYPE html>\n" + d.documentElement.outerHTML, stray };
  }, ZIPS);
  await page.close();

  // ── pictures: ours, at twice the width they're shown at ──
  let out = template;
  const CF_IMG = /(?:https:\/\/images\.clickfunnels\.com\/cdn-cgi\/image\/[^/]+\/)?https:\/\/statics\.myclickfunnels\.com\/workspace\/[^/]+\/image\/(\d+)\/file\/[0-9a-f]+\.(png|jpe?g|webp|gif)/g;
  const done = new Map();
  for (const m of [...out.matchAll(CF_IMG)]) {
    const [whole, id, ext] = m;
    if (done.has(whole)) continue;
    const shown = Math.max(...Object.entries(widths).filter(([src]) => src.includes(`/image/${id}/`)).map(([, w]) => w), 0);
    const file = `${IMG_DIR}/${id}.webp`;
    if (!existsSync(file)) {
      const src = whole.replace(/^https:\/\/images\.clickfunnels\.com\/cdn-cgi\/image\/[^/]+\//, "");
      const tmp = `/tmp/cf-free-${id}.${ext}`;
      execFileSync("curl", ["-sL", "--fail", src, "-o", tmp]);
      const w = shown ? Math.min(1600, Math.round(shown * 2)) : 0;
      if (ext === "gif") execFileSync("gif2webp", ["-quiet", "-q", "80", tmp, "-o", file]);
      else execFileSync("cwebp", ["-quiet", "-q", "80", ...(w ? ["-resize", String(w), "0"] : []), tmp, "-o", file]);
      console.log(`  image ${id} shown ${Math.round(shown)}px → ${file.split("/").pop()}`);
    }
    done.set(whole, `/funnels/free/${id}.webp`);
  }
  for (const [from, to] of done) out = out.replaceAll(from, to);
  // srcset entries of the same picture through the resizer: the one file.
  out = out.replace(/\ssrcset="[^"]*"/g, "").replace(/\ssizes="[^"]*"/g, "");
  // Each picture's own width and height, so nothing jumps while it loads
  // (render.ts gives them height:auto, so the CSS width still rules).
  out = out.replace(/<img\b[^>]*\ssrc="\/funnels\/free\/(\d+)\.webp"[^>]*>/g, (tag, id) => {
    const info = execFileSync("webpinfo", [`${IMG_DIR}/${id}.webp`]).toString();
    const [, w, h] = info.match(/Canvas size (\d+) x (\d+)/) ?? info.match(/Width: (\d+)\s+Height: (\d+)/) ?? [];
    if (!w) return tag;
    return tag.replace(/\s(width|height)="[^"]*"/g, "").replace("<img ", `<img width="${w}" height="${h}" `);
  });

  const left = out.match(/https?:\/\/[^"' )]*(clickfunnels|myclickfunnels)[^"' )]*/g) ?? [];
  if (left.length) console.warn(`  ${name}: still pointing at ClickFunnels:`, [...new Set(left)].slice(0, 10));
  out = out.replace("</head>", "{{HEAD}}\n</head>").replace("</body>", "{{BODY}}\n</body>");
  writeFileSync(
    `${OUT}/${name}.ts`,
    `// Generated by tools/cf_clone_free.mjs from ${ORIGIN}${path}. Don't edit by hand:\n` +
      `// re-run the tool. ClickFunnels' page without its scripts; {{HEAD}} and {{BODY}} are filled by ../render.ts.\n` +
      `export const TEMPLATE = ${JSON.stringify(out)};\n`,
  );
  console.log(`${name}: ${Math.round(out.length / 1024)} KB (was ${Math.round(html.length / 1024)} KB), ${stray.length} texts`);
}
await browser.close();
