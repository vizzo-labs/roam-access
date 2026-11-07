'use client';

import React from 'react';
import { V2BigBtn } from '../ui/Buttons';
import { V2Shell } from '../ui/Shell';
import { C2, F2, RA2_INPUT_FONT, V2_H1 } from '../ui/palette';
import { useV2Heading } from '../ui/useHeading';
import { V2Verdict } from '../ui/Verdict';
import { Card, SPACE, TYPE } from '../ds';
import { useT } from '../i18n';
import { useUser } from '@clerk/nextjs';
import { PublicProfileForm, initialPublic, publicError } from '../contrib/PublicProfileForm';
import { suggestPublicName } from '../contrib/authorText';

const VERDICT_HELP = ['works', 'check', 'barrier', 'unknown'];

// ─────────────────────────────────────────────────────────────
// SETUP · step 3 — the first time: how you'll appear on reviews (Brief L:
// name shown on reviews, post anonymously, which describes you, show my
// needs). Editing needs later (from Me) ends with the private name only.
// ─────────────────────────────────────────────────────────────
function V2SetupName({ app }) {
  const h = useV2Heading('setup-name');
  const t = useT();
  const first = !app.user?.done;
  const { user: clerk } = useUser();
  const [name, setName] = React.useState(app.user?.name || '');
  const [pub, setPub] = React.useState(() => initialPublic(app.user?.pub, suggestPublicName(clerk?.firstName, clerk?.lastName, app.user?.name)));
  const [tried, setTried] = React.useState(false);
  const nameError = tried ? publicError(t, pub) : null;

  function finish() {
    if (first) {
      setTried(true);
      if (publicError(t, pub)) { document.getElementById('setup-pub-name')?.focus(); return; }
      const chosen = { ...pub, relationship: pub.relationship || 'unsaid' };
      // The app greets you by the name you chose (unless you post anonymously).
      const greet = !pub.postAnonymously ? (pub.publicName || '').trim() : '';
      app.setUser({ ...(app.user || {}), name: greet || app.user?.name || '', needs: app.user?.needs || [], done: true, pub: chosen });
    } else {
      app.setUser({ ...(app.user || {}), name: name.trim(), needs: app.user?.needs || [], done: true });
    }
    app.goto('home');
    app.toast(t('onboarding.name.done'));
  }

  const bar = (
    <div style={{ padding: '14px 24px calc(var(--ra-tabs-pad) + 8px)', background: C2.paper, borderTop: `1px solid ${C2.hair}`, flexShrink: 0 }}>
      <V2BigBtn kind="primary" onClick={finish}>{t('onboarding.finish')}</V2BigBtn>
    </div>
  );

  return (
    <V2Shell bar={bar}>
      <div style={{ padding: '14px 24px 24px' }}>
        <div style={{ display: 'flex', gap: 5, marginBottom: 24 }} aria-hidden="true">
          <div style={{ flex: 1, height: 5, borderRadius: 3, background: C2.teal }}/>
          <div style={{ flex: 1, height: 5, borderRadius: 3, background: C2.teal }}/>
          <div style={{ flex: 1, height: 5, borderRadius: 3, background: C2.teal }}/>
        </div>
        <p className="ra-sr-only">{t('onboarding.step', { step: 3, total: 3 })}</p>

        {first ? (
          <>
            <h1 ref={h} tabIndex={-1} style={{ ...V2_H1, fontSize: 29, lineHeight: 1.12, marginBottom: 10 }}>
              {t('contrib.setup.title')}<span aria-hidden="true" style={{ color: C2.rust }}>.</span>
            </h1>
            <p style={{ fontSize: 16.5, color: C2.char, lineHeight: 1.5, margin: '0 0 22px' }}>
              {t('contrib.setup.lead')}
            </p>
            <PublicProfileForm idBase="setup-pub" value={pub} onChange={setPub} needs={app.user?.needs} nameError={nameError}/>
          </>
        ) : (<>
        <h1 ref={h} tabIndex={-1} style={{ ...V2_H1, fontSize: 29, lineHeight: 1.12, marginBottom: 10 }}>
          {t('onboarding.name.title')}<span style={{ color: C2.rust }}>{t('onboarding.questionMark')}</span>
        </h1>
        <p style={{ fontSize: 16.5, color: C2.char, lineHeight: 1.5, margin: '0 0 22px' }}>
          {t('onboarding.name.lead')}
        </p>

        <label htmlFor="setup-name" style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>{t('onboarding.name.label')}</label>
        <input id="setup-name" value={name} onChange={e => setName(e.target.value)}
          autoComplete="nickname" placeholder={t('onboarding.name.placeholder')}
          style={{
            width: '100%', boxSizing: 'border-box', minHeight: 60,
            border: `1.5px solid ${C2.line}`, borderRadius: 16, padding: '0 18px',
            fontSize: RA2_INPUT_FONT + 1, fontFamily: F2, color: C2.char, background: C2.paper,
          }}/>
        </>)}

        {/* First time only: what the answers will look like, before the first search. */}
        {!app.user?.done && (
          <Card variant="filled" as="section" aria-labelledby="verdicts-h" style={{ marginTop: SPACE.xl }}>
            <h2 id="verdicts-h" style={{ ...TYPE.headline, margin: '0 0 4px' }}>{t('onboarding.verdicts.title')}</h2>
            <p style={{ ...TYPE.footnote, color: C2.slate, margin: `0 0 ${SPACE.sm}px` }}>
              {t('onboarding.verdicts.lead')}
            </p>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: SPACE.sm }}>
              {VERDICT_HELP.map(kind => (
                <li key={kind} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
                  <V2Verdict kind={kind}/>
                  <span style={{ ...TYPE.footnote, color: C2.char }}>{t(`onboarding.verdicts.${kind}`)}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    </V2Shell>
  );
}

export { V2SetupName };
