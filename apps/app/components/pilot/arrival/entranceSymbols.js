// Getting there 4 (I4) — one symbol per entrance kind, so a place with
// several entrances shows which pin is which door. Each kind differs in
// SHAPE and in its glyph, and on the map each pin also carries a short text
// label; the key under the map names every symbol in words. Colour only
// repeats what the shape says (teal = confirmed; dashed and white =
// not confirmed or may have changed). Plain SVG strings: MapLibre owns the
// marker elements, and the key renders the same markup.
//
//   main   rounded square · door
//   side   circle         · door with an arrow out to the side
//   back   diamond        · door
//   lift   square         · lift arrows (up and down)
//   other  hexagon        · door

const DOOR = 'M8 19V6.2c0-.7.5-1.2 1.2-1.2h5.6c.7 0 1.2.5 1.2 1.2V19M6 19h12M13.6 12.2v.01';
const SIDE = 'M7 19V6.2C7 5.5 7.5 5 8.2 5h5.6c.7 0 1.2.5 1.2 1.2V19M5 19h10.5M12.6 12.2v.01M17 12h3.5M18.8 10.2l1.8 1.8-1.8 1.8';
const LIFT = 'M8.5 10.5 12 6.5l3.5 4M8.5 13.5l3.5 4 3.5-4';

// Shapes in a 24×24 box, inset so a 2.5px stroke fits.
const SHAPES = {
  main: '<rect x="1.8" y="1.8" width="20.4" height="20.4" rx="5"/>',
  side: '<circle cx="12" cy="12" r="10.4"/>',
  back: '<path d="M12 .9 23.1 12 12 23.1.9 12Z" stroke-linejoin="round"/>',
  lift: '<rect x="1.8" y="1.8" width="20.4" height="20.4" rx="1"/>',
  other: '<path d="M6.3 2h11.4l5.4 10-5.4 10H6.3L.9 12Z" stroke-linejoin="round"/>',
};
const GLYPH = { main: DOOR, side: SIDE, back: DOOR, lift: LIFT, other: DOOR };
// The diamond's middle is smaller: shrink its glyph so it stays inside.
const GLYPH_SCALE = { back: 0.72, other: 0.85 };

export const ENTRANCE_SYMBOL_KINDS = ['main', 'side', 'back', 'lift', 'other'];
export const kindOf = k => (ENTRANCE_SYMBOL_KINDS.includes(k) ? k : 'other');

/**
 * SVG markup for one entrance symbol.
 * @param kind     main | side | back | lift | other
 * @param colors   { fill, stroke, glyph } — read C2 at call time
 * @param dashed   not confirmed / may have changed
 */
export function entranceSymbolSvg(kind, { size = 40, fill, stroke, glyph, dashed = false } = {}) {
  const k = kindOf(kind);
  const s = GLYPH_SCALE[k] || 1;
  const tr = s === 1 ? '' : ` transform="translate(${12 - 12 * s} ${12 - 12 * s}) scale(${s})"`;
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true" focusable="false" style="display:block;overflow:visible">`
    + `<g fill="${fill}" stroke="${stroke}" stroke-width="${dashed ? 1.6 : 1.8}"${dashed ? ' stroke-dasharray="2.6 1.8"' : ''}>${SHAPES[k]}</g>`
    + `<path d="${GLYPH[k]}"${tr} fill="none" stroke="${glyph}" stroke-width="${2 / s}" stroke-linecap="round" stroke-linejoin="round"/>`
    + '</svg>';
}
