'use client';

import React from 'react';
import { RA2_NEEDS } from '@/lib/pilot-data';
import { V2Shell } from '../ui/Shell';
import { C2, F2, M2 } from '../ui/palette';
import { useV2Heading } from '../ui/useHeading';
import { usePortalRows } from './MePortals';
import { Card, Chip, ChipGroup, GUTTER, Icon, List, ListRow, RADIUS, SPACE, SectionHeader, TYPE } from '../ds';

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
    { l: 'My needs card', m: 'Tell a place what you need before you go', fn: () => app.goto('card') },
    ...(app.installable ? [{ l: 'Install the app', m: 'Add Roam Access to your home screen', hi: false, fn: () => app.install() }] : []),
    { l: 'Invite someone to the pilot', m: 'Every new voice makes the map better', fn: () => app.invite() },
    { l: 'Sign out', m: 'Your reviews and saved places stay', fn: () => app.signOut() },
    { l: 'Delete my account', m: 'Removes your needs, reviews and saved places', fn: () => app.deleteAccount() },
  ];

  const icons = {
    'Accessibility settings': 'a11y', 'My needs card': 'user', 'Install the app': 'plus',
    'Invite someone to the pilot': 'users', 'Sign out': 'back', 'Delete my account': 'close',
  };
  const row = r => (
    <ListRow key={r.l} onClick={r.fn} padX={SPACE.md} title={r.l} subtitle={r.m}
      leading={<span style={{ color: r.danger ? C2.red : C2.teal }}><Icon name={icons[r.l] || 'forward'} size={22}/></span>}/>
  );
  const portals = usePortalRows();

  return (
    <V2Shell tabs app={app} active="me">
      <div style={{ padding: `${SPACE.md}px ${GUTTER}px ${SPACE.xl}px` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: SPACE.md, marginBottom: SPACE.lg }}>
          <span aria-hidden="true" style={{
            width: 64, height: 64, borderRadius: RADIUS.pill, background: C2.teal, color: C2.paper, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 24, fontFamily: F2,
          }}>{(name || 'You').charAt(0).toUpperCase()}</span>
          <div style={{ minWidth: 0 }}>
            <h1 ref={h} tabIndex={-1} style={{ ...TYPE.title1, margin: 0 }}>
              {name || 'You'}<span aria-hidden="true" style={{ color: C2.rust }}>.</span>
            </h1>
            <p style={{ ...TYPE.footnote, color: C2.slate, margin: '2px 0 0' }}>Manly pilot · tester</p>
          </div>
        </div>

        {/* my needs */}
        <Card variant="filled" as="section" aria-labelledby="needs-h" style={{ marginBottom: SPACE.sm }}>
          <SectionHeader id="needs-h" title="What I need" size="sm" style={{ marginBottom: SPACE.xs }}
            action={{ label: 'Edit', ariaLabel: 'Edit what I need', onClick: () => app.goto('setup') }}/>
          <ChipGroup label="My needs" wrap>
            {needChips.length
              ? needChips.map(t => <Chip key={t} outline>{t}</Chip>)
              : <span style={{ ...TYPE.footnote, color: C2.slate }}>Nothing set — showing general access for now.</span>}
          </ChipGroup>
        </Card>

        {/* impact */}
        <Card variant="brand" as="section" aria-labelledby="impact-h" style={{ marginBottom: SPACE.lg }} data-ra-oncolor="">
          <h2 id="impact-h" style={{ ...TYPE.headline, margin: `0 0 ${SPACE.sm}px` }}>Your impact</h2>
          <dl style={{ display: 'flex', gap: 10, margin: 0 }}>
            {[[stats.reviews, stats.reviews === 1 ? 'review' : 'reviews'], [stats.places, stats.places === 1 ? 'place reviewed' : 'places reviewed'], [app.pilot.testers, app.pilot.testers === 1 ? 'person in the pilot' : 'people in the pilot']].map(([n, l]) => (
              <div key={l} style={{ flex: 1, background: 'rgba(250,249,246,0.12)', borderRadius: RADIUS.md, padding: '12px 10px', display: 'flex', flexDirection: 'column-reverse' }}>
                <dt style={{ fontSize: 13, lineHeight: 1.3, fontFamily: F2 }}>{l}</dt>
                <dd style={{ fontFamily: M2, fontSize: 24, fontWeight: 700, margin: '0 0 3px' }}>{n}</dd>
              </div>
            ))}
          </dl>
          {stats.reviews === 0 && (
            <p style={{ ...TYPE.footnote, margin: `${SPACE.sm}px 0 0` }}>Your first review helps everyone with needs like yours.</p>
          )}
        </Card>

        <Card padding={0} style={{ marginBottom: SPACE.md }}>
          <List label="Settings and tools">
            {rows.slice(0, -2).map(row)}
            <ListRow href="/how-it-works" padX={SPACE.md} title="How Roam Access works"
              subtitle="How verdicts are made · payment never changes one · privacy"
              leading={<span style={{ color: C2.teal }}><Icon name="info" size={22}/></span>}/>
            {portals}
          </List>
        </Card>

        <Card padding={0}>
          <List label="Account">
            {rows.slice(-2).map(r => row({ ...r, danger: r.l === 'Delete my account' }))}
          </List>
        </Card>

        <p style={{ ...TYPE.overline, fontSize: 11, color: C2.slate, textAlign: 'center', margin: `${SPACE.lg}px 0 0` }}>
          Roam Access pilot · Manly · map data © OpenStreetMap contributors
        </p>
      </div>
    </V2Shell>
  );
}

export { V2Me };
