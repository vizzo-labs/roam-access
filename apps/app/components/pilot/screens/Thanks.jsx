'use client';

import React from 'react';
import { V2BigBtn } from '../ui/Buttons';
import { V2Shell } from '../ui/Shell';
import { C2, F2, M2 } from '../ui/palette';
import { useV2Heading } from '../ui/useHeading';

// ─────────────────────────────────────────────────────────────
// THANKS — the community loop, made visible
// ─────────────────────────────────────────────────────────────
function V2Thanks({ app }) {
  const v = app.venueById(app.selectedId);
  const h = useV2Heading('thanks');
  const name = app.user?.name;
  return (
    <V2Shell bg={C2.teal}>
      <div style={{ padding: '56px 26px 0', textAlign: 'center' }} data-ra-oncolor="">
        <div aria-hidden="true" style={{
          width: 88, height: 88, borderRadius: 999, margin: '0 auto 26px',
          background: 'rgba(250,249,246,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="40" height="32" viewBox="0 0 16 12" fill="none"><path d="M1 6l5 5L15 1" stroke={C2.paper} strokeWidth="2" strokeLinecap="round"/></svg>
        </div>
        <h1 ref={h} tabIndex={-1} style={{ ...V2_H1, fontSize: 34, letterSpacing: '-0.03em', lineHeight: 1.1, color: C2.paper, marginBottom: 12 }}>
          Thanks{name ? `, ${name}` : ''}<span style={{ color: 'rgba(250,249,246,0.55)' }}>.</span>
        </h1>
        <p style={{ fontSize: 17.5, lineHeight: 1.5, color: 'rgba(250,249,246,0.9)', margin: '0 auto', maxWidth: 300, fontFamily: F2 }}>
          Your review of {v.name} is live — everyone in the pilot can see it now.
        </p>
      </div>

      <div style={{ padding: '30px 26px 0' }}>
        {[
          { n: String(app.lastSubmit?.venueReviews ?? v.verified), l: `${(app.lastSubmit?.venueReviews ?? v.verified) === 1 ? 'review' : 'reviews'} of ${v.name} so far` },
          { n: String(app.myStats.places), l: `${app.myStats.places === 1 ? 'place' : 'places'} you’ve reviewed in the pilot` },
          { n: String(app.pilot.testers), l: `${app.pilot.testers === 1 ? 'person' : 'people'} taking part in the pilot` },
        ].map(s => (
          <div key={s.l} style={{
            display: 'flex', alignItems: 'baseline', gap: 14,
            padding: '16px 18px', borderRadius: 16, marginBottom: 10,
            background: 'rgba(250,249,246,0.09)',
          }}>
            <span style={{ fontFamily: M2, fontSize: 26, fontWeight: 700, color: C2.paper, whiteSpace: 'nowrap' }}>{s.n}</span>
            <span style={{ fontSize: 15, color: 'rgba(250,249,246,0.88)', lineHeight: 1.4, fontFamily: F2 }}>{s.l}</span>
          </div>
        ))}
      </div>

      <div style={{ padding: '24px 26px 30px' }} data-ra-oncolor="">
        <V2BigBtn kind="rust" onClick={() => app.goto('home')}>Done</V2BigBtn>
      </div>
    </V2Shell>
  );
}

export { V2Thanks };
