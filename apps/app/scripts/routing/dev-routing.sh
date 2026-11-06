#!/usr/bin/env bash
# Step-free routing (Getting there 6) · one command to try it locally:
# starts the Valhalla container if needed (127.0.0.1 only), then `next dev`
# with VALHALLA_URL set, so venue pages show "Route avoiding mapped steps".
#
#   npm run dev:routing                 # http://localhost:3000
#   PORT=3456 npm run dev:routing
#
# Stop: Ctrl-C stops the app; `docker stop ra-valhalla` stops the router.
set -euo pipefail
cd "$(dirname "$0")/../.."
REGION="${VALHALLA_REGION:-greater-sydney}"
DATA="${VALHALLA_DATA:-$HOME/Vizzo/valhalla-data}"
VPORT="${VALHALLA_PORT:-8002}"
VALHALLA_REGION="$REGION" VALHALLA_DATA="$DATA" VALHALLA_PORT="$VPORT" bash scripts/routing/start-valhalla.sh
mkdir -p public/maplibre && cp node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs public/maplibre/
export VALHALLA_URL="http://127.0.0.1:$VPORT"
export VALHALLA_CHECKS="$DATA/$REGION/checks.json"
echo "Routing: $VALHALLA_URL ($REGION) · checks: $VALHALLA_CHECKS"
exec npx next dev -p "${PORT:-3000}" "$@"
