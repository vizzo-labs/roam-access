'use client';

import React from 'react';
import { V2BigBtn, V2RoundBtn } from '../ui/Buttons';
import { V2Shell } from '../ui/Shell';
import { C2, F2, M2, V2_H1 } from '../ui/palette';
import { useV2Heading } from '../ui/useHeading';
import { ExtLink, ListedNote, ToiletAttribution } from '../layers/bits';
import { MattingQuestion, ReportButton, TempReportBanner } from '../layers/TempReports';
import { NearestToilet } from '../layers/VenueAccessExtras';
import { distanceLabel, hoursLabel } from '../layers/layerUtils';

// ─────────────────────────────────────────────────────────────
// FACILITY — one toilet or beach access item. Listings, not verdicts.
// ─────────────────────────────────────────────────────────────
const KIND_LABEL = { toilet: 'Public toilet', beach: 'Beach access', liberty_swing: 'Liberty Swing', ferry: 'Ferry wharf', walk: 'Accessible walk' };

function toiletFacts(d) {
  const f = [];
  const add = (ok, t) => f.push({ ok, t });
  add(!!d.accessible, d.accessible ? 'Accessible toilet' : d.ambulant ? 'Ambulant toilet only — not listed as wheelchair accessible' : 'Not listed as accessible');
  if (d.lhTransfer || d.rhTransfer) add(true, [d.lhTransfer && 'left-hand', d.rhTransfer && 'right-hand'].filter(Boolean).join(' and ').replace(/^./, c => c.toUpperCase()) + ' transfer');
  if (d.changingPlaces) add(true, 'Changing Places certified (hoist, adult change table)');
  else if (d.adultChange) add(true, 'Adult change room');
  if (d.adultChange && d.byoSling) add(null, 'Bring your own hoist sling');
  if (d.acShower || d.shower) add(true, d.acShower ? 'Shower in the adult change room' : 'Shower');
  if (d.mlak24) add(null, 'Opens with an MLAK key, 24 hours');
  else if (d.mlakAfterHours) add(null, 'MLAK key needed after hours');
  else if (d.keyRequired) add(null, 'Key needed — ask nearby');
  if (d.parkingAccessible) add(true, 'Accessible parking');
  if (d.babyChange) add(true, 'Baby change');
  if (d.paymentRequired) add(null, 'Payment needed');
  return f;
}

function Fact({ ok, children }) {
  const sym = ok === true ? '✓' : ok === false ? '✗' : 'i';
  const bg = ok === true ? C2.teal : ok === false ? C2.red : '#475569';
  return (
    <li style={{ display: 'flex', gap: 12, padding: '12px 18px', alignItems: 'flex-start', borderTop: `1px solid ${C2.hair}` }}>
      <span aria-hidden="true" style={{
        width: 22, height: 22, borderRadius: 999, background: bg, color: C2.paper, flexShrink: 0,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, fontFamily: M2,
      }}>{sym}</span>
      <span style={{ fontSize: 16, lineHeight: 1.45, fontFamily: F2, color: C2.char }}>
        {ok === false && <span className="ra-sr-only">No: </span>}{children}
      </span>
    </li>
  );
}

function Box({ title, children }) {
  return (
    <section style={{ borderRadius: 18, border: `1.5px solid ${C2.line}`, overflow: 'hidden', marginBottom: 12 }}>
      <h2 style={{ padding: '16px 18px 6px', fontSize: 14, fontWeight: 700, color: C2.teal, margin: 0, fontFamily: F2, letterSpacing: '0.02em' }}>{title}</h2>
      {children}
    </section>
  );
}

