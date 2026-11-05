'use client';

import React from 'react';
import { PilotMap, MapLegend } from '../PilotMap';
import { V2Mic } from '../ui/Mic';
import { V2Shell } from '../ui/Shell';
import { V2_VERDICT_META, V2Verdict } from '../ui/Verdict';
import { C2, F2 } from '../ui/palette';
import { useV2Heading } from '../ui/useHeading';
import { ra2Search } from '@/lib/pilot/match';

// ─────────────────────────────────────────────────────────────
// MAP — verdict-coded pins, one card at a time
// ─────────────────────────────────────────────────────────────
function V2MapView({ app }) {
  const query = app.query || { cats: [], tags: [], label: 'All places' };
  const results = ra2Search(app.venues, query, app.user?.needs || []);
  const [selId, setSelId] = React.useState(results[0]?.id || null);
  const sel = results.find(r => r.id === selId) || results[0];
  const h = useV2Heading('map');
  const pinColor = { works: C2.blue, check: C2.amber, barrier: C2.red, unknown: '#475569' };
  const pinIcon = { works: '✓', check: '!', barrier: '✗', unknown: '?' };
  // Remap data coords into the band clear of the floating search chrome above
  // and the selected card below, so no pin ever renders under either.
  const pinX = x => `${(0.06 + x * 0.88) * 100}%`;
  const pinY = y => `${(0.2 + y * 0.5) * 100}%`;
  const legendKinds = [...new Set(results.map(r => r.verdict.kind))];

  return (
    <V2Shell scroll={false} tabs app={app} active="home">
      <h1 ref={h} tabIndex={-1} className="ra-sr-only">Map of results — {query.label}</h1>
      <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
        <PilotMap results={results} selectedId={selId} onSelect={setSelId} origin={app.origin}
          colors={pinColor} icons={pinIcon} labels={Object.fromEntries(Object.entries(V2_VERDICT_META).map(([k, m]) => [k, m.label]))}
          onLocate={app.locateFromMap} onLocateError={app.locateError} autoLocate={app.origin.mine}
          locateStyle={{ right: 18, bottom: sel ? 232 : 24 }}/>

        {/* top: search pill + list toggle */}
        <div style={{ position: 'absolute', top: 'var(--ra-shell-top)', left: 18, right: 18, display: 'flex', gap: 8, zIndex: 3 }}>
          <button onClick={() => app.goto('results')} style={{
            flex: 1, minWidth: 0, minHeight: 54, borderRadius: 999, border: `1.5px solid ${C2.line}`,
            background: C2.paper, padding: '0 18px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 10,
            fontFamily: F2, fontSize: 15.5, fontWeight: 600, color: C2.char, textAlign: 'left',
            boxSizing: 'border-box',
          }} aria-label={`Back to list. Current search: ${query.label}`}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" style={{ flexShrink: 0 }}>
              <path d="M15 5l-7 7 7 7" stroke={C2.char} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{query.label}</span>
            <V2Mic size={18} color={C2.teal}/>
          </button>
          <button onClick={() => app.goto('results')} aria-label="Show as list" style={{
            minHeight: 54, minWidth: 54, borderRadius: 999, border: `1.5px solid ${C2.line}`,
            background: C2.paper, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
              <path d="M4 6h16M4 12h16M4 18h16" stroke={C2.char} strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* legend */}
        <MapLegend compact kinds={legendKinds} colors={pinColor} icons={pinIcon}
          labels={Object.fromEntries(Object.entries(V2_VERDICT_META).map(([k, m]) => [k, m.label]))}
          style={{ top: 'calc(var(--ra-shell-top) + 66px)', left: 18 }}/>

        {/* selected card */}
        {sel && (
          <div style={{
            position: 'absolute', bottom: 16, left: 18, right: 18, zIndex: 3,
            background: C2.paper, borderRadius: 20, border: `1.5px solid ${C2.line}`,
            padding: 18, boxShadow: '0 12px 32px rgba(26,26,26,0.10)', boxSizing: 'border-box',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: F2, fontSize: 19, fontWeight: 700, letterSpacing: '-0.015em', color: C2.char, marginBottom: 3 }}>{sel.name}</div>
                <div style={{ fontFamily: F2, fontSize: 14, color: C2.slate }}>{sel.kind} · {sel.area} · {sel.mins} min walk</div>
              </div>
              <V2Verdict kind={sel.verdict.kind}/>
            </div>
            <div style={{ fontFamily: F2, fontSize: 14.5, color: C2.char, lineHeight: 1.45, marginBottom: 14 }}>
              {sel.verdict.why}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => app.goto('venue', sel.id)} style={{
                flex: 1, minHeight: 50, borderRadius: 12, border: 0, background: C2.teal, color: C2.paper,
                fontFamily: F2, fontSize: 15.5, fontWeight: 700, cursor: 'pointer',
              }}>See details</button>
              <button onClick={() => app.toggleSave(sel.id)}
                aria-label={app.world.saved.includes(sel.id) ? `Remove ${sel.name} from saved` : `Save ${sel.name}`}
                aria-pressed={app.world.saved.includes(sel.id)}
                style={{
                  minHeight: 50, minWidth: 50, borderRadius: 12, border: `1.5px solid ${C2.line}`,
                  background: app.world.saved.includes(sel.id) ? C2.tealSoft : C2.paper,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill={app.world.saved.includes(sel.id) ? C2.teal : 'none'} aria-hidden="true" focusable="false">
                  <path d="M6 4h12v17l-6-4-6 4V4Z" stroke={app.world.saved.includes(sel.id) ? C2.teal : C2.char} strokeWidth="2" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </V2Shell>
  );
}

export { V2MapView };
