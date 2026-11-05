'use client';

import React from 'react';
import { MLAK_URL, CHANGING_PLACES_FINDER } from '@/lib/layers/defs';
import { V2Back } from '../ui/Buttons';
import { V2Shell } from '../ui/Shell';
import { C2 } from '../ui/palette';
import { useV2Heading } from '../ui/useHeading';
import { Button, Card, GUTTER, List, SkeletonList, SPACE, TYPE } from '../ds';
import { ExtLink, FacilityRow, ListedNote, SectionHead } from '../layers/bits';
import { MattingQuestion, TempReportBanner } from '../layers/TempReports';
import { distanceLabel, metres, reportType, toiletTags } from '../layers/layerUtils';

// ─────────────────────────────────────────────────────────────
// BEACH ACCESS — free beach wheelchairs, Liberty Swings, MLAK,
// the ferry ramp at low tide, and today's community reports
// ─────────────────────────────────────────────────────────────
function V2Beach({ app }) {
  const h = useV2Heading('beach');
  const L = app.layers;
  const items = L.facilities.filter(f => f.layer === 'beach');
  const of = kind => items.filter(f => f.kind === kind);
  const beaches = of('beach');
  const swings = of('liberty_swing').sort((a, b) => metres(app.origin, a) - metres(app.origin, b));
  const getting = [...of('ferry'), ...of('walk')];
  const today = items.flatMap(f => L.reportsFor('facility', f.id).map(r => ({ r, f })));
  const manly = beaches.find(b => b.id === 'beach-manly') || beaches[0];
  const nearToilets = manly ? L.facilities
    .filter(f => f.kind === 'toilet' && (f.details?.accessible || f.details?.adultChange))
    .map(f => ({ f, m: metres(manly, f) })).sort((a, b) => a.m - b.m).slice(0, 3) : [];

  const alertFor = f => {
    const r = L.reportsFor('facility', f.id).find(x => !reportType(x.type)?.positive);
    return r ? reportType(r.type)?.banner : null;
  };
  const where = f => `${f.suburb ? `${f.suburb} · ` : ''}${distanceLabel(app.origin, f)}`;
  const body = { ...TYPE.body, margin: 0 };

  return (
    <V2Shell tabs app={app} active="home">
      <div style={{ padding: `10px ${GUTTER}px 0`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <V2Back app={app} to="home" label="Back to home"/>
        {!app.wide && (
          <Button variant="ghost" size="sm" icon="map" onClick={() => { L.setShown('beach', true); app.goto('map'); }}>Show on map</Button>
        )}
      </div>
      <div style={{ padding: `18px ${GUTTER}px 24px` }}>
        <h1 ref={h} tabIndex={-1} style={{ ...TYPE.title1, margin: '0 0 6px' }}>
          Beach access<span style={{ color: C2.rust }}>.</span>
        </h1>
        <p style={{ ...TYPE.callout, color: C2.slate, margin: `0 0 ${SPACE.md}px` }}>
          Free beach wheelchairs, Liberty Swings and what to know before you go — Manly and the Northern Beaches.
        </p>
        <ListedNote>
          From Northern Beaches Council, NSW National Parks and Transport for NSW — not yet confirmed by the community.
          Today’s reports come from people in the pilot.
        </ListedNote>
        {!L.loaded && <SkeletonList label="Loading beach access…" count={3} padX={0}/>}
        {L.failed && <p role="status" style={{ ...TYPE.callout, color: C2.slate }}>Couldn’t load beach access — check your connection.</p>}

        {today.length > 0 && (
          <section aria-labelledby="beach-today-h">
            <SectionHead id="beach-today-h" sub="Reported by people in the pilot. Reports disappear by themselves.">Today at the beach</SectionHead>
            {today.map(({ r, f }) => (
              <div key={r.id}>
                <p style={{ ...TYPE.headline, fontSize: 15, margin: `0 0 ${SPACE.xs}px` }}>{f.name}</p>
                <TempReportBanner app={app} reports={[r]} placeName={f.name}/>
              </div>
            ))}
          </section>
        )}

        {beaches.length > 0 && (
          <section aria-labelledby="beach-chairs-h">
            <SectionHead id="beach-chairs-h" sub="Free for people with disability aged 5 and over, hired by a support person. Book ahead.">
              Free beach wheelchairs
            </SectionHead>
            {beaches.map(f => (
              <Card key={f.id} padding={0} style={{ marginBottom: SPACE.sm }}>
                <List label={f.name}>
                  <FacilityRow app={app} f={f} subtitle={where(f)} alert={alertFor(f)}
                    tags={(f.details?.features || []).slice(1, 4).map(s => s.split(' — ')[0])}/>
                </List>
                <div style={{ padding: `0 ${SPACE.md}px ${SPACE.md}px` }}>
                  <div style={{ display: 'flex', gap: SPACE.xs, flexWrap: 'wrap' }}>
                    {f.bookingUrl && (
                      <Button size="sm" icon="external" href={f.bookingUrl} external aria-label={`Book the beach wheelchair at ${f.name} (opens in a new tab)`}>
                        Book the wheelchair
                      </Button>
                    )}
                    {f.bookingPhone && (
                      <Button size="sm" variant="outline" icon="phone" href={`tel:${f.bookingPhone.replace(/[^+\d]/g, '')}`} aria-label={`Call ${f.bookingPhone} to book at ${f.name}`}>
                        Call {f.bookingPhone}
                      </Button>
                    )}
                  </div>
                  {f.details?.mattingQuestion && <MattingQuestion app={app} facility={f}/>}
                </div>
              </Card>
            ))}
          </section>
        )}

        {swings.length > 0 && (
          <section aria-labelledby="beach-swings-h">
            <SectionHead id="beach-swings-h" sub="Swings for wheelchair users at inclusive playgrounds. They unlock with an MLAK key.">Liberty Swings</SectionHead>
            <List label="Liberty Swings" inset>
              {swings.map(f => <FacilityRow key={f.id} app={app} f={f} subtitle={where(f)} alert={alertFor(f)}/>)}
            </List>
          </section>
        )}

        <section aria-labelledby="beach-mlak-h">
          <SectionHead id="beach-mlak-h">MLAK keys</SectionHead>
          <p style={body}>
            An MLAK key opens accessible toilets and Liberty Swings around Australia. At Manly, lifeguards can lend you one
            (<ExtLink href="https://hellomanly.com.au/?p=32200">Hello Manly</ExtLink>). To get your own:{' '}
            <ExtLink href={MLAK_URL}>Master Locksmiths Access Key</ExtLink>.
          </p>
        </section>

        {getting.length > 0 && (
          <section aria-labelledby="beach-getting-h">
            <SectionHead id="beach-getting-h">Getting there and around</SectionHead>
            <List label="Getting there and around" inset>
              {getting.map(f => (
                <FacilityRow key={f.id} app={app} f={f} subtitle={`${where(f)} · ${f.description || ''}`} alert={alertFor(f)}/>
              ))}
            </List>
          </section>
        )}

        {nearToilets.length > 0 && (
          <section aria-labelledby="beach-toilets-h">
            <SectionHead id="beach-toilets-h" sub={`Nearest to ${manly.name}. Listed on the National Public Toilet Map.`}>Accessible toilets and showers</SectionHead>
            <List label="Accessible toilets near the beach" inset>
              {nearToilets.map(({ f }) => (
                <FacilityRow key={f.id} app={app} f={f}
                  subtitle={`${f.suburb ? `${f.suburb} · ` : ''}${distanceLabel(manly, f)} from the beach`}
                  tags={toiletTags(f.details || {})} alert={alertFor(f)}/>
              ))}
            </List>
            <Button variant="plain" size="sm" onClick={() => app.goto('toilets')} style={{ paddingLeft: 0, marginTop: SPACE.xs }}>
              See all accessible toilets
            </Button>
          </section>
        )}

        <section aria-labelledby="beach-cp-h">
          <SectionHead id="beach-cp-h">Changing Places</SectionHead>
          <p style={body}>
            There’s no Changing Places toilet in Manly yet. Collaroy Surf Life Saving Club has an adult lift-and-change room.
            The nearest certified ones are in the toilets list — or use the{' '}
            <ExtLink href={CHANGING_PLACES_FINDER}>Changing Places finder</ExtLink>.
          </p>
        </section>
      </div>
    </V2Shell>
  );
}

export { V2Beach };
