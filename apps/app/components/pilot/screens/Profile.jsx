'use client';

import React from 'react';
import { useUser } from '@clerk/nextjs';
import { V2Shell } from '../ui/Shell';
import { useV2Heading } from '../ui/useHeading';
import { Banner, Button, GUTTER, SPACE, ScreenHeader } from '../ds';
import { useT } from '../i18n';
import { PublicProfileForm, initialPublic, publicError } from '../contrib/PublicProfileForm';
import { isLegacy, suggestPublicName } from '../contrib/authorText';

// ─────────────────────────────────────────────────────────────
// ME → HOW I APPEAR ON REVIEWS (#/profile) — Brief L
// ─────────────────────────────────────────────────────────────
function V2Profile({ app }) {
  const t = useT();
  const h = useV2Heading('profile');
  const { user: clerk } = useUser();
  const pub = app.user?.pub;
  const legacy = isLegacy(pub);
  const suggestion = suggestPublicName(clerk?.firstName, clerk?.lastName, app.user?.name);
  const [value, setValue] = React.useState(() => initialPublic(pub, suggestion));
  const [tried, setTried] = React.useState(false);
  const [state, setState] = React.useState(null); // 'saving' | 'saved' | 'failed'
  // An admin cleared an offensive name: say so, and ask for a new one.
  const wasReset = !legacy && !pub.postAnonymously && !(pub.publicName || '').trim();
  const nameError = tried ? publicError(t, value) : null;

  async function save() {
    setTried(true);
    if (publicError(t, value)) { document.getElementById('profile-name')?.focus(); return; }
    setState('saving');
    const ok = await app.savePublic({ ...value, relationship: value.relationship || 'unsaid' });
    setState(ok ? 'saved' : 'failed');
  }

  return (
    <V2Shell tabs app={app} active="me">
      <ScreenHeader headingRef={h} title={t('contrib.profile.title')}
        subtitle={t('contrib.profile.lead')}
        back={{ label: t('contrib.profile.back'), onClick: () => app.goto('me') }}/>
      <div style={{ padding: `${SPACE.md}px ${GUTTER}px ${SPACE.xl}px`, display: 'flex', flexDirection: 'column', gap: SPACE.lg }}>
        {legacy && <Banner tone="info">{t('contrib.profile.legacy')}</Banner>}
        {wasReset && <Banner tone="warn">{t('contrib.profile.reset')}</Banner>}
        <PublicProfileForm idBase="profile" value={value} onChange={v => { setValue(v); setState(null); }}
          needs={app.user?.needs} nameError={nameError}/>
        <div>
          <Button full size="lg" onClick={save} disabled={state === 'saving'}>
            {state === 'saving' ? t('common.saving') : t('contrib.form.save')}
          </Button>
          {state === 'saved' && <Banner tone="success" live="polite" style={{ marginTop: SPACE.sm }}>{t('contrib.form.saved')}</Banner>}
          {state === 'failed' && <Banner tone="danger" live="assertive" style={{ marginTop: SPACE.sm }}>{t('contrib.form.failed')}</Banner>}
        </div>
      </div>
    </V2Shell>
  );
}

export { V2Profile };
