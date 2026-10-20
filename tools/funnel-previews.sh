#!/bin/bash
# The dashboard's funnel cards show a screenshot of each code funnel's first
# page (lib/codeFunnels.ts → public/funnels/<slug>/preview.webp). Run this
# again after a landing page changes:   bash tools/funnel-previews.sh
#
# It shoots funnnnels.vercel.app, where the Pixel doesn't load and the visitor
# count ignores the visit, so the screenshots never touch the stats.
# Needs Google Chrome and cwebp (brew install webp).
set -euo pipefail
cd "$(dirname "$0")/.."
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

shot() { # slug url
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --window-size=1280,800 \
    --virtual-time-budget=8000 --user-data-dir="$TMP/profile-$1" \
    --screenshot="$TMP/$1.png" "$2" >/dev/null 2>&1
  cwebp -quiet -q 82 -resize 720 0 "$TMP/$1.png" -o "public/funnels/$1/preview.webp"
  echo "public/funnels/$1/preview.webp"
}

shot midi-drum-kit "https://funnnnels.vercel.app/fr/midi-drum-kit?country=FR"
shot top-hits-midi-bundle "https://funnnnels.vercel.app/top-hits-midi-bundle?country=US"
shot jazz-midi-pack "https://funnnnels.vercel.app/jazz-midi-pack?country=US"
