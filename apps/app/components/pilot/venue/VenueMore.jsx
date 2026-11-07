'use client';

import React from 'react';
import { C2 } from '../ui/palette';
import { Button, Disclosure, SPACE, TYPE, useDisclosures } from '../ds';
import { useT } from '../i18n';
import { VenuePhotos } from '../photos/VenuePhotos';
import { SensorySummary } from '../sensory/SensorySummary';
import { WhatToExpect } from '../sensory/WhatToExpect';
import { AskPlace } from '../ask/AskPlace';
import { VenueSays, VenueFooterLinks } from '../screens/VenueSays';
import { VenueCorrections } from '../owners/VenueCorrections';
import { PartnerBadges } from '../layers/VenueAccessExtras';
import { ReportDialog } from '../trust/ReportDialog';

// "More about this place": everything that isn't the verdict, today, your
// needs, getting there or reviews — one tap deeper, closed by default, in the
// same order on every place. Which ones are open is remembered for the
// session. "What the venue says" and partner programs never change a verdict.
function VenueMore({ app, venue: v, says }) {
  const t = useT();
  const more = useDisclosures('place');
  const [reporting, setReporting] = React.useState(false);
  const empty = t('place.more.empty');
  return (
    <section aria-labelledby="more-h" style={{ marginTop: SPACE.lg }}>
      <h2 id="more-h" style={{ ...TYPE.title3, fontSize: 20, margin: `0 0 ${SPACE.xs}px`, color: C2.char }}>{t('place.more.title')}</h2>
      <Disclosure icon="photo" title={t('place.more.photos')} emptyText={empty} {...more.props('photos')}>
        <VenuePhotos key={'photos-' + v.id} app={app} venueId={v.id}/>
      </Disclosure>
      <Disclosure icon="ear" title={t('place.more.sensory')} emptyText={empty} {...more.props('sensory')}>
        <SensorySummary key={'sensory-' + v.id} app={app} venue={v}/>
      </Disclosure>
      <Disclosure icon="list" title={t('place.more.story')} emptyText={empty} {...more.props('story')}>
        <WhatToExpect key={'story-' + v.id} app={app} venue={v}/>
      </Disclosure>
      <Disclosure icon="question" title={t('place.more.ask')} emptyText={empty} {...more.props('ask')}>
        <AskPlace key={'ask-' + v.id} app={app} venue={v}/>
      </Disclosure>
      <Disclosure icon="flag" title={t('place.more.says')} emptyText={empty} {...more.props('says')}>
        <VenueSays app={app} venue={v} says={says}/>
      </Disclosure>
      <Disclosure icon="info" title={t('place.more.details')} {...more.props('details')} style={{ borderBottom: `1px solid ${C2.hair}` }}>
        <VenueCorrections venue={v} corrections={says?.corrections}/>
        <PartnerBadges badges={app.layers.badgesFor(v.id)}/>
        <Button variant="outline" full icon="flag" aria-haspopup="dialog" onClick={() => setReporting(true)}>{t('place.more.wrong')}</Button>
        <VenueFooterLinks venue={v} says={says}/>
        <p style={{ ...TYPE.footnote, textAlign: 'center', margin: `${SPACE.xs}px 0 0` }}>
          <a href={`/v/${encodeURIComponent(v.id)}/share`} target="_blank" rel="noopener" style={{ color: C2.teal, fontWeight: 600, display: 'inline-flex', alignItems: 'center', minHeight: 44 }}>
            {t('venue.shareSummary')}<span className="ra-sr-only"> {t('common.opensNewTab')}</span>
          </a>
        </p>
      </Disclosure>
      {reporting && (
        <ReportDialog venue={v} initialKind={null}
          onClose={() => setReporting(false)}
          onReview={() => { setReporting(false); app.goto('review', v.id); }}
          onSent={() => { setReporting(false); app.toast(t('trust.fresh.reportSent')); }}/>
      )}
    </section>
  );
}

export { VenueMore };
