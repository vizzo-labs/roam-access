'use client';
// A small map of one place: the street address (where map apps send you) and
// its step-free entrance(s). Two modes:
//   view  — static picture (no gestures, nothing to tab into); the caller
//           gives it a text alternative via `label` (role="img").
//   edit  — `pin` + `onPin`: drag the entrance pin or tap the map to move it.
//           Two-finger / Ctrl-scroll to move the map, so the form still
//           scrolls. Keyboard and screen-reader users move the pin with the
//           buttons in EntranceMarker (and can skip the map entirely).
// The key below the map says what each symbol means — never colour alone.

import React from 'react';
import 'maplibre-gl/dist/maplibre-gl.css';
import { C2, F2 } from '../ui/palette';
import { entranceSymbolSvg, kindOf } from './entranceSymbols';
import { RADIUS, SPACE, TYPE, prefersReducedMotion } from '../ds';
import { useT } from '../i18n';

const STYLE = 'https://tiles.openfreemap.org/styles/positron';

// Street-address pin (decorative; the key names it in words).
const PIN = 'M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Zm0-8.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z';

function svg(path, color, size) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="${path}" fill="none" stroke="${color}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

/** Colours for an entrance symbol, read from C2 at call time (high contrast). */
const symbolColors = dashed => (dashed
  ? { fill: C2.paper, stroke: C2.slate, glyph: C2.slate, dashed: true }
  : { fill: C2.teal, stroke: C2.paper, glyph: C2.paper });

/** The marker elements, built outside React (MapLibre owns them). An
 *  entrance is its kind's shape (./entranceSymbols.js) plus a text label. */
function markerEl(type, { kind = 'main', label = '', dashed = false, drag = false } = {}) {
  const el = document.createElement('div');
  el.setAttribute('aria-hidden', 'true');
  if (type === 'venue') {
    el.style.cssText = `width:34px;height:34px;border-radius:999px;background:${C2.paper};border:2px solid ${C2.char};display:flex;align-items:center;justify-content:center;box-shadow:0 1px 4px rgba(0,0,0,.25)`;
    el.innerHTML = svg(PIN, C2.char, 20);
    return el;
  }
  // No `position` here: MapLibre's marker class makes it absolute (which also
  // anchors the label below).
  el.style.cssText = `width:40px;height:40px;filter:drop-shadow(0 1px 3px rgba(0,0,0,.35));${drag ? 'cursor:grab;touch-action:none;' : ''}`;
  el.innerHTML = entranceSymbolSvg(kind, { size: 40, ...symbolColors(dashed) });
  if (label) {
    // The kind in words, under the symbol (the anchor stays the symbol's centre).
    const tag = document.createElement('span');
    tag.textContent = label;
    tag.style.cssText = `position:absolute;top:calc(100% + 2px);left:50%;transform:translateX(-50%);white-space:nowrap;font:700 13px/1.2 ${F2};color:${C2.char};background:${C2.paper};border:1.5px solid ${dashed ? C2.slate : C2.teal};border-radius:6px;padding:1px 5px`;
    el.appendChild(tag);
  }
  return el;
}

const isDashed = e => e.source !== 'community' || e.status !== 'current';

