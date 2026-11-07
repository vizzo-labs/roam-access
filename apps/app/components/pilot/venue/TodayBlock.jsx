'use client';

import React from 'react';
import { C2 } from '../ui/palette';
import { SPACE, TYPE } from '../ds';
import { useT } from '../i18n';
import { TempReportBanner, ReportButton } from '../layers/TempReports';
import { VenueNotices } from '../owners/VenueNotices';

// "Today": live temporary problems (each with "Still there?"), the venue's
// own dated updates ("Venue says"), then "Report a problem today" — always
// here, in the same place on every place page, reachable without scrolling.
// None of it changes the verdict.
function TodayBlock({ app, venue: v }) {
  const t = useT();
  return (
    <section aria-labelledby="today-h" style={{ marginTop: SPACE.md }}>
      <h2 id="today-h" style={{ ...TYPE.title3, fontSize: 20, margin: `0 0 ${SPACE.xs}px`, color: C2.char }}>{t('place.today')}</h2>
      <TempReportBanner app={app} reports={app.layers.reportsFor('venue', v.id)} placeName={v.name}/>
      <VenueNotices venue={v}/>
      <ReportButton app={app} target={{ type: 'venue', id: v.id, where: 'venue', name: v.name }}
        label={t('place.report')} title={t('place.report')} description={t('place.report.desc', { name: v.name })}
        variant="outline" size="md" style={{ minHeight: 56 }}/>
    </section>
  );
}

export { TodayBlock };
