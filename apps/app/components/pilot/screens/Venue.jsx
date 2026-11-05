'use client';

import React from 'react';
import { useVenueReviews } from './useVenueReviews';
import { V2BigBtn, V2RoundBtn, V2Back } from '../ui/Buttons';
import { V2Shell } from '../ui/Shell';
import { V2_VERDICT_META, V2Verdict } from '../ui/Verdict';
import { C2, F2, M2 } from '../ui/palette';
import { useV2Heading } from '../ui/useHeading';
import { ra2Verdict } from '@/lib/pilot/match';

// ─────────────────────────────────────────────────────────────
// VENUE — verdict first, plain language, detail on demand
// ─────────────────────────────────────────────────────────────
function V2VenueView({ app }) {
  const v = app.venueById(app.selectedId);
  const h = useV2Heading('venue-' + v.id);
  const verdict = ra2Verdict(v, app.user?.needs || []);
  const saved = app.world.saved.includes(v.id);
  const meta = V2_VERDICT_META[verdict.kind];
  const { reviews: loaded } = useVenueReviews(app, v.id);
  const written = v.verified;
  const firstReview = loaded && loaded[0];

  React.useEffect(() => { app.markVisited(v.id); }, [v.id]); // eslint-disable-line

  const nRev = `${v.verified} community ${v.verified === 1 ? 'review' : 'reviews'}`;
  const verdictLead = {
    works: `${verdict.works.slice(0, 3).map(f => f.s).join(', ')} — from ${nRev}.`,
    check: v.verified
      ? `Things to know before you go, from ${nRev}.`
      : 'Not yet confirmed by anyone in the pilot. Check before you go — then tell us how it was.',
    barrier: `People in the pilot have flagged real barriers here, from ${nRev}.`,
    unknown: 'Nobody with your access needs has reviewed this place yet. Your visit could be the first data point.',
  }[verdict.kind];

  const bar = (
    <div style={{
      padding: '14px 22px calc(var(--ra-tabs-pad) + 8px)', background: C2.paper,
      borderTop: `1px solid ${C2.hair}`, display: 'flex', gap: 10, flexShrink: 0,
    }}>
      <V2BigBtn kind="primary" style={{ flex: 1.5 }} ariaLabel={`Directions to ${v.name} (opens Google Maps)`}
        onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${v.lat},${v.lng}`, '_blank', 'noopener')}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
          <path d="M12 21s-7-6.2-7-11a7 7 0 1 1 14 0c0 4.8-7 11-7 11Z" stroke={C2.paper} strokeWidth="2"/>
          <circle cx="12" cy="10" r="2.5" stroke={C2.paper} strokeWidth="2"/>
        </svg>
        Directions
      </V2BigBtn>
      {v.phone ? (
        <V2BigBtn kind="outline" style={{ flex: 1 }} ariaLabel={`Call ${v.name}`}
          onClick={() => { window.location.href = 'tel:' + v.phone.replace(/[^+\d]/g, ''); }}>Call</V2BigBtn>
      ) : v.website ? (
        <V2BigBtn kind="outline" style={{ flex: 1 }} ariaLabel={`${v.name} website (opens in a new tab)`}
          onClick={() => window.open(v.website, '_blank', 'noopener')}>Website</V2BigBtn>
      ) : null}
    </div>
  );

  return (
    <V2Shell bar={bar}>
      <div style={{ padding: '10px 22px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <V2Back app={app} to={app.venueOrigin} label="Back"/>
        <V2RoundBtn onClick={() => app.toggleSave(v.id)} pressed={saved}
          ariaLabel={saved ? `Remove ${v.name} from saved` : `Save ${v.name}`}
          style={saved ? { background: C2.tealSoft, borderColor: C2.teal } : {}}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill={saved ? C2.teal : 'none'} aria-hidden="true" focusable="false">
            <path d="M6 4h12v17l-6-4-6 4V4Z" stroke={saved ? C2.teal : C2.char} strokeWidth="2" strokeLinejoin="round"/>
          </svg>
        </V2RoundBtn>
      </div>

      <div style={{ padding: '16px 22px 24px' }}>
        <h1 ref={h} tabIndex={-1} style={{ ...V2_H1, fontSize: 30, lineHeight: 1.05, marginBottom: 4 }}>
          {v.name}<span style={{ color: C2.rust }}>.</span>
        </h1>
        <p style={{ fontSize: 15, color: C2.slate, margin: '0 0 16px', fontFamily: F2 }}>{v.kind} · {v.address ? `${v.address}, ` : ''}{v.area} · {v.mins} min walk</p>

        {/* THE verdict */}
        <div style={{ background: meta.bg, borderRadius: 18, padding: 20, marginBottom: 10 }}>
          <V2Verdict kind={verdict.kind} big/>
          <p style={{ fontSize: 16.5, lineHeight: 1.5, color: C2.char, margin: '12px 0 0', fontFamily: F2 }}>
            {verdictLead}
          </p>
        </div>

        {/* barriers — first when they exist */}
        {verdict.barriers.length > 0 && (
          <section style={{ borderRadius: 18, border: `1.5px solid ${C2.line}`, overflow: 'hidden', marginBottom: 10 }}>
            <h2 style={{ padding: '16px 18px 6px', fontSize: 14, fontWeight: 700, color: C2.red, margin: 0, fontFamily: F2, letterSpacing: '0.02em' }}>BARRIERS</h2>
            {verdict.barriers.map(f => (
              <div key={f.t} style={{ display: 'flex', gap: 12, padding: '12px 18px', alignItems: 'flex-start', borderTop: `1px solid ${C2.hair}` }}>
                <span aria-hidden="true" style={{
                  width: 22, height: 22, borderRadius: 999, background: C2.red, color: C2.redBg, flexShrink: 0,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, fontFamily: M2,
                }}>✗</span>
                <span style={{ fontSize: 16, lineHeight: 1.45, fontFamily: F2 }}>{f.t}</span>
              </div>
            ))}
          </section>
        )}

        {/* what works */}
        {verdict.works.length > 0 && (
          <section style={{ borderRadius: 18, border: `1.5px solid ${C2.line}`, overflow: 'hidden', marginBottom: 10 }}>
            <h2 style={{ padding: '16px 18px 6px', fontSize: 14, fontWeight: 700, color: C2.blue, margin: 0, fontFamily: F2, letterSpacing: '0.02em' }}>WHAT WORKS</h2>
            {verdict.works.map(f => (
              <div key={f.t} style={{ display: 'flex', gap: 12, padding: '12px 18px', alignItems: 'flex-start', borderTop: `1px solid ${C2.hair}` }}>
                <span aria-hidden="true" style={{
                  width: 22, height: 22, borderRadius: 999, background: C2.blue, color: C2.blueBg, flexShrink: 0,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, fontFamily: M2,
                }}>✓</span>
                <span style={{ fontSize: 16, lineHeight: 1.45, fontFamily: F2 }}>{f.t}</span>
              </div>
            ))}
          </section>
        )}

        {/* check before you go */}
        {verdict.checks.length > 0 && (
          <section style={{ borderRadius: 18, border: `1.5px solid ${C2.line}`, overflow: 'hidden', marginBottom: 16 }}>
            <h2 style={{ padding: '16px 18px 6px', fontSize: 14, fontWeight: 700, color: C2.amber, margin: 0, fontFamily: F2, letterSpacing: '0.02em' }}>CHECK BEFORE YOU GO</h2>
            {verdict.checks.map(f => (
              <div key={f.t} style={{ display: 'flex', gap: 12, padding: '12px 18px', alignItems: 'flex-start', borderTop: `1px solid ${C2.hair}` }}>
                <span aria-hidden="true" style={{
                  width: 22, height: 22, borderRadius: 999, background: C2.amber, color: C2.amberBg, flexShrink: 0,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, fontFamily: M2,
                }}>!</span>
                <span style={{ fontSize: 16, lineHeight: 1.45, fontFamily: F2 }}>{f.t}</span>
              </div>
            ))}
          </section>
        )}

        {/* community voice */}
        {firstReview && (
          <div style={{ background: C2.stone, borderRadius: 18, padding: 18, marginBottom: 16 }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: C2.slate, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: M2, margin: '0 0 10px' }}>From the community</h2>
            <p style={{ fontSize: 16, lineHeight: 1.5, margin: '0 0 10px', fontFamily: F2 }}>
              “{firstReview.text}”
            </p>
            <p style={{ fontSize: 13.5, color: C2.slate, fontWeight: 600, margin: 0, fontFamily: F2 }}>{firstReview.who} · {firstReview.when}</p>
          </div>
        )}

        {written > 0 ? (
          <V2BigBtn kind="ghost" onClick={() => app.goto('reviews', v.id)}>
            Read all {written} {written === 1 ? 'review' : 'reviews'}
          </V2BigBtn>
        ) : (
          <V2BigBtn kind="ghost" onClick={() => app.goto('review', v.id)}>
            No reviews yet — be the first
          </V2BigBtn>
        )}
        <div style={{ height: 10 }}/>
        <V2BigBtn kind="outline" onClick={() => app.goto('review', v.id)}>
          Share your experience
        </V2BigBtn>

        <p style={{ fontSize: 13.5, color: C2.slate, textAlign: 'center', margin: '18px 0 0', lineHeight: 1.5, fontFamily: F2 }}>
          Place details from{' '}
          <a href={v.osmUrl} target="_blank" rel="noopener noreferrer" style={{ color: C2.teal, fontWeight: 600 }}>
            OpenStreetMap<span className="ra-sr-only"> (opens in a new tab)</span>
          </a>. Spot something wrong? Say so in your review.
        </p>
      </div>
    </V2Shell>
  );
}

export { V2VenueView };
