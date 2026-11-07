'use client';

import React from 'react';
import { C2 } from '../ui/palette';
import { Banner, Button, SPACE, TYPE } from '../ds';
import { ReportDialog } from './ReportDialog';
import { useT } from '../i18n';

// Inside the verdict card, only when a place has community reviews:
// "Still right? [Yes] [Something changed]". "Yes" refreshes the date only —
// it never changes the verdict; "Something changed" opens the report dialog.
// (Replaces the separate "Last confirmed / Still accurate?" card.)
function StillRight({ app, venue }) {
  const t = useT();
  const [state, setState] = React.useState('idle'); // idle | sending | done
  const [reporting, setReporting] = React.useState(false);
  if (!(venue.verified > 0)) return null;

  async function confirm() {
    if (state !== 'idle') return;
    setState('sending');
    try {
      const res = await fetch(`/api/venues/${encodeURIComponent(venue.id)}/confirm`, { method: 'POST' });
      if (!res.ok) throw new Error(String(res.status));
      const { venue: next } = await res.json();
      if (next) app.updateVenue(next);
      setState('done');
    } catch {
      setState('idle');
      app.toast(t('trust.fresh.saveFailed'));
    }
  }

  return (
    <>
      {state === 'done' ? (
        <Banner tone="success" live="polite" style={{ marginTop: SPACE.sm }}>{t('place.still.thanks')}</Banner>
      ) : (
        <div role="group" aria-labelledby={`still-${venue.id}`} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: SPACE.xs, marginTop: SPACE.xs, paddingTop: SPACE.xs, borderTop: `1px solid ${C2.line}` }}>
          <span id={`still-${venue.id}`} style={{ ...TYPE.headline, color: C2.char }}>{t('place.still.q')}</span>
          <Button size="sm" variant="outline" onClick={confirm} disabled={state === 'sending'} aria-label={t('place.still.yesAria', { name: venue.name })} style={{ minHeight: 44, padding: '4px 14px' }}>
            {state === 'sending' ? t('common.saving') : t('place.still.yes')}
          </Button>
          <Button size="sm" variant="outline" onClick={() => setReporting(true)} style={{ minHeight: 44, padding: '4px 12px' }}>{t('place.still.changed')}</Button>
        </div>
      )}
      {reporting && (
        <ReportDialog venue={venue} initialKind="info_wrong"
          onClose={() => setReporting(false)}
          onReview={() => { setReporting(false); app.goto('review', venue.id); }}
          onSent={() => { setReporting(false); app.toast(t('trust.fresh.reportSent')); }}/>
      )}
    </>
  );
}

export { StillRight };
