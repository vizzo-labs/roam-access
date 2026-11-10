// The map's symbols, drawn two ways from the same shapes:
//  - as SVG markup, for the DOM pins (the list's places, the selected one)
//    and for the Key; and
//  - on a canvas, as WebGL sprites for every other place (map/placeLayers.js).
// Verdict never relies on colour alone: the shape says it too (circle =
// works for you, diamond = check first, octagon = has barriers), and the
// full pin adds the ✓ ! ✗ badge.
//
// Size tiers (map/placeLayers.js has the zoom levels):
//   dot    ≤ 13  a small verdict shape with a white ring, no icon
//   mark   14–15 a 22px verdict shape with the category icon, no badge
//   street ≥ 16  the category pin with its badge (15 % smaller than the
//                full pin); "No info yet" = a small quiet marker
//   full         the selected, hovered or focused place, at every zoom

export const PAPER = '#FAF9F6';
const INK = '#1A1A1A';
// "No info yet" dots: lighter than the verdicts (low emphasis) and still
// 3:1 against the map's paper background.
export const QUIET = '#7A828C';
export const QUIET_INK = '#475569';
export const TEAL_FILL = '#0A4F4F';
export const MUTED = '#475569';

// 24×24 stroke icons, one per kind of place.
export const PLACE_ICONS = {
  cafe:  'M4 9h12v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V9ZM16 11h1.5a2.5 2.5 0 0 1 0 5H16M8 3.5v2.5M12 3.5v2.5',
  food:  'M7 3v7a2.5 2.5 0 0 0 5 0V3M9.5 3v18M17 3c-1.5 1-2.5 3-2.5 6v3h3v9',
  bar:   'M6 3h12l-1.2 6.5a4.9 4.9 0 0 1-9.6 0L6 3ZM12 14.5V21M8 21h8',
  park:  'M12 3 6 12h4l-4 7h12l-4-7h4L12 3ZM12 19v2',
  water: 'M3 9c2 0 2-2 4.5-2S10 9 12 9s2-2 4.5-2S19 9 21 9M3 15c2 0 2-2 4.5-2s2.5 2 4.5 2 2-2 4.5-2 2.5 2 4.5 2',
  arts:  'M4 10 12 4l8 6M6 10v8M10 10v8M14 10v8M18 10v8M4 18h16',
  music: 'M9 18V6l10-2v12M9 18a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Zm10-2a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z',
  stay:  'M3 6v13M3 14h18M21 19v-5a3 3 0 0 0-3-3h-8v3M6.5 11.5a1.5 1.5 0 1 0 0-.01',
  // Access layers (F3)
  toilet: 'M6 3h5v7H6zM4 10h15v1.5A6.5 6.5 0 0 1 12.5 18h-2A6.5 6.5 0 0 1 4 11.5V10ZM9 18l-1 3h7l-1-3',
  swing: 'M3 3h18M7 3v11M17 3v11M5 14h14v3H5zM9 20h6',
  ferry: 'M3 14h18l-2.5 5h-13L3 14ZM6 14V9h12v5M10 9V6h4v3M2 22c2.5 0 2.5-1.2 5-1.2s2.5 1.2 5 1.2 2.5-1.2 5-1.2 2.5 1.2 5 1.2',
  walk:  'M13.5 4.5a1.5 1.5 0 1 0 0-.01M9 21l2.5-6 3 3v3M11.5 15l-1-5.5 4 1.5 2 3M10.5 9.5 7 12v3',
  // Getting there 2 (I2): parking & transport
  parking: 'M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2ZM9.5 17V7h3.5a3 3 0 0 1 0 6H9.5',
  car:   'M5 16V11l2-5h10l2 5v5M3.5 16h17v3h-17zM7.5 19v1.5M16.5 19v1.5M5 11h14M7.5 13.5h.01M16.5 13.5h.01',
  bus:   'M6 3h12a2 2 0 0 1 2 2v12H4V5a2 2 0 0 1 2-2ZM4 11h16M8 20v-3M16 20v-3M8 14h.01M16 14h.01',
};
export const PLACE_ICON_LEGEND = [
  ['cafe', 'Cafe'], ['food', 'Food'], ['bar', 'Bar & pub'], ['park', 'Park'],
  ['water', 'Beach & pool'], ['arts', 'Arts & culture'], ['music', 'Music & shows'], ['stay', 'Stay'],
];
const KIND_ICON = {
  Cafe: 'cafe', Restaurant: 'food', Takeaway: 'food', 'Food court': 'food', 'Ice cream': 'food',
  Bar: 'bar', Pub: 'bar', 'Beer garden': 'bar', Nightclub: 'bar',
  Park: 'park', Garden: 'park', 'Nature reserve': 'park',
  Beach: 'water', 'Ocean pool': 'water', 'Swimming pool': 'water',
  Museum: 'arts', Gallery: 'arts', 'Arts centre': 'arts', Library: 'arts', Aquarium: 'arts',
  Theatre: 'music', Cinema: 'music', 'Music venue': 'music',
  Hotel: 'stay', Motel: 'stay', Hostel: 'stay', 'Guest house': 'stay',
};
const CAT_ICON = { food: 'food', parks: 'park', arts: 'arts', music: 'music', stay: 'stay' };
export const iconFor = (r) => KIND_ICON[r.kind] || CAT_ICON[r.cat] || 'food';

