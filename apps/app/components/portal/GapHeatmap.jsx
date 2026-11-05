'use client';
// Council dashboard: where in the pilot area places have no community
// information, per access need. A MapLibre grid (~450 m cells) shaded by the
// share of places without information, plus the same numbers as a table —
// the table is the accessible equivalent of the map.

import { useEffect, useRef, useState } from 'react';
import 'maplibre-gl/dist/maplibre-gl.css';

const STYLE = 'https://tiles.openfreemap.org/styles/positron';
// Sequential, one hue: the darker, the bigger the gap. Labels carry the numbers.
export const GAP_STEPS = [
  { min: 0, max: 24, color: '#F6E2DA', label: '0–24% without info' },
  { min: 25, max: 49, color: '#E9AE96', label: '25–49%' },
  { min: 50, max: 74, color: '#CF6B47', label: '50–74%' },
  { min: 75, max: 100, color: '#9C2D0E', label: '75–100%' },
];
const stepFor = pct => GAP_STEPS.find(s => pct <= s.max) || GAP_STEPS[GAP_STEPS.length - 1];

function features(grid, need) {
  return {
    type: 'FeatureCollection',
    features: grid.map(c => {
      const gaps = c.gaps[need] ?? 0;
      const pct = Math.round((gaps / c.venues) * 100);
      const [w, s, e, n] = c.bounds;
      return {
        type: 'Feature', id: c.id,
        properties: { id: c.id, color: stepFor(pct).color, label: `${gaps}/${c.venues}`, pct, dark: pct >= 75 ? 1 : 0 },
        geometry: { type: 'Polygon', coordinates: [[[w, s], [e, s], [e, n], [w, n], [w, s]]] },
      };
    }),
  };
}

export function GapHeatmap({ grid, needs }) {
  const box = useRef(null);
  const mapRef = useRef(null);
  const [need, setNeed] = useState('any');
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [picked, setPicked] = useState(null);

  useEffect(() => {
    let cancelled = false;
    import('maplibre-gl').then(mod => {
      const lib = mod.default ?? mod;
      if (cancelled || !box.current) return;
      lib.setWorkerUrl('/maplibre/maplibre-gl-worker.mjs');
      const xs = grid.flatMap(c => [c.bounds[0], c.bounds[2]]), ys = grid.flatMap(c => [c.bounds[1], c.bounds[3]]);
      const map = new lib.Map({
        container: box.current, style: STYLE, attributionControl: { compact: true },
        bounds: [[Math.min(...xs), Math.min(...ys)], [Math.max(...xs), Math.max(...ys)]], fitBoundsOptions: { padding: 24 },
      });
      map.addControl(new lib.NavigationControl({ showCompass: false }), 'top-right');
      map.on('error', e => { if (!map.isStyleLoaded() && /style/i.test(String(e?.error?.message || ''))) setFailed(true); });
      map.on('load', () => {
        map.addSource('gaps', { type: 'geojson', data: features(grid, 'any') });
        map.addLayer({ id: 'gaps-fill', type: 'fill', source: 'gaps', paint: { 'fill-color': ['get', 'color'], 'fill-opacity': 0.88 } });
        map.addLayer({ id: 'gaps-line', type: 'line', source: 'gaps', paint: { 'line-color': '#1A1A1A', 'line-width': 1 } });
        map.addLayer({
          id: 'gaps-label', type: 'symbol', source: 'gaps',
          layout: { 'text-field': ['get', 'label'], 'text-size': 13, 'text-font': ['Noto Sans Bold'], 'text-allow-overlap': true },
          paint: {
            'text-color': ['case', ['==', ['get', 'dark'], 1], '#FAF9F6', '#1A1A1A'],
            'text-halo-color': ['case', ['==', ['get', 'dark'], 1], '#9C2D0E', '#FAF9F6'], 'text-halo-width': 1,
          },
        });
        map.on('click', 'gaps-fill', e => setPicked(e.features?.[0]?.properties?.id || null));
        map.on('mouseenter', 'gaps-fill', () => { map.getCanvas().style.cursor = 'pointer'; });
        map.on('mouseleave', 'gaps-fill', () => { map.getCanvas().style.cursor = ''; });
        setReady(true);
      });
      mapRef.current = map;
    }).catch(() => setFailed(true));
    return () => { cancelled = true; mapRef.current?.remove(); mapRef.current = null; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!ready) return;
    mapRef.current?.getSource('gaps')?.setData(features(grid, need));
  }, [need, ready, grid]);

  const needLabel = need === 'any' ? 'any community information' : needs.find(n => n.id === need)?.label;
  const cell = picked ? grid.find(c => c.id === picked) : null;
  const rows = [...grid].sort((a, b) => (b.gaps[need] / b.venues) - (a.gaps[need] / a.venues) || b.venues - a.venues);

  return (
    <div>
      <fieldset style={{ margin: '0 0 0.75rem' }}>
        <legend>Show places without information for</legend>
        <div className="pt-radios">
          {[{ id: 'any', label: 'Any need (no reviews at all)' }, ...needs].map(n => (
            <label key={n.id}><input type="radio" name="gap-need" value={n.id} checked={need === n.id} onChange={() => { setNeed(n.id); setPicked(null); }}/>{n.label}</label>
          ))}
        </div>
      </fieldset>
      <div className="pt-map" role="img" aria-label={`Map of the pilot area in about 450-metre squares, shaded by the share of places without ${needLabel}. Darker means bigger gaps. The table below has the same numbers.`}>
        <div ref={box} style={{ position: 'absolute', inset: 0 }}/>
        {failed && <p role="status" style={{ position: 'absolute', inset: 0, margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', textAlign: 'center' }}>The map couldn’t load. The table below has the same numbers.</p>}
      </div>
      <div className="pt-legend" aria-hidden="true">
        {GAP_STEPS.map(s => <span key={s.color}><i style={{ background: s.color }}/>{s.label}</span>)}
        <span>Label: places without info / places in the square</span>
      </div>
      <p aria-live="polite" className="small" style={{ minHeight: '1.5rem', margin: '0.5rem 0 0' }}>
        {cell ? `Square near ${cell.suburb}: ${cell.gaps[need]} of ${cell.venues} places have no information for ${needLabel}.` : 'Select a square on the map for its numbers.'}
      </p>
      <details style={{ marginTop: '0.5rem' }}>
        <summary>Table: every square, biggest gaps first</summary>
        <div className="pt-table-wrap">
          <table>
            <caption className="pt-sr">Places without {needLabel}, by map square</caption>
            <thead><tr><th scope="col">Square near</th><th scope="col" className="num">Places</th><th scope="col" className="num">Without info</th><th scope="col" className="num">Share</th></tr></thead>
            <tbody>
              {rows.map(c => (
                <tr key={c.id}>
                  <th scope="row">{c.suburb} <span className="muted small">({c.bounds[1].toFixed(3)}, {c.bounds[0].toFixed(3)})</span></th>
                  <td className="num">{c.venues}</td><td className="num">{c.gaps[need]}</td><td className="num">{Math.round((c.gaps[need] / c.venues) * 100)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
