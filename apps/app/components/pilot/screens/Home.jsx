'use client';

import React from 'react';
import { RA2_TILES } from '@/lib/pilot-data';
import { V2Logo } from '../ui/Logo';
import { V2Mic } from '../ui/Mic';
import { V2Shell } from '../ui/Shell';
import { V2TileIcon } from '../ui/TileIcon';
import { GapsPrompt } from '../community/GapsPrompt';
import { C2, F2 } from '../ui/palette';
import { useV2Heading } from '../ui/useHeading';
import { ra2Verdict, ra2ParseQuery } from '@/lib/pilot/match';
import { AccessLayersLinks } from '../layers/AccessLayersLinks';
import { Card, GUTTER, Icon, List, RADIUS, SPACE, SearchField, SectionHeader, TYPE } from '../ds';
import { PlaceRow } from '../explore/PlaceRow';

const ALL = { cats: [], tags: [], label: 'All places', raw: '' };

// ─────────────────────────────────────────────────────────────
// HOME — one question, voice first, search always there
// ─────────────────────────────────────────────────────────────
function V2Home({ app }) {
  const h = useV2Heading('home');
  const [typed, setTyped] = React.useState('');

  const name = app.user?.name;
  const visited = app.venueById(app.world.visitedId);
  const showPrompt = visited && !app.world.reviewed.includes(visited.id);
  const needIds = app.user?.needs || [];
  const byDistance = app.venues.map(v => ({ ...v, verdict: ra2Verdict(v, needIds) })).sort((x, y) => x.mins - y.mins);
  const worksNear = byDistance.filter(x => x.verdict.kind === 'works').slice(0, 3);
  const firstReviews = byDistance.filter(x => x.verified === 0).slice(0, 3);
  const nearbyList = worksNear.length ? worksNear : firstReviews;
  const pad = { padding: `${SPACE.xl + 2}px ${GUTTER}px 0` };

  return (
    <V2Shell tabs app={app} active="home">
      {!app.wide && (
        <div style={{ padding: `10px ${GUTTER}px 0`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <V2Logo size={26}/>
          <button onClick={() => app.goto('me')} aria-label="Open your profile" className="ds-press" style={{
            width: 48, height: 48, borderRadius: RADIUS.pill, background: C2.teal, color: C2.paper,
            border: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: 16, cursor: 'pointer', fontFamily: F2,
          }}>{(name || 'You').charAt(0).toUpperCase()}</button>
        </div>
      )}

      <div style={{ padding: `${SPACE.xl}px ${GUTTER}px 0` }}>
        <h1 ref={h} tabIndex={-1} style={{ ...TYPE.display, margin: `0 0 ${SPACE.xl}px`, color: C2.char }}>
          {name ? <>Hi {name}.<br/></> : <>Hi.<br/></>}
          Where do you want to go today<span style={{ color: C2.rust }}>?</span>
        </h1>

        {/* Voice — the primary action */}
        <button onClick={() => app.goto('voice')} className="ds-press" style={{
          width: '100%', minHeight: 92, borderRadius: RADIUS.lg + 2, border: 0,
          background: C2.teal, color: C2.paper, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 16, padding: '14px 22px',
          textAlign: 'left', fontFamily: F2, boxSizing: 'border-box',
        }}>
          <span aria-hidden="true" style={{
            width: 56, height: 56, borderRadius: RADIUS.pill, background: 'rgba(250,249,246,0.14)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}><V2Mic size={30}/></span>
          <span>
            <span style={{ display: 'block', fontSize: 19, fontWeight: 700, marginBottom: 3 }}>Tap and speak</span>
            <span style={{ display: 'block', fontSize: 14.5, opacity: 0.92, lineHeight: 1.35 }}>“Find a quiet cafe with step-free entry”</span>
          </span>
        </button>

        {/* Typing is always one tap away — no extra step */}
        <SearchField id="home-search" label="Search for places" value={typed} onChange={setTyped}
          placeholder="Or type what you’re looking for" style={{ marginTop: 10 }}
          onSubmit={t => app.runSearch(ra2ParseQuery(t))}/>
      </div>

      {/* 1-tap review prompt — the community loop */}
      {showPrompt && (
        <div style={pad}>
          <Card variant="tint" onClick={() => app.goto('review', visited.id)} padding={18} style={{ border: `2px solid ${C2.teal}` }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ ...TYPE.overline, display: 'block', color: C2.slate, marginBottom: 6 }}>1-tap review</span>
                <span style={{ ...TYPE.headline, fontSize: 17.5, display: 'block', color: C2.char, marginBottom: 3 }}>How was {visited.name}?</span>
                <span style={{ ...TYPE.footnote, display: 'block', color: C2.slate }}>One tap helps other people plan their day.</span>
              </span>
              <span style={{ color: C2.teal }}><Icon name="forward" size={20} strokeWidth={2.4}/></span>
            </span>
          </Card>
        </div>
      )}

      {/* Help fill the gaps — one quick answer per place */}
      <GapsPrompt app={app} style={pad}/>

      {/* Browse */}
      <section aria-labelledby="browse-h" style={pad}>
        <SectionHeader id="browse-h" size="sm" title="Browse"
          action={{ label: 'All places', ariaLabel: 'Show all places', onClick: () => app.runSearch(ALL) }}/>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {RA2_TILES.map(t => (
            <Card key={t.id} padding={SPACE.md} style={{ minHeight: 104 }}
              onClick={() => app.runSearch({ cats: t.cats, tags: [], label: t.label, raw: '' })}>
              <span style={{ display: 'block', marginBottom: SPACE.sm }}><V2TileIcon id={t.id}/></span>
              <span style={{ ...TYPE.headline, fontSize: 15.5, display: 'block', color: C2.char }}>{t.label}</span>
            </Card>
          ))}
        </div>
      </section>

      {/* Toilets + beach access (F3) */}
      <AccessLayersLinks app={app}/>

      {/* Nearby — what works, or where a first review helps most */}
      {nearbyList.length > 0 && (
        <section aria-labelledby="nearby-h" style={{ ...pad, paddingBottom: SPACE.xl }}>
          <SectionHeader id="nearby-h" size="sm"
            title={worksNear.length ? 'Works for you, nearby' : 'Nearby, waiting for a first review'}
            description={worksNear.length ? `Confirmed by people in the pilot · walking from ${app.origin.name}` : 'Been to one of these? Your review is the first data point.'}/>
          <Card padding={0}>
            <List label={worksNear.length ? 'Places that work for you nearby' : 'Nearby places without reviews'}>
              {nearbyList.map(v => (
                <PlaceRow key={v.id} app={app} place={v} reasons={worksNear.length ? 1 : 0} padX={SPACE.md}
                  subtitle={`${v.kind} · ${v.mins} min walk`}/>
              ))}
            </List>
          </Card>
        </section>
      )}
    </V2Shell>
  );
}

export { V2Home };
