'use client';

import React from 'react';
import { V2BigBtn } from '../ui/Buttons';
import { V2Shell } from '../ui/Shell';
import { V2Verdict } from '../ui/Verdict';
import { C2, F2 } from '../ui/palette';
import { useV2Heading } from '../ui/useHeading';
import { ra2Verdict } from '@/lib/pilot/match';

// ─────────────────────────────────────────────────────────────
// SAVED — plan your day out
// ─────────────────────────────────────────────────────────────
function V2SavedView({ app }) {
  const h = useV2Heading('saved');
  const places = app.world.saved.map(id => app.venueById(id)).filter(Boolean);
  return (
    <V2Shell tabs app={app} active="saved">
      <div style={{ padding: '16px 22px 24px' }}>
        <h1 ref={h} tabIndex={-1} style={{ ...V2_H1, fontSize: 30, marginBottom: 6 }}>
          Saved<span style={{ color: C2.rust }}>.</span>
        </h1>
        <p style={{ fontSize: 15.5, color: C2.slate, margin: '0 0 18px', lineHeight: 1.45, fontFamily: F2 }}>
          Your places, with what people in the pilot say now.
        </p>

        {places.map(p => {
          const verdict = ra2Verdict(p, app.user?.needs || []);
          return (
            <button key={p.id} onClick={() => app.goto('venue', p.id)} style={{
              width: '100%', textAlign: 'left', cursor: 'pointer', fontFamily: F2,
              background: C2.paper, border: `1.5px solid ${C2.line}`, borderRadius: 18,
              padding: 18, marginBottom: 12, display: 'block', boxSizing: 'border-box',
            }}>
              <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: 18, fontWeight: 700, letterSpacing: '-0.015em', color: C2.char, marginBottom: 3 }}>{p.name}</span>
                  <span style={{ display: 'block', fontSize: 13.5, color: C2.slate }}>{p.kind} · {p.area}</span>
                </span>
                <V2Verdict kind={verdict.kind}/>
              </span>
              <span style={{ fontSize: 14.5, color: C2.char, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span aria-hidden="true" style={{ color: C2.rust, fontWeight: 700 }}>/</span>{p.note || (p.verified ? `${p.verified} ${p.verified === 1 ? 'review' : 'reviews'}` : 'No reviews yet — be the first')}
              </span>
            </button>
          );
        })}

        {!places.length && (
          <div style={{ padding: 28, textAlign: 'center', border: `1.5px dashed ${C2.line}`, borderRadius: 18 }}>
            <p style={{ fontSize: 15.5, color: C2.slate, margin: '0 0 16px', fontFamily: F2 }}>
              Nothing saved yet. Find somewhere that works and keep it here.
            </p>
            <V2BigBtn kind="primary" onClick={() => app.goto('home')}>Explore places</V2BigBtn>
          </div>
        )}
      </div>
    </V2Shell>
  );
}

export { V2SavedView };
