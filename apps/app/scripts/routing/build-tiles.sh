#!/usr/bin/env bash
# Step-free routing (Getting there 6) · build Valhalla tiles for one region and
# measure the build: wall time, peak container RAM (docker stats every 2 s),
# tile size on disk. Data lives OUTSIDE the repo, in $VALHALLA_DATA
# (default ~/Vizzo/valhalla-data/<region>/, prepared by prepare-extract.py).
#
#   scripts/routing/build-tiles.sh greater-sydney
#
# The build container exits when done (serve_tiles=False); start-valhalla.sh
# serves the tiles afterwards.
set -euo pipefail
REGION="${1:?region, e.g. greater-sydney}"
DATA="${VALHALLA_DATA:-$HOME/Vizzo/valhalla-data}"
DIR="$DATA/$REGION"
IMAGE="${VALHALLA_IMAGE:-ghcr.io/valhalla/valhalla-scripted:3.9.1}"
NAME="ra-valhalla-build-$REGION"
test -f "$DIR/custom_files/$REGION.osm.pbf" || { echo "No $DIR/custom_files/$REGION.osm.pbf — run prepare-extract.py first"; exit 1; }

docker rm -f "$NAME" >/dev/null 2>&1 || true
start=$(date +%s)
docker run -d --name "$NAME" \
  -v "$DIR/custom_files:/custom_files" \
  -e serve_tiles=False -e build_elevation=True -e build_admins=True -e build_time_zones=False \
  -e use_tiles_ignore_pbf=False -e force_rebuild=True -e server_threads="${THREADS:-6}" \
  "$IMAGE" >/dev/null

peak=0
while [ "$(docker inspect -f '{{.State.Running}}' "$NAME" 2>/dev/null)" = "true" ]; do
  mem=$(docker stats --no-stream --format '{{.MemUsage}}' "$NAME" 2>/dev/null | awk '{print $1}')
  mib=$(python3 -c "import re,sys;s='$mem';m=re.match(r'([\d.]+)([KMG]i?B)',s);u={'KiB':1/1024,'MiB':1,'GiB':1024,'kB':1/1000,'MB':1,'GB':1000};print(int(float(m.group(1))*u[m.group(2)]) if m else 0)")
  [ "$mib" -gt "$peak" ] && peak=$mib
  sleep 2
done
end=$(date +%s)
code=$(docker inspect -f '{{.State.ExitCode}}' "$NAME")
docker logs "$NAME" > "$DIR/build.log" 2>&1
docker rm "$NAME" >/dev/null

tiles=$(du -sk "$DIR/custom_files/valhalla_tiles.tar" 2>/dev/null | awk '{print $1}')
elev=$(du -sk "$DIR/custom_files/elevation_data" 2>/dev/null | awk '{print $1}')
pbf=$(stat -f %z "$DIR/custom_files/$REGION.osm.pbf" 2>/dev/null || stat -c %s "$DIR/custom_files/$REGION.osm.pbf")
cat > "$DIR/build-metrics.json" <<EOF
{ "region": "$REGION", "image": "$IMAGE", "exit_code": $code, "seconds": $((end - start)),
  "peak_ram_mib": $peak, "pbf_bytes": $pbf, "tiles_tar_kib": ${tiles:-0}, "elevation_kib": ${elev:-0},
  "built_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)" }
EOF
cat "$DIR/build-metrics.json"