// ── Shapes (viewBox units) ───────────────────────────────────────────────
const PIN_PATH = 'M16 39C16 39 3 24.5 3 15.5a13 13 0 0 1 26 0C29 24.5 16 39 16 39Z';
// Verdict shapes in a 32×32 box, centred on (16, 16).
export const SHAPES = {
  works: 'M16 2a14 14 0 1 1 0 28a14 14 0 1 1 0-28Z',
  check: 'M16 1.2 30.8 16 16 30.8 1.2 16Z',
  barrier: 'M10.2 1.5h11.6l8.7 8.7v11.6l-8.7 8.7H10.2l-8.7-8.7V10.2Z',
};
// Dots are tiny: a regular octagon there reads as a circle, so the dot's
// octagon has shorter cut corners (still an octagon, clearly not round).
const DOT_SHAPES = { ...SHAPES, barrier: 'M8 1.8h16l6.2 6.2v16L24 30.2H8L1.8 24V8Z' };
const SQUARE = 'M7 3h18a4 4 0 0 1 4 4v18a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4Z';
const FACILITY_PIN = 'M7 3h18a4 4 0 0 1 4 4v18a4 4 0 0 1-4 4h-5l-4 8-4-8H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4Z';
const QUIET_CIRCLE = 'M16 3a13 13 0 1 1 0 26a13 13 0 1 1 0-26Z';
// Badge marks drawn as strokes (not font glyphs), so the SVG pins and the
// WebGL sprites look the same everywhere. Centred on (27, 5).
const BADGE_MARKS = {
  '✓': { d: 'M24 5.2l2.1 2.2 3.9-4.4' },
  '✗': { d: 'M24.6 2.6l4.8 4.8M29.4 2.6l-4.8 4.8' },
  '!': { d: 'M27 1.6v3.7', dot: [27, 7.8] },
};
// ⚠ in the top-left corner: a temporary problem was reported today.
const ALERT = { tri: 'M5 -4 11.5 7.5H-1.5Z', bar: 'M5 -0.5v3.5', dot: [5, 5.2] };
const SHADOW = 'filter:drop-shadow(0 1px 2px rgba(26,26,26,.35))';
// The inner, coloured part of a dot: the shape shrunk inside its white ring.
const DOT_INNER = 0.74;
// Dot widths (ring included): a diamond covers half its box, so it's drawn
// a little bigger to weigh the same as the others.
export const DOT_W = { works: 12, check: 14, barrier: 12 };

// ── SVG markup (DOM pins, the Key, list icons) ───────────────────────────
const ALERT_MARK = `<path d="${ALERT.tri}" fill="${INK}" stroke="${PAPER}" stroke-width="1.5" stroke-linejoin="round"/>`
  + `<path d="${ALERT.bar}" stroke="${PAPER}" stroke-width="1.6" stroke-linecap="round"/><circle cx="${ALERT.dot[0]}" cy="${ALERT.dot[1]}" r="0.9" fill="${PAPER}"/>`;

function badgeSvg(badge, color) {
  const m = BADGE_MARKS[badge];
  const mark = m
    ? `<path d="${m.d}" fill="none" stroke="${color}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>` + (m.dot ? `<circle cx="${m.dot[0]}" cy="${m.dot[1]}" r="1" fill="${color}"/>` : '')
    : `<text x="27" y="8.2" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, monospace" font-weight="800" font-size="9" fill="${color}">${badge}</text>`;
  return `<circle cx="27" cy="5" r="6.5" fill="${PAPER}" stroke="${color}" stroke-width="1.5"/>` + mark;
}

