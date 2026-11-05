'use client';

import React from 'react';
import { V2Shell } from '../ui/Shell';
import { C2, M2 } from '../ui/palette';
import { useV2Heading } from '../ui/useHeading';
import { ActionRow, Card, GUTTER, IconButton, List, ListRow, SectionHeader, SPACE, TYPE } from '../ds';
import { ExtLink, ListedNote, ToiletAttribution } from '../layers/bits';
import { MattingQuestion, ReportButton, TempReportBanner } from '../layers/TempReports';
import { NearestToilet } from '../layers/VenueAccessExtras';
import { distanceLabel, facilityKindLabel, hoursLabel } from '../layers/layerUtils';
import { useT } from '../i18n';

// ─────────────────────────────────────────────────────────────
// FACILITY — one toilet or beach access item. Listings, not verdicts.
// ─────────────────────────────────────────────────────────────
// Listed toilet details as translated lines: { ok: true|false|null, t }.
function toiletFacts(d, t) {
  const f = [];
  const add = (ok, key, params) => f.push({ ok, t: t(key, params) });
  add(!!d.accessible, d.accessible ? 'layers.fact.accessible' : d.ambulant ? 'layers.fact.ambulantOnly' : 'layers.fact.notAccessible');
  if (d.lhTransfer || d.rhTransfer) add(true, d.lhTransfer && d.rhTransfer ? 'layers.fact.transferBoth' : d.lhTransfer ? 'layers.fact.transferLeft' : 'layers.fact.transferRight');
  if (d.changingPlaces) add(true, 'layers.fact.changingPlaces');
  else if (d.adultChange) add(true, 'layers.fact.adultChange');
  if (d.adultChange && d.byoSling) add(null, 'layers.fact.byoSling');
  if (d.acShower || d.shower) add(true, d.acShower ? 'layers.fact.acShower' : 'layers.fact.shower');
  if (d.mlak24) add(null, 'layers.fact.mlak24');
  else if (d.mlakAfterHours) add(null, 'layers.fact.mlakAfterHours');
  else if (d.keyRequired) add(null, 'layers.fact.keyRequired');
  if (d.parkingAccessible) add(true, 'layers.fact.parking');
  if (d.babyChange) add(true, 'layers.fact.babyChange');
  if (d.paymentRequired) add(null, 'layers.fact.payment');
  // Opening hours are the Toilet Map's own words (English).
  add(null, 'layers.fact.hours', { hours: hoursLabel(d) || t('layers.fact.hoursNotListed') });
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

function Facts({ title, items, lang }) {
  const t = useT();
  return (
    <Card padding={0} style={{ marginBottom: SPACE.sm }}>
      <SectionHeader size="sm" title={title} style={{ padding: `${SPACE.md}px ${SPACE.md}px 0`, marginBottom: 4 }}/>
      <List label={title}>
        {items.map(x => (
          <ListRow key={x.t} dense padX={SPACE.md} leading={<Mark ok={x.ok}/>}
            title={<span style={{ fontWeight: 500 }}>{x.ok === false && <span className="ra-sr-only">{t('layers.fact.no')}</span>}<span lang={lang}>{x.t}</span></span>}/>
        ))}
      </List>
    </Card>
  );
}

function V2Facility({ app }) {
  const t = useT();
  const L = app.layers;
  const f = L.facilityById(app.selectedId);
  const h = useV2Heading('facility-' + app.selectedId + (f ? '' : '-loading'));
  const back = () => {
    if (window.RA2_NAVIGATED && window.history.length > 1) window.history.back();
    else app.goto(f?.layer === 'toilets' ? 'toilets' : f ? 'beach' : 'home');
  };
  const top = (
    <div style={{ padding: `10px ${GUTTER}px 0` }}>
      <IconButton icon="back" label={t('common.back')} onClick={back}/>
    </div>
  );

  if (!f) {
    return (
      <V2Shell tabs app={app} active="home">
        {top}
        <div style={{ padding: `18px ${GUTTER}px` }}>
          <h1 ref={h} tabIndex={-1} style={{ ...TYPE.title2, margin: 0 }}>
            {L.loaded ? t('layers.facility.gone') : t('common.loading')}
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
    { id: 'dir', label: t('layers.facility.directions'), icon: 'directions', primary: true, external: true,
      href: `https://www.google.com/maps/dir/?api=1&destination=${f.lat},${f.lng}`,
      ariaLabel: t('layers.facility.directionsLabel', { name: f.name }) },
    f.bookingUrl && { id: 'book', label: t('layers.facility.book'), icon: 'external', href: f.bookingUrl, external: true, ariaLabel: t('layers.facility.bookLabel', { name: f.name }) },
    tel && { id: 'call', label: t('layers.facility.call'), icon: 'phone', href: tel, ariaLabel: t('layers.facility.callLabel', { phone: f.bookingPhone }) },
  ];

  return (
    <V2Shell tabs app={app} active="home">
      {top}
      <div style={{ padding: `16px ${GUTTER}px 24px` }}>
        <h1 ref={h} tabIndex={-1} style={{ ...TYPE.title1, margin: '0 0 4px' }}>
          {f.name}<span aria-hidden="true" style={{ color: C2.rust }}>.</span>
        </h1>
        <p style={{ ...TYPE.footnote, fontSize: 15, color: C2.slate, margin: `0 0 ${SPACE.md}px` }}>
          {facilityKindLabel(t, f.kind)} · {f.address ? `${f.address}, ` : ''}{f.suburb || ''} · {distanceLabel(app.origin, f, t)}
        </p>

        <TempReportBanner app={app} reports={L.reportsFor('facility', f.id)} placeName={f.name}/>
        <ActionRow label={t('layers.facility.actions', { name: f.name })} actions={actions} style={{ marginBottom: SPACE.md }}/>

        <ListedNote>
          {t('layers.facility.listed', { source: f.source })}{isToilet ? ' ' + t('layers.facility.checkHours') : ''}
        </ListedNote>

        {isToilet ? <Facts title={t('layers.facility.whatsListed')} items={toiletFacts(d, t)}/> : (
          <>
            {/* Beach listings are the sources' words, in English. */}
            {f.description && <p lang="en-AU" style={{ ...TYPE.body, fontSize: 16.5, margin: `0 0 ${SPACE.sm}px` }}>{f.description}</p>}
            {d.features?.length > 0 && <Facts lang="en-AU" title={t('layers.facility.whatsListedHere')} items={d.features.map(x => ({ ok: true, t: x }))}/>}
            {d.bookings?.length > 0 && (
              <Card style={{ marginBottom: SPACE.sm }}>
                <SectionHeader size="sm" title={t('layers.facility.booking')}/>
                <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                  {d.bookings.map(b => (
                    <li key={b.label} style={{ ...TYPE.body, padding: '6px 0' }}>
                      {b.url ? <ExtLink href={b.url} lang="en-AU">{b.label}</ExtLink> : <span lang="en-AU">{b.label}</span>}
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
            <SectionHeader size="sm" title={t('layers.facility.notes')}/>
            {notes.map(n => <p key={n} lang="en-AU" style={{ ...TYPE.callout, margin: '0 0 8px', whiteSpace: 'pre-line' }}>{n}</p>)}
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
            <p style={{ margin: '0 0 4px' }}>{t('layers.facility.sources')}</p>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {(d.sources?.length ? d.sources : f.sourceUrl ? [{ label: f.source, url: f.sourceUrl }] : []).map(s => (
                <li key={s.url} style={{ padding: '4px 0' }}><ExtLink href={s.url} lang="en-AU">{s.label}</ExtLink></li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </V2Shell>
  );
}

export { V2Facility };
