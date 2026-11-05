'use client';
// Home: the way into the access layers — accessible toilets and beach access.

import React from 'react';
import { C2, F2 } from '../ui/palette';
import { facilitySvg } from '../PilotMap';

const ITEMS = [
  { view: 'toilets', icon: 'toilet', label: 'Accessible toilets', sub: 'MLAK, adult change, hours' },
  { view: 'beach', icon: 'water', label: 'Beach access', sub: 'Beach wheelchairs, Liberty Swings' },
];

export function AccessLayersLinks({ app }) {
  const live = app.layers.reports.filter(r => r.targetType === 'facility' && app.layers.facilityById(r.targetId)?.layer === 'beach').length;
  return (
    <div style={{ padding: '26px 22px 0' }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 12px', letterSpacing: '-0.01em', fontFamily: F2 }}>Plan around access</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {ITEMS.map(it => (
          <button key={it.view} type="button" onClick={() => app.goto(it.view)} style={{
            minHeight: 104, borderRadius: 16, border: `1.5px solid ${C2.line}`, background: C2.paper, cursor: 'pointer',
            fontFamily: F2, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'space-between',
            gap: 8, padding: 16, boxSizing: 'border-box', textAlign: 'left',
          }}>
            <span aria-hidden="true" style={{ lineHeight: 0 }} dangerouslySetInnerHTML={{ __html: facilitySvg({ w: 26, icon: it.icon }) }}/>
            <span>
              <span style={{ display: 'block', fontSize: 15.5, fontWeight: 700, color: C2.char, letterSpacing: '-0.01em' }}>{it.label}</span>
              <span style={{ display: 'block', fontSize: 13, color: C2.slate, marginTop: 2, lineHeight: 1.35 }}>
                {it.view === 'beach' && live ? `${live} ${live === 1 ? 'report' : 'reports'} today` : it.sub}
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
