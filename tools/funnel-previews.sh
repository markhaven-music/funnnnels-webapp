#!/bin/bash
# The dashboard's funnel cards and funnel maps show screenshots of each code
# funnel's pages (lib/codeFunnels.ts → public/funnels/<slug>/preview.webp,
# order.webp, and -en for the MIDI Drum Kit's English pages). Run this again
# after a page changes:   bash tools/funnel-previews.sh
#
# It shoots funnnnels.vercel.app, where the Pixel doesn't load and the visitor
# count ignores the visit, so the screenshots never touch the stats.
# Needs Google Chrome and cwebp (brew install webp).
set -euo pipefail
cd "$(dirname "$0")/.."
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

shot() { # slug file url
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --window-size=1280,800 \
    --virtual-time-budget=15000 --user-data-dir="$TMP/profile-$1-$2" \
    --screenshot="$TMP/$1-$2.png" "$3" >/dev/null 2>&1
  cwebp -quiet -q 82 -resize 720 0 "$TMP/$1-$2.png" -o "public/funnels/$1/$2.webp"
  echo "public/funnels/$1/$2.webp"
}

# preview = the card and the landing step; order = the order-page step (the funnel map).
shot midi-drum-kit preview "https://funnnnels.vercel.app/fr/midi-drum-kit?country=FR"
shot midi-drum-kit order "https://funnnnels.vercel.app/fr/midi-drum-kit/order?country=FR"
shot midi-drum-kit preview-en "https://funnnnels.vercel.app/midi-drum-kit?country=US"
shot midi-drum-kit order-en "https://funnnnels.vercel.app/midi-drum-kit/order?country=US"
shot top-hits-midi-bundle preview "https://funnnnels.vercel.app/top-hits-midi-bundle?country=US"
shot top-hits-midi-bundle order "https://funnnnels.vercel.app/top-hits-midi-bundle/order?country=US"
shot jazz-midi-pack preview "https://funnnnels.vercel.app/jazz-midi-pack?country=US"
shot jazz-midi-pack order "https://funnnnels.vercel.app/jazz-midi-pack/order?country=US"
