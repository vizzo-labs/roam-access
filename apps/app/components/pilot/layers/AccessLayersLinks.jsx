'use client';
// Home: the way into the access layers — accessible toilets and beach access.

import React from 'react';
import { C2 } from '../ui/palette';
import { facilitySvg } from '../PilotMap';
import { Card, SectionHeader, SPACE, TYPE } from '../ds';

const ITEMS = [
  { view: 'toilets', icon: 'toilet', label: 'Accessible toilets', sub: 'MLAK, adult change, hours' },
  { view: 'beach', icon: 'water', label: 'Beach access', sub: 'Beach wheelchairs, Liberty Swings' },
];

export function AccessLayersLinks({ app }) {
  const live = app.layers.reports.filter(r => r.targetType === 'facility' && app.layers.facilityById(r.targetId)?.layer === 'beach').length;
  return (
    <section aria-labelledby="access-layers-h" style={{ padding: '26px 22px 0' }}>
      <SectionHeader id="access-layers-h" size="sm" title="Plan around access"/>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {ITEMS.map(it => (
          <Card key={it.view} onClick={() => app.goto(it.view)} padding={SPACE.md} style={{ minHeight: 104 }}>
            <span aria-hidden="true" style={{ display: 'block', lineHeight: 0, marginBottom: SPACE.xs }}
              dangerouslySetInnerHTML={{ __html: facilitySvg({ w: 26, icon: it.icon }) }}/>
            <span style={{ display: 'block', ...TYPE.headline, fontSize: 15.5, color: C2.char }}>{it.label}</span>
            <span style={{ display: 'block', ...TYPE.caption, fontWeight: 400, color: C2.slate, marginTop: 2 }}>
              {it.view === 'beach' && live ? `${live} ${live === 1 ? 'report' : 'reports'} today` : it.sub}
            </span>
          </Card>
        ))}
      </div>
    </section>
  );
}
