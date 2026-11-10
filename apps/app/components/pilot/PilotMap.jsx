'use client';
// Real map: MapLibre GL + OpenFreeMap vector tiles (free, no key; data ©
// OpenStreetMap contributors, credited in the corner).
//
// The map mirrors the list: it shows the pins of the places the caller passes
// (the list or page on screen), never every place in the area, so it scales
// to a whole city. No clusters. Instead:
//  - Overview (zoom < 15): small markers, a category icon in a verdict shape
//    (circle = works, diamond = check first, octagon = barriers), no badge.
//    Street zoom, hover and selection: the full pin with the verdict badge.
//  - Where two pins would overlap, only the higher-ranked one (list order;
//    the selected, hovered and focused pins always win) is shown; the others
//    appear as you zoom in. The result only changes with zoom, so it stays
//    put while panning. From zoom 17 (phones, `spread`: from 15) overlapping
//    pins are nudged apart instead, so a place in the same building as
//    another is still reachable.
//  - "No info yet" places are hidden until street zoom (16), then quiet dots;
//    `showUnknown` shows them at every zoom.
//  - Pins outside the view are hidden, so keyboard focus only reaches the
//    pins you can see, in list order.
// Pins are real <button>s; the list stays the primary, fully accessible way.

import { useEffect, useRef, useState } from 'react';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useT } from './i18n';
import { kindLabel } from '@/lib/i18n/data';
import { prefersReducedMotion } from './ds/tokens';
import { Button } from './ds/Button';

const STYLE = 'https://tiles.openfreemap.org/styles/positron';
const TEAL = '#0A4F4F', PAPER = '#FAF9F6';
// Zoom levels (≈ 13 a few suburbs, 15 a neighbourhood, 17 one block).
const STREET_ZOOM = 15;   // from here: full pins with the verdict badge
const UNKNOWN_ZOOM = 16;  // from here: "No info yet" places as quiet dots
const NUDGE_ZOOM = 17;    // from here: overlapping pins nudged apart, not hidden

