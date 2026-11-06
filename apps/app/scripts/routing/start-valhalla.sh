#!/usr/bin/env bash
# Step-free routing (Getting there 6) · start the local Valhalla server.
# Serves the tiles built by build-tiles.sh on 127.0.0.1 only (never on the
# network). Idempotent: does nothing if `ra-valhalla` is already running.
#
#   scripts/routing/start-valhalla.sh            # Greater Sydney on 127.0.0.1:8002
#   VALHALLA_REGION=northern-beaches scripts/routing/start-valhalla.sh
#   docker stop ra-valhalla                       # stop it
set -euo pipefail
REGION="${VALHALLA_REGION:-greater-sydney}"
DATA="${VALHALLA_DATA:-$HOME/Vizzo/valhalla-data}"
PORT="${VALHALLA_PORT:-8002}"
IMAGE="${VALHALLA_IMAGE:-ghcr.io/valhalla/valhalla-scripted:3.9.1}"
NAME=ra-valhalla
DIR="$DATA/$REGION/custom_files"

if ! docker info >/dev/null 2>&1; then echo "Docker isn't running. Start Docker Desktop first."; exit 1; fi
test -f "$DIR/valhalla_tiles.tar" || { echo "No tiles in $DIR — see scripts/routing/README.md (prepare-extract.py, then build-tiles.sh $REGION)."; exit 1; }

state=$(docker inspect -f '{{.State.Running}}' "$NAME" 2>/dev/null || echo missing)
if [ "$state" = "true" ]; then
  echo "ra-valhalla is already running."
elif [ "$state" = "false" ]; then
  docker start "$NAME" >/dev/null && echo "Started ra-valhalla."
else
  docker run -d --name "$NAME" -p "127.0.0.1:$PORT:8002" \
    -v "$DIR:/custom_files" \
    -e serve_tiles=True -e use_tiles_ignore_pbf=True -e build_elevation=False -e build_admins=False \
    -e build_time_zones=False -e force_rebuild=False -e server_threads="${THREADS:-4}" \
    "$IMAGE" >/dev/null
  echo "Created ra-valhalla ($REGION) on 127.0.0.1:$PORT."
fi

# Wait until it answers (loading the tiles takes a few seconds).
for _ in $(seq 1 60); do
  if curl -fsS "http://127.0.0.1:$PORT/status" >/dev/null 2>&1; then echo "Valhalla is up: http://127.0.0.1:$PORT"; exit 0; fi
  sleep 1
done
echo "Valhalla didn't answer within 60 s — check: docker logs ra-valhalla"; exit 1
