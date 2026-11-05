'use client';

import React from 'react';
import { RA2_NEEDS } from '@/lib/pilot-data';
import { V2BigBtn, V2RoundBtn } from '../ui/Buttons';
import { V2Mic } from '../ui/Mic';
import { V2Shell } from '../ui/Shell';
import { V2Verdict } from '../ui/Verdict';
import { C2, F2, V2_H1 } from '../ui/palette';
import { useV2Heading } from '../ui/useHeading';
import { ra2Search } from '@/lib/pilot/match';
import { VerdictReasons } from '../trust/VerdictReasons';

// ─────────────────────────────────────────────────────────────
// RESULTS — one verdict per card
// ─────────────────────────────────────────────────────────────
function V2Results({ app }) {
  const h = useV2Heading('results-' + (app.query?.label || ''));
  const query = app.query || { cats: [], tags: [], label: 'All places' };
  const all = ra2Search(app.venues, query, app.user?.needs || []);
  const [limit, setLimit] = React.useState(25);
  const results = all.slice(0, limit);
  const needShorts = RA2_NEEDS.filter(n => (app.user?.needs || []).includes(n.id)).map(n => n.short);

  return (
    <V2Shell tabs app={app} active="home">
      {/* what you asked */}
      <div style={{ padding: '10px 22px 0', display: 'flex', gap: 8 }}>
        <button onClick={() => app.goto('home')} style={{
          display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0,
          minHeight: 56, borderRadius: 999, border: `1.5px solid ${C2.line}`,
          background: C2.paper, padding: '0 18px', cursor: 'pointer',
          fontFamily: F2, fontSize: 16, fontWeight: 600, color: C2.char, textAlign: 'left',
          boxSizing: 'border-box',
        }} aria-label={`Back to home. Current search: ${query.label}`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" style={{ flexShrink: 0 }}>
            <path d="M15 5l-7 7 7 7" stroke={C2.char} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{query.label}</span>
        </button>
        <V2RoundBtn onClick={() => app.goto('voice')} ariaLabel="Search again by voice" style={{ width: 56, height: 56 }}>
          <V2Mic size={22} color={C2.teal}/>
        </V2RoundBtn>
        {!app.wide && (
          <V2RoundBtn onClick={() => app.goto('map')} ariaLabel="Show results on the map" style={{ width: 56, height: 56 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
              <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2ZM9 4v14M15 6v14" stroke={C2.char} strokeWidth="1.8" strokeLinejoin="round"/>
            </svg>
          </V2RoundBtn>
        )}
      </div>

      <div style={{ padding: '20px 22px 24px' }}>
        <h1 ref={h} tabIndex={-1} style={{ ...V2_H1, fontSize: 24, marginBottom: 4 }}>
          {all.length} {all.length === 1 ? 'place' : 'places'} found<span style={{ color: C2.rust }}>.</span>
        </h1>
        <p style={{ fontSize: 15.5, color: C2.slate, margin: '0 0 16px', lineHeight: 1.45, fontFamily: F2 }}>
          {needShorts.length
            ? `Matched to your needs: ${needShorts.join(' + ')}.`
            : 'Showing general access — set your needs to personalise.'}
        </p>
        <p style={{ fontSize: 14, color: C2.slate, margin: '-6px 0 14px', fontFamily: F2, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span>Walking times from {app.origin.name}.</span>
          {!app.origin.mine && (
            <button onClick={app.locateMe} style={{
              minHeight: 44, padding: '0 4px', border: 0, background: 'transparent', color: C2.teal,
              fontFamily: F2, fontSize: 14, fontWeight: 700, textDecoration: 'underline', textUnderlineOffset: 3, cursor: 'pointer',
            }}>Use my location</button>
          )}
        </p>

        {results.map(r => (
          <button key={r.id} onClick={() => app.goto('venue', r.id)} style={{
            width: '100%', textAlign: 'left', cursor: 'pointer', fontFamily: F2,
            background: C2.paper, border: `1.5px solid ${C2.line}`, borderRadius: 18,
            padding: 18, marginBottom: 12, display: 'block', boxSizing: 'border-box',
          }}>
            <span style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
              <span style={{ minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 19, fontWeight: 700, letterSpacing: '-0.015em', marginBottom: 3, color: C2.char }}>{r.name}</span>
                <span style={{ display: 'block', fontSize: 14, color: C2.slate }}>{r.kind} · {r.area} · {r.mins} min walk</span>
              </span>
              <V2Verdict kind={r.verdict.kind}/>
            </span>
            <VerdictReasons venue={r} verdict={r.verdict} needs={app.user?.needs || []}/>
          </button>
        ))}

        {all.length > results.length && (
          <V2BigBtn kind="ghost" onClick={() => setLimit(l => l + 25)}>
            Show {Math.min(25, all.length - results.length)} more
          </V2BigBtn>
        )}

        {!results.length && (
          <p style={{ padding: 24, textAlign: 'center', color: C2.slate, fontSize: 15, border: `1.5px dashed ${C2.line}`, borderRadius: 16 }}>
            Nothing matched that. Try “quiet cafe” or browse from Home.
          </p>
        )}
      </div>
    </V2Shell>
  );
}

export { V2Results };
