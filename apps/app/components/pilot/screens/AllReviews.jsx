'use client';

import React from 'react';
import { RA2_NEEDS } from '@/lib/pilot-data';
import { useVenueReviews } from './useVenueReviews';
import { V2BigBtn, V2Back } from '../ui/Buttons';
import { V2Shell } from '../ui/Shell';
import { V2Verdict } from '../ui/Verdict';
import { C2, F2, V2_H1 } from '../ui/palette';
import { useV2Heading } from '../ui/useHeading';

// ─────────────────────────────────────────────────────────────
// ALL REVIEWS — filter by lived experience
// ─────────────────────────────────────────────────────────────
function V2AllReviews({ app }) {
  const v = app.venueById(app.selectedId);
  const h = useV2Heading('reviews-' + v.id);
  const [filter, setFilter] = React.useState('All');
  const { reviews: loaded, error } = useVenueReviews(app, v.id);
  const all = loaded || [];
  const filters = ['All', ...RA2_NEEDS.map(n => n.filter)];
  const shown = filter === 'All' ? all : all.filter(r => r.filters.includes(filter));

  return (
    <V2Shell tabs app={app} active="home">
      <div style={{ padding: '10px 22px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
        <V2Back app={app} to="venue" id={v.id} label={`Back to ${v.name}`}/>
        <div>
          <h1 ref={h} tabIndex={-1} style={{ ...V2_H1, fontSize: 19, letterSpacing: '-0.015em' }}>{v.name} reviews</h1>
          <p style={{ fontSize: 13.5, color: C2.slate, margin: 0, fontFamily: F2 }}>
            {loaded ? `${all.length} ${all.length === 1 ? 'review' : 'reviews'} from the pilot` : error ? 'Couldn’t load reviews' : 'Loading reviews…'}
          </p>
        </div>
      </div>

      <div style={{ padding: '18px 22px 0', display: 'flex', gap: 7, flexWrap: 'wrap' }} role="group" aria-label="Filter reviews by lived experience">
        {filters.map(f => {
          const on = filter === f;
          return (
            <button key={f} onClick={() => setFilter(f)} aria-pressed={on} style={{
              minHeight: 44, padding: '0 16px', borderRadius: 999, cursor: 'pointer',
              border: on ? `1.5px solid ${C2.teal}` : `1.5px solid ${C2.line}`,
              background: on ? C2.teal : C2.paper,
              color: on ? C2.paper : C2.char,
              fontFamily: F2, fontSize: 14.5, fontWeight: 600,
            }}>{f}</button>
          );
        })}
      </div>

      <div style={{ padding: '18px 22px 24px' }}>
        {shown.map((r, i) => (
          <article key={r.id || i} style={{
            border: `1.5px solid ${C2.hair}`, borderRadius: 18, padding: 18, marginBottom: 12,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: C2.teal, fontFamily: F2 }}>{r.who}</span>
              <V2Verdict kind={r.v} label={{ works: 'It worked', check: 'Some barriers', barrier: 'Didn’t work' }[r.v]}/>
            </div>
            <p style={{ fontSize: 15.5, lineHeight: 1.5, margin: '0 0 12px', color: C2.char, fontFamily: F2 }}>{r.text}</p>
            {r.details && <p style={{ fontSize: 14, lineHeight: 1.5, margin: '0 0 12px', color: C2.slate, fontFamily: F2 }}>{r.details}</p>}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: C2.slate, fontFamily: F2 }}>
                {r.when}{r.mine ? ' · yours' : ''}
              </span>
            </div>
          </article>
        ))}
        {loaded && !shown.length && (
          <p style={{ padding: 24, textAlign: 'center', color: C2.slate, fontSize: 15, border: `1.5px dashed ${C2.line}`, borderRadius: 16, fontFamily: F2 }}>
            No reviews from this lived experience yet — yours could be the first.
          </p>
        )}
        <V2BigBtn kind="primary" onClick={() => app.goto('review', v.id)}>Share your experience</V2BigBtn>
      </div>
    </V2Shell>
  );
}

export { V2AllReviews };