function V2Facility({ app }) {
  const L = app.layers;
  const f = L.facilityById(app.selectedId);
  const h = useV2Heading('facility-' + app.selectedId + (f ? '' : '-loading'));
  const listView = f?.layer === 'toilets' ? 'toilets' : 'beach';
  const back = () => {
    if (window.RA2_NAVIGATED && window.history.length > 1) window.history.back();
    else app.goto(listView);
  };

  if (!f) {
    return (
      <V2Shell tabs app={app} active="home">
        <div style={{ padding: '10px 22px 0' }}>
          <V2RoundBtn onClick={() => app.goto('home')} ariaLabel="Back to home">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
              <path d="M15 5l-7 7 7 7" stroke={C2.char} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </V2RoundBtn>
        </div>
        <div style={{ padding: '18px 22px' }}>
          <h1 ref={h} tabIndex={-1} style={{ ...V2_H1, fontSize: 26 }}>
            {L.loaded ? 'This place isn’t on the map any more.' : 'Loading…'}
          </h1>
        </div>
      </V2Shell>
    );
  }

  const d = f.details || {};
  const isToilet = f.kind === 'toilet';
  const reports = L.reportsFor('facility', f.id);
  const hrs = isToilet ? hoursLabel(d) : null;
  const notes = isToilet ? [d.openingHoursNote, d.accessNote, d.toiletNote, d.adultChangeNote].filter(Boolean) : [];

  const bar = (
    <div style={{
      padding: '14px 22px calc(var(--ra-tabs-pad) + 8px)', background: C2.paper,
      borderTop: `1px solid ${C2.hair}`, display: 'flex', gap: 10, flexShrink: 0,
    }}>
      <V2BigBtn kind="primary" style={{ flex: 1.5 }} ariaLabel={`Directions to ${f.name} (opens Google Maps)`}
        onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${f.lat},${f.lng}`, '_blank', 'noopener')}>
        Directions
      </V2BigBtn>
      {f.bookingUrl ? (
        <V2BigBtn kind="outline" style={{ flex: 1 }} ariaLabel={`Book at ${f.name} (opens in a new tab)`}
          onClick={() => window.open(f.bookingUrl, '_blank', 'noopener')}>Book</V2BigBtn>
      ) : f.bookingPhone ? (
        <V2BigBtn kind="outline" style={{ flex: 1 }} ariaLabel={`Call ${f.bookingPhone}`}
          onClick={() => window.location.assign('tel:' + f.bookingPhone.replace(/[^+\d]/g, ''))}>Call</V2BigBtn>
      ) : null}
    </div>
  );

  return (
    <V2Shell bar={bar}>
      <div style={{ padding: '10px 22px 0' }}>
        <V2RoundBtn onClick={back} ariaLabel="Back">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
            <path d="M15 5l-7 7 7 7" stroke={C2.char} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </V2RoundBtn>
      </div>
      <div style={{ padding: '16px 22px 24px', fontFamily: F2 }}>
        <h1 ref={h} tabIndex={-1} style={{ ...V2_H1, fontSize: 28, lineHeight: 1.1, marginBottom: 4 }}>
          {f.name}<span style={{ color: C2.rust }}>.</span>
        </h1>
        <p style={{ fontSize: 15, color: C2.slate, margin: '0 0 14px' }}>
          {KIND_LABEL[f.kind] || 'Access info'} · {f.address ? `${f.address}, ` : ''}{f.suburb || ''} · {distanceLabel(app.origin, f)}
        </p>

        <TempReportBanner app={app} reports={reports} placeName={f.name}/>

        <ListedNote>
          Listed by {f.source} — not yet confirmed by the community.{isToilet ? ' Check opening hours before you go.' : ''}
        </ListedNote>

        {isToilet ? (
          <Box title="WHAT’S LISTED">
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {toiletFacts(d).map(x => <Fact key={x.t} ok={x.ok}>{x.t}</Fact>)}
              <Fact ok={null}>Opening hours: {hrs || 'not listed'}</Fact>
            </ul>
          </Box>
        ) : (
          <>
            {f.description && <p style={{ fontSize: 16.5, lineHeight: 1.5, margin: '0 0 12px', color: C2.char }}>{f.description}</p>}
            {d.features?.length > 0 && (
              <Box title="WHAT’S LISTED HERE">
                <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                  {d.features.map(t => <Fact key={t} ok={true}>{t}</Fact>)}
                </ul>
              </Box>
            )}
            {d.bookings?.length > 0 && (
              <Box title="BOOKING">
                <ul style={{ listStyle: 'none', margin: 0, padding: '4px 18px 14px' }}>
                  {d.bookings.map(b => (
                    <li key={b.label} style={{ fontSize: 16, lineHeight: 1.5, padding: '6px 0' }}>
                      {b.url ? <ExtLink href={b.url}>{b.label}</ExtLink> : b.label}
                      {b.phone && <> — <a href={`tel:${b.phone.replace(/[^+\d]/g, '')}`} style={{ color: C2.teal, fontWeight: 600 }}>{b.phone}</a></>}
                    </li>
                  ))}
                </ul>
              </Box>
            )}
          </>
        )}

        {notes.length > 0 && (
          <Box title="NOTES FROM THE TOILET MAP">
            {notes.map(n => <p key={n} style={{ fontSize: 15.5, lineHeight: 1.5, margin: 0, padding: '10px 18px', borderTop: `1px solid ${C2.hair}`, whiteSpace: 'pre-line' }}>{n}</p>)}
          </Box>
        )}

        {d.mattingQuestion && (
          <div style={{ background: C2.stone, borderRadius: 18, padding: '6px 18px 18px', marginBottom: 12 }}>
            <MattingQuestion app={app} facility={f}/>
          </div>
        )}

        {!isToilet && <NearestToilet app={app} venue={f}/>}

        <ReportButton app={app} target={{ type: 'facility', id: f.id, where: f.layer, name: f.name }}/>

        {isToilet ? <ToiletAttribution facilityUrl={f.sourceUrl}/> : (
          <div style={{ fontSize: 13.5, color: C2.slate, lineHeight: 1.55, margin: '18px 0 0' }}>
            <p style={{ margin: '0 0 4px' }}>Sources:</p>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {(d.sources?.length ? d.sources : f.sourceUrl ? [{ label: f.source, url: f.sourceUrl }] : []).map(s => (
                <li key={s.url} style={{ padding: '4px 0' }}><ExtLink href={s.url}>{s.label}</ExtLink></li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </V2Shell>
  );
}

export { V2Facility };
