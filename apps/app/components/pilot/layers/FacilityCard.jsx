'use client';
// Phone map: the bottom card for a selected toilet / beach item.

import React from 'react';
import { C2 } from '../ui/palette';
import { Badge, Button, Card, SPACE, TYPE } from '../ds';
import { useT } from '../i18n';
import { distanceLabel, facilityKindLabel, hoursLabel, reportBanner, reportType, toiletTagLabels } from './layerUtils';

export function FacilityCard({ app, f }) {
  const t = useT();
  const d = f.details || {};
  const rep = app.layers.reportsFor('facility', f.id).find(r => !reportType(r.type)?.positive);
  const isToilet = f.kind === 'toilet';
  // Toilet hours and beach descriptions come from the source, in English.
  const line = isToilet ? [...toiletTagLabels(d, t), hoursLabel(d)].filter(Boolean).join(' · ') : f.description;
  return (
    <Card variant="raised" style={{ position: 'absolute', bottom: 16, left: 18, right: 18, width: 'auto', zIndex: 3, borderRadius: 20 }}>
      <p style={{ ...TYPE.title3, fontSize: 19, margin: '0 0 3px' }}>{f.name}</p>
      <p style={{ ...TYPE.footnote, color: C2.slate, margin: 0 }}>
        {facilityKindLabel(t, f.kind)} · {t('layers.listedBy', { source: f.source })} · {distanceLabel(app.origin, f, t)}
      </p>
      {line && <p lang={isToilet ? undefined : 'en-AU'} style={{ ...TYPE.callout, margin: `${SPACE.xs}px 0 0`, maxHeight: 64, overflow: 'hidden' }}>{line}</p>}
      {rep && <Badge tone="warn" style={{ marginTop: SPACE.xs }}>{reportBanner(t, rep.type)}</Badge>}
      <Button full onClick={() => app.goto('facility', f.id)} aria-label={t('layers.card.detailsFor', { name: f.name })} style={{ marginTop: SPACE.sm }}>
        {t('layers.card.details')}
      </Button>
    </Card>
  );
}
