#!/bin/bash
# The dashboard's funnel cards and funnel maps show screenshots of each code
# funnel's pages (lib/codeFunnels.ts → public/funnels/<slug>/preview.webp,
# order.webp, and -en for the MIDI Drum Kit's English pages).
#
# It runs by itself after every production deploy (.github/workflows/funnel-shots.yml):
# with SHOTS_TOKEN set, each picture is also sent to funnnnels.com/api/shots,
# the storage the cards and maps load them from (lib/shots.ts). By hand:
#   SHOTS_TOKEN=… bash tools/funnel-previews.sh
#
# It shoots funnnnels.vercel.app, where the Pixel doesn't load and the visitor
# count ignores the visit, so the screenshots never touch the stats. ?origin=1
# keeps the pages there (anyone else is sent to m.thegrind.studio, lib/originBounce.ts).
# Needs Google Chrome and cwebp (brew install webp / apt install webp).
set -euo pipefail
cd "$(dirname "$0")/.."
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
SHOTS_URL="${SHOTS_URL:-https://funnnnels.com/api/shots}"
FAILED=0
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

# The window is taller than the picture: a preview's "not counted" tag sits at its
# bottom edge, and only the top 1280×800 is kept.
shot() { # slug file url
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --window-size=1280,880 \
    --virtual-time-budget=15000 --user-data-dir="$TMP/profile-$1-$2" \
    --screenshot="$TMP/$1-$2.png" "$3" >/dev/null 2>&1
  if [ ! -s "$TMP/$1-$2.png" ]; then echo "no screenshot: $3" >&2; FAILED=1; return; fi
  mkdir -p "public/funnels/$1"
  cwebp -quiet -q 82 -crop 0 0 1280 800 -resize 720 0 "$TMP/$1-$2.png" -o "public/funnels/$1/$2.webp"
  echo "public/funnels/$1/$2.webp"
  if [ -n "${SHOTS_TOKEN:-}" ]; then
    curl -fsS -X PUT -H "Authorization: Bearer $SHOTS_TOKEN" -H "Content-Type: image/webp" \
      --data-binary "@public/funnels/$1/$2.webp" "$SHOTS_URL?slug=$1&name=$2" >/dev/null || { echo "upload failed: $1/$2" >&2; FAILED=1; }
  fi
}

# preview = the card and the landing step; order = the order-page step (the funnel map).
shot midi-drum-kit preview "https://funnnnels.vercel.app/fr/midi-drum-kit?country=FR&origin=1"
shot midi-drum-kit order "https://funnnnels.vercel.app/fr/midi-drum-kit/order?country=FR&origin=1"
shot midi-drum-kit preview-en "https://funnnnels.vercel.app/midi-drum-kit?country=US&origin=1"
shot midi-drum-kit order-en "https://funnnnels.vercel.app/midi-drum-kit/order?country=US&origin=1"
# thanks = the thank-you step: ?preview=1 shows it as a buyer of everything sees it (no order needed).
shot midi-drum-kit thanks "https://funnnnels.vercel.app/fr/midi-drum-kit/thank-you?country=FR&preview=1&origin=1"
shot midi-drum-kit thanks-en "https://funnnnels.vercel.app/midi-drum-kit/thank-you?country=US&preview=1&origin=1"
shot top-hits-midi-bundle preview "https://funnnnels.vercel.app/top-hits-midi-bundle?country=US&origin=1"
shot top-hits-midi-bundle order "https://funnnnels.vercel.app/top-hits-midi-bundle/order?country=US&origin=1"
shot top-hits-chords preview "https://funnnnels.vercel.app/top-hits-chords?country=US&origin=1"
shot top-hits-chords order "https://funnnnels.vercel.app/top-hits-chords/order?country=US&origin=1"
shot famous-beats-bundle preview "https://funnnnels.vercel.app/famous-beats-bundle?country=US&origin=1"
shot famous-beats-bundle order "https://funnnnels.vercel.app/famous-beats-bundle/order?country=US&origin=1"
shot drunk-swing-grooves preview "https://funnnnels.vercel.app/drunk-swing-grooves?country=US&origin=1"
shot drunk-swing-grooves order "https://funnnnels.vercel.app/drunk-swing-grooves/order?country=US&origin=1"
shot jazz-midi-pack preview "https://funnnnels.vercel.app/jazz-midi-pack?country=US&origin=1"
shot jazz-midi-pack order "https://funnnnels.vercel.app/jazz-midi-pack/order?country=US&origin=1"
# The Free packs map (lib/funnelMap.ts): each pack's sign-up page; optin-rolls is also its card.
shot free optin-rolls "https://funnnnels.vercel.app/download-rolls-midi-drums?origin=1"
shot free optin-bounce "https://funnnnels.vercel.app/download-bounce-midi-drums?origin=1"
shot free optin-hooks "https://funnnnels.vercel.app/free/hooks?origin=1"

exit "$FAILED"
