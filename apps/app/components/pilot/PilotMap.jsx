'use client';
// Real map: MapLibre GL + OpenFreeMap vector tiles (free, no key; data ©
// OpenStreetMap contributors, credited in the corner).
//
// The map shows EVERY place in view (`everything`: the places that match
// the search and filters, from anywhere), and nothing is ever hidden or
// grouped: no clusters. Markers get smaller as you zoom out, the way
// Google Maps shows points of interest (map/placeLayers.js has the tiers):
//   - zoomed out (< 14): small dots in the verdict colour AND shape (circle
//     works · diamond check first · octagon barriers); "No info yet" = tiny
//     grey dots;
//   - 14–15: 22px verdict shapes with the category icon;
//   - street zoom (≥ 16): category pins with the ✓ ! ✗ badge; places in one
//     building are nudged apart so each can be clicked.
// The selected, hovered or focused place is always a full pin.
//
// Speed: everything is drawn by WebGL (a GeoJSON source + circle/symbol
// layers). Only the places of the list on screen (`results`) and the
// selected one are DOM <button>s, so the Tab order is the list's order and
// stays short; the list is the way to browse them all. A click or tap
// anywhere near a dot (a 24px box) selects it.

import { useEffect, useMemo, useRef, useState } from 'react';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useT } from './i18n';
import { kindLabel } from '@/lib/i18n/data';
import { prefersReducedMotion } from './ds/tokens';
import { Button } from './ds/Button';
import {
  PAPER, PLACE_ICONS, PLACE_ICON_LEGEND, SPRITE, DOT_W, iconFor, pinSvg, markSvg, verdictDotSvg, dotSvg, quietSvg,
  facilitySvg,
} from './map/symbols';
import { addPlaceLayers, DOT_ZOOM, STREET_ZOOM, HIT } from './map/placeLayers';

// The shapes and pins are shared with the Key, the list and the layers.
export {
  PLACE_ICONS, PLACE_ICON_LEGEND, iconFor, pinSvg, markSvg, dotSvg, verdictDotSvg, quietSvg, facilitySvg,
} from './map/symbols';

const STYLE = 'https://tiles.openfreemap.org/styles/positron';
// The button around a dot or a small shape: WCAG 2.2's 24px minimum, the
// same reach as a tap on the WebGL dots. Focus or selection makes it a full
// pin (≥ 44px).
const SMALL_T = 24;
const TEAL = '#0A4F4F';

