'use client';
// Getting there 6 · the route avoiding mapped steps on a MapLibre map (same
// basemap as MiniMap). A picture with a text alternative (role="img"): the
// route, every point to check and every step are also in the lists beside it,
// so nothing here is needed to use the route.
//
// Slope is never colour alone: gentle = solid line, 5–8% = dashed, 8%+ =
// dotted (and darker), and the key below says so in words. Points to check
// are numbered markers matching the "Check before you go" list.

import React from 'react';
import 'maplibre-gl/dist/maplibre-gl.css';
import { C2, F2 } from '../ui/palette';
import { RADIUS, SPACE, TYPE } from '../ds';
import { useT } from '../i18n';

const STYLE = 'https://tiles.openfreemap.org/styles/positron';

/** Line colours, read from C2 at call time (high contrast swaps them). */
const lineColor = g => (g === 'steep' ? C2.red : g === 'moderate' ? C2.amber : C2.teal);
// Dash patterns in line widths — the shape, not only the colour, says the slope.
const DASH = { gentle: null, moderate: [2.2, 1.2], steep: [0.4, 1.1] };

function pinEl({ text, fill, color, border, size = 24, round = true }) {
  const el = document.createElement('div');
  el.setAttribute('aria-hidden', 'true');
  el.textContent = text;
  el.style.cssText = `min-width:${size}px;height:${size}px;padding:0 ${round ? 0 : 6}px;box-sizing:border-box;border-radius:${round ? 999 : 6}px;background:${fill};color:${color};border:2px solid ${border};display:flex;align-items:center;justify-content:center;font:800 ${size < 26 ? 12 : 13}px/1 ${F2};box-shadow:0 1px 4px rgba(0,0,0,.3);white-space:nowrap`;
  return el;
}

