'use client';

import React from 'react';
import { RA2_NEEDS } from '@/lib/pilot-data';
import { needText } from '@/lib/i18n/data';
import { useT } from '../i18n';
import { V2BigBtn } from '../ui/Buttons';
import { V2Shell } from '../ui/Shell';
import { C2, F2, V2_H1 } from '../ui/palette';
import { useV2Heading } from '../ui/useHeading';

// ─────────────────────────────────────────────────────────────
// SETUP · step 2 — first-person needs
// ─────────────────────────────────────────────────────────────
function V2Setup({ app }) {
  const h = useV2Heading('setup');
  const t = useT();
  const [needs, setNeeds] = React.useState(new Set(app.user?.needs || []));

  function toggle(id) {
    setNeeds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const bar = (
    <div style={{ padding: '14px 24px calc(var(--ra-tabs-pad) + 8px)', background: C2.paper, borderTop: `1px solid ${C2.hair}`, flexShrink: 0 }}>
      <V2BigBtn kind="primary" onClick={() => {
        app.setUser({ ...(app.user || {}), needs: Array.from(needs) });
        app.goto('setup-name');
      }}>{t('onboarding.continue')}</V2BigBtn>
    </div>
  );

  return (
    <V2Shell bar={bar}>
      <div style={{ padding: '14px 24px 24px' }}>
        <div style={{ display: 'flex', gap: 5, marginBottom: 24 }} aria-hidden="true">
          <div style={{ flex: 1, height: 5, borderRadius: 3, background: C2.teal }}/>
          <div style={{ flex: 1, height: 5, borderRadius: 3, background: C2.teal }}/>
          <div style={{ flex: 1, height: 5, borderRadius: 3, background: C2.line }}/>
        </div>
        <p className="ra-sr-only">{t('onboarding.step', { step: 2, total: 3 })}</p>

        <h1 ref={h} tabIndex={-1} style={{ ...V2_H1, fontSize: 29, lineHeight: 1.12, marginBottom: 10 }}>
          {t('onboarding.needs.title')}<span style={{ color: C2.rust }}>{t('onboarding.questionMark')}</span>
        </h1>
        <p style={{ fontSize: 16.5, color: C2.char, lineHeight: 1.5, margin: '0 0 22px' }}>
          {t('onboarding.needs.lead')}
        </p>

        {RA2_NEEDS.map(n => {
          const on = needs.has(n.id);
          return (
            <button key={n.id} onClick={() => toggle(n.id)} aria-pressed={on} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 14,
              minHeight: 68, borderRadius: 16, padding: '10px 16px', marginBottom: 10,
              border: on ? `2.5px solid ${C2.teal}` : `1.5px solid ${C2.line}`,
              background: on ? C2.tealSoft : C2.paper,
              cursor: 'pointer', fontFamily: F2, textAlign: 'left', boxSizing: 'border-box',
            }}>
              <span aria-hidden="true" style={{
                width: 30, height: 30, borderRadius: 999, flexShrink: 0,
                border: on ? 0 : `2px solid ${C2.line}`,
                background: on ? C2.teal : 'transparent',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                boxSizing: 'border-box',
              }}>
                {on && <svg width="15" height="12" viewBox="0 0 16 12" fill="none"><path d="M1 6l5 5L15 1" stroke={C2.paper} strokeWidth="2.5" strokeLinecap="round"/></svg>}
              </span>
              <span style={{ fontSize: 17, fontWeight: 600, lineHeight: 1.35, color: C2.char }}>{needText(t, n.id, 'label')}</span>
            </button>
          );
        })}

        <p style={{ fontSize: 14, color: C2.slate, lineHeight: 1.5, marginTop: 14, marginBottom: 0 }}>
          {t('onboarding.needs.privacy')}
        </p>
      </div>
    </V2Shell>
  );
}

export { V2Setup };
