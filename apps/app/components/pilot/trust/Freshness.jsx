'use client';

import React from 'react';
import { C2 } from '../ui/palette';
import { Banner, Button, Card, SPACE, TYPE } from '../ds';
import { ReportDialog } from './ReportDialog';
import { dateAU, isStale, since } from '@/lib/trust/labels';

// "Last confirmed <date>", a quick "Still accurate?" (Yes / Something
// changed) and "Report a problem". A "Yes" refreshes the date only — it never
// changes the verdict; only reviews do that. Render with key={venue.id}.
function Freshness({ app, venue }) {
  const [state, setState] = React.useState('idle'); // idle | sending | done
  const [report, setReport] = React.useState(null);  // null | { kind }
  const last = venue.lastConfirmed;
  const hasCommunity = venue.verified > 0;
  const ago = last ? since(last) : '';

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
      app.toast('Couldn’t save that — check your connection and try again.');
    }
  }

  return (
    <>
    <Card variant="filled" as="section" aria-labelledby="fresh-h" style={{ marginBottom: SPACE.md }}>
      <h2 id="fresh-h" style={{ ...TYPE.headline, margin: '0 0 2px' }}>
        {last ? `Last confirmed ${dateAU(last)}` : 'Not confirmed by anyone yet'}
      </h2>
      <p style={{ ...TYPE.footnote, color: C2.slate, margin: `0 0 ${SPACE.sm}px` }}>
        {last
          ? `${ago.charAt(0).toUpperCase() + ago.slice(1)}, by someone in the pilot.${isStale(last) ? ' That’s a while ago — things may have changed.' : ''}`
          : 'Place details come from OpenStreetMap. Been here? Your review would be the first.'}
      </p>

      {hasCommunity && (
        state === 'done' ? (
          <Banner tone="success" live="polite" style={{ marginBottom: SPACE.sm }}>
            Thanks — you confirmed it’s still accurate today.
          </Banner>
        ) : (
          <div role="group" aria-labelledby="fresh-q" style={{ marginBottom: SPACE.sm }}>
            <p id="fresh-q" style={{ ...TYPE.headline, margin: `0 0 ${SPACE.xs}px` }}>Been lately? Is this still accurate?</p>
            <div style={{ display: 'flex', gap: SPACE.xs, flexWrap: 'wrap' }}>
              <Button onClick={confirm} disabled={state === 'sending'} style={{ flex: '1 1 140px' }}>
                {state === 'sending' ? 'Saving…' : 'Yes, still accurate'}
              </Button>
              <Button variant="outline" onClick={() => setReport({ kind: 'info_wrong' })} style={{ flex: '1 1 140px' }}>
                Something changed
              </Button>
            </div>
          </div>
        )
      )}

      <p id="fresh-report-hint" style={{ ...TYPE.footnote, color: C2.slate, margin: '4px 0 0' }}>
        Closed, moved, in the wrong spot or listed twice?
      </p>
      <Button variant="plain" size="sm" onClick={() => setReport({ kind: null })} aria-describedby="fresh-report-hint"
        style={{ padding: '0 2px' }}>
        Report a problem
      </Button>

    </Card>
    {/* Outside the Card: the Sheet positions itself in the screen, and the
        Card would clip it. */}
      {report && (
        <ReportDialog venue={venue} initialKind={report.kind}
          onClose={() => setReport(null)}
          onReview={() => { setReport(null); app.goto('review', venue.id); }}
          onSent={() => { setReport(null); app.toast('Thanks — the pilot team will check your report.'); }}/>
      )}
    </>
  );
}

export { Freshness };