const iconSvg = (icon, color, tx, ty, k, sw) =>
  `<g transform="translate(${tx} ${ty}) scale(${k})"><path d="${PLACE_ICONS[icon] || PLACE_ICONS.food}" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/></g>`;

// One map pin. `badge` is the verdict symbol (or null).
export function pinSvg({ w, fill, stroke, iconColor, icon, badge, badgeColor, alert = false, strokeWidth = 2 }) {
  const h = Math.round(w * 1.25);
  return `<svg width="${w}" height="${h}" viewBox="0 0 32 40" aria-hidden="true" focusable="false" style="display:block;overflow:visible;${SHADOW}">`
    + `<path d="${PIN_PATH}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}"/>`
    + iconSvg(icon, iconColor, 8.5, 8, 0.625, 2.6)
    + (badge ? badgeSvg(badge, badgeColor) : '')
    + (alert ? ALERT_MARK : '')
    + `</svg>`;
}

// Mid zoom: the category icon in a verdict SHAPE, no badge.
export function markSvg({ w, kind, fill, icon, alert = false }) {
  return `<svg width="${w}" height="${w}" viewBox="0 0 32 32" aria-hidden="true" focusable="false" style="display:block;overflow:visible;${SHADOW}">`
    + `<path d="${SHAPES[kind] || SHAPES.works}" fill="${fill}" stroke="${PAPER}" stroke-width="2" stroke-linejoin="round"/>`
    + iconSvg(icon, PAPER, 8.2, 8.2, 0.65, 2.8)
    + (alert ? `<g transform="translate(-2 2)">${ALERT_MARK}</g>` : '')
    + `</svg>`;
}

// Zoomed out: just the verdict shape with a white ring.
export function verdictDotSvg({ w = null, kind, fill }) {
  const d = DOT_SHAPES[kind] || DOT_SHAPES.works;
  w = w || DOT_W[kind] || 12;
  return `<svg width="${w}" height="${w}" viewBox="0 0 32 32" aria-hidden="true" focusable="false" style="display:block;overflow:visible">`
    + `<path d="${d}" fill="${PAPER}"/>`
    + `<g transform="translate(16 16) scale(${DOT_INNER}) translate(-16 -16)"><path d="${d}" fill="${fill}"/></g>`
    + `</svg>`;
}

// "No info yet": a quiet grey dot (`w` = its full width, ring included).
export function dotSvg({ w = 7, fill = QUIET }) {
  return `<svg width="${w}" height="${w}" viewBox="0 0 14 14" aria-hidden="true" focusable="false" style="display:block">`
    + `<circle cx="7" cy="7" r="6" fill="${fill}" stroke="${PAPER}" stroke-width="2"/></svg>`;
}

// "No info yet" at street zoom: a small pale marker with the category icon.
export function quietSvg({ w = 20, icon }) {
  return `<svg width="${w}" height="${w}" viewBox="0 0 32 32" aria-hidden="true" focusable="false" style="display:block;overflow:visible">`
    + `<path d="${QUIET_CIRCLE}" fill="${PAPER}" stroke="${QUIET_INK}" stroke-width="2.2"/>`
    + iconSvg(icon, QUIET_INK, 8.2, 8.2, 0.65, 2.6)
    + `</svg>`;
}

// ── Facility pins (access layers) ────────────────────────────────────────
// A rounded square: a different SHAPE from place pins, so a listing never
// reads as a verdict. Teal = listed; muted (paper) = listed but not
// accessible (e.g. a toilet without an accessible cubicle).
const facilityColours = muted => ({ fill: muted ? PAPER : TEAL_FILL, stroke: muted ? MUTED : PAPER, ic: muted ? MUTED : PAPER });
export function facilitySvg({ w, icon, muted = false, alert = false }) {
  const h = Math.round(w * 1.25);
  const c = facilityColours(muted);
  return `<svg width="${w}" height="${h}" viewBox="0 0 32 40" aria-hidden="true" focusable="false" style="display:block;overflow:visible;${SHADOW}">`
    + `<path d="${FACILITY_PIN}" fill="${c.fill}" stroke="${c.stroke}" stroke-width="2"/>`
    + iconSvg(icon || 'toilet', c.ic, 8.5, 8.5, 0.625, 2.6)
    + (alert ? ALERT_MARK : '')
    + `</svg>`;
}
// Mid zoom: the square without the pointer.
export function facilityMarkSvg({ w = 22, icon, muted = false, alert = false }) {
  const c = facilityColours(muted);
  return `<svg width="${w}" height="${w}" viewBox="0 0 32 32" aria-hidden="true" focusable="false" style="display:block;overflow:visible;${SHADOW}">`
    + `<path d="${SQUARE}" fill="${c.fill}" stroke="${c.stroke}" stroke-width="2"/>`
    + iconSvg(icon || 'toilet', c.ic, 8.5, 8.5, 0.625, 2.8)
    + (alert ? `<g transform="translate(-2 2)">${ALERT_MARK}</g>` : '')
    + `</svg>`;
}
// Zoomed out: a small square.
export function facilityDotSvg({ w = 10, muted = false }) {
  const c = facilityColours(muted);
  return `<svg width="${w}" height="${w}" viewBox="0 0 32 32" aria-hidden="true" focusable="false" style="display:block;overflow:visible">`
    + `<path d="${SQUARE}" fill="${PAPER}"/>`
    + `<g transform="translate(16 16) scale(${DOT_INNER}) translate(-16 -16)"><path d="${SQUARE}" fill="${muted ? c.stroke : c.fill}"/></g>`
    + `</svg>`;
}

