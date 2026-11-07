'use client';

import React from 'react';
import { V2Shell } from '../ui/Shell';
import { C2 } from '../ui/palette';
import { useV2Heading } from '../ui/useHeading';
import { ra2Verdict } from '@/lib/pilot/match';
import { Banner, Card, EmptyState, GUTTER, List, SPACE, ScreenHeader } from '../ds';
import { PlaceRow } from '../explore/PlaceRow';
import { useT } from '../i18n';
import { kindLabel } from '@/lib/i18n/data';
import { SavedUpdates } from '../owners/SavedUpdates';

const INSTALL_TIP_KEY = 'ra2-install-tip-dismissed';

// ─────────────────────────────────────────────────────────────
// SAVED — plan your day out
// ─────────────────────────────────────────────────────────────
function V2SavedView({ app }) {
  const t = useT();
  const h = useV2Heading('saved');
  const needs = app.user?.needs || [];
  const places = app.world.saved.map(id => app.venueById(id)).filter(Boolean).map(v => ({ ...v, verdict: ra2Verdict(v, needs) }));

  // PWA: suggest installing once someone has a reason to come back — after
  // they've saved a place — not on first visit. Dismissible, remembered.
  const [tipOff, setTipOff] = React.useState(() => { try { return !!localStorage.getItem(INSTALL_TIP_KEY); } catch { return true; } });
  const showTip = !app.wide && app.installable && places.length > 0 && !tipOff;
  const dismissTip = () => { setTipOff(true); try { localStorage.setItem(INSTALL_TIP_KEY, '1'); } catch { /* private mode */ } };

  return (
    <V2Shell tabs app={app} active="saved">
      <ScreenHeader headingRef={h} title={t('explore.saved.title')}
        subtitle={places.length ? t('explore.saved.subtitle') : null}/>
      <div style={{ padding: `${SPACE.lg}px ${GUTTER}px ${SPACE.xl}px` }}>
        {showTip && (
          <Banner tone="teal" icon="plus" title={t('explore.saved.tipTitle')} onDismiss={dismissTip} dismissLabel={t('explore.saved.tipDismiss')}
            action={{ label: t('explore.saved.tipInstall'), onClick: app.install }} style={{ marginBottom: SPACE.md }}>
            {t('explore.saved.tipBody')}
          </Banner>
        )}
        <SavedUpdates app={app}/>
        {places.length > 0 ? (
          <Card padding={0}>
            <List label={t('explore.saved.list')}>
              {places.map(p => <PlaceRow key={p.id} app={app} place={p} reasons={1} padX={SPACE.md} subtitle={`${kindLabel(t, p.kind)} · ${p.area} · ${t('common.minWalk', { mins: p.mins })}`}/>)}
            </List>
          </Card>
        ) : (
          <Card variant="filled" style={{ marginTop: SPACE.xs }}>
            <EmptyState icon="bookmark" title={t('explore.saved.emptyTitle')}
              body={t('explore.saved.emptyBody')}
              action={{ label: t('explore.saved.explore'), icon: 'search', onClick: () => app.goto('home') }}/>
          </Card>
        )}
        <p style={{ fontSize: 13, color: C2.slate, margin: `${SPACE.md}px 0 0`, textAlign: 'center' }}>
          {t('explore.saved.footer')}
        </p>
      </div>
    </V2Shell>
  );
}

export { V2SavedView };
