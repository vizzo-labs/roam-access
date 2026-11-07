'use client';

import React from 'react';
import { V2Shell } from '../ui/Shell';
import { useV2Heading } from '../ui/useHeading';
import { useT } from '../i18n';
import { GettingThere } from '../arrival/GettingThere';
import { GUTTER, SPACE, ScreenHeader } from '../ds';

// ─────────────────────────────────────────────────────────────
// GETTING THERE (route arrival/<id>) — when the Directions button isn't
// enough: which door (with the mini-map, photo and "Still the way in?"),
// directions to it or to the front, the maps app, then the arrival slots:
// parking and transport nearby, steps from the street (arrival/slots.js).
// Entrances never change a verdict.
// ─────────────────────────────────────────────────────────────
function V2Arrival({ app }) {
  const t = useT();
  const v = app.venueById(app.selectedId);
  const h = useV2Heading('arrival-' + v.id);
  return (
    <V2Shell>
      <ScreenHeader headingRef={h} title={t('place.arrival.title', { name: v.name })} subtitle={t('place.arrival.lead')}
        back={{ label: t('place.backTo', { name: v.name }), onClick: () => app.goto('venue', v.id) }}/>
      <div style={{ padding: `${SPACE.md}px ${GUTTER}px ${SPACE.xl}px` }}>
        <GettingThere key={'arrive-' + v.id} app={app} venue={v} bare/>
      </div>
    </V2Shell>
  );
}

export { V2Arrival };
