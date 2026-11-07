'use client';

import React from 'react';
import { RA2_NEEDS } from '@/lib/pilot-data';
import { needText } from '@/lib/i18n/data';
import { useT } from '../i18n';
import { V2Shell } from '../ui/Shell';
import { C2 } from '../ui/palette';
import { useV2Heading } from '../ui/useHeading';
import { Button, CheckRow, GUTTER, SPACE, Stepper, TYPE } from '../ds';

// An icon beside every need's words.
const NEED_ICON = { mobility: 'wheelchair', vision: 'eye', hearing: 'ear', autism: 'bell', cognitive: 'brain', mental: 'leaf', chronic: 'seat' };

// ─────────────────────────────────────────────────────────────
// SET-UP · step 1 of 2 — "What do you need at a place?" Real checkboxes
// (screen readers hear "checkbox, checked"), an icon per need, and "Skip
// for now". From Me → What I need it's this step only.
// ─────────────────────────────────────────────────────────────
function V2Setup({ app }) {
  const h = useV2Heading('setup');
  const t = useT();
  const first = !app.user?.done;
  const [needs, setNeeds] = React.useState(() => new Set(app.user?.needs || []));
  const set = (id, on) => setNeeds(prev => { const n = new Set(prev); if (on) n.add(id); else n.delete(id); return n; });

  function next() {
    app.setUser({ ...(app.user || {}), needs: RA2_NEEDS.map(n => n.id).filter(id => needs.has(id)) });
    if (first) app.goto('setup-name');
    else { app.goto('me'); app.toast(t('steps.setup.saved')); }
  }
  // Skip: straight to Find with no needs (results then show general access).
  function skip() {
    app.setUser({ ...(app.user || {}), needs: [], done: true });
    app.goto('find');
  }

  const bar = (
    <div style={{ padding: `${SPACE.sm}px ${GUTTER}px calc(var(--ra-tabs-pad) + 6px)`, background: C2.paper, borderTop: `1px solid ${C2.hair}`, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: SPACE.xs }}>
      <Button full size="lg" onClick={next}>{t('onboarding.continue')}</Button>
      {first && <Button full variant="ghost" onClick={skip}>{t('steps.setup.skip')}</Button>}
    </div>
  );

  return (
    <V2Shell bar={bar}>
      <div style={{ padding: `${SPACE.sm}px ${GUTTER}px ${SPACE.xl}px` }}>
        {first && <Stepper step={1} total={2} style={{ marginBottom: SPACE.lg }}/>}
        <h1 ref={h} tabIndex={-1} style={{ ...TYPE.title1, margin: 0, color: C2.char }}>
          {first && <span className="ra-sr-only">{t('onboarding.step', { step: 1, total: 2 })}. </span>}
          {t('onboarding.needs.title')}<span aria-hidden="true" style={{ color: C2.rust }}>{t('onboarding.questionMark')}</span>
        </h1>
        <p style={{ ...TYPE.body, color: C2.char, margin: `${SPACE.xs}px 0 ${SPACE.md}px` }}>{t('onboarding.needs.lead')}</p>

        <fieldset style={{ border: 0, margin: 0, padding: 0, minWidth: 0 }}>
          <legend className="ra-sr-only">{t('steps.setup.group')}</legend>
          <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE.xs }}>
            {RA2_NEEDS.map(n => (
              <CheckRow key={n.id} icon={NEED_ICON[n.id]} checked={needs.has(n.id)} onChange={on => set(n.id, on)}
                label={needText(t, n.id, 'label')}/>
            ))}
          </div>
        </fieldset>

        <p style={{ ...TYPE.footnote, color: C2.slate, margin: `${SPACE.md}px 0 0` }}>{t('onboarding.needs.privacy')}</p>
      </div>
    </V2Shell>
  );
}

export { V2Setup };