function RouteMap({ route, label, height = 320, style }) {
  const t = useT();
  const box = React.useRef(null);
  const ctx = React.useRef(null);
  const [ready, setReady] = React.useState(false);
  const [failed, setFailed] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    import('maplibre-gl').then((mod) => {
      const lib = mod.default ?? mod;
      if (cancelled || !box.current) return;
      lib.setWorkerUrl('/maplibre/maplibre-gl-worker.mjs');
      const map = new lib.Map({
        container: box.current, style: STYLE, center: [route.from.lng, route.from.lat], zoom: 15, maxZoom: 18.5,
        interactive: false, attributionControl: false,
      });
      map.on('error', (e) => {
        if (!map.isStyleLoaded() && /style/i.test(String(e?.error?.message || e?.error?.url || ''))) setFailed(true);
      });
      map.on('load', () => { if (!cancelled) { ctx.current = { map, lib, markers: [] }; setReady(true); } });
    }).catch(() => setFailed(true));
    return () => {
      cancelled = true;
      ctx.current?.map.remove();
      ctx.current = null;
      setReady(false);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Draw (and redraw on a new route, contrast or language change).
  const key = JSON.stringify([route.segments?.length, route.from, route.to, route.summary?.m, route.partial]) + C2.teal + C2.red + t.locale;
  React.useEffect(() => {
    if (!ready || !ctx.current) return;
    const { map, lib } = ctx.current;
    ctx.current.markers.forEach(m => m.remove());
    ctx.current.markers = [];
    for (const id of ['route-gentle', 'route-moderate', 'route-steep', 'route-case']) if (map.getLayer(id)) map.removeLayer(id);
    if (map.getSource('route')) map.removeSource('route');

    const features = (route.segments || []).map(s => ({ type: 'Feature', properties: { grade: s.grade }, geometry: { type: 'LineString', coordinates: s.coords } }));
    map.addSource('route', { type: 'geojson', data: { type: 'FeatureCollection', features } });
    map.addLayer({ id: 'route-case', type: 'line', source: 'route', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': C2.paper, 'line-width': 11 } });
    for (const g of ['gentle', 'moderate', 'steep']) {
      map.addLayer({
        id: `route-${g}`, type: 'line', source: 'route', filter: ['==', ['get', 'grade'], g],
        layout: { 'line-cap': g === 'steep' ? 'round' : 'butt', 'line-join': 'round' },
        paint: { 'line-color': lineColor(g), 'line-width': g === 'steep' ? 7 : 6, ...(DASH[g] ? { 'line-dasharray': DASH[g] } : {}) },
      });
    }

    const add = (el, at, anchor = 'center') => ctx.current.markers.push(new lib.Marker({ element: el, anchor, offset: anchor === 'bottom' ? [0, -6] : [0, 0] }).setLngLat(at).addTo(map));
    add(pinEl({ text: t('route.map.start'), fill: C2.char, color: C2.paper, border: C2.paper, round: false }), [route.from.lng, route.from.lat], 'bottom');
    const end = route.partial ? route.partial.at : [route.to.lng, route.to.lat];
    add(pinEl({ text: t('route.map.end'), fill: C2.teal, color: C2.paper, border: C2.paper, round: false }), end, 'bottom');
    for (const c of route.checks || []) {
      const pts = c.points ? c.points : c.at ? [{ at: c.at, n: c.n }] : [];
      for (const p of pts) if (p.n) add(pinEl({ text: String(p.n), fill: C2.paper, color: C2.char, border: C2.char }), p.at);
    }

    const b = new lib.LngLatBounds([route.from.lng, route.from.lat], [route.from.lng, route.from.lat]);
    features.forEach(f => f.geometry.coordinates.forEach(c => b.extend(c)));
    b.extend(end);
    map.fitBounds(b, { padding: 36, maxZoom: 17.5, duration: 0 });
  }, [ready, key]); // eslint-disable-line react-hooks/exhaustive-deps

  const sw = (g) => (
    <svg width="34" height="10" aria-hidden="true" focusable="false" style={{ flexShrink: 0 }}>
      <line x1="2" y1="5" x2="32" y2="5" stroke={C2.paper} strokeWidth="9" strokeLinecap="round"/>
      <line x1="3" y1="5" x2="31" y2="5" stroke={lineColor(g)} strokeWidth={g === 'steep' ? 6 : 5}
        strokeLinecap={g === 'steep' ? 'round' : 'butt'}
        strokeDasharray={g === 'moderate' ? '11 6' : g === 'steep' ? '0.1 8' : undefined}/>
    </svg>
  );
  const item = { display: 'inline-flex', alignItems: 'center', gap: 6 };
  return (
    <div style={style}>
      <div style={{ position: 'relative', height, borderRadius: RADIUS.md, overflow: 'hidden', border: `1.5px solid ${C2.line}`, background: C2.stone }}>
        <div ref={box} role="img" aria-label={label} style={{ position: 'absolute', inset: 0 }}/>
        {failed && (
          <p style={{ ...TYPE.footnote, color: C2.slate, position: 'absolute', inset: 0, margin: 0, padding: SPACE.md, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
            {t('arrival.map.failed')}
          </p>
        )}
      </div>
      <ul aria-label={t('route.map.key')} style={{ listStyle: 'none', margin: `${SPACE.xs}px 0 0`, padding: 0, display: 'flex', flexWrap: 'wrap', gap: `4px ${SPACE.md}px`, ...TYPE.footnote, color: C2.char }}>
        <li style={item}>{sw('gentle')}{t('route.map.gentle')}</li>
        <li style={item}>{sw('moderate')}{t('route.map.moderate')}</li>
        <li style={item}>{sw('steep')}{t('route.map.steep')}</li>
        <li style={item}>
          <span aria-hidden="true" style={{ width: 22, height: 22, borderRadius: 999, border: `2px solid ${C2.char}`, background: C2.paper, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13, flexShrink: 0 }}>1</span>
          {t('route.map.numbered')}
        </li>
      </ul>
      <p style={{ ...TYPE.caption, color: C2.slate, margin: '2px 0 0' }}>
        {t('route.map.credit')}{' '}
        <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener" style={{ color: C2.slate, display: 'inline-flex', alignItems: 'center', minHeight: 44 }}>
          © OpenStreetMap<span className="ra-sr-only"> {t('common.opensNewTab')}</span>
        </a>
      </p>
    </div>
  );
}

export { RouteMap };