export function PilotMap({
  results, selectedId, hoverId = null, onSelect, origin, colors, icons, labels,
  topPad = 150, bottomPad = 210, fit = true, fitKey = null, initialBounds = null,
  onLocate, onLocateError, autoLocate = false, locateStyle = { right: 16, top: 16 },
  // Access layers (F3): facility pins (toilets, beach items) drawn as square
  // markers, and ids of places with a live temporary report (⚠ corner mark).
  extras = [], selectedExtraId = null, onSelectExtra, fitExtras = false, alertIds = null,
  // Place preview card (desktop): a handle on the map + its pins, and a
  // click on the map itself (not a pin) — used to close the card.
  apiRef = null, onMapClick,
  // Phones (the map inside Find): pins at `pinSize` px (≥ 48); `spread`
  // nudges overlapping pins apart from street zoom (no clusters, nothing
  // hidden there); `attribution={false}` drops MapLibre's small credit button —
  // the caller shows the credit as text instead.
  pinSize = null, spread = false, attribution = true,
  // "No info yet" places at every zoom (the Key / map layers option).
  showUnknown = false,
  // "Search this area": shown after the person pans or zooms; called with
  // the visible bounds { w, s, e, n }.
  onSearchArea = null, searchAreaStyle = { top: 16 },
}) {
  const box = useRef(null);
  const ctx = useRef(null); // { map, lib }
  const markers = useRef(new Map()); // id → { mk, el, kind, icon, state, look, ... }
  const byIdRef = useRef(new Map());
  const selRef = useRef(selectedId);
  selRef.current = selectedId;
  // Desktop: the row under the pointer/focus in the panel lifts its pin.
  const hoverRef = useRef(hoverId);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const onLocateRef = useRef(onLocate);
  onLocateRef.current = onLocate;
  const onLocateErrorRef = useRef(onLocateError);
  onLocateErrorRef.current = onLocateError;
  const onMapClickRef = useRef(onMapClick);
  const geoRef = useRef(null);
  const extraMarkers = useRef(new Map()); // id → { mk, el, x, alert, state }
  const onSelectExtraRef = useRef(onSelectExtra);
  const alertRef = useRef(alertIds);
  const selExtraRef = useRef(selectedExtraId);
  const unknownRef = useRef(showUnknown);
  // Latest props for the marker callbacks; runs before the effects below.
  useEffect(() => {
    onSelectExtraRef.current = onSelectExtra; alertRef.current = alertIds; hoverRef.current = hoverId;
    onMapClickRef.current = onMapClick; selExtraRef.current = selectedExtraId; unknownRef.current = showUnknown;
  });
  // Pins are built outside React: they read the current words from a ref and
  // are rebuilt when the language changes (it's part of the keys below).
  const t = useT();
  const tRef = useRef(t);
  useEffect(() => { tRef.current = t; });
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [following, setFollowing] = useState(false);
  const [locating, setLocating] = useState(false);
  const [areaBtn, setAreaBtn] = useState(false);

  // Layout = pick each pin's look for this zoom, hide the lower-ranked of
  // two overlapping pins, then hide pins outside the view. The first two
  // steps only re-run when the zoom (or the pins) change; panning only
  // re-checks what's in view.
  const lay = useRef({ zoom: null, bearing: null, dirty: true, frame: 0 });
  const layout = useRef(() => {});
  const schedule = useRef(() => {});
  useEffect(() => { layout.current = () => {
    const map = ctx.current?.map;
    if (!map) return;
    const L = lay.current;
    const zoom = map.getZoom(), bearing = map.getBearing();
    const opts = { colors, icons, t: tRef.current, size: pinSize, zoom, showUnknown: unknownRef.current };
    const focused = typeof document !== 'undefined' ? document.activeElement : null;
    if (L.dirty || L.zoom !== zoom || L.bearing !== bearing) {
      L.dirty = false; L.zoom = zoom; L.bearing = bearing;
      paintPins(markers.current, selRef.current, alertRef.current, hoverRef.current, opts);
      paintExtras(extraMarkers.current, selExtraRef.current, opts);
      L.items = rankedItems(map, markers.current, extraMarkers.current, selRef.current, hoverRef.current, selExtraRef.current, focused);
      // Nudging moves a pin by up to ~70px: fine in a street, misleading
      // (kilometres) zoomed out, so below street zoom overlaps are hidden.
      if (zoom >= (spread ? STREET_ZOOM : NUDGE_ZOOM)) nudgeApart(L.items, pinSize || 44);
      else hideOverlaps(L.items);
    }
    cullOutsideView(map, L.items || [], focused);
  };
  // During a pan or zoom: at most one layout per frame.
  schedule.current = () => {
    if (lay.current.frame) return;
    lay.current.frame = requestAnimationFrame(() => { lay.current.frame = 0; layout.current(); });
  }; });
  const relayout = () => { lay.current.dirty = true; layout.current(); };

  // Create the map once.
  useEffect(() => {
    let cancelled = false;
    import('maplibre-gl').then((mod) => {
      const lib = mod.default ?? mod; // v6 ships ESM without a default export
      if (cancelled || !box.current) return;
      // The worker is copied to /public at build time (see package.json):
      // MapLibre's default URL is relative to its own file, which bundling moves.
      lib.setWorkerUrl('/maplibre/maplibre-gl-worker.mjs');
      const b = initialBounds;
      const map = new lib.Map({
        container: box.current, style: STYLE,
        ...(b ? { bounds: [[b.w, b.s], [b.e, b.n]] } : { center: [origin.lng, origin.lat], zoom: 14.2 }),
        attributionControl: attribution ? { compact: true } : false,
      });
      // Only a style that never loads is fatal; a stray tile error isn't.
      map.on('error', (e) => {
        if (!map.isStyleLoaded() && /style/i.test(String(e?.error?.message || e?.error?.url || ''))) setFailed(true);
      });
      map.on('move', () => schedule.current());
      map.on('moveend', () => layout.current());
      map.on('resize', () => schedule.current());
      map.on('click', () => onMapClickRef.current?.());
      // A pan or zoom by the person (mouse, touch, keys — not our own
      // fitBounds/easeTo, which carry no originalEvent) offers "Search this area".
      let byPerson = false;
      map.on('movestart', (e) => { if (e.originalEvent) byPerson = true; });
      map.on('moveend', (e) => { if (byPerson || e.originalEvent) setAreaBtn(true); byPerson = false; });

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
      if (apiRef) apiRef.current = { map, pinEl: id => markers.current.get(id)?.el || null };
      // Dev only: a handle for the headless map checks (zoom, pan, frame times).
      if (process.env.NODE_ENV !== 'production' || process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview') window.__raMap = map;
      setReady(true);
    }).catch((e) => { console.warn('[roam-access] map failed to load', e); setFailed(true); });
    const lays = lay.current;
    return () => {
      cancelled = true;
      if (lays.frame) cancelAnimationFrame(lays.frame);
      if (ctx.current) ctx.current.map.remove();
      ctx.current = null;
      if (apiRef) apiRef.current = null;
      geoRef.current = null;
      markers.current.clear();
      extraMarkers.current.clear();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // New result set: rebuild the pins. DOM order is result order, so keyboard
  // users reach the best matches first.
  const key = t.locale + '#' + results.map(r => r.id + ':' + r.verdict.kind).join('|');
  useEffect(() => {
    if (!ready || !ctx.current) return;
    const { map, lib } = ctx.current;
    byIdRef.current = new Map(results.map(r => [r.id, r]));
    markers.current.forEach(m => m.mk.remove());
    markers.current.clear();
    for (const r of results) {
      const el = pinButton(r, labels, () => onSelectRef.current(r.id), t);
      // Anchored at the bottom centre; the look decides the offset (a pin's
      // tip, or the centre of a small marker, sits exactly on the place).
      const mk = new lib.Marker({ element: el, anchor: 'bottom' }).setLngLat([r.lng, r.lat]).addTo(map);
      markers.current.set(r.id, { mk, el, kind: r.verdict.kind, icon: iconFor(r), state: null, lngLat: [r.lng, r.lat] });
    }
    relayout();
  }, [ready, key]); // eslint-disable-line react-hooks/exhaustive-deps

  // Frame the best matches when the list itself changes (a new search,
  // filters) — not when it grows ("Show more") or after "Search this area"
  // (fit = false), where the person chose the view.
  const fitDone = useRef(null);
  const fk = fitKey ?? key;
  useEffect(() => {
    if (!ready || !ctx.current || !fit || !results.length || fitDone.current === fk) return;
    fitDone.current = fk;
    const { map, lib } = ctx.current;
    const bounds = new lib.LngLatBounds();
    const focus = results.slice(0, 20);
    const sel = results.find(r => r.id === selectedId);
    if (sel && !focus.includes(sel)) focus.push(sel);
    focus.forEach(r => bounds.extend([r.lng, r.lat]));
    map.fitBounds(bounds, { padding: { top: topPad, bottom: bottomPad, left: 48, right: 48 }, maxZoom: 16, duration: 0 });
    setAreaBtn(false);
  }, [ready, fk, fit]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reports come and go without the result set changing: repaint the marks.
  const alertKey = alertIds ? [...alertIds].sort().join('|') : '';
  useEffect(() => { if (ready) relayout(); }, [ready, alertKey, showUnknown]); // eslint-disable-line react-hooks/exhaustive-deps

  // Facility pins (access layers): rebuilt when the set or a report changes.
  const extraKey = t.locale + '#' + extras.map(x => `${x.id}:${x.muted ? 1 : 0}:${alertIds?.has(x.id) ? 1 : 0}`).join('|');
  useEffect(() => {
    if (!ready || !ctx.current) return;
    const { map, lib } = ctx.current;
    extraMarkers.current.forEach(m => m.mk.remove());
    extraMarkers.current.clear();
    for (const x of extras) {
      const el = document.createElement('button');
      el.type = 'button';
      const alert = !!alertIds?.has(x.id);
      el.setAttribute('aria-label', alert ? t('app.map.withAlert', { label: x.label }) : x.label);
      Object.assign(el.style, { background: 'transparent', border: '0', padding: '0', cursor: 'pointer', lineHeight: '0', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' });
      el.addEventListener('click', (e) => { e.stopPropagation(); onSelectExtraRef.current?.(x.id); });
      const mk = new lib.Marker({ element: el, anchor: 'bottom' }).setLngLat([x.lng, x.lat]).addTo(map);
      extraMarkers.current.set(x.id, { mk, el, x, alert, state: null, lngLat: [x.lng, x.lat] });
    }
    relayout();
    // fitExtras: true = frame them all; a number = frame the first N.
    if (fitExtras && extras.length) {
      const bounds = new lib.LngLatBounds();
      (typeof fitExtras === 'number' ? extras.slice(0, fitExtras) : extras).forEach(x => bounds.extend([x.lng, x.lat]));
      map.fitBounds(bounds, { padding: { top: topPad, bottom: bottomPad, left: 48, right: 48 }, maxZoom: 16, duration: 0 });
      setAreaBtn(false);
    }
  }, [ready, extraKey, fitExtras]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!ready || !ctx.current) return;
    relayout();
    const sel = extraMarkers.current.get(selectedExtraId)?.x;
    if (sel) {
      const { map } = ctx.current;
      const p = map.project([sel.lng, sel.lat]);
      const { clientWidth: w, clientHeight: h } = map.getContainer();
      if (p.x < 40 || p.x > w - 40 || p.y < topPad - 10 || p.y > h - bottomPad) {
        map.easeTo({ center: [sel.lng, sel.lat], zoom: Math.max(map.getZoom(), 15), padding: { top: topPad, bottom: bottomPad, left: 0, right: 0 }, duration: prefersReducedMotion() ? 0 : 300 });
      }
    }
  }, [ready, selectedExtraId, extraKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { if (ready) relayout(); }, [ready, hoverId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Selection: the big pin; bring it into view if it's off-screen.
  useEffect(() => {
    if (!ready || !ctx.current) return;
    relayout();
    const sel = byIdRef.current.get(selectedId);
    if (sel) {
      const { map } = ctx.current;
      const p = map.project([sel.lng, sel.lat]);
      const { clientWidth: w, clientHeight: h } = map.getContainer();
      if (p.x < 40 || p.x > w - 40 || p.y < topPad - 10 || p.y > h - bottomPad) {
        map.easeTo({ center: [sel.lng, sel.lat], zoom: Math.max(map.getZoom(), 15), padding: { top: topPad, bottom: bottomPad, left: 0, right: 0 }, duration: prefersReducedMotion() ? 0 : 300 });
      }
    }
  }, [ready, selectedId]); // eslint-disable-line react-hooks/exhaustive-deps

  // A pin that takes keyboard focus is never hidden while it has it.
  useEffect(() => {
    const el = box.current;
    if (!ready || !el) return;
    const onFocus = () => relayout();
    el.addEventListener('focusin', onFocus);
    return () => el.removeEventListener('focusin', onFocus);
  }, [ready]); // eslint-disable-line react-hooks/exhaustive-deps

  function locate() {
    const geo = geoRef.current;
    if (!geo) return;
    if (!following) setLocating(true);
    if (!geo.trigger()) setLocating(false);
  }

  function searchArea() {
    const map = ctx.current?.map;
    if (!map || !onSearchArea) return;
    const b = map.getBounds();
    setAreaBtn(false);
    onSearchArea({ w: b.getWest(), s: b.getSouth(), e: b.getEast(), n: b.getNorth() });
  }

  return (
    <>
      {/* First in the DOM, so it comes before the pins in the tab order. */}
      {ready && !failed && onSearchArea && areaBtn && (
        <Button variant="secondary" size="md" icon="search" onClick={searchArea}
          style={{ position: 'absolute', zIndex: 7, left: '50%', transform: 'translateX(-50%)', width: 'max-content', maxWidth: 'calc(100% - 32px)', boxShadow: '0 4px 14px rgba(26,26,26,0.18)', ...searchAreaStyle }}>
          {t('app.map.searchArea')}
        </Button>
      )}
      {/* isolate: pins/bubbles stack inside the map, never over the legend */}
      <div ref={box} style={{ position: 'absolute', inset: 0, background: '#EDEAE2', isolation: 'isolate' }}/>
      {ready && !failed && (
        <button type="button" onClick={locate} aria-pressed={following}
          aria-label={following ? t('app.map.stopFollowing') : t('app.map.showMe')}
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
        }}>{t('app.map.failed')}</p>
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

const PIN_PATH = 'M16 39C16 39 3 24.5 3 15.5a13 13 0 0 1 26 0C29 24.5 16 39 16 39Z';

// One map pin as SVG markup. `badge` is the verdict symbol (or null).
export function pinSvg({ w, fill, stroke, iconColor, icon, badge, badgeColor, alert = false, strokeWidth = 2 }) {
  const h = Math.round(w * 1.25);
  return `<svg width="${w}" height="${h}" viewBox="0 0 32 40" aria-hidden="true" focusable="false" style="display:block;overflow:visible;filter:drop-shadow(0 1px 2px rgba(26,26,26,.35))">`
    + `<path d="${PIN_PATH}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}"/>`
    + `<g transform="translate(8.5 8) scale(0.625)"><path d="${PLACE_ICONS[icon]}" fill="none" stroke="${iconColor}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></g>`
    + (badge ? `<circle cx="27" cy="5" r="6.5" fill="${PAPER}" stroke="${badgeColor}" stroke-width="1.5"/>`
      + `<text x="27" y="8.2" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, monospace" font-weight="800" font-size="9" fill="${badgeColor}">${badge}</text>` : '')
    + (alert ? ALERT_MARK : '')
    + `</svg>`;
}

function pinButton(r, labels, onClick, t) {
  const el = document.createElement('button');
  el.type = 'button';
  el.setAttribute('aria-label', t('app.map.pin', { name: r.name, kind: kindLabel(t, r.kind), verdict: labels[r.verdict.kind] }));
  Object.assign(el.style, {
    background: 'transparent', border: '0', padding: '0', cursor: 'pointer',
    display: 'flex', alignItems: 'flex-end', justifyContent: 'center', lineHeight: '0',
  });
  el.addEventListener('click', (e) => { e.stopPropagation(); onClick(); });
  return el;
}

// Small overview marker: the category icon in a verdict SHAPE, so the
// verdict never relies on colour alone even without the badge:
// circle = works for you, diamond = check first, octagon = has barriers.
const MARK_SHAPES = {
  works: '<circle cx="16" cy="16" r="14"/>',
  check: '<path d="M16 1.2 30.8 16 16 30.8 1.2 16Z" stroke-linejoin="round"/>',
  barrier: '<path d="M10.2 1.5h11.6l8.7 8.7v11.6l-8.7 8.7H10.2l-8.7-8.7V10.2Z" stroke-linejoin="round"/>',
};
export function markSvg({ w, kind, fill, icon, alert = false }) {
  const shape = (MARK_SHAPES[kind] || MARK_SHAPES.works);
  return `<svg width="${w}" height="${w}" viewBox="0 0 32 32" aria-hidden="true" focusable="false" style="display:block;overflow:visible;filter:drop-shadow(0 1px 2px rgba(26,26,26,.35))">`
    + `<g fill="${fill}" stroke="${PAPER}" stroke-width="2">${shape}</g>`
    + `<g transform="translate(8.2 8.2) scale(0.65)"><path d="${PLACE_ICONS[icon] || PLACE_ICONS.food}" fill="none" stroke="${PAPER}" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></g>`
    + (alert ? `<g transform="translate(-2 2)">${ALERT_MARK}</g>` : '')
    + `</svg>`;
}
// "No info yet": a quiet dot (the button around it is still ≥ 44px).
export function dotSvg({ w = 14, fill }) {
  return `<svg width="${w}" height="${w}" viewBox="0 0 14 14" aria-hidden="true" focusable="false" style="display:block">`
    + `<circle cx="7" cy="7" r="6" fill="${fill}" stroke="${PAPER}" stroke-width="2"/></svg>`;
}

// Each place pin's look for this zoom: 'full' (pin + badge), 'mark' (small
// overview marker), 'dot' ("No info yet" at street zoom, or when asked) or
// 'hidden'. Only re-draws a pin whose look actually changed.
function paintPins(markers, selectedId, alertIds, hoverId, { colors, icons, t, size, zoom, showUnknown }) {
  const P = size || 44;      // full pin width (phones pass 48)
  const T = size || 44;      // smallest target for marks and dots
  markers.forEach((m, id) => {
    const on = id === selectedId;
    const lift = !on && id === hoverId; // highlighted from the list, not selected
    const unknown = m.kind === 'unknown';
    const alert = !!alertIds?.has(id);
    // A live report always gets a full pin, so its ⚠ mark is visible.
    const look = on || lift || (unknown && alert) ? 'full'
      : unknown ? (showUnknown || zoom >= UNKNOWN_ZOOM ? 'dot' : 'hidden')
      : zoom >= STREET_ZOOM ? 'full' : 'mark';
    m.look = look;
    m.rank = on ? 0 : lift ? 1 : 2;
    if (m.baseLabel == null) m.baseLabel = m.el.getAttribute('aria-label');
    m.el.setAttribute('aria-label', alert ? t('app.map.withAlert', { label: m.baseLabel }) : m.baseLabel);
    m.el.setAttribute('aria-pressed', String(on));
    m.el.style.zIndex = on ? '5' : lift ? '4' : look === 'dot' ? '1' : unknown ? '2' : '3';
    const state = `${look}|${on}|${lift}|${alert}|${P}`;
    if (m.state === state) return;
    m.state = state;
    if (look === 'hidden') { m.box = null; return; }
    if (look === 'dot' || look === 'mark') {
      const vis = look === 'dot' ? 14 : (size ? 34 : 30);
      m.el.style.width = m.el.style.height = T + 'px';
      m.el.style.alignItems = 'center';
      m.el.innerHTML = look === 'dot' ? dotSvg({ fill: colors.unknown }) : markSvg({ w: vis, kind: m.kind, fill: colors[m.kind], icon: m.icon, alert });
      m.base = [0, T / 2]; // its centre sits on the place
      m.box = { x0: -T / 2, x1: T / 2, y0: -T / 2, y1: T / 2 };
      return;
    }
    // Full pin; the selected one is bigger (with a dark ring on phones).
    const w = on ? P + 8 : lift ? P + 4 : P;
    const h = Math.round(w * 1.25);
    m.el.style.width = w + 'px';
    m.el.style.height = h + 'px';
    m.el.style.alignItems = 'flex-end';
    m.base = [0, 0]; // the pin's tip sits on the place
    m.box = { x0: -w / 2, x1: w / 2, y0: -h, y1: 0 };
    const ring = size && on ? '#1A1A1A' : null;
    m.el.innerHTML = unknown
      ? pinSvg({ w, fill: PAPER, stroke: ring || colors.unknown, iconColor: colors.unknown, icon: m.icon, badge: icons.unknown, badgeColor: colors.unknown, alert, strokeWidth: ring ? 3 : 2 })
      : pinSvg({ w, fill: colors[m.kind], stroke: ring || PAPER, iconColor: PAPER, icon: m.icon, badge: icons[m.kind], badgeColor: colors[m.kind], alert, strokeWidth: ring ? 3 : 2 });
  });
}

// Everything that could be drawn, best first: the focused pin, the selected
// place and facility, the hovered row, then the list in its order, then the
// facility pins (nearest first). Screen positions are worked out once here.
function rankedItems(map, markers, extras, selectedId, hoverId, selectedExtraId, focused) {
  const items = [];
  const add = (m) => {
    if (!m.box) { show(m, false); return; }
    const p = map.project(m.lngLat);
    const forced = m.el === focused || m.rank < 2;
    items.push({ m, x: p.x, y: p.y, forced, pri: m.el === focused ? -1 : m.rank });
  };
  markers.forEach(add);
  extras.forEach(add);
  // Stable sort: forced first, then list order (Map keeps insertion order).
  return items.sort((a, b) => a.pri - b.pri);
}

// Priority declutter: walk the ranked items and keep one only if its target
// doesn't overlap one already kept. Screen-space, so panning never changes
// the result; zooming in brings the hidden ones back.
function hideOverlaps(items) {
  const kept = [];
  const GAP = 2;
  for (const it of items) {
    it.m.nudge = [0, 0];
    const b = it.m.box;
    // The box is already relative to the place (marks and dots are centred on it).
    const r = { x0: it.x + b.x0 - GAP, x1: it.x + b.x1 + GAP, y0: it.y + b.y0 - GAP, y1: it.y + b.y1 + GAP };
    it.rect = r;
    const hit = !it.forced && kept.some(k => r.x0 < k.x1 && r.x1 > k.x0 && r.y0 < k.y1 && r.y1 > k.y0);
    it.collided = hit;
    if (!hit) kept.push(r);
  }
}

// Street zoom (phones: from zoom 15): pins that would sit on top of each
// other (same building, next door) are nudged apart around a small circle,
// so each stays a separate target. Nothing is hidden, nothing grouped.
function nudgeApart(items, size) {
  const used = new Set();
  for (const it of items) it.collided = false;
  for (const a of items) {
    if (used.has(a)) continue;
    used.add(a);
    const group = [a];
    for (const b of items) {
      if (used.has(b)) continue;
      if (group.some(g => Math.hypot(g.x - b.x, g.y - b.y) < size)) { group.push(b); used.add(b); }
    }
    if (group.length === 1) { a.m.nudge = [0, 0]; continue; }
    const r = Math.max(size * 0.6, (size * 0.95 * group.length) / (2 * Math.PI));
    group.forEach((g, i) => {
      const ang = (2 * Math.PI * i) / group.length - Math.PI / 2;
      g.m.nudge = [Math.round(Math.cos(ang) * r), Math.round(Math.sin(ang) * r)];
    });
  }
  for (const it of items) {
    const b = it.m.box, n = it.m.nudge;
    it.rect = { x0: it.x + n[0] + b.x0, x1: it.x + n[0] + b.x1, y0: it.y + n[1] + b.y0, y1: it.y + n[1] + b.y1 };
  }
}

// Only pins inside the view are shown (and so focusable). Runs every frame
// while panning: positions move, the decluttering result doesn't.
function cullOutsideView(map, items, focused) {
  const c = map.getContainer();
  const W = c.clientWidth, H = c.clientHeight;
  for (const it of items) {
    const m = it.m;
    const p = map.project(m.lngLat);
    const dx = p.x - it.x, dy = p.y - it.y;
    const r = it.rect;
    const inView = r.x1 + dx > 0 && r.x0 + dx < W && r.y1 + dy > 0 && r.y0 + dy < H;
    const offset = [m.base[0] + (m.nudge?.[0] || 0), m.base[1] + (m.nudge?.[1] || 0)];
    const key = offset.join(',');
    if (m.offsetKey !== key) { m.offsetKey = key; m.mk.setOffset(offset); }
    show(m, !it.collided && (inView || m.el === focused));
  }
}

function show(m, on) {
  if (m.shown === on) return;
  m.shown = on;
  m.el.style.display = on ? 'flex' : 'none';
}

// ── Facility pins (access layers) ────────────────────────────────────────
// A rounded square with a pointer: a different SHAPE from place pins, so a
// listing never reads as a verdict. Teal = listed; muted (paper) = listed but
// not accessible (e.g. a toilet without an accessible cubicle).
const TEAL_FILL = '#0A4F4F', MUTED = '#475569';
export function facilitySvg({ w, icon, muted = false, alert = false }) {
  const h = Math.round(w * 1.25);
  const fill = muted ? PAPER : TEAL_FILL, stroke = muted ? MUTED : PAPER, ic = muted ? MUTED : PAPER;
  return `<svg width="${w}" height="${h}" viewBox="0 0 32 40" aria-hidden="true" focusable="false" style="display:block;overflow:visible;filter:drop-shadow(0 1px 2px rgba(26,26,26,.35))">`
    + `<path d="M7 3h18a4 4 0 0 1 4 4v18a4 4 0 0 1-4 4h-5l-4 8-4-8H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4Z" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`
    + `<g transform="translate(8.5 8.5) scale(0.625)"><path d="${PLACE_ICONS[icon] || PLACE_ICONS.toilet}" fill="none" stroke="${ic}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></g>`
    + (alert ? ALERT_MARK : '')
    + `</svg>`;
}

// ⚠ in the top-left corner: a temporary problem was reported today.
const ALERT_MARK = `<path d="M5 -4 11.5 7.5H-1.5Z" fill="#1A1A1A" stroke="${PAPER}" stroke-width="1.5" stroke-linejoin="round"/>`
  + `<path d="M5 -0.5v3.5" stroke="${PAPER}" stroke-width="1.6" stroke-linecap="round"/><circle cx="5" cy="5.2" r="0.9" fill="${PAPER}"/>`;

// Facility pins follow the same rules: the small square pin in the
// overview, the full one at street zoom or when selected.
function paintExtras(markers, selectedId, { size, zoom }) {
  const P = size || 44, T = size || 44;
  markers.forEach((m, id) => {
    const on = id === selectedId;
    m.rank = on ? 0 : 3;
    m.el.setAttribute('aria-pressed', String(on));
    m.el.style.zIndex = on ? '6' : '4';
    const w = on ? P + 8 : zoom >= STREET_ZOOM ? P : 30;
    const bw = Math.max(w, T), bh = Math.max(Math.round(w * 1.25), T);
    m.base = [0, 0];
    m.box = { x0: -bw / 2, x1: bw / 2, y0: -bh, y1: 0 };
    const state = `${w}`;
    if (m.state === state) return;
    m.state = state;
    m.el.style.width = bw + 'px';
    m.el.style.height = bh + 'px';
    m.el.innerHTML = facilitySvg({ w, icon: m.x.icon, muted: m.x.muted, alert: m.alert });
  });
}

// Key for the map: verdict colours/badges, then the category symbols.
// `compact` (phones) folds the symbols away behind a button.
export function MapLegend({ kinds, colors, icons, labels, compact = false, style = {} }) {
  const t = useT();
  const [open, setOpen] = useState(!compact);
  const row = { display: 'inline-flex', alignItems: 'center', gap: 8 };
  return (
    <div style={{
      position: 'absolute', zIndex: 2, background: PAPER, border: '1px solid #8A8680', borderRadius: 12,
      padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 5,
      font: '600 13px Inter, system-ui, sans-serif', color: '#1A1A1A', ...style,
    }}>
      {/* Zoomed out: the shape; zoomed in: the pin with its mark. */}
      {['works', 'check', 'barrier', 'unknown'].filter(k => k !== 'unknown' || !kinds || kinds.includes('unknown')).map(k => (
        <span key={k} style={row}>
          <span aria-hidden="true" style={{ lineHeight: 0, display: 'inline-flex', alignItems: 'flex-end', gap: 4, width: 40, justifyContent: 'center' }} dangerouslySetInnerHTML={{ __html: k === 'unknown'
            ? dotSvg({ w: 12, fill: colors.unknown }) + pinSvg({ w: 20, fill: PAPER, stroke: colors.unknown, iconColor: colors.unknown, icon: 'food', badge: null })
            : markSvg({ w: 16, kind: k, fill: colors[k], icon: 'food' }) + pinSvg({ w: 20, fill: colors[k], stroke: PAPER, iconColor: PAPER, icon: 'food', badge: icons[k], badgeColor: colors[k] }) }}/>
          {labels[k]}
        </span>
      ))}
      {compact && (
        <button type="button" aria-expanded={open} onClick={() => setOpen(o => !o)} style={{
          minHeight: 44, marginTop: 2, padding: '0 2px', border: 0, background: 'transparent', textAlign: 'left',
          font: '700 13px Inter, system-ui, sans-serif', color: TEAL, textDecoration: 'underline', textUnderlineOffset: 3, cursor: 'pointer',
        }}>{open ? t('app.map.hideSymbols') : t('app.map.showSymbols')}</button>
      )}
      {open && (
        <ul style={{
          listStyle: 'none', margin: compact ? 0 : '4px 0 0', padding: '8px 0 0', borderTop: '1px solid #E5E2DA',
          display: 'grid', gridTemplateColumns: 'auto auto', gap: '6px 14px',
        }}>
          {PLACE_ICON_LEGEND.map(([id]) => (
            <li key={id} style={row}>
              <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d={PLACE_ICONS[id]} fill="none" stroke="#1A1A1A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {t(`app.map.legend.${id}`)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
