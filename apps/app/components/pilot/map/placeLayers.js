// Every place in view, drawn by WebGL (MapLibre GeoJSON source + circle and
// symbol layers), so the map scales to a whole city without clusters and
// without hiding anything. Only the list's places and the selected one are
// DOM buttons (PilotMap.jsx); this file draws everything else and finds what
// a click or tap landed on.
//
// Marker size follows zoom (the same tiers as map/symbols.js):
//   < 14   verdict dots (shape + white ring, ~8px of colour; a little smaller
//          across a whole city) · "No info yet" 5px grey dots
//   14–15  22px verdict shapes with the category icon · 7px grey dots
//   ≥ 16   category pins with the badge · small pale "No info yet" markers
// Overlap is allowed. Draw order, bottom to top: no info yet, then has
// barriers, check first, works for you; facility squares (toilets, beach,
// parking) on top, because the person switched them on.

import { QUIET, PAPER, drawSprite, SPRITE } from './symbols';


export const DOT_ZOOM = 14;     // below: dots
export const STREET_ZOOM = 16;  // from here: pins
export const HIT = 12;          // tap tolerance: a 24px box around the point

const SRC = 'ra-places', XSRC = 'ra-extras';
const RANK = { works: 3, check: 2, barrier: 1, unknown: 0 };
const NO_INFO = ['==', ['get', 'kind'], 'unknown'];
const HAS_VERDICT = ['!=', ['get', 'kind'], 'unknown'];

// Street zoom: places in one building are nudged apart around a small
// circle (the `slot` property; see nudgeSlots). Up to 12 per group.
const MAX_GROUP = 12;
function slotRadius(n, size) { return Math.max(size * 0.6, (size * 0.95 * n) / (2 * Math.PI)); }
export function slotOffset(slot, size) {
  if (!slot) return [0, 0];
  const n = Math.floor(slot / 100), i = slot % 100;
  const r = slotRadius(n, size), ang = (2 * Math.PI * i) / n - Math.PI / 2;
  return [Math.round(Math.cos(ang) * r), Math.round(Math.sin(ang) * r)];
}
function offsetExpr(size) {
  const e = ['match', ['get', 'slot']];
  for (let n = 2; n <= MAX_GROUP; n++) for (let i = 0; i < n; i++) e.push(n * 100 + i, ['literal', slotOffset(n * 100 + i, size)]);
  e.push(['literal', [0, 0]]);
  return e;
}

const SYMBOL = { 'icon-allow-overlap': true, 'icon-ignore-placement': true };
// Across a whole city (zoom ≤ 11) the dots shrink a little more, so a
// dense centre stays a calm scatter rather than a blot.
const CITY_SIZE = ['interpolate', ['linear'], ['zoom'], 10, 0.62, 12.5, 1];
const LAYERS = (pinW) => [
  { id: 'ra-quiet-dots', type: 'circle', source: SRC, maxzoom: STREET_ZOOM, base: NO_INFO, quiet: true,
    paint: {
      'circle-color': QUIET, 'circle-stroke-color': PAPER,
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 1.6, 12.5, 2.5, DOT_ZOOM - 0.01, 2.5, DOT_ZOOM, 3.5],
      'circle-stroke-width': ['interpolate', ['linear'], ['zoom'], 10, 0.5, 12.5, 0.75, DOT_ZOOM - 0.01, 0.75, DOT_ZOOM, 1],
    } },
  { id: 'ra-quiet-pins', type: 'symbol', source: SRC, minzoom: STREET_ZOOM, base: NO_INFO, quiet: true,
    layout: { ...SYMBOL, 'icon-image': ['concat', 'ra:q-pin-', ['get', 'icon']], 'icon-offset': offsetExpr(pinW) } },
  { id: 'ra-verdict-dots', type: 'symbol', source: SRC, maxzoom: DOT_ZOOM, base: HAS_VERDICT,
    layout: { ...SYMBOL, 'symbol-sort-key': ['get', 'rank'], 'icon-image': ['concat', 'ra:v-dot-', ['get', 'kind']], 'icon-size': CITY_SIZE } },
  { id: 'ra-verdict-marks', type: 'symbol', source: SRC, minzoom: DOT_ZOOM, maxzoom: STREET_ZOOM, base: HAS_VERDICT,
    layout: { ...SYMBOL, 'symbol-sort-key': ['get', 'rank'],
      'icon-image': ['concat', 'ra:v-mark-', ['get', 'kind'], '-', ['get', 'icon'], '-', ['to-string', ['get', 'alert']]] } },
  { id: 'ra-verdict-pins', type: 'symbol', source: SRC, minzoom: STREET_ZOOM, base: HAS_VERDICT, pin: true,
    layout: { ...SYMBOL, 'symbol-sort-key': ['get', 'rank'], 'icon-anchor': 'bottom', 'icon-offset': offsetExpr(pinW),
      'icon-image': ['concat', 'ra:v-pin-', ['get', 'kind'], '-', ['get', 'icon'], '-', ['to-string', ['get', 'alert']]] } },
  { id: 'ra-fac-dots', type: 'symbol', source: XSRC, maxzoom: DOT_ZOOM, extra: true,
    layout: { ...SYMBOL, 'icon-image': ['concat', 'ra:f-dot-', ['to-string', ['get', 'muted']]], 'icon-size': CITY_SIZE } },
  { id: 'ra-fac-marks', type: 'symbol', source: XSRC, minzoom: DOT_ZOOM, maxzoom: STREET_ZOOM, extra: true,
    layout: { ...SYMBOL, 'icon-image': ['concat', 'ra:f-mark-', ['get', 'icon'], '-', ['to-string', ['get', 'muted']], '-', ['to-string', ['get', 'alert']]] } },
  { id: 'ra-fac-pins', type: 'symbol', source: XSRC, minzoom: STREET_ZOOM, extra: true, pin: true,
    layout: { ...SYMBOL, 'icon-anchor': 'bottom', 'icon-offset': offsetExpr(pinW),
      'icon-image': ['concat', 'ra:f-pin-', ['get', 'icon'], '-', ['to-string', ['get', 'muted']], '-', ['to-string', ['get', 'alert']]] } },
];

