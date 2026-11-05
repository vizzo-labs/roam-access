'use client';

import React from 'react';
import { C2, F2, M2 } from '../ui/palette';
import { useT } from '../i18n';
import { fetchGaps, peekGaps } from './gapsStore';

// Entry point for "Help fill the gaps" — on Home and after a review.
// Hidden when nothing nearby needs an answer (or the request fails).
function GapsPrompt({ app, style = {}, onColor = false }) {
  const t = useT();
  const [n, setN] = React.useState(() => peekGaps(app.origin)?.tasks?.length ?? null);
  const { lat, lng } = app.origin;
  React.useEffect(() => {
    let live = true;
    fetchGaps({ lat, lng }).then(d => { if (live) setN(d.tasks.length); }, () => { if (live) setN(0); });
    return () => { live = false; };
  }, [lat, lng, app.reviewsVersion]);
  if (!n) return null;

  return (
    <div style={style} data-ra-oncolor={onColor ? '' : undefined}>
      <button onClick={() => app.goto('gaps')} style={{
        width: '100%', textAlign: 'left', cursor: 'pointer', fontFamily: F2,
        background: C2.paper, border: `2px solid ${C2.teal}`, borderRadius: 18,
        padding: 18, display: 'flex', alignItems: 'center', gap: 14, boxSizing: 'border-box',
      }}>
        <span aria-hidden="true" style={{
          width: 48, height: 48, borderRadius: 999, background: C2.tealSoft, flexShrink: 0,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" focusable="false">
            <path d="M12 21s-7-6.2-7-11a7 7 0 1 1 14 0c0 4.8-7 11-7 11Z" stroke={C2.teal} strokeWidth="2"/>
            <path d="M10.2 8.6a1.9 1.9 0 1 1 2.6 1.8c-.5.2-.8.7-.8 1.2v.4" stroke={C2.teal} strokeWidth="1.9" strokeLinecap="round"/>
            <circle cx="12" cy="14.2" r="1" fill={C2.teal}/>
          </svg>
        </span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: 'block', fontFamily: M2, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: C2.slate, marginBottom: 6 }}>{t('community.prompt.overline')}</span>
          <span style={{ display: 'block', fontSize: 17.5, fontWeight: 700, letterSpacing: '-0.015em', color: C2.char, marginBottom: 3 }}>
            {t('community.prompt.title', { count: n })}
          </span>
          <span style={{ display: 'block', fontSize: 14, color: C2.slate, lineHeight: 1.4 }}>{t('community.prompt.sub')}</span>
        </span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" style={{ flexShrink: 0 }}>
          <path d="M9 5l7 7-7 7" stroke={C2.teal} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </div>
  );
}

export { GapsPrompt };
