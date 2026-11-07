'use client';

import React from 'react';
import { C2 } from '../ui/palette';
import { Button, Card, SPACE, TYPE } from '../ds';
import { UserText, useFormat, useT } from '../i18n';
import { whoText } from '../trust/text';
import { useDirections } from './directions';

// The place page's "Getting there": the right door in words, who marked it
// and when, "Directions to the step-free entrance", and "More about getting
// there" (the Getting there screen: both doors, the mini-map, parking and
// transport, steps from the street). Entrances never change a verdict;
// OpenStreetMap entrances and ones reported "Changed" aren't routed to.
function EntranceCard({ app, venue: v }) {
  const t = useT();
  const fmt = useFormat();
  const dir = useDirections(v, app.user?.needs || []);
  const e = dir.entrance; // a routable, community-marked step-free door
  const more = (
    <Button variant="ghost" full iconRight="forward" onClick={() => app.goto('arrival', v.id)}
      aria-label={t('place.arrive.moreAria', { name: v.name })}>{t('place.arrive.more')}</Button>
  );
  return (
    <section aria-labelledby="arrive-h" style={{ marginTop: SPACE.lg }}>
      <h2 id="arrive-h" style={{ ...TYPE.title3, fontSize: 20, margin: `0 0 ${SPACE.xs}px`, color: C2.char }}>{t('arrival.title')}</h2>
      <Card variant="outline">
        {e ? (
          <>
            <h3 style={{ ...TYPE.headline, margin: 0, color: C2.char }}>{t(`arrival.kind.${e.kind}.title`)}</h3>
            {e.note && <p style={{ ...TYPE.body, margin: `${SPACE.xxs}px 0 0`, color: C2.char }}>“<UserText>{e.note}</UserText>”</p>}
            <p style={{ ...TYPE.footnote, color: C2.slate, margin: `${SPACE.xxs}px 0 ${SPACE.sm}px` }}>
              {t('arrival.source.marked', { who: whoText(t, e.whoNeed, e.whoMore), date: fmt.date(e.at) })}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE.xs }}>
              <Button full icon="directions" href={dir.entranceHref} external aria-label={dir.entranceAria}>
                {t('arrival.dir.toEntrance', { where: t(`arrival.kind.${e.kind}.short`) })}
              </Button>
              {more}
            </div>
          </>
        ) : (
          <>
            {/* "Mark the door" lives on the Getting there screen and in the review. */}
            <p style={{ ...TYPE.callout, margin: `0 0 ${SPACE.sm}px`, color: C2.char }}>{t('place.arrive.none')}</p>
            {more}
          </>
        )}
      </Card>
    </section>
  );
}

export { EntranceCard };
