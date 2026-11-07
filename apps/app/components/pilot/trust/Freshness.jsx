'use client';

import React from 'react';
import { C2 } from '../ui/palette';
import { Banner, Button, Card, SPACE, TYPE } from '../ds';
import { ReportDialog } from './ReportDialog';
import { isStale } from '@/lib/trust/labels';
import { useFormat, useT } from '../i18n';

// "Last confirmed <date>", a quick "Still accurate?" (Yes / Something
// changed) and "Report a problem". A "Yes" refreshes the date only — it never
// changes the verdict; only reviews do that. Render with a per-venue key
// that is unique among its siblings, e.g. key={'fresh-' + venue.id}.
function Freshness({ app, venue }) {
  const t = useT();
  const fmt = useFormat();
  const [state, setState] = React.useState('idle'); // idle | sending | done
  const [report, setReport] = React.useState(null);  // null | { kind }
  const last = venue.lastConfirmed;
  const hasCommunity = venue.verified > 0;

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
    <Card variant="filled" as="section" aria-labelledby="fresh-h" style={{ marginBottom: SPACE.md }}>
      <h2 id="fresh-h" style={{ ...TYPE.headline, margin: '0 0 2px' }}>
        {last ? t('trust.fresh.last', { date: fmt.date(last) }) : t('trust.fresh.never')}
      </h2>
      <p style={{ ...TYPE.footnote, color: C2.slate, margin: `0 0 ${SPACE.sm}px` }}>
        {last
          ? t('trust.fresh.by', { ago: fmt.timeAgo(last) }) + (isStale(last) ? ' ' + t('trust.fresh.stale') : '')
          : t('trust.fresh.osmOnly')}
      </p>

      {hasCommunity && (
        state === 'done' ? (
          <Banner tone="success" live="polite" style={{ marginBottom: SPACE.sm }}>
            {t('trust.fresh.thanks')}
          </Banner>
        ) : (
          <div role="group" aria-labelledby="fresh-q" style={{ marginBottom: SPACE.sm }}>
            <p id="fresh-q" style={{ ...TYPE.headline, margin: `0 0 ${SPACE.xs}px` }}>{t('trust.fresh.question')}</p>
            <div style={{ display: 'flex', gap: SPACE.xs, flexWrap: 'wrap' }}>
              <Button onClick={confirm} disabled={state === 'sending'} style={{ flex: '1 1 140px' }}>
                {state === 'sending' ? t('common.saving') : t('trust.fresh.yes')}
              </Button>
              <Button variant="outline" onClick={() => setReport({ kind: 'info_wrong' })} style={{ flex: '1 1 140px' }}>
                {t('trust.fresh.changed')}
              </Button>
            </div>
          </div>
        )
      )}

      <p id="fresh-report-hint" style={{ ...TYPE.footnote, color: C2.slate, margin: '4px 0 0' }}>
        {t('trust.fresh.reportHint')}
      </p>
      <Button variant="plain" size="sm" onClick={() => setReport({ kind: null })} aria-describedby="fresh-report-hint"
        style={{ padding: '0 2px' }}>
        {t('trust.fresh.report')}
      </Button>

    </Card>
    {/* Outside the Card: the Sheet positions itself in the screen, and the
        Card would clip it. */}
      {report && (
        <ReportDialog venue={venue} initialKind={report.kind}
          onClose={() => setReport(null)}
          onReview={() => { setReport(null); app.goto('review', venue.id); }}
          onSent={() => { setReport(null); app.toast(t('trust.fresh.reportSent')); }}/>
      )}
    </>
  );
}

export { Freshness };