export function PilotMap({
  results, everything = null, selectedId, hoverId = null, onSelect, origin, colors, icons, labels,
  topPad = 150, bottomPad = 210, fit = true, fitKey = null, initialBounds = null,
  onLocate, onLocateError, autoLocate = false, locateStyle = { right: 16, top: 16 },
  // Access layers (F3): facility markers (toilets, beach items) as squares,
  // and ids of places with a live temporary report (⚠ corner mark).
  extras = [], selectedExtraId = null, onSelectExtra, fitExtras = false, alertIds = null,
  // Place preview card (desktop): a handle on the map + its pins, and a
  // click on the map itself (not a marker) — used to close the card.
  apiRef = null, onMapClick,
  // Phones (the map inside Find): full pins at `pinSize` px (≥ 48);
  // `attribution={false}` drops MapLibre's small credit button — the caller
  // shows the credit as text instead.
  pinSize = null, attribution = true,
  // "No info yet" places as grey dots (on by default; the Key / map layers).
  showUnknown = true,
  // "Search this area": shown after the person pans or zooms; refreshes the
  // LIST for the visible bounds { w, s, e, n } (the map already shows all).
  onSearchArea = null, searchAreaStyle = { top: 16 },
}) {
  const box = useRef(null);
  const ctx = useRef(null); // { map, lib, gl }
  const pins = useRef(new Map()); // id → DOM pin { mk, el, place, kind, icon, state, ... }
  const extraPin = useRef(null);  // the selected facility, as a DOM pin
  const all = everything || results;
  const allById = useMemo(() => new Map(all.map(r => [r.id, r])), [all]);
  const allRef = useRef(allById);
  allRef.current = allById;
  const resultsRef = useRef(results);
  resultsRef.current = results;
  const selRef = useRef(selectedId);
  selRef.current = selectedId;
  const hoverRef = useRef(hoverId);
  const focusRef = useRef(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const onLocateRef = useRef(onLocate);
  onLocateRef.current = onLocate;
  const onLocateErrorRef = useRef(onLocateError);
  onLocateErrorRef.current = onLocateError;
  const onMapClickRef = useRef(onMapClick);
  const geoRef = useRef(null);
  const onSelectExtraRef = useRef(onSelectExtra);
  const alertRef = useRef(alertIds);
  const unknownRef = useRef(showUnknown);
  // Latest props for the map callbacks; runs before the effects below.
  useEffect(() => {
    onSelectExtraRef.current = onSelectExtra; alertRef.current = alertIds; hoverRef.current = hoverId;
    onMapClickRef.current = onMapClick; unknownRef.current = showUnknown;
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
  const [inView, setInView] = useState(null);

  const P = pinSize || 44;                 // full pin width (phones pass 48)
  const T = pinSize || 44;                 // smallest DOM target
  const pinW = Math.round(P * 0.85);       // street-zoom pins, 15 % smaller
  const quietW = pinSize ? 22 : SPRITE.quiet;

  // The selected place stays a DOM pin after its card closes (so focus can
  // go back to it) until another one is chosen or it leaves the map.
  const sticky = useRef(null);
  const inResults = id => results.some(r => r.id === id);
  if (selectedId && allById.has(selectedId) && !inResults(selectedId)) sticky.current = selectedId;
  if (sticky.current && (!allById.has(sticky.current) || inResults(sticky.current))) sticky.current = null;
  // DOM pins: the list on screen in its order, then the selected place and
  // the hovered row if they aren't in it.
  const domPlaces = [...results];
  for (const id of [sticky.current, hoverId]) {
    if (id && !domPlaces.some(r => r.id === id) && allById.has(id)) domPlaces.push(allById.get(id));
  }

  // Layout: each DOM pin's look for this zoom tier, then show only the pins
  // in view (so Tab never reaches a pin you can't see).
  const lay = useRef({ tier: null, dirty: true, frame: 0 });
  const layout = useRef(() => {});
  const schedule = useRef(() => {});
  useEffect(() => { layout.current = () => {
    const c = ctx.current;
    if (!c) return;
    const { map, gl } = c;
    const zoom = map.getZoom();
    const tier = zoom < DOT_ZOOM ? 'dot' : zoom < STREET_ZOOM ? 'mark' : 'street';
    const L = lay.current;
    if (L.dirty || L.tier !== tier) {
      L.dirty = false; L.tier = tier;
      paintPins(pins.current, { tier, sel: selRef.current, hover: hoverRef.current, focus: focusRef.current,
        alertIds: alertRef.current, showUnknown: unknownRef.current, colors, icons, t: tRef.current, P, T, pinW, quietW, phone: !!pinSize });
    }
    placePins(map, gl, pins.current, extraPin.current, focusRef.current);
  };
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
      map.on('resize', () => schedule.current());
      map.on('moveend', () => {
        // Street zoom: re-work which pins share a building (zoom only).
        if (ctx.current?.gl?.nudge()) lay.current.dirty = true;
        layout.current();
        countInView();
      });
      // A click or tap near a marker selects it (24px tolerance); anywhere
      // else it's a click on the map.
      map.on('click', (e) => pickAt(e.point));
      let hoverFrame = 0;
      map.on('mousemove', (e) => {
        if (hoverFrame) return;
        hoverFrame = requestAnimationFrame(() => {
          hoverFrame = 0;
          const hit = ctx.current?.gl?.hit(e.point);
          map.getCanvas().style.cursor = hit ? 'pointer' : '';
        });
      });
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

      ctx.current = { map, lib, gl: null };
      if (apiRef) apiRef.current = { map, pinEl: id => pins.current.get(id)?.el || null };
      // Dev only: a handle for the headless map checks (zoom, pan, frame times).
      if (process.env.NODE_ENV !== 'production' || process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview') window.__raMap = map;
      map.once('load', () => {
        if (cancelled) return;
        ctx.current.gl = addPlaceLayers(map, { colors, icons, pinW, quietW });
        ctx.current.gl.setPriority(() => resultsRef.current);
        // Location already shared in this session: show the dot straight away.
        if (autoLocate) { try { geo.trigger(); } catch (e) {} }
        setReady(true);
      });
    }).catch((e) => { console.warn('[roam-access] map failed to load', e); setFailed(true); });
    const lays = lay.current;
    return () => {
      cancelled = true;
      if (lays.frame) cancelAnimationFrame(lays.frame);
      if (ctx.current) ctx.current.map.remove();
      ctx.current = null;
      if (apiRef) apiRef.current = null;
      geoRef.current = null;
      pins.current.clear();
      extraPin.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // "N places in this area" for screen readers (not live: it would talk
  // over every pan). Counts what the map draws.
  function countInView() {
    const map = ctx.current?.map;
    if (!map) return;
    const b = map.getBounds();
    let n = 0;
    allRef.current.forEach((r) => {
      if (!unknownRef.current && r.verdict?.kind === 'unknown') return;
      if (r.lat >= b.getSouth() && r.lat <= b.getNorth() && r.lng >= b.getWest() && r.lng <= b.getEast()) n++;
    });
    setInView(n);
  }

  // Everything → the WebGL layers (rebuilt when the set or a report changes).
  const alertKey = alertIds ? [...alertIds].sort().join('|') : '';
  useEffect(() => {
    const gl = ctx.current?.gl;
    if (!ready || !gl) return;
    gl.setPlaces(all.map(r => ({ id: r.id, lng: r.lng, lat: r.lat, kind: r.verdict.kind, icon: iconFor(r), alert: !!alertIds?.has(r.id) })));
    countInView();
    relayout();
  }, [ready, all, alertKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const gl = ctx.current?.gl;
    if (!ready || !gl) return;
    gl.setShowQuiet(showUnknown);
    countInView();
    relayout();
  }, [ready, showUnknown]); // eslint-disable-line react-hooks/exhaustive-deps

  // DOM pins: diffed against the list, then put back in list order so Tab
  // follows the list. Their WebGL twins are filtered out of the layers.
  const domKey = t.locale + '#' + domPlaces.map(r => r.id + ':' + r.verdict.kind).join('|');
  useEffect(() => {
    if (!ready || !ctx.current) return;
    const { map, lib, gl } = ctx.current;
    const keep = new Set(domPlaces.map(r => r.id));
    pins.current.forEach((m, id) => { if (!keep.has(id)) { m.mk.remove(); pins.current.delete(id); } });
    const order = [];
    for (const r of domPlaces) {
      let m = pins.current.get(r.id);
      if (!m || m.kindKey !== r.verdict.kind + t.locale) {
        if (m) m.mk.remove(); // its verdict or the language changed
        const el = pinButton(r, labels, (e) => pick(r.id, e), t);
        // Anchored at the bottom centre; the look decides the offset (a pin's
        // tip, or the centre of a small marker, sits exactly on the place).
        const mk = new lib.Marker({ element: el, anchor: 'bottom' }).setLngLat([r.lng, r.lat]).addTo(map);
        m = { mk, el, place: r, kind: r.verdict.kind, kindKey: r.verdict.kind + t.locale, icon: iconFor(r), state: null, lngLat: [r.lng, r.lat] };
      }
      m.place = r;
      order.push([r.id, m]);
    }
    pins.current = new Map(order);
    // Keyboard order = list order.
    const parent = order[0]?.[1].el.parentNode;
    if (parent) order.forEach(([, m]) => parent.appendChild(m.el));
    gl?.setExcluded(order.map(([id]) => id), selectedExtraId ? [selectedExtraId] : []);
    relayout();
  }, [ready, domKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Frame the best matches when the list itself changes (a new search,
  // filters) — not when it grows ("Show more") or after "Search this area"
  // (fit = false), where the person chose the view.
  const fitDone = useRef(null);
  const fk = fitKey ?? domKey;
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
  useEffect(() => { if (ready) relayout(); }, [ready, alertKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Facilities (access layers): all drawn by WebGL; the selected one is a
  // DOM pin. Rebuilt when the set or a report changes.
  const extraKey = t.locale + '#' + extras.map(x => `${x.id}:${x.muted ? 1 : 0}:${alertIds?.has(x.id) ? 1 : 0}`).join('|');
  useEffect(() => {
    if (!ready || !ctx.current?.gl) return;
    const { map, lib, gl } = ctx.current;
    gl.setExtras(extras.map(x => ({ ...x, alert: !!alertIds?.has(x.id) })));
    // fitExtras: true = frame them all; a number = frame the first N.
    if (fitExtras && extras.length) {
      const bounds = new lib.LngLatBounds();
      (typeof fitExtras === 'number' ? extras.slice(0, fitExtras) : extras).forEach(x => bounds.extend([x.lng, x.lat]));
      map.fitBounds(bounds, { padding: { top: topPad, bottom: bottomPad, left: 48, right: 48 }, maxZoom: 16, duration: 0 });
      setAreaBtn(false);
    }
  }, [ready, extraKey, fitExtras]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!ready || !ctx.current?.gl) return;
    const { map, lib, gl } = ctx.current;
    extraPin.current?.mk.remove();
    extraPin.current = null;
    const x = extras.find(e => e.id === selectedExtraId);
    gl.setExcluded([...pins.current.keys()], x ? [x.id] : []);
    if (!x) return;
    const alert = !!alertIds?.has(x.id);
    const el = document.createElement('button');
    el.type = 'button';
    el.setAttribute('aria-label', alert ? t('app.map.withAlert', { label: x.label }) : x.label);
    el.setAttribute('aria-pressed', 'true');
    Object.assign(el.style, { background: 'transparent', border: '0', padding: '0', cursor: 'pointer', lineHeight: '0', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: '6' });
    const w = P + 8;
    el.style.width = w + 'px';
    el.style.height = Math.round(w * 1.25) + 'px';
    el.innerHTML = facilitySvg({ w, icon: x.icon, muted: x.muted, alert });
    el.addEventListener('click', (e) => { e.stopPropagation(); onSelectExtraRef.current?.(x.id); });
    const mk = new lib.Marker({ element: el, anchor: 'bottom' }).setLngLat([x.lng, x.lat]).addTo(map);
    extraPin.current = { mk, el, lngLat: [x.lng, x.lat], base: [0, 0] };
    const p = map.project([x.lng, x.lat]);
    const { clientWidth: W, clientHeight: H } = map.getContainer();
    if (p.x < 40 || p.x > W - 40 || p.y < topPad - 10 || p.y > H - bottomPad) {
      map.easeTo({ center: [x.lng, x.lat], zoom: Math.max(map.getZoom(), 15), padding: { top: topPad, bottom: bottomPad, left: 0, right: 0 }, duration: prefersReducedMotion() ? 0 : 300 });
    }
    relayout();
  }, [ready, selectedExtraId, extraKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { if (ready) relayout(); }, [ready, hoverId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Selection: the big pin; bring it into view if it's off-screen.
  useEffect(() => {
    if (!ready || !ctx.current) return;
    relayout();
    const sel = allById.get(selectedId);
    if (sel) {
      const { map } = ctx.current;
      const p = map.project([sel.lng, sel.lat]);
      const { clientWidth: w, clientHeight: h } = map.getContainer();
      if (p.x < 40 || p.x > w - 40 || p.y < topPad - 10 || p.y > h - bottomPad) {
        map.easeTo({ center: [sel.lng, sel.lat], zoom: Math.max(map.getZoom(), 15), padding: { top: topPad, bottom: bottomPad, left: 0, right: 0 }, duration: prefersReducedMotion() ? 0 : 300 });
      }
    }
  }, [ready, selectedId, domKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // A pin with keyboard focus is a full pin, and never culled while focused.
  useEffect(() => {
    const el = box.current;
    if (!ready || !el) return;
    const onIn = (e) => { const id = e.target?.dataset?.pin; if (id && focusRef.current !== id) { focusRef.current = id; relayout(); } };
    const onOut = (e) => { if (e.target?.dataset?.pin && focusRef.current) { focusRef.current = null; relayout(); } };
    el.addEventListener('focusin', onIn);
    el.addEventListener('focusout', onOut);
    return () => { el.removeEventListener('focusin', onIn); el.removeEventListener('focusout', onOut); };
  }, [ready]); // eslint-disable-line react-hooks/exhaustive-deps

  // A click or tap goes to the NEAREST marker within reach (24px), DOM pin
  // or WebGL dot: overlap is allowed, so a pin's button may cover a dot next
  // to it. Keyboard activation (detail 0) always picks the focused pin.
  function pick(id, e) {
    const c = ctx.current;
    if (!c || !e || e.detail === 0) { onSelectRef.current(id); return; }
    const rect = c.map.getContainer().getBoundingClientRect();
    pickAt({ x: e.clientX - rect.left, y: e.clientY - rect.top }, id);
  }
  function pickAt(pt, clickedId = null) {
    const c = ctx.current;
    if (!c) return;
    const { map, gl } = c;
    let best = clickedId ? { id: clickedId } : null, bestD = clickedId ? Infinity : HIT * 1.5;
    pins.current.forEach((m, pid) => {
      if (!m.shown) return;
      const q = map.project(m.lngLat), n = gl ? gl.offsetOf(pid) : [0, 0];
      const d = Math.hypot(pt.x - (q.x + n[0]), pt.y - (q.y + n[1] + (m.centreDy || 0)));
      if (d < bestD) { bestD = d; best = { id: pid }; }
    });
    const hit = gl?.hit(pt);
    if (hit && hit.d < bestD - 1) best = hit;
    if (!best) onMapClickRef.current?.();
    else if (best.extra) onSelectExtraRef.current?.(best.id);
    else onSelectRef.current?.(best.id);
  }

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
      {/* Screen readers: what's on the map, and that the list is the way in. */}
      {ready && !failed && inView != null && <p className="ra-sr-only">{t('app.map.inArea', { count: inView })}</p>}
      {/* First in the DOM, so it comes before the pins in the tab order. */}
      {ready && !failed && onSearchArea && areaBtn && (
        <Button variant="secondary" size="md" icon="search" onClick={searchArea}
          style={{ position: 'absolute', zIndex: 7, left: '50%', transform: 'translateX(-50%)', width: 'max-content', maxWidth: 'calc(100% - 32px)', boxShadow: '0 4px 14px rgba(26,26,26,0.18)', ...searchAreaStyle }}>
          {t('app.map.searchArea')}
        </Button>
      )}
      {/* isolate: pins stack inside the map, never over the legend */}
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

// ── DOM pins (the list's places and the selected one) ────────────────────

function pinButton(r, labels, onClick, t) {
  const el = document.createElement('button');
  el.type = 'button';
  el.dataset.pin = r.id;
  el.setAttribute('aria-label', t('app.map.pin', { name: r.name, kind: kindLabel(t, r.kind), verdict: labels[r.verdict.kind] }));
  Object.assign(el.style, {
    background: 'transparent', border: '0', padding: '0', cursor: 'pointer',
    display: 'flex', alignItems: 'flex-end', justifyContent: 'center', lineHeight: '0',
  });
  el.addEventListener('click', (e) => { e.stopPropagation(); onClick(e); });
  return el;
}

// Each DOM pin's look: the zoom tier's (dot · mark · street), or 'full' when
// it's selected, hovered or focused. A "No info yet" place is hidden when
// the person turned those off, unless it's the one they're on. Only
// re-draws a pin whose look changed.
function paintPins(pins, { tier, sel, hover, focus, alertIds, showUnknown, colors, icons, t, P, T, pinW, quietW, phone }) {
  pins.forEach((m, id) => {
    const on = id === sel;
    const lift = !on && id === hover;
    const foc = !on && !lift && id === focus;
    const unknown = m.kind === 'unknown';
    const alert = !!alertIds?.has(id);
    const look = on || lift || foc ? 'full' : tier;
    m.hidden = unknown && !showUnknown && look !== 'full';
    if (m.baseLabel == null) m.baseLabel = m.el.getAttribute('aria-label');
    m.el.setAttribute('aria-label', alert ? t('app.map.withAlert', { label: m.baseLabel }) : m.baseLabel);
    m.el.setAttribute('aria-pressed', String(on));
    m.el.style.zIndex = on ? '5' : lift || foc ? '4' : unknown ? '2' : '3';
    m.full = look === 'full';
    const state = `${look}|${on}|${lift}|${alert}|${P}`;
    if (m.state === state) return;
    m.state = state;
    // Dots and shapes: a 24px button (a tap anywhere near also reaches it,
    // see pickAt), so neighbours' buttons don't pile up over each other.
    const centred = (svg, size = SMALL_T) => {
      m.el.style.width = m.el.style.height = size + 'px';
      m.el.style.alignItems = 'center';
      m.el.innerHTML = svg;
      m.base = [0, size / 2]; // its centre sits on the place
      m.centreDy = 0;
    };
    if (look === 'dot') {
      centred(unknown ? dotSvg({ w: 5 }) : verdictDotSvg({ kind: m.kind, fill: colors[m.kind] }));
      return;
    }
    if (look === 'mark') {
      centred(unknown ? dotSvg({ w: 7 }) : markSvg({ w: SPRITE.mark, kind: m.kind, fill: colors[m.kind], icon: m.icon, alert }));
      return;
    }
    if (look === 'street' && unknown) { centred(quietSvg({ w: quietW, icon: m.icon }), T); return; }
    // A pin: street zoom (15 % smaller) or full (the selected one is
    // bigger, with a dark ring on phones). Its tip sits on the place.
    const w = look === 'street' ? pinW : on ? P + 8 : lift ? P + 4 : P;
    const h = Math.round(w * 1.25);
    m.el.style.width = Math.max(w, T) + 'px';
    m.el.style.height = Math.max(h, T) + 'px';
    m.el.style.alignItems = 'flex-end';
    m.base = [0, 0];
    m.centreDy = -h * 0.6; // the pin's head, above its tip
    const ring = phone && on ? '#1A1A1A' : null;
    m.el.innerHTML = unknown
      ? pinSvg({ w, fill: PAPER, stroke: ring || colors.unknown, iconColor: colors.unknown, icon: m.icon, badge: icons.unknown, badgeColor: colors.unknown, alert, strokeWidth: ring ? 3 : 2 })
      : pinSvg({ w, fill: colors[m.kind], stroke: ring || PAPER, iconColor: PAPER, icon: m.icon, badge: icons[m.kind], badgeColor: colors[m.kind], alert, strokeWidth: ring ? 3 : 2 });
  });
}

// Offsets (street-zoom nudge) and culling: a pin outside the view is
// hidden, so it can't take focus. Runs every frame while panning.
function placePins(map, gl, pins, extraPin, focusId) {
  const c = map.getContainer();
  const W = c.clientWidth, H = c.clientHeight, M = 30;
  const each = (m, id) => {
    const p = map.project(m.lngLat);
    const nudge = id && gl ? gl.offsetOf(id) : [0, 0];
    const off = [m.base[0] + nudge[0], m.base[1] + nudge[1]];
    const key = off.join(',');
    if (m.offsetKey !== key) { m.offsetKey = key; m.mk.setOffset(off); }
    const x = p.x + nudge[0], y = p.y + nudge[1];
    const inView = x > -M && x < W + M && y > -M && y < H + M;
    show(m, !m.hidden && (inView || id === focusId));
  };
  pins.forEach((m, id) => each(m, id));
  if (extraPin) each(extraPin, null);
}

function show(m, on) {
  if (m.shown === on) return;
  m.shown = on;
  m.el.style.display = on ? 'flex' : 'none';
}

// ── Key ──────────────────────────────────────────────────────────────────
// Desktop map key: what a dot, a shape and a pin mean, then the category
// symbols. `compact` folds the symbols away behind a button.
export function MapLegend({ kinds, colors, icons, labels, compact = false, style = {} }) {
  const t = useT();
  const [open, setOpen] = useState(!compact);
  const row = { display: 'inline-flex', alignItems: 'center', gap: 8 };
  return (
    <div style={{
      position: 'absolute', zIndex: 2, background: PAPER, border: '1px solid #8A8680', borderRadius: 12,
      padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 5, maxWidth: 230,
      font: '600 13px Inter, system-ui, sans-serif', color: '#1A1A1A', ...style,
    }}>
      {/* Zoomed out → in: the dot, the shape, the pin. */}
      {['works', 'check', 'barrier', 'unknown'].filter(k => k !== 'unknown' || !kinds || kinds.includes('unknown')).map(k => (
        <span key={k} style={row}>
          <span aria-hidden="true" style={{ lineHeight: 0, display: 'inline-flex', alignItems: 'center', gap: 4, width: 62, flex: 'none', justifyContent: 'flex-start' }} dangerouslySetInnerHTML={{ __html: legendSymbols(k, colors, icons) }}/>
          {labels[k]}
        </span>
      ))}
      <span style={{ fontWeight: 400, fontSize: 13, lineHeight: 1.35, color: '#3D3A36' }}>{t('app.map.legendTiers')}</span>
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

// The three looks of one verdict, small to big (the Key and the legend).
// `dot` scales the dots (1 = their size on the map).
export function legendSymbols(k, colors, icons, { dot = 1.15, mark = 18, pin = 20 } = {}) {
  const box = Math.round(14 * dot);
  const cell = svg => `<span style="display:inline-flex;flex:none;width:${box}px;justify-content:center">${svg}</span>`;
  if (k === 'unknown') return cell(dotSvg({ w: Math.round(7 * dot) })) + quietSvg({ w: mark, icon: 'food' });
  return cell(verdictDotSvg({ w: Math.round(DOT_W[k] * dot), kind: k, fill: colors[k] }))
    + markSvg({ w: mark, kind: k, fill: colors[k], icon: 'food' })
    + pinSvg({ w: pin, fill: colors[k], stroke: PAPER, iconColor: PAPER, icon: 'food', badge: icons[k], badgeColor: colors[k] });
}
