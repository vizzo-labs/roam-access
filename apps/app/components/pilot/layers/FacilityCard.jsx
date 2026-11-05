'use client';
// Phone map: the bottom card for a selected toilet / beach item.

import React from 'react';
import { C2, F2 } from '../ui/palette';
import { distanceLabel, hoursLabel, reportType, toiletTags } from './layerUtils';

const KIND = { toilet: 'Public toilet', beach: 'Beach access', liberty_swing: 'Liberty Swing', ferry: 'Ferry wharf', walk: 'Accessible walk' };

export function FacilityCard({ app, f }) {
  const d = f.details || {};
  const rep = app.layers.reportsFor('facility', f.id).find(r => !reportType(r.type)?.positive);
  const line = f.kind === 'toilet'
    ? [...toiletTags(d), hoursLabel(d)].filter(Boolean).join(' · ')
    : f.description;
  return (
    <div style={{
      position: 'absolute', bottom: 16, left: 18, right: 18, zIndex: 3, fontFamily: F2,
      background: C2.paper, borderRadius: 20, border: `1.5px solid ${C2.line}`,
      padding: 18, boxShadow: '0 12px 32px rgba(26,26,26,0.10)', boxSizing: 'border-box',
    }}>
      <div style={{ fontSize: 19, fontWeight: 700, letterSpacing: '-0.015em', color: C2.char, marginBottom: 3 }}>{f.name}</div>
      <div style={{ fontSize: 14, color: C2.slate }}>{KIND[f.kind] || 'Access info'} · listed by {f.source} · {distanceLabel(app.origin, f)}</div>
      {line && <div style={{ fontSize: 14.5, color: C2.char, lineHeight: 1.45, margin: '8px 0 0', maxHeight: 64, overflow: 'hidden' }}>{line}</div>}
      {rep && <div style={{ fontSize: 14.5, fontWeight: 700, color: C2.char, marginTop: 6 }}>⚠ {reportType(rep.type)?.banner}</div>}
      <button type="button" onClick={() => app.goto('facility', f.id)} style={{
        width: '100%', marginTop: 12, minHeight: 50, borderRadius: 12, border: 0, background: C2.teal, color: C2.paper,
        fontFamily: F2, fontSize: 15.5, fontWeight: 700, cursor: 'pointer',
      }}>See details<span className="ra-sr-only"> for {f.name}</span></button>
    </div>
  );
}
