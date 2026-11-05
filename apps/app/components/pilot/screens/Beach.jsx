'use client';

import React from 'react';
import { MLAK_URL, CHANGING_PLACES_FINDER } from '@/lib/layers/defs';
import { V2Back } from '../ui/Buttons';
import { V2Shell } from '../ui/Shell';
import { C2, F2, V2_H1 } from '../ui/palette';
import { useV2Heading } from '../ui/useHeading';
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
  const meta = f => `${f.suburb || ''}${f.suburb ? ' · ' : ''}${distanceLabel(app.origin, f)}`;

  return (
    <V2Shell tabs app={app} active="home">
      <div style={{ padding: '10px 22px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <V2Back app={app} to="home" label="Back to home"/>
        {!app.wide && (
          <button type="button" onClick={() => { L.setShown('beach', true); app.goto('map'); }} style={{
            minHeight: 48, padding: '0 16px', borderRadius: 999, border: `1.5px solid ${C2.line}`, background: C2.paper,
            fontFamily: F2, fontSize: 15, fontWeight: 700, color: C2.char, cursor: 'pointer',
          }}>Show on map</button>
        )}
      </div>
      <div style={{ padding: '18px 22px 24px', fontFamily: F2 }}>
        <h1 ref={h} tabIndex={-1} style={{ ...V2_H1, fontSize: 28, marginBottom: 6 }}>
          Beach access<span style={{ color: C2.rust }}>.</span>
        </h1>
        <p style={{ fontSize: 15.5, color: C2.slate, margin: '0 0 14px', lineHeight: 1.45 }}>
          Free beach wheelchairs, Liberty Swings and what to know before you go — Manly and the Northern Beaches.
        </p>
        <ListedNote>
          From Northern Beaches Council, NSW National Parks and Transport for NSW — not yet confirmed by the community.
          Today’s reports come from people in the pilot.
        </ListedNote>
        {!L.loaded && <p role="status" style={{ color: C2.slate }}>Loading beach access…</p>}
        {L.failed && <p role="status" style={{ color: C2.slate }}>Couldn’t load beach access — check your connection.</p>}

        {today.length > 0 && (
          <>
            <SectionHead sub="Reported by people in the pilot. Reports disappear by themselves.">Today at the beach</SectionHead>
            {today.map(({ r, f }) => (
              <div key={r.id}>
                <p style={{ margin: '0 0 6px', fontSize: 14.5, fontWeight: 700 }}>{f.name}</p>
                <TempReportBanner app={app} reports={[r]} placeName={f.name}/>
              </div>
            ))}
          </>
        )}

        {beaches.length > 0 && (
          <>
            <SectionHead sub="Free for people with disability aged 5 and over, hired by a support person. Book ahead.">
              Free beach wheelchairs
            </SectionHead>
            {beaches.map(f => (
              <div key={f.id} style={{ marginBottom: 14 }}>
                <FacilityRow app={app} f={f} meta={meta(f)} alert={alertFor(f)}
                  tags={(f.details?.features || []).slice(1, 4).map(s => s.split(' — ')[0])}/>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '-2px 0 0' }}>
                  {f.bookingUrl && (
                    <a href={f.bookingUrl} target="_blank" rel="noopener noreferrer" style={linkBtn(true)}>
                      Book the wheelchair<span className="ra-sr-only"> at {f.name} (opens in a new tab)</span>
                    </a>
                  )}
                  {f.bookingPhone && (
                    <a href={`tel:${f.bookingPhone.replace(/[^+\d]/g, '')}`} style={linkBtn(false)}>
                      Call {f.bookingPhone}<span className="ra-sr-only"> to book at {f.name}</span>
                    </a>
                  )}
                </div>
                {f.details?.mattingQuestion && <MattingQuestion app={app} facility={f}/>}
              </div>
            ))}
          </>
        )}

        {swings.length > 0 && (
          <>
            <SectionHead sub="Swings for wheelchair users at inclusive playgrounds. They unlock with an MLAK key.">Liberty Swings</SectionHead>
            {swings.map(f => <FacilityRow key={f.id} app={app} f={f} meta={meta(f)} alert={alertFor(f)}/>)}
          </>
        )}

        <SectionHead>MLAK keys</SectionHead>
        <p style={{ fontSize: 15.5, lineHeight: 1.5, margin: '0 0 6px' }}>
          An MLAK key opens accessible toilets and Liberty Swings around Australia. At Manly, lifeguards can lend you one
          (<ExtLink href="https://hellomanly.com.au/?p=32200">Hello Manly</ExtLink>). To get your own:{' '}
          <ExtLink href={MLAK_URL}>Master Locksmiths Access Key</ExtLink>.
        </p>

        {getting.length > 0 && (
          <>
            <SectionHead>Getting there and around</SectionHead>
            {getting.map(f => (
              <FacilityRow key={f.id} app={app} f={f} meta={`${meta(f)} · ${f.description || ''}`} alert={alertFor(f)}/>
            ))}
          </>
        )}

        {nearToilets.length > 0 && (
          <>
            <SectionHead sub={`Nearest to ${manly.name}. Listed on the National Public Toilet Map.`}>Accessible toilets and showers</SectionHead>
            {nearToilets.map(({ f }) => (
              <FacilityRow key={f.id} app={app} f={f} meta={`${f.suburb || ''} · ${distanceLabel(manly, f).replace('walk', 'walk from the beach')}`}
                tags={toiletTags(f.details || {})} alert={alertFor(f)}/>
            ))}
            <button type="button" onClick={() => app.goto('toilets')} style={{
              minHeight: 48, padding: '0 4px', border: 0, background: 'transparent', color: C2.teal, cursor: 'pointer',
              fontFamily: F2, fontSize: 15.5, fontWeight: 700, textDecoration: 'underline', textUnderlineOffset: 3,
            }}>See all accessible toilets</button>
          </>
        )}

        <SectionHead>Changing Places</SectionHead>
        <p style={{ fontSize: 15.5, lineHeight: 1.5, margin: 0 }}>
          There’s no Changing Places toilet in Manly yet. Collaroy Surf Life Saving Club has an adult lift-and-change room.
          The nearest certified ones are on the <button type="button" onClick={() => app.goto('toilets')} style={inlineBtn}>toilets list</button> —
          or use the <ExtLink href={CHANGING_PLACES_FINDER}>Changing Places finder</ExtLink>.
        </p>
      </div>
    </V2Shell>
  );
}

const linkBtn = primary => ({
  display: 'inline-flex', alignItems: 'center', minHeight: 44, padding: '0 16px', borderRadius: 999,
  fontFamily: F2, fontSize: 15, fontWeight: 700, textDecoration: 'none', boxSizing: 'border-box',
  background: primary ? C2.teal : C2.paper, color: primary ? C2.paper : C2.teal, border: `2px solid ${C2.teal}`,
});
const inlineBtn = {
  border: 0, background: 'transparent', padding: '10px 0', margin: '-10px 0', color: C2.teal, cursor: 'pointer',
  fontFamily: F2, fontSize: 'inherit', fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: 3,
};

export { V2Beach };
