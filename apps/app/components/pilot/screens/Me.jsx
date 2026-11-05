'use client';

import React from 'react';
import { RA2_NEEDS } from '@/lib/pilot-data';
import { V2Shell } from '../ui/Shell';
import { C2, F2, M2, V2_H1 } from '../ui/palette';
import { useV2Heading } from '../ui/useHeading';

// ─────────────────────────────────────────────────────────────
// ME — profile, needs, impact, settings
// ─────────────────────────────────────────────────────────────
function V2Me({ app }) {
  const h = useV2Heading('me');
  const name = app.user?.name;
  const needChips = RA2_NEEDS.filter(n => (app.user?.needs || []).includes(n.id)).map(n => n.chip);
  const stats = app.myStats;

  const rows = [
    { l: 'Accessibility settings', m: 'Text size · contrast · motion', hi: true, fn: () => app.openA11y() },
    ...(app.installable ? [{ l: 'Install the app', m: 'Add Roam Access to your home screen', hi: false, fn: () => app.install() }] : []),
    { l: 'Invite someone to the pilot', m: 'Every new voice makes the map better', fn: () => app.invite() },
    { l: 'Sign out', m: 'Your reviews and saved places stay', fn: () => app.signOut() },
    { l: 'Delete my account', m: 'Removes your needs, reviews and saved places', fn: () => app.deleteAccount() },
  ];

  return (
    <V2Shell tabs app={app} active="me">
      <div style={{ padding: '16px 22px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 22 }}>
          <span aria-hidden="true" style={{
            width: 64, height: 64, borderRadius: 999, background: C2.teal, color: C2.paper,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 22, fontFamily: F2,
          }}>{(name || 'You').charAt(0).toUpperCase()}</span>
          <div>
            <h1 ref={h} tabIndex={-1} style={{ ...V2_H1, fontSize: 24, letterSpacing: '-0.02em' }}>
              {name || 'You'}<span style={{ color: C2.rust }}>.</span>
            </h1>
            <p style={{ fontSize: 14, color: C2.slate, margin: 0, fontFamily: F2 }}>Manly pilot · tester</p>
          </div>
        </div>

        {/* my needs */}
        <section style={{ background: C2.stone, borderRadius: 18, padding: 18, marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h2 style={{ fontSize: 15.5, fontWeight: 700, margin: 0, fontFamily: F2 }}>What I need</h2>
            <button onClick={() => app.goto('setup')} style={{
              minHeight: 44, padding: '0 14px', borderRadius: 999, border: 0, background: 'transparent',
              color: C2.teal, fontFamily: F2, fontSize: 14.5, fontWeight: 700, cursor: 'pointer',
              textDecoration: 'underline', textUnderlineOffset: 4,
            }}>Edit</button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
            {needChips.length ? needChips.map(t => (
              <span key={t} style={{
                fontSize: 13.5, fontWeight: 600, padding: '8px 13px', borderRadius: 999,
                background: C2.paper, color: C2.char, border: `1px solid ${C2.line}`, fontFamily: F2,
              }}>{t}</span>
            )) : (
              <span style={{ fontSize: 14, color: C2.slate, fontFamily: F2 }}>Nothing set — showing general access for now.</span>
            )}
          </div>
        </section>

        {/* impact */}
        <section style={{ background: C2.teal, borderRadius: 18, padding: 18, marginBottom: 18, color: C2.paper }} data-ra-oncolor="">
          <h2 style={{ fontSize: 15.5, fontWeight: 700, margin: '0 0 12px', fontFamily: F2 }}>Your impact</h2>
          <div style={{ display: 'flex', gap: 10 }}>
            {[[String(stats.reviews), stats.reviews === 1 ? 'review' : 'reviews'], [String(stats.places), stats.places === 1 ? 'place reviewed' : 'places reviewed'], [String(app.pilot.testers), app.pilot.testers === 1 ? 'person in the pilot' : 'people in the pilot']].map(([n, l]) => (
              <div key={l} style={{ flex: 1, background: 'rgba(250,249,246,0.1)', borderRadius: 12, padding: '12px 10px' }}>
                <div style={{ fontFamily: M2, fontSize: 24, fontWeight: 700, marginBottom: 3 }}>{n}</div>
                <div style={{ fontSize: 12, opacity: 0.88, lineHeight: 1.3, fontFamily: F2 }}>{l}</div>
              </div>
            ))}
          </div>
        </section>

        {/* settings rows */}
        {rows.slice(0, -2).map(r => (
          <button key={r.l} onClick={r.fn} style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
            minHeight: 66, padding: '10px 16px', marginBottom: 8, cursor: 'pointer', textAlign: 'left',
            borderRadius: 16, fontFamily: F2, boxSizing: 'border-box',
            border: r.hi ? `2px solid ${C2.teal}` : `1.5px solid ${C2.line}`,
            background: r.hi ? C2.tealSoft : C2.paper,
          }}>
            <span>
              <span style={{ display: 'block', fontSize: 16, fontWeight: 700, color: C2.char, marginBottom: 2 }}>{r.l}</span>
              <span style={{ display: 'block', fontSize: 13, color: C2.slate }}>{r.m}</span>
            </span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" style={{ flexShrink: 0 }}>
              <path d="M9 5l7 7-7 7" stroke={C2.slate} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        ))}

        <a href="/how-it-works" style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
          minHeight: 66, padding: '10px 16px', marginBottom: 8, textAlign: 'left', textDecoration: 'none',
          borderRadius: 16, fontFamily: F2, boxSizing: 'border-box', border: `1.5px solid ${C2.line}`, background: C2.paper,
        }}>
          <span>
            <span style={{ display: 'block', fontSize: 16, fontWeight: 700, color: C2.char, marginBottom: 2 }}>How Roam Access works</span>
            <span style={{ display: 'block', fontSize: 13, color: C2.slate }}>How verdicts are made · payment never changes one · privacy</span>
          </span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" style={{ flexShrink: 0 }}>
            <path d="M9 5l7 7-7 7" stroke={C2.slate} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </a>

        {rows.slice(-2).map(r => (
          <button key={r.l} onClick={r.fn} style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
            minHeight: 66, padding: '10px 16px', marginBottom: 8, cursor: 'pointer', textAlign: 'left',
            borderRadius: 16, fontFamily: F2, boxSizing: 'border-box',
            border: r.hi ? `2px solid ${C2.teal}` : `1.5px solid ${C2.line}`,
            background: r.hi ? C2.tealSoft : C2.paper,
          }}>
            <span>
              <span style={{ display: 'block', fontSize: 16, fontWeight: 700, color: C2.char, marginBottom: 2 }}>{r.l}</span>
              <span style={{ display: 'block', fontSize: 13, color: C2.slate }}>{r.m}</span>
            </span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" style={{ flexShrink: 0 }}>
              <path d="M9 5l7 7-7 7" stroke={C2.slate} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        ))}

        <p style={{ fontFamily: M2, fontSize: 10.5, letterSpacing: '0.08em', textTransform: 'uppercase', color: C2.slate, textAlign: 'center', margin: '16px 0 0' }}>
          Roam Access pilot · Manly · map data © OpenStreetMap contributors
        </p>
      </div>
    </V2Shell>
  );
}

export { V2Me };