// ── Canvas sprites (WebGL layers) ────────────────────────────────────────
// Each sprite is drawn at `pr` device pixels per CSS pixel and handed to
// map.addImage(name, imageData, { pixelRatio: pr }). Path2D takes the same
// SVG path strings, so the shapes match the markup above exactly.

const P2D = new Map();
const path = (d) => { let p = P2D.get(d); if (!p) { p = new Path2D(d); P2D.set(d, p); } return p; };

// A canvas `wPx × hPx` CSS px; `unit` = CSS px per viewBox unit; (ox, oy) =
// where the viewBox origin sits, in CSS px.
function sprite(wPx, hPx, pr, unit, ox, oy, draw) {
  const c = document.createElement('canvas');
  c.width = Math.ceil(wPx * pr); c.height = Math.ceil(hPx * pr);
  const ctx = c.getContext('2d');
  ctx.setTransform(pr * unit, 0, 0, pr * unit, pr * ox, pr * oy);
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  draw(ctx, pr);
  return ctx.getImageData(0, 0, c.width, c.height);
}
function shadow(ctx, pr, on) {
  ctx.shadowColor = on ? 'rgba(26,26,26,0.35)' : 'transparent';
  ctx.shadowBlur = on ? 2 * pr : 0;
  ctx.shadowOffsetY = on ? 1 * pr : 0;
}
function fillStroke(ctx, pr, d, fill, stroke, sw, withShadow = true) {
  const p = path(d);
  shadow(ctx, pr, withShadow);
  ctx.fillStyle = fill; ctx.fill(p);
  shadow(ctx, pr, false);
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = sw; ctx.stroke(p); }
}
function icon(ctx, name, color, tx, ty, k, sw) {
  ctx.save();
  ctx.translate(tx, ty); ctx.scale(k, k);
  ctx.strokeStyle = color; ctx.lineWidth = sw;
  ctx.stroke(path(PLACE_ICONS[name] || PLACE_ICONS.food));
  ctx.restore();
}
function badge(ctx, glyph, color) {
  ctx.beginPath(); ctx.arc(27, 5, 6.5, 0, Math.PI * 2);
  ctx.fillStyle = PAPER; ctx.fill();
  ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.stroke();
  const m = BADGE_MARKS[glyph];
  if (!m) return;
  ctx.strokeStyle = color; ctx.lineWidth = 1.7; ctx.stroke(path(m.d));
  if (m.dot) { ctx.beginPath(); ctx.arc(m.dot[0], m.dot[1], 1, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill(); }
}
function alertMark(ctx) {
  ctx.fillStyle = INK; ctx.fill(path(ALERT.tri));
  ctx.strokeStyle = PAPER; ctx.lineWidth = 1.5; ctx.stroke(path(ALERT.tri));
  ctx.lineWidth = 1.6; ctx.stroke(path(ALERT.bar));
  ctx.beginPath(); ctx.arc(ALERT.dot[0], ALERT.dot[1], 0.9, 0, Math.PI * 2); ctx.fillStyle = PAPER; ctx.fill();
}
function inner(ctx, d, fill) {
  ctx.save();
  ctx.translate(16, 16); ctx.scale(DOT_INNER, DOT_INNER); ctx.translate(-16, -16);
  ctx.fillStyle = fill; ctx.fill(path(d));
  ctx.restore();
}

// Sprite sizes in CSS px, by name. Pins: the region is 40×44 units with
// the tip at the bottom centre (icon-anchor 'bottom'); the rest are square
// and centred.
export const SPRITE = { mark: 22, quiet: 20, fdot: 11, fmark: 22 };

/**
 * Draw the sprite called `name` (see placeLayers.js for the names):
 *   v-dot-{kind}            v-mark-{kind}-{icon}-{a}   v-pin-{kind}-{icon}-{a}
 *   q-pin-{icon}            f-dot-{m}                  f-mark-{icon}-{m}-{a}   f-pin-{icon}-{m}-{a}
 * `colors`/`icons` are the verdict colours and badges; `pinW` = street pin
 * width, `quietW` = the "No info yet" street marker.
 */
export function drawSprite(name, { colors, icons, pinW, quietW, pr }) {
  const [group, tier, ...rest] = name.split('-');
  if (group === 'v' && tier === 'dot') {
    const [kind] = rest;
    const w = DOT_W[kind] || 12, u = w / 32;
    return sprite(w, w, pr, u, 0, 0, (ctx) => {
      ctx.fillStyle = PAPER; ctx.fill(path(DOT_SHAPES[kind]));
      inner(ctx, DOT_SHAPES[kind], colors[kind]);
    });
  }
  if (group === 'v' && tier === 'mark') {
    const [kind, ic, a] = rest;
    const w = SPRITE.mark, u = w / 32, pad = 4 * u;
    return sprite(w + 2 * pad, w + 2 * pad, pr, u, pad, pad, (ctx) => {
      fillStroke(ctx, pr, SHAPES[kind], colors[kind], PAPER, 2);
      icon(ctx, ic, PAPER, 8.2, 8.2, 0.65, 2.8);
      if (a === '1') { ctx.save(); ctx.translate(-2, 2); alertMark(ctx); ctx.restore(); }
    });
  }
  if (group === 'v' && tier === 'pin') {
    const [kind, ic, a] = rest;
    const u = pinW / 32;
    return sprite(40 * u, 44 * u, pr, u, 4 * u, 4 * u, (ctx) => {
      fillStroke(ctx, pr, PIN_PATH, colors[kind], PAPER, 2);
      icon(ctx, ic, PAPER, 8.5, 8, 0.625, 2.6);
      badge(ctx, icons[kind], colors[kind]);
      if (a === '1') alertMark(ctx);
    });
  }
  if (group === 'q' && tier === 'pin') {
    const [ic] = rest;
    const w = quietW, u = w / 32, pad = 2 * u;
    return sprite(w + 2 * pad, w + 2 * pad, pr, u, pad, pad, (ctx) => {
      fillStroke(ctx, pr, QUIET_CIRCLE, PAPER, QUIET_INK, 2.2);
      icon(ctx, ic, QUIET_INK, 8.2, 8.2, 0.65, 2.6);
    });
  }
  if (group === 'f' && tier === 'dot') {
    const muted = rest[0] === '1';
    const c = facilityColours(muted);
    const w = SPRITE.fdot, u = w / 32;
    return sprite(w, w, pr, u, 0, 0, (ctx) => {
      ctx.fillStyle = PAPER; ctx.fill(path(SQUARE));
      inner(ctx, SQUARE, muted ? c.stroke : c.fill);
    });
  }
  if (group === 'f' && tier === 'mark') {
    const [ic, m, a] = rest;
    const c = facilityColours(m === '1');
    const w = SPRITE.fmark, u = w / 32, pad = 4 * u;
    return sprite(w + 2 * pad, w + 2 * pad, pr, u, pad, pad, (ctx) => {
      fillStroke(ctx, pr, SQUARE, c.fill, c.stroke, 2);
      icon(ctx, ic, c.ic, 8.5, 8.5, 0.625, 2.8);
      if (a === '1') { ctx.save(); ctx.translate(-2, 2); alertMark(ctx); ctx.restore(); }
    });
  }
  if (group === 'f' && tier === 'pin') {
    const [ic, m, a] = rest;
    const c = facilityColours(m === '1');
    const u = pinW / 32;
    return sprite(40 * u, 44 * u, pr, u, 4 * u, 4 * u, (ctx) => {
      fillStroke(ctx, pr, FACILITY_PIN, c.fill, c.stroke, 2);
      icon(ctx, ic, c.ic, 8.5, 8.5, 0.625, 2.6);
      if (a === '1') alertMark(ctx);
    });
  }
  return null;
}
