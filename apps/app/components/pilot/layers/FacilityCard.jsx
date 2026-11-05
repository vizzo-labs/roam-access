'use client';
// Phone map: the bottom card for a selected toilet / beach item.

import React from 'react';
import { C2 } from '../ui/palette';
import { Badge, Button, Card, SPACE, TYPE } from '../ds';
import { distanceLabel, hoursLabel, reportType, toiletTags } from './layerUtils';

const KIND = { toilet: 'Public toilet', beach: 'Beach access', liberty_swing: 'Liberty Swing', ferry: 'Ferry wharf', walk: 'Accessible walk' };

export function FacilityCard({ app, f }) {
  const d = f.details || {};
  const rep = app.layers.reportsFor('facility', f.id).find(r => !reportType(r.type)?.positive);
  const line = f.kind === 'toilet' ? [...toiletTags(d), hoursLabel(d)].filter(Boolean).join(' · ') : f.description;
  return (
    <Card variant="raised" style={{ position: 'absolute', bottom: 16, left: 18, right: 18, width: 'auto', zIndex: 3, borderRadius: 20 }}>
      <p style={{ ...TYPE.title3, fontSize: 19, margin: '0 0 3px' }}>{f.name}</p>
      <p style={{ ...TYPE.footnote, color: C2.slate, margin: 0 }}>{KIND[f.kind] || 'Access info'} · listed by {f.source} · {distanceLabel(app.origin, f)}</p>
      {line && <p style={{ ...TYPE.callout, margin: `${SPACE.xs}px 0 0`, maxHeight: 64, overflow: 'hidden' }}>{line}</p>}
      {rep && <Badge tone="warn" style={{ marginTop: SPACE.xs }}>{reportType(rep.type)?.banner}</Badge>}
      <Button full onClick={() => app.goto('facility', f.id)} style={{ marginTop: SPACE.sm }}>
        See details<span className="ra-sr-only"> for {f.name}</span>
      </Button>
    </Card>
  );
}
