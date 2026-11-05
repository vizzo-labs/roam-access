'use client';
// Real map: MapLibre GL + OpenFreeMap vector tiles (free, no key; data ©
// OpenStreetMap contributors, credited in the corner).
//
// Every place is always on the map, with detail by zoom (like any street
// map): places with access info are full pins at every zoom; places with no
// info yet are quiet dots in the overview and become "?" pins at street level.
// Pins are real <button>s; the list view stays the primary, fully accessible
// way to browse.

import { useEffect, useRef, useState } from 'react';
import 'maplibre-gl/dist/maplibre-gl.css';

const STYLE = 'https://tiles.openfreemap.org/styles/positron';
const TEAL = '#0A4F4F', PAPER = '#FAF9F6';
// From this zoom (street level) every place gets a full-size pin.
const DETAIL_ZOOM = 15;

export function PilotMap({
  results, selectedId, onSelect, origin, colors, icons, labels,
  topPad = 150, bottomPad = 210, fit = true,
  onLocate, onLocateError, autoLocate = false, locateStyle = { right: 16, top: 16 },
}) {
  const box = useRef(null);
  const ctx = useRef(null); // { map, lib }
  const markers = useRef(new Map()); // id → { mk, el, dot, kind }
  const byIdRef = useRef(new Map());
  const selRef = useRef(selectedId);
  selRef.current = selectedId;
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const onLocateRef = useRef(onLocate);
  onLocateRef.current = onLocate;
  const onLocateErrorRef = useRef(onLocateError);
  onLocateErrorRef.current = onLocateError;
  const geoRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [following, setFollowing] = useState(false);
  const [locating, setLocating] = useState(false);

  const repaint = useRef(() => {});
  repaint.current = () => {
    const map = ctx.current?.map;
    // A narrowed search (≤ 80 places) shows every result as a full pin; the
    // whole area or a huge list keeps the quiet dots until street level.
    const fewResults = fit && markers.current.size <= 80;
    if (map) paintPins(markers.current, selRef.current, colors, icons, fewResults || map.getZoom() >= DETAIL_ZOOM);
  };

  // Create the map once.
  useEffect(() => {
    let cancelled = false;
    import('maplibre-gl').then((mod) => {
      const lib = mod.default ?? mod; // v6 ships ESM without a default export
      if (cancelled || !box.current) return;
      // The worker is copied to /public at build time (see package.json):
      // MapLibre's default URL is relative to its own file, which bundling moves.
      lib.setWorkerUrl('/maplibre/maplibre-gl-worker.mjs');
      const map = new lib.Map({
        container: box.current, style: STYLE,
        center: [origin.lng, origin.lat], zoom: 14.2,
        attributionControl: { compact: true },
      });
      // Only a style that never loads is fatal; a stray tile error isn't.
      map.on('error', (e) => {
        if (!map.isStyleLoaded() && /style/i.test(String(e?.error?.message || e?.error?.url || ''))) setFailed(true);
      });
      map.on('zoomend', () => repaint.current());

      // "You are here": MapLibre draws the dot + accuracy circle; our own
      // 48px button (below) drives it, because the built-in one is too small.
      const geo = new lib.GeolocateControl({
        positionOptions: { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 },
        trackUserLocation: true, showUserLocation: true, showAccuracyCircle: true,
        fitBoundsOptions: { maxZoom: 16 },
      });
      map.addControl(geo, 'top-right');
      geo.on('geolocate', (pos) => {
        setLocating(false);
        onLocateRef.current?.({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      });
      geo.on('error', () => { setLocating(false); setFollowing(false); onLocateErrorRef.current?.(); });
      geo.on('trackuserlocationstart', () => setFollowing(true));
      geo.on('trackuserlocationend', () => { setFollowing(false); setLocating(false); });
      geoRef.current = geo;
      // Location already shared in this session: show the dot straight away.
      if (autoLocate) map.once('load', () => { try { geo.trigger(); } catch (e) {} });

      ctx.current = { map, lib };
      setReady(true);
    }).catch((e) => { console.warn('[roam-access] map failed to load', e); setFailed(true); });
    return () => {
      cancelled = true;
      if (ctx.current) ctx.current.map.remove();
      ctx.current = null;
      geoRef.current = null;
      markers.current.clear();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // New result set: rebuild the pins, then frame the best matches. DOM order
  // is result order, so keyboard users reach the best matches first.
  const key = results.map(r => r.id + ':' + r.verdict.kind).join('|');
  useEffect(() => {
    if (!ready || !ctx.current) return;
    const { map, lib } = ctx.current;
    byIdRef.current = new Map(results.map(r => [r.id, r]));
    markers.current.forEach(m => m.mk.remove());
    markers.current.clear();
    for (const r of results) {
      const el = pinButton(r, labels, () => onSelectRef.current(r.id));
      // Anchored at the pin's tip, which sits exactly on the place.
      const mk = new lib.Marker({ element: el, anchor: 'bottom' }).setLngLat([r.lng, r.lat]).addTo(map);
      markers.current.set(r.id, { mk, el, kind: r.verdict.kind, icon: iconFor(r), state: null });
    }
    if (fit && results.length) {
      const bounds = new lib.LngLatBounds();
      const focus = results.slice(0, 20);
      const sel = results.find(r => r.id === selectedId);
      if (sel && !focus.includes(sel)) focus.push(sel);
      focus.forEach(r => bounds.extend([r.lng, r.lat]));
      map.fitBounds(bounds, { padding: { top: topPad, bottom: bottomPad, left: 48, right: 48 }, maxZoom: 16, duration: 0 });
    }
    repaint.current();
  }, [ready, key]); // eslint-disable-line react-hooks/exhaustive-deps

  // Selection: the big pin; bring it into view if it's off-screen.
  useEffect(() => {
    if (!ready || !ctx.current) return;
    repaint.current();
    const sel = byIdRef.current.get(selectedId);
    if (sel) {
      const { map } = ctx.current;
      const p = map.project([sel.lng, sel.lat]);
      const { clientWidth: w, clientHeight: h } = map.getContainer();
      if (p.x < 40 || p.x > w - 40 || p.y < topPad - 10 || p.y > h - bottomPad) {
        map.easeTo({ center: [sel.lng, sel.lat], zoom: Math.max(map.getZoom(), 15), padding: { top: topPad, bottom: bottomPad, left: 0, right: 0 }, duration: 300 });
      }
    }
  }, [ready, selectedId]); // eslint-disable-line react-hooks/exhaustive-deps

  function locate() {
    const geo = geoRef.current;
    if (!geo) return;
    if (!following) setLocating(true);
    if (!geo.trigger()) setLocating(false);
  }

  return (
    <>
      {/* isolate: pins/bubbles stack inside the map, never over the legend */}
      <div ref={box} style={{ position: 'absolute', inset: 0, background: '#EDEAE2', isolation: 'isolate' }}/>
      {ready && !failed && (
        <button type="button" onClick={locate} aria-pressed={following}
          aria-label={following ? 'Stop following my location' : 'Show my location on the map'}
          style={{
            position: 'absolute', zIndex: 6, ...locateStyle,
            width: 48, height: 48, borderRadius: 999, cursor: 'pointer', padding: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: following ? `2px solid ${TEAL}` : '1.5px solid #8A8680',
            background: following ? TEAL : PAPER,
            boxShadow: '0 4px 14px rgba(26,26,26,0.14)',
          }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false"
            className={locating ? 'ra-locating' : undefined}>
            <circle cx="12" cy="12" r="4" fill={following ? PAPER : TEAL}/>
            <circle cx="12" cy="12" r="7.5" stroke={following ? PAPER : '#1A1A1A'} strokeWidth="1.8"/>
            <path d="M12 1.5v3M12 19.5v3M1.5 12h3M19.5 12h3" stroke={following ? PAPER : '#1A1A1A'} strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
        </button>
      )}
      {failed && (
        <p role="status" style={{
          position: 'absolute', left: 18, right: 18, top: '40%', margin: 0, textAlign: 'center',
          fontFamily: 'Inter, system-ui, sans-serif', fontSize: 15, color: '#5A5651',
        }}>The map couldn’t load. The list view has every result.</p>
      )}
    </>
  );
}

// ── Pins ─────────────────────────────────────────────────────────────────
// Shape = category (icon inside a map pin); colour + corner badge = verdict.
// The badge's symbol means the verdict never relies on colour alone.

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

const PIN_PATH = 'M16 39C16 39 3 24.5 3 15.5a13 13 0 0 1 26 0C29 24.5 16 39 16 39Z';

// One map pin as SVG markup. `badge` is the verdict symbol (or null).
export function pinSvg({ w, fill, stroke, iconColor, icon, badge, badgeColor }) {
  const h = Math.round(w * 1.25);
  return `<svg width="${w}" height="${h}" viewBox="0 0 32 40" aria-hidden="true" focusable="false" style="display:block;overflow:visible;filter:drop-shadow(0 1px 2px rgba(26,26,26,.35))">`
    + `<path d="${PIN_PATH}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`
    + `<g transform="translate(8.5 8) scale(0.625)"><path d="${PLACE_ICONS[icon]}" fill="none" stroke="${iconColor}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></g>`
    + (badge ? `<circle cx="27" cy="5" r="6.5" fill="${PAPER}" stroke="${badgeColor}" stroke-width="1.5"/>`
      + `<text x="27" y="8.2" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, monospace" font-weight="800" font-size="9" fill="${badgeColor}">${badge}</text>` : '')
    + `</svg>`;
}

function pinButton(r, labels, onClick) {
  const el = document.createElement('button');
  el.type = 'button';
  el.setAttribute('aria-label', `${r.name}, ${r.kind}, ${labels[r.verdict.kind]}`);
  Object.assign(el.style, {
    background: 'transparent', border: '0', padding: '0', cursor: 'pointer',
    display: 'flex', alignItems: 'flex-end', justifyContent: 'center', lineHeight: '0',
  });
  el.addEventListener('click', (e) => { e.stopPropagation(); onClick(); });
  return el;
}

// Places with a verdict: a coloured pin at every zoom. Places with no info
// yet: a quiet dot in the overview, a white pin at street level. Selected:
// the big pin. Only re-draws a pin whose look actually changed.
function paintPins(markers, selectedId, colors, icons, detail) {
  markers.forEach((m, id) => {
    const on = id === selectedId;
    const unknown = m.kind === 'unknown';
    const quiet = unknown && !on && !detail;
    const state = `${on}|${quiet}`;
    m.el.setAttribute('aria-pressed', String(on));
    m.el.style.zIndex = on ? '5' : quiet ? '1' : unknown ? '2' : '3';
    if (m.state === state) return;
    m.state = state;
    if (quiet) {
      m.el.style.width = m.el.style.height = '20px';
      m.el.style.alignItems = 'center';
      m.el.innerHTML = `<span aria-hidden="true" style="display:block;width:12px;height:12px;border-radius:999px;background:${colors.unknown};opacity:.6;border:1.5px solid ${PAPER};box-sizing:border-box"></span>`;
      m.mk.setOffset([0, 10]); // a dot sits on the place, not above it
      return;
    }
    const w = on ? 46 : 34;
    m.el.style.width = w + 'px';
    m.el.style.height = Math.round(w * 1.25) + 'px';
    m.el.style.alignItems = 'flex-end';
    m.mk.setOffset([0, 0]);
    m.el.innerHTML = unknown
      ? pinSvg({ w, fill: PAPER, stroke: colors.unknown, iconColor: colors.unknown, icon: m.icon, badge: null })
      : pinSvg({ w, fill: colors[m.kind], stroke: PAPER, iconColor: PAPER, icon: m.icon, badge: icons[m.kind], badgeColor: colors[m.kind] });
  });
}

// Key for the map: verdict colours/badges, then the category symbols.
// `compact` (phones) folds the symbols away behind a button.
export function MapLegend({ kinds, colors, icons, labels, compact = false, style = {} }) {
  const [open, setOpen] = useState(!compact);
  const row = { display: 'inline-flex', alignItems: 'center', gap: 8 };
  return (
    <div style={{
      position: 'absolute', zIndex: 2, background: PAPER, border: '1px solid #8A8680', borderRadius: 12,
      padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 5,
      font: '600 12.5px Inter, system-ui, sans-serif', color: '#1A1A1A', ...style,
    }}>
      {['works', 'check', 'barrier', 'unknown'].filter(k => k !== 'unknown' || kinds.includes('unknown')).map(k => (
        <span key={k} style={row}>
          <span aria-hidden="true" style={{ lineHeight: 0 }} dangerouslySetInnerHTML={{ __html: k === 'unknown'
            ? pinSvg({ w: 20, fill: PAPER, stroke: colors.unknown, iconColor: colors.unknown, icon: 'food', badge: null })
            : pinSvg({ w: 20, fill: colors[k], stroke: PAPER, iconColor: PAPER, icon: 'food', badge: icons[k], badgeColor: colors[k] }) }}/>
          {labels[k]}
        </span>
      ))}
      {compact && (
        <button type="button" aria-expanded={open} onClick={() => setOpen(o => !o)} style={{
          minHeight: 32, marginTop: 2, padding: '0 2px', border: 0, background: 'transparent', textAlign: 'left',
          font: '700 12.5px Inter, system-ui, sans-serif', color: TEAL, textDecoration: 'underline', textUnderlineOffset: 3, cursor: 'pointer',
        }}>{open ? 'Hide symbols' : 'Show symbols'}</button>
      )}
      {open && (
        <ul style={{
          listStyle: 'none', margin: compact ? 0 : '4px 0 0', padding: '8px 0 0', borderTop: '1px solid #E5E2DA',
          display: 'grid', gridTemplateColumns: 'auto auto', gap: '6px 14px',
        }}>
          {PLACE_ICON_LEGEND.map(([id, label]) => (
            <li key={id} style={row}>
              <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d={PLACE_ICONS[id]} fill="none" stroke="#1A1A1A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
