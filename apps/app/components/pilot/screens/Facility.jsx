'use client';

import React from 'react';
import { V2Shell } from '../ui/Shell';
import { C2, M2 } from '../ui/palette';
import { useV2Heading } from '../ui/useHeading';
import { ActionRow, Card, GUTTER, IconButton, List, ListRow, SectionHeader, SPACE, TYPE } from '../ds';
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
  add(null, `Opening hours: ${hoursLabel(d) || 'not listed'}`);
  return f;
}

function Mark({ ok }) {
  const sym = ok === true ? '✓' : ok === false ? '✗' : 'i';
  const bg = ok === true ? C2.teal : ok === false ? C2.red : '#475569';
  return (
    <span aria-hidden="true" style={{
      width: 22, height: 22, borderRadius: 999, background: bg, color: C2.paper, flexShrink: 0,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, fontFamily: M2,
    }}>{sym}</span>
  );
}

function Facts({ title, items }) {
  return (
    <Card padding={0} style={{ marginBottom: SPACE.sm }}>
      <SectionHeader size="sm" title={title} style={{ padding: `${SPACE.md}px ${SPACE.md}px 0`, marginBottom: 4 }}/>
      <List label={title}>
        {items.map(x => (
          <ListRow key={x.t} dense padX={SPACE.md} leading={<Mark ok={x.ok}/>}
            title={<span style={{ fontWeight: 500 }}>{x.ok === false && <span className="ra-sr-only">No: </span>}{x.t}</span>}/>
        ))}
      </List>
    </Card>
  );
}

function V2Facility({ app }) {
  const L = app.layers;
  const f = L.facilityById(app.selectedId);
  const h = useV2Heading('facility-' + app.selectedId + (f ? '' : '-loading'));
  const back = () => {
    if (window.RA2_NAVIGATED && window.history.length > 1) window.history.back();
    else app.goto(f?.layer === 'toilets' ? 'toilets' : f ? 'beach' : 'home');
  };
  const top = (
    <div style={{ padding: `10px ${GUTTER}px 0` }}>
      <IconButton icon="back" label="Back" onClick={back}/>
    </div>
  );

  if (!f) {
    return (
      <V2Shell tabs app={app} active="home">
        {top}
        <div style={{ padding: `18px ${GUTTER}px` }}>
          <h1 ref={h} tabIndex={-1} style={{ ...TYPE.title2, margin: 0 }}>
            {L.loaded ? 'This place isn’t on the map any more.' : 'Loading…'}
          </h1>
        </div>
      </V2Shell>
    );
  }

  const d = f.details || {};
  const isToilet = f.kind === 'toilet';
  const notes = isToilet ? [d.openingHoursNote, d.accessNote, d.toiletNote, d.adultChangeNote].filter(Boolean) : [];
  const tel = f.bookingPhone ? 'tel:' + f.bookingPhone.replace(/[^+\d]/g, '') : null;
  const actions = [
    { id: 'dir', label: 'Directions', icon: 'directions', primary: true, external: true,
      href: `https://www.google.com/maps/dir/?api=1&destination=${f.lat},${f.lng}`,
      ariaLabel: `Directions to ${f.name} (opens Google Maps)` },
    f.bookingUrl && { id: 'book', label: 'Book', icon: 'external', href: f.bookingUrl, external: true, ariaLabel: `Book at ${f.name} (opens in a new tab)` },
    tel && { id: 'call', label: 'Call', icon: 'phone', href: tel, ariaLabel: `Call ${f.bookingPhone}` },
  ];

  return (
    <V2Shell tabs app={app} active="home">
      {top}
      <div style={{ padding: `16px ${GUTTER}px 24px` }}>
        <h1 ref={h} tabIndex={-1} style={{ ...TYPE.title1, margin: '0 0 4px' }}>
          {f.name}<span style={{ color: C2.rust }}>.</span>
        </h1>
        <p style={{ ...TYPE.footnote, fontSize: 15, color: C2.slate, margin: `0 0 ${SPACE.md}px` }}>
          {KIND_LABEL[f.kind] || 'Access info'} · {f.address ? `${f.address}, ` : ''}{f.suburb || ''} · {distanceLabel(app.origin, f)}
        </p>

        <TempReportBanner app={app} reports={L.reportsFor('facility', f.id)} placeName={f.name}/>
        <ActionRow label={`Actions for ${f.name}`} actions={actions} style={{ marginBottom: SPACE.md }}/>

        <ListedNote>
          Listed by {f.source} — not yet confirmed by the community.{isToilet ? ' Check opening hours before you go.' : ''}
        </ListedNote>

        {isToilet ? <Facts title="What’s listed" items={toiletFacts(d)}/> : (
          <>
            {f.description && <p style={{ ...TYPE.body, fontSize: 16.5, margin: `0 0 ${SPACE.sm}px` }}>{f.description}</p>}
            {d.features?.length > 0 && <Facts title="What’s listed here" items={d.features.map(t => ({ ok: true, t }))}/>}
            {d.bookings?.length > 0 && (
              <Card style={{ marginBottom: SPACE.sm }}>
                <SectionHeader size="sm" title="Booking"/>
                <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                  {d.bookings.map(b => (
                    <li key={b.label} style={{ ...TYPE.body, padding: '6px 0' }}>
                      {b.url ? <ExtLink href={b.url}>{b.label}</ExtLink> : b.label}
                      {b.phone && <> — <a href={`tel:${b.phone.replace(/[^+\d]/g, '')}`} style={{ color: C2.teal, fontWeight: 600 }}>{b.phone}</a></>}
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </>
        )}

        {notes.length > 0 && (
          <Card style={{ marginBottom: SPACE.sm }}>
            <SectionHeader size="sm" title="Notes from the Toilet Map"/>
            {notes.map(n => <p key={n} style={{ ...TYPE.callout, margin: '0 0 8px', whiteSpace: 'pre-line' }}>{n}</p>)}
          </Card>
        )}

        {d.mattingQuestion && (
          <Card variant="filled" style={{ marginBottom: SPACE.sm }}>
            <MattingQuestion app={app} facility={f}/>
          </Card>
        )}

        {!isToilet && <NearestToilet app={app} venue={f}/>}

        <ReportButton app={app} target={{ type: 'facility', id: f.id, where: f.layer, name: f.name }}/>

        {isToilet ? <ToiletAttribution facilityUrl={f.sourceUrl}/> : (
          <div style={{ ...TYPE.footnote, color: C2.slate, lineHeight: 1.55, margin: `${SPACE.lg}px 0 0` }}>
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
