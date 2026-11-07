'use client';

import React from 'react';
import { RA2_NEEDS } from '@/lib/pilot-data';
import { needText } from '@/lib/i18n/data';
import { LanguagePicker, useT } from '../i18n';
import { V2Shell } from '../ui/Shell';
import { C2, F2, M2 } from '../ui/palette';
import { useV2Heading } from '../ui/useHeading';
import { usePortalRows } from './MePortals';
import { MeContrib } from '../contrib/MeContrib';
import { Card, Chip, ChipGroup, GUTTER, Icon, List, ListRow, RADIUS, SPACE, SectionHeader, TYPE } from '../ds';

// ─────────────────────────────────────────────────────────────
// ME — profile, needs, impact, settings
// ─────────────────────────────────────────────────────────────
function V2Me({ app }) {
  const h = useV2Heading('me');
  const t = useT();
  const name = app.user?.name;
  const needChips = RA2_NEEDS.filter(n => (app.user?.needs || []).includes(n.id)).map(n => needText(t, n.id, 'chip'));
  const stats = app.myStats;

  const rows = [
    { id: 'a11y', icon: 'a11y', fn: () => app.openA11y() },
    { id: 'card', icon: 'user', fn: () => app.goto('card') },
    ...(app.installable ? [{ id: 'install', icon: 'plus', fn: () => app.install() }] : []),
    { id: 'invite', icon: 'users', fn: () => app.invite() },
    { id: 'signOut', icon: 'back', fn: () => app.signOut() },
    { id: 'delete', icon: 'close', danger: true, fn: () => app.deleteAccount() },
  ];

  const row = r => (
    <ListRow key={r.id} onClick={r.fn} padX={SPACE.md} title={t(`me.row.${r.id}`)} subtitle={t(`me.row.${r.id}.sub`)}
      leading={<span style={{ color: r.danger ? C2.red : C2.teal }}><Icon name={r.icon} size={22}/></span>}/>
  );
  const portals = usePortalRows(t);

  return (
    <V2Shell tabs app={app} active="me">
      <div style={{ padding: `${SPACE.md}px ${GUTTER}px ${SPACE.xl}px` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: SPACE.md, marginBottom: SPACE.lg }}>
          <span aria-hidden="true" style={{
            width: 64, height: 64, borderRadius: RADIUS.pill, background: C2.teal, color: C2.paper, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 24, fontFamily: F2,
          }}>{(name || t('me.you')).charAt(0).toUpperCase()}</span>
          <div style={{ minWidth: 0 }}>
            <h1 ref={h} tabIndex={-1} style={{ ...TYPE.title1, margin: 0 }}>
              {name || t('me.you')}{!/[.!?。]$/.test(name || '') && <span aria-hidden="true" style={{ color: C2.rust }}>.</span>}
            </h1>
            <p style={{ ...TYPE.footnote, color: C2.slate, margin: '2px 0 0' }}>{t('me.role')}</p>
          </div>
        </div>

        {/* my needs */}
        <Card variant="filled" as="section" aria-labelledby="needs-h" style={{ marginBottom: SPACE.sm }}>
          <SectionHeader id="needs-h" title={t('me.needs.title')} size="sm" style={{ marginBottom: SPACE.xs }}
            action={{ label: t('common.edit'), ariaLabel: t('me.needs.edit'), onClick: () => app.goto('setup') }}/>
          <ChipGroup label={t('me.needs.chips')} wrap>
            {needChips.length
              ? needChips.map(c => <Chip key={c} outline>{c}</Chip>)
              : <span style={{ ...TYPE.footnote, color: C2.slate }}>{t('me.needs.none')}</span>}
          </ChipGroup>
        </Card>

        {/* impact */}
        <Card variant="brand" as="section" aria-labelledby="impact-h" style={{ marginBottom: SPACE.lg }} data-ra-oncolor="">
          <h2 id="impact-h" style={{ ...TYPE.headline, margin: `0 0 ${SPACE.sm}px` }}>{t('me.impact.title')}</h2>
          <dl style={{ display: 'flex', gap: 10, margin: 0 }}>
            {[[stats.reviews, t('me.impact.reviews', { count: stats.reviews })], [stats.places, t('me.impact.places', { count: stats.places })], [app.pilot.testers, t('me.impact.testers', { count: app.pilot.testers })]].map(([n, l]) => (
              <div key={l} style={{ flex: 1, background: 'rgba(250,249,246,0.12)', borderRadius: RADIUS.md, padding: '12px 10px', display: 'flex', flexDirection: 'column-reverse' }}>
                <dt style={{ fontSize: 13, lineHeight: 1.3, fontFamily: F2 }}>{l}</dt>
                <dd style={{ fontFamily: M2, fontSize: 24, fontWeight: 700, margin: '0 0 3px' }}>{n}</dd>
              </div>
            ))}
          </dl>
          {stats.reviews === 0 && (
            <p style={{ ...TYPE.footnote, margin: `${SPACE.sm}px 0 0` }}>{t('me.impact.first')}</p>
          )}
        </Card>

        {/* recognition (Brief L): how I appear, badges, top contributors */}
        <MeContrib app={app}/>

        {/* language (#21) — also in Accessibility settings */}
        <Card as="section" aria-label={t('common.language.title')} style={{ marginBottom: SPACE.md }}>
          <LanguagePicker idBase="me-lang" compact/>
        </Card>

        <Card padding={0} style={{ marginBottom: SPACE.md }}>
          <List label={t('me.list.settings')}>
            {rows.slice(0, -2).map(row)}
            <ListRow href="/how-it-works" padX={SPACE.md} title={t('onboarding.howItWorks')}
              subtitle={t('me.howItWorks.sub')}
              leading={<span style={{ color: C2.teal }}><Icon name="info" size={22}/></span>}/>
            {portals}
          </List>
        </Card>

        <Card padding={0}>
          <List label={t('me.list.account')}>
            {rows.slice(-2).map(row)}
          </List>
        </Card>

        <p style={{ ...TYPE.overline, fontSize: 11, color: C2.slate, textAlign: 'center', margin: `${SPACE.lg}px 0 0` }}>
          {t('me.footer')}
        </p>
      </div>
    </V2Shell>
  );
}

export { V2Me };
