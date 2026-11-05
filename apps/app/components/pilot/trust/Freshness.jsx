'use client';

import React from 'react';
import { C2, F2 } from '../ui/palette';
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

  const btn = {
    flex: 1, minHeight: 52, borderRadius: 14, cursor: 'pointer', fontFamily: F2, fontSize: 16, fontWeight: 700,
    padding: '6px 12px', boxSizing: 'border-box',
  };

  return (
    <section aria-labelledby="fresh-h" style={{ borderRadius: 18, background: C2.stone, padding: 18, marginBottom: 16, fontFamily: F2 }}>
      <h2 id="fresh-h" style={{ fontSize: 16, fontWeight: 700, margin: '0 0 2px', color: C2.char }}>
        {last ? <>Last confirmed {dateAU(last)}</> : 'Not confirmed by anyone yet'}
      </h2>
      <p style={{ fontSize: 14.5, color: C2.slate, margin: '0 0 14px', lineHeight: 1.45 }}>
        {last
          ? `${since(last) === 'today' ? 'Today' : since(last).replace(/^./, c => c.toUpperCase())}, by someone in the pilot.${isStale(last) ? ' That’s a while ago — things may have changed.' : ''}`
          : 'Place details come from OpenStreetMap. Been here? Your review would be the first.'}
      </p>

      {hasCommunity && (
        state === 'done' ? (
          <p role="status" style={{ fontSize: 16, fontWeight: 700, color: C2.char, margin: '0 0 12px' }}>
            Thanks — you confirmed it’s still accurate today.
          </p>
        ) : (
          <div role="group" aria-labelledby="fresh-q" style={{ marginBottom: 12 }}>
            <p id="fresh-q" style={{ fontSize: 16, fontWeight: 700, margin: '0 0 8px', color: C2.char }}>Been lately? Is this still accurate?</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button type="button" onClick={confirm} disabled={state === 'sending'}
                style={{ ...btn, border: 0, background: C2.teal, color: C2.paper }}>
                {state === 'sending' ? 'Saving…' : 'Yes, still accurate'}
              </button>
              <button type="button" onClick={() => setReport({ kind: 'info_wrong' })}
                style={{ ...btn, border: `2px solid ${C2.teal}`, background: C2.paper, color: C2.teal }}>
                Something changed
              </button>
            </div>
          </div>
        )
      )}

      <p id="fresh-report-hint" style={{ margin: '4px 0 0', fontSize: 14.5, color: C2.slate, lineHeight: 1.4 }}>
        Closed, moved, in the wrong spot or listed twice?
      </p>
      <button type="button" onClick={() => setReport({ kind: null })} aria-describedby="fresh-report-hint" style={{
        minHeight: 44, padding: '0 2px', border: 0, background: 'transparent', color: C2.teal,
        fontFamily: F2, fontSize: 15.5, fontWeight: 700, textDecoration: 'underline', textUnderlineOffset: 4, cursor: 'pointer',
      }}>Report a problem</button>

      {report && <ReportDialog open venue={venue} initialKind={report?.kind ?? null}
        onClose={() => setReport(null)}
        onReview={() => { setReport(null); app.goto('review', venue.id); }}
        onSent={() => { setReport(null); app.toast('Thanks — the pilot team will check your report.'); }}/>}
    </section>
  );
}

export { Freshness };
