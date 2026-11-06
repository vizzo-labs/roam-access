#!/bin/sh
# Render the zone maps (OpenFreeMap Positron + MapLibre) to PNG/JPEG for the kit.
#   sh docs/mapping-day/scripts/render_maps.sh
# Needs Node 22+ and Google Chrome. Serves docs/mapping-day on a random local port.
set -e
cd "$(dirname "$0")/.."
PORT=$(( $(od -An -N2 -tu2 /dev/urandom) % 900 + 3100 ))
python3 -I -m http.server "$PORT" --bind 127.0.0.1 >/dev/null 2>&1 &
SERVER=$!
trap 'kill $SERVER' EXIT
sleep 1
for Z in A B C D E F; do
  node scripts/chrome.mjs shot "http://127.0.0.1:$PORT/maps/render.html?zone=$Z" "maps/zone-$Z.png" 1000 780 2
done
node scripts/chrome.mjs shot "http://127.0.0.1:$PORT/maps/render.html?overview=1" maps/overview.png 1000 900 2
# Smaller JPEGs to embed in kit.html (macOS sips).
for f in maps/*.png; do
  sips -s format jpeg -s formatOptions 72 -Z 1500 "$f" --out "${f%.png}.jpg" >/dev/null
done