const EMPTY = { type: 'FeatureCollection', features: [] };

/**
 * Add the sources, layers and sprite drawing to `map` (after its style has
 * loaded). Returns a controller; `opts`: { colors, icons, pinW, quietW }.
 */
export function addPlaceLayers(map, opts) {
  const pr = Math.min(3, Math.max(2, Math.ceil(window.devicePixelRatio || 1)));
  const specs = LAYERS(opts.pinW);
  const state = { places: [], extras: [], exclude: [], excludeExtra: [], showQuiet: true, slots: new Map(), slotZoom: null, priority: () => [] };

  // Sprites are drawn on first use (Path2D on a canvas is synchronous).
  map.on('styleimagemissing', (e) => {
    if (!String(e.id).startsWith('ra:') || map.hasImage(e.id)) return;
    const img = drawSprite(e.id.slice(3), { ...opts, pr });
    if (img) map.addImage(e.id, img, { pixelRatio: pr });
  });

  map.addSource(SRC, { type: 'geojson', data: EMPTY });
  map.addSource(XSRC, { type: 'geojson', data: EMPTY });
  for (const s of specs) {
    const layer = { id: s.id, type: s.type, source: s.source, filter: s.base || ['has', 'id'] };
    if (s.minzoom != null) layer.minzoom = s.minzoom;
    if (s.maxzoom != null) layer.maxzoom = s.maxzoom;
    if (s.layout) layer.layout = s.layout;
    if (s.paint) layer.paint = s.paint;
    map.addLayer(layer);
  }

  const placeFeatures = () => ({
    type: 'FeatureCollection',
    features: state.places.map((p) => ({
      type: 'Feature', geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
      properties: { id: p.id, kind: p.kind, icon: p.icon, alert: p.alert ? 1 : 0, rank: RANK[p.kind] ?? 0, slot: state.slots.get(p.id) || 0 },
    })),
  });
  const extraFeatures = () => ({
    type: 'FeatureCollection',
    features: state.extras.map((x) => ({
      type: 'Feature', geometry: { type: 'Point', coordinates: [x.lng, x.lat] },
      properties: { id: x.id, icon: x.icon || 'toilet', muted: x.muted ? 1 : 0, alert: x.alert ? 1 : 0, slot: state.slots.get(x.id) || 0 },
    })),
  });
  const push = () => { map.getSource(SRC)?.setData(placeFeatures()); map.getSource(XSRC)?.setData(extraFeatures()); };

  function applyFilters() {
    for (const s of specs) {
      const ids = s.extra ? state.excludeExtra : state.exclude;
      const base = s.base || ['has', 'id'];
      map.setFilter(s.id, ids.length ? ['all', base, ['!', ['in', ['get', 'id'], ['literal', ids]]]] : base);
      if (s.quiet) map.setLayoutProperty(s.id, 'visibility', state.showQuiet ? 'visible' : 'none');
    }
  }

  // Street zoom: group places whose pins would sit on each other (screen
  // distance < a pin's width) and give each one a slot around a circle.
  // Only depends on the zoom, so panning never moves a pin.
  function nudgeSlots(force = false) {
    const zoom = map.getZoom();
    if (zoom < STREET_ZOOM) return false;
    if (!force && state.slotZoom != null && Math.abs(zoom - state.slotZoom) < 0.01) return false;
    state.slotZoom = zoom;
    const size = opts.pinW;
    const all = [...state.priority(), ...state.places, ...state.extras];
    const seen = new Set();
    const pts = [];
    for (const p of all) {
      if (seen.has(p.id)) continue;
      seen.add(p.id);
      if (p.kind === 'unknown' && !state.showQuiet) continue;
      const q = map.project([p.lng, p.lat]);
      pts.push({ id: p.id, x: q.x, y: q.y });
    }
    // Grid hash, then flood-fill the neighbours closer than `size`.
    const cell = new Map();
    const key = (cx, cy) => cx + ',' + cy;
    pts.forEach((p, i) => {
      const k = key(Math.floor(p.x / size), Math.floor(p.y / size));
      (cell.get(k) || cell.set(k, []).get(k)).push(i);
    });
    const group = new Int32Array(pts.length).fill(-1);
    const next = new Map();
    let g = 0;
    for (let i = 0; i < pts.length; i++) {
      if (group[i] >= 0) continue;
      const members = [i];
      group[i] = g;
      for (let m = 0; m < members.length; m++) {
        const a = pts[members[m]];
        const cx = Math.floor(a.x / size), cy = Math.floor(a.y / size);
        for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
          for (const j of cell.get(key(cx + dx, cy + dy)) || []) {
            if (group[j] >= 0) continue;
            const b = pts[j];
            if (Math.hypot(a.x - b.x, a.y - b.y) < size) { group[j] = g; members.push(j); }
          }
        }
      }
      if (members.length > 1) {
        const n = Math.min(members.length, MAX_GROUP);
        members.sort((x, y) => x - y).forEach((idx, k) => next.set(pts[idx].id, n * 100 + (k % n)));
      }
      g++;
    }
    let changed = next.size !== state.slots.size;
    if (!changed) for (const [id, s] of next) if (state.slots.get(id) !== s) { changed = true; break; }
    state.slots = next;
    if (changed) push();
    return changed;
  }

  return {
    setPlaces(places) { state.places = places; state.slotZoom = null; nudgeSlots(true); push(); },
    setExtras(extras) { state.extras = extras; state.slotZoom = null; nudgeSlots(true); push(); },
    // DOM pins first in the nudge order (the list's order), then the rest.
    setPriority(fn) { state.priority = fn; },
    setExcluded(ids, extraIds) { state.exclude = ids; state.excludeExtra = extraIds; applyFilters(); },
    setShowQuiet(on) { if (state.showQuiet === on) return; state.showQuiet = on; applyFilters(); state.slotZoom = null; nudgeSlots(true); },
    nudge: () => nudgeSlots(false),
    offsetOf(id) { return map.getZoom() >= STREET_ZOOM ? slotOffset(state.slots.get(id) || 0, opts.pinW) : [0, 0]; },
    // What a click or tap at `point` landed on: the nearest place or
    // facility marker within HIT px of it (a 24px box), or null.
    hit(point) {
      const box = [[point.x - HIT, point.y - HIT], [point.x + HIT, point.y + HIT]];
      const feats = map.queryRenderedFeatures(box, { layers: specs.map(s => s.id) });
      let best = null, bestD = Infinity;
      for (const f of feats) {
        const spec = specs.find(s => s.id === f.layer.id);
        const [lng, lat] = f.geometry.coordinates;
        const q = map.project([lng, lat]);
        const off = spec.pin || spec.id === 'ra-quiet-pins' ? slotOffset(f.properties.slot || 0, opts.pinW) : [0, 0];
        // A pin's head sits above its point.
        const cy = q.y + off[1] - (spec.pin ? opts.pinW * 0.7 : 0);
        const d = Math.hypot(point.x - (q.x + off[0]), point.y - cy) - (spec.extra ? 0 : (RANK[f.properties.kind] || 0) * 0.01);
        if (d < bestD) { bestD = d; best = { id: f.properties.id, extra: !!spec.extra, d }; }
      }
      return best;
    },
  };
}

export { SPRITE };
