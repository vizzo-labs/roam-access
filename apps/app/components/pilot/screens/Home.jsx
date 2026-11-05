'use client';

import React from 'react';
import { RA2_TILES } from '@/lib/pilot-data';
import { V2Logo } from '../ui/Logo';
import { V2Mic } from '../ui/Mic';
import { V2Shell } from '../ui/Shell';
import { V2TileIcon } from '../ui/TileIcon';
import { V2Verdict } from '../ui/Verdict';
import { C2, F2, M2, RA2_INPUT_FONT, V2_H1 } from '../ui/palette';
import { useV2Heading } from '../ui/useHeading';
import { ra2Verdict, ra2ParseQuery } from '@/lib/pilot/match';

// ─────────────────────────────────────────────────────────────
// HOME — one question, voice first
// ─────────────────────────────────────────────────────────────
function V2Home({ app }) {
  const h = useV2Heading('home');
  const [typing, setTyping] = React.useState(false);
  const [typed, setTyped] = React.useState('');
  const inputRef = React.useRef(null);

  React.useEffect(() => { if (typing && inputRef.current) inputRef.current.focus(); }, [typing]);

  const name = app.user?.name;
  const visited = app.venueById(app.world.visitedId);
  const showPrompt = visited && !app.world.reviewed.includes(visited.id);
  const needIds = app.user?.needs || [];
  const byDistance = app.venues.map(v => ({ v, verdict: ra2Verdict(v, needIds) })).sort((x, y) => x.v.mins - y.v.mins);
  const worksNear = byDistance.filter(x => x.verdict.kind === 'works').slice(0, 3);
  const firstReviews = byDistance.filter(x => x.v.verified === 0).slice(0, 3);
  const nearbyList = worksNear.length ? worksNear : firstReviews;

  function runTyped(e) {
    e.preventDefault();
    if (!typed.trim()) return;
    app.runSearch(ra2ParseQuery(typed.trim()));
  }

  return (
    <V2Shell tabs app={app} active="home">
      {!app.wide && (
        <div style={{ padding: '10px 22px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <V2Logo size={26}/>
          <button onClick={() => app.goto('me')} aria-label="Open your profile" style={{
            width: 44, height: 44, borderRadius: 999, background: C2.teal, color: C2.paper,
            border: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: F2,
          }}>{(name || 'You').charAt(0).toUpperCase()}</button>
        </div>
      )}

      <div style={{ padding: '26px 22px 0' }}>
        <h1 ref={h} tabIndex={-1} style={{ ...V2_H1, fontSize: 34, letterSpacing: '-0.03em', lineHeight: 1.08, marginBottom: 24 }}>
          {name ? <>Hi {name}.<br/></> : <>Hi.<br/></>}
          Where do you want to go today<span style={{ color: C2.rust }}>?</span>
        </h1>

        {/* Voice — the primary action */}
        <button onClick={() => app.goto('voice')} style={{
          width: '100%', minHeight: 92, borderRadius: 20, border: 0,
          background: C2.teal, color: C2.paper, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 16, padding: '14px 22px',
          textAlign: 'left', fontFamily: F2, boxSizing: 'border-box',
        }}>
          <span aria-hidden="true" style={{
            width: 56, height: 56, borderRadius: 999, background: 'rgba(250,249,246,0.14)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}><V2Mic size={30}/></span>
          <span>
            <span style={{ display: 'block', fontSize: 19, fontWeight: 700, marginBottom: 3 }}>Tap and speak</span>
            <span style={{ display: 'block', fontSize: 14, opacity: 0.88, lineHeight: 1.35 }}>"Find a quiet cafe with step-free entry"</span>
          </span>
        </button>

        {/* Type instead */}
        {!typing ? (
          <button onClick={() => setTyping(true)} style={{
            width: '100%', minHeight: 58, borderRadius: 16, marginTop: 10,
            background: C2.stone, border: 0, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 12, padding: '0 18px',
            fontFamily: F2, fontSize: 16.5, color: C2.slate, textAlign: 'left',
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
              <circle cx="11" cy="11" r="6.5" stroke={C2.slate} strokeWidth="2"/>
              <path d="m20 20-4-4" stroke={C2.slate} strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Or type what you're looking for
          </button>
        ) : (
          <form onSubmit={runTyped} style={{
            display: 'flex', gap: 8, marginTop: 10,
          }}>
            <label htmlFor="home-search" className="ra-sr-only">Search for places</label>
            <input id="home-search" ref={inputRef} value={typed} onChange={e => setTyped(e.target.value)}
              placeholder="Try “quiet cafe with step-free entry”"
              style={{
                flex: 1, minWidth: 0, minHeight: 58, borderRadius: 16,
                border: `1.5px solid ${C2.line}`, padding: '0 16px',
                fontSize: RA2_INPUT_FONT, fontFamily: F2, color: C2.char, background: C2.paper,
                boxSizing: 'border-box',
              }}/>
            <button type="submit" aria-label="Search" style={{
              minHeight: 58, minWidth: 58, borderRadius: 16, border: 0, background: C2.teal,
              color: C2.paper, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
                <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="2"/>
                <path d="m20 20-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </form>
        )}
      </div>

      {/* 1-tap review prompt — the community loop */}
      {showPrompt && (
        <div style={{ padding: '26px 22px 0' }}>
          <button onClick={() => app.goto('review', visited.id)} style={{
            width: '100%', textAlign: 'left', cursor: 'pointer', fontFamily: F2,
            background: C2.tealSoft, border: `2px solid ${C2.teal}`, borderRadius: 18,
            padding: 18, display: 'flex', alignItems: 'center', gap: 14, boxSizing: 'border-box',
          }}>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: 'block', fontFamily: M2, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: C2.slate, marginBottom: 6 }}>1-tap review</span>
              <span style={{ display: 'block', fontSize: 17.5, fontWeight: 700, letterSpacing: '-0.015em', color: C2.char, marginBottom: 3 }}>
                How was {visited.name}?
              </span>
              <span style={{ display: 'block', fontSize: 14, color: C2.slate, lineHeight: 1.4 }}>One tap helps other people plan their day.</span>
            </span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" style={{ flexShrink: 0 }}>
              <path d="M9 5l7 7-7 7" stroke={C2.teal} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      )}

      {/* Browse tiles */}
      <div style={{ padding: '26px 22px 0' }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 12px', letterSpacing: '-0.01em', fontFamily: F2 }}>Or browse</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {RA2_TILES.map(t => (
            <button key={t.id} onClick={() => app.runSearch({ cats: t.cats, tags: [], label: t.label, raw: '' })} style={{
              minHeight: 104, borderRadius: 16, border: `1.5px solid ${C2.line}`,
              background: C2.paper, cursor: 'pointer', fontFamily: F2,
              display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
              justifyContent: 'space-between', padding: 16, boxSizing: 'border-box',
            }}>
              <V2TileIcon id={t.id}/>
              <span style={{ fontSize: 15.5, fontWeight: 700, color: C2.char, letterSpacing: '-0.01em', textAlign: 'left' }}>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Nearby — what works, or where a first review helps most */}
      {nearbyList.length > 0 && (
        <div style={{ padding: '26px 22px 24px' }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 4px', letterSpacing: '-0.01em', fontFamily: F2 }}>
            {worksNear.length ? 'Works for you, nearby' : 'Nearby, waiting for a first review'}
          </h2>
          <p style={{ fontSize: 14, color: C2.slate, margin: '0 0 12px', fontFamily: F2, lineHeight: 1.45 }}>
            {worksNear.length ? `Confirmed by people in the pilot · walking from ${app.origin.name}` : 'Been to one of these? Your review is the first data point.'}
          </p>
          {nearbyList.map(({ v, verdict }) => (
            <button key={v.id} onClick={() => app.goto('venue', v.id)} style={{
              width: '100%', borderRadius: 16, border: `1.5px solid ${C2.line}`, padding: 16, marginBottom: 10,
              display: 'flex', alignItems: 'center', gap: 14, background: C2.paper,
              cursor: 'pointer', fontFamily: F2, textAlign: 'left', boxSizing: 'border-box',
            }}>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 16.5, fontWeight: 700, marginBottom: 3, color: C2.char }}>{v.name}</span>
                <span style={{ display: 'block', fontSize: 13.5, color: C2.slate }}>{v.kind} · {v.mins} min walk</span>
              </span>
              <V2Verdict kind={verdict.kind}/>
            </button>
          ))}
        </div>
      )}
    </V2Shell>
  );
}

export { V2Home };
