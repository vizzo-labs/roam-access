'use client';
// Home: the way into the access layers — accessible toilets and beach access.

import React from 'react';
import { C2 } from '../ui/palette';
import { facilitySvg } from '../PilotMap';
import { Card, SectionHeader, SPACE, TYPE } from '../ds';
import { useT } from '../i18n';

const ITEMS = [
  { view: 'toilets', icon: 'toilet', label: 'layers.home.toilets', sub: 'layers.home.toiletsSub' },
  { view: 'beach', icon: 'water', label: 'layers.home.beach', sub: 'layers.home.beachSub' },
];

export function AccessLayersLinks({ app }) {
  const t = useT();
  const live = app.layers.reports.filter(r => r.targetType === 'facility' && app.layers.facilityById(r.targetId)?.layer === 'beach').length;
  return (
    <section aria-labelledby="access-layers-h" style={{ padding: '26px 22px 0' }}>
      <SectionHeader id="access-layers-h" size="sm" title={t('layers.home.title')}/>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
        {ITEMS.map(it => (
          <Card key={it.view} onClick={() => app.goto(it.view)} padding={SPACE.md} style={{ minHeight: 104 }}>
            <span aria-hidden="true" style={{ display: 'block', lineHeight: 0, marginBottom: SPACE.xs }}
              dangerouslySetInnerHTML={{ __html: facilitySvg({ w: 26, icon: it.icon }) }}/>
            <span style={{ display: 'block', ...TYPE.headline, fontSize: 15.5, color: C2.char }}>{t(it.label)}</span>
            <span style={{ display: 'block', ...TYPE.caption, fontWeight: 400, color: C2.slate, marginTop: 2 }}>
              {it.view === 'beach' && live ? t('layers.home.reportsToday', { count: live }) : t(it.sub)}
            </span>
          </Card>
        ))}
      </div>
    </section>
  );
}