function MiniMap({ venue, entrances = [], pin = null, pinKind = 'main', onPin, label, height = 200, style }) {
  const t = useT();
  const box = React.useRef(null);
  const ctx = React.useRef(null); // { map, lib, pinMk }
  const markers = React.useRef([]);
  const onPinRef = React.useRef(onPin);
  React.useEffect(() => { onPinRef.current = onPin; });
  const editable = !!onPin;
  const [ready, setReady] = React.useState(false);
  const [failed, setFailed] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    import('maplibre-gl').then((mod) => {
      const lib = mod.default ?? mod;
      if (cancelled || !box.current) return;
      lib.setWorkerUrl('/maplibre/maplibre-gl-worker.mjs');
      const map = new lib.Map({
        container: box.current, style: STYLE, center: [venue.lng, venue.lat], zoom: 17.5, maxZoom: 19.5,
        // Our own attribution line below: nothing focusable inside a role="img".
        interactive: editable, cooperativeGestures: editable, attributionControl: false,
      });
      map.on('error', (e) => {
        if (!map.isStyleLoaded() && /style/i.test(String(e?.error?.message || e?.error?.url || ''))) setFailed(true);
      });
      if (editable) {
        map.on('click', (e) => onPinRef.current?.({ lat: e.lngLat.lat, lng: e.lngLat.lng }));
        // The canvas is a keyboard-pannable region; give it a real name.
        map.getCanvas().setAttribute('aria-label', t('arrival.map.canvas'));
      }
      ctx.current = { map, lib, pinMk: null };
      setReady(true);
    }).catch(() => setFailed(true));
    return () => {
      cancelled = true;
      ctx.current?.map.remove();
      ctx.current = null;
    };
  }, [venue.id, editable]); // eslint-disable-line react-hooks/exhaustive-deps

  // Venue + entrance markers (view), then frame them all.
  const key = entrances.map(e => `${e.id}:${e.kind}:${e.lat},${e.lng}:${e.source}:${e.status}`).join('|') + C2.teal + C2.paper + t.locale;
  React.useEffect(() => {
    if (!ready || !ctx.current) return;
    const { map, lib } = ctx.current;
    markers.current.forEach(m => m.remove());
    markers.current = [new lib.Marker({ element: markerEl('venue') }).setLngLat([venue.lng, venue.lat]).addTo(map)];
    const pts = entrances.filter(e => e.lat != null);
    for (const e of pts) {
      const el = markerEl('entrance', { kind: kindOf(e.kind), label: t(`arrival.kind.${kindOf(e.kind)}.map`), dashed: isDashed(e) });
      markers.current.push(new lib.Marker({ element: el })
        .setLngLat([e.lng, e.lat]).addTo(map));
    }
    if (!editable && pts.length) {
      const b = new lib.LngLatBounds([venue.lng, venue.lat], [venue.lng, venue.lat]);
      pts.forEach(e => b.extend([e.lng, e.lat]));
      map.fitBounds(b, { padding: 48, maxZoom: 18, duration: 0 });
    }
  }, [ready, key]); // eslint-disable-line react-hooks/exhaustive-deps

  // The draggable entrance pin (edit).
  React.useEffect(() => {
    if (!ready || !ctx.current || !editable) return;
    const c = ctx.current;
    // A new kind (main / side / back …) means a new symbol: rebuild the pin.
    if (c.pinMk && (!pin || c.pinKind !== pinKind)) { c.pinMk.remove(); c.pinMk = null; }
    if (!pin) return;
    if (!c.pinMk) {
      c.pinKind = pinKind;
      c.pinMk = new c.lib.Marker({ element: markerEl('entrance', { kind: kindOf(pinKind), label: t(`arrival.kind.${kindOf(pinKind)}.map`), drag: true }), draggable: true })
        .setLngLat([pin.lng, pin.lat]).addTo(c.map);
      c.pinMk.on('dragend', () => {
        const ll = c.pinMk.getLngLat();
        onPinRef.current?.({ lat: ll.lat, lng: ll.lng });
      });
    } else {
      c.pinMk.setLngLat([pin.lng, pin.lat]);
    }
    // Keep the pin in view when a button or "use my location" moves it.
    const px = c.map.project([pin.lng, pin.lat]);
    const { clientWidth: w, clientHeight: h } = c.map.getContainer();
    if (px.x < 30 || px.y < 30 || px.x > w - 30 || px.y > h - 30) {
      c.map.easeTo({ center: [pin.lng, pin.lat], duration: prefersReducedMotion() ? 0 : 300 });
    }
  }, [ready, editable, pin?.lat, pin?.lng, pinKind]); // eslint-disable-line react-hooks/exhaustive-deps

  // The key: one entry per kind on the map (its symbol + what it is), so
  // several entrances are told apart by shape and words, never colour alone.
  const shown = editable
    ? (pin ? [{ kind: kindOf(pinKind), dashed: false }] : [])
    : entrances.filter(e => e.lat != null).map(e => ({ kind: kindOf(e.kind), dashed: isDashed(e) }));
  const keyItems = [];
  for (const k of shown) if (!keyItems.some(x => x.kind === k.kind && x.dashed === k.dashed)) keyItems.push(k);
  const item = { display: 'inline-flex', alignItems: 'center', gap: 6 };
  return (
    <div style={style}>
      <div style={{ position: 'relative', height, borderRadius: RADIUS.md, overflow: 'hidden', border: `1.5px solid ${C2.line}`, background: C2.stone }}>
        <div ref={box} role={editable ? 'group' : 'img'} aria-label={label}
          style={{ position: 'absolute', inset: 0 }}/>
        {failed && (
          <p style={{ ...TYPE.footnote, color: C2.slate, position: 'absolute', inset: 0, margin: 0, padding: SPACE.md, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
            {t('arrival.map.failed')}
          </p>
        )}
      </div>
      {/* The key: symbol + words, so the colours never carry meaning alone. */}
      <ul aria-label={t('arrival.map.key')} style={{ listStyle: 'none', margin: `${SPACE.xs}px 0 0`, padding: 0, display: 'flex', flexWrap: 'wrap', gap: `4px ${SPACE.md}px`, ...TYPE.footnote, color: C2.char }}>
        <li style={item}>
          <span aria-hidden="true" style={{ width: 20, height: 20, borderRadius: 999, border: `2px solid ${C2.char}`, background: C2.paper, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
            dangerouslySetInnerHTML={{ __html: svg(PIN, C2.char, 13) }}/>
          {t('arrival.map.keyAddress')}
        </li>
        {keyItems.map(k => (
          <li key={`${k.kind}-${k.dashed}`} style={item}>
            <span aria-hidden="true" style={{ display: 'inline-flex', flexShrink: 0 }}
              dangerouslySetInnerHTML={{ __html: entranceSymbolSvg(k.kind, { size: 22, ...symbolColors(k.dashed) }) }}/>
            <span>
              <span style={{ fontWeight: 700 }}>{t(`arrival.kind.${k.kind}.map`)}</span>
              {' · '}{k.dashed
                ? t('arrival.map.keyItemDashed', { door: t(`arrival.kind.${k.kind}.title`) })
                : t(`arrival.kind.${k.kind}.title`)}
            </span>
          </li>
        ))}
      </ul>
      <p style={{ ...TYPE.caption, color: C2.slate, margin: '2px 0 0' }}>
        {t('arrival.map.credit')}{' '}
        <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener" style={{ color: C2.slate, display: 'inline-flex', alignItems: 'center', minHeight: 44 }}>
          © OpenStreetMap<span className="ra-sr-only"> {t('common.opensNewTab')}</span>
        </a>
      </p>
    </div>
  );
}

export { MiniMap };
