'use client';
// Venue page · "Getting there" (I1). Gets people to the RIGHT door: the
// step-free entrance someone marked (mini-map with the street address and the
// entrance, the entrance photo and note, who marked it and when, "Still the
// way in?"), Directions to it in Apple or Google Maps, and — through
// ARRIVAL_SLOTS (./slots.js) — whatever later stages add (parking, stops,
// step-by-step arrival).
//
// Honesty: entrances never change the verdict. Community-marked entrances say
// when, and who by their access needs if that person allows it (never a name); OpenStreetMap ones are "unconfirmed"; a
// "Changed" answer stops directions going there until someone confirms it.

import React from 'react';
import { C2 } from '../ui/palette';
import {
  Banner, Button, Card, PhotoGrid, PhotoViewer, SectionHeader, SegmentedControl, SourceBadge, SPACE, TYPE,
} from '../ds';
import { UserText, useFormat, useT } from '../i18n';
import { localPhoto, whoText } from '../trust/text';
import { MiniMap } from './MiniMap';
import { pinWhere } from './EntranceMarker';
import { ARRIVAL_SLOTS } from './slots';
import { directionsFor, useMapsApp } from './directions';
import { entranceLast, rankEntrances, routable } from '@/lib/arrival/entrances';

function useVenueEntrances(app, venue) {
  const [list, setList] = React.useState(null);
  React.useEffect(() => {
    let live = true;
    fetch(`/api/venues/${encodeURIComponent(venue.id)}/entrances`)
      .then(r => (r.ok ? r.json() : { entrances: [] }))
      .then(d => { if (live) setList(d.entrances || []); }, () => { if (live) setList([]); });
    return () => { live = false; };
  }, [venue.id, app.reviewsVersion]);
  return [list, setList];
}

/** "Step-free entrance at the back" and where it is, in words. */
function entranceTitle(t, e) {
  return t(`arrival.kind.${e.kind}.title`);
}

// `bare`: the Getting there screen, whose h1 already says it — no h2 here.
function GettingThere({ app, venue, children, bare = false }) {
  const t = useT();
  const needs = app.user?.needs || [];
  const [mapsApp, setMapsApp] = useMapsApp();
  const [loaded, setLoaded] = useVenueEntrances(app, venue);
  // Until the full list arrives, the bootstrap's best entrance stands in.
  const entrances = loaded ?? (venue.entrance ? [venue.entrance] : []);
  const directions = directionsFor(t, venue, needs, mapsApp);
  const best = entrances[0] || null;
  const arrival = {
    entrances, entrance: directions.entrance, directions, needs,
    destination: directions.entrance ? { lat: directions.entrance.lat, lng: directions.entrance.lng } : { lat: venue.lat, lng: venue.lng },
  };
  const onMap = entrances.filter(e => e.lat != null);

  async function answer(e, value) {
    const res = await fetch(`/api/entrances/${encodeURIComponent(e.id)}/answer`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ answer: value }),
    });
    if (!res.ok) throw new Error(String(res.status));
    const d = await res.json();
    if (d.venue) app.updateVenue(d.venue);
    if (d.entrances) setLoaded(rankEntrances(d.entrances));
  }

  return (
    <section aria-labelledby={bare ? undefined : 'arrive-h'} style={{ marginBottom: SPACE.md }}>
      {!bare && (
        <SectionHeader id="arrive-h" title={t('arrival.title')} size="sm"
          description={best ? null : t('arrival.none.description')}/>
      )}

      <Card variant="outline" style={{ marginBottom: SPACE.sm }}>
        {best && (
          <>
            {onMap.length > 0 && (
              <MiniMap venue={venue} entrances={onMap} height={onMap.length > 1 ? 240 : 190} style={{ marginBottom: SPACE.sm }}
                label={[
                  onMap.length > 1
                    ? t('arrival.map.viewLabelMany', { name: venue.name, count: onMap.length })
                    : t('arrival.map.viewLabel', { name: venue.name }),
                  ...onMap.map(e => t('arrival.map.pinDesc', { door: entranceTitle(t, e), where: pinWhere(t, venue, e) })),
                ].join(' ')}/>
            )}
            {entrances.map((e, i) => (
              <EntranceDetails key={e.id} app={app} venue={venue} e={e} first={i === 0} onAnswer={answer} ready={!!loaded}/>
            ))}
          </>
        )}
        {!best && (
          <>
            <p style={{ ...TYPE.callout, margin: `0 0 ${SPACE.sm}px`, color: C2.char }}>{t('arrival.none.body')}</p>
            <Button variant="secondary" size="sm" icon="pin" onClick={() => app.goto('review', venue.id)}
              aria-label={t('arrival.none.markAria', { name: venue.name })}>
              {t('arrival.none.mark')}
            </Button>
          </>
        )}

        <div style={{ borderTop: `1px solid ${C2.hair}`, marginTop: SPACE.md, paddingTop: SPACE.md }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: SPACE.xs }}>
            {directions.entrance && (
              <Button icon="directions" href={directions.entranceHref} external aria-label={directions.entranceAria} style={{ flex: '2 1 220px', whiteSpace: 'normal' }}>
                {t('arrival.dir.toEntrance', { where: t(`arrival.kind.${directions.entrance.kind}.short`) })}
              </Button>
            )}
            <Button variant={directions.entrance ? 'outline' : 'primary'} icon="directions" href={directions.addressHref} external
              aria-label={directions.addressAria} style={{ flex: '1 1 180px', whiteSpace: 'normal' }}>
              {t('arrival.dir.toAddress')}
            </Button>
          </div>
          <p id="arrive-app-l" style={{ ...TYPE.footnote, fontWeight: 700, color: C2.char, margin: `${SPACE.sm}px 0 6px` }}>{t('arrival.app.label')}</p>
          <SegmentedControl label={t('arrival.app.label')} value={mapsApp} onChange={setMapsApp}
            options={[{ value: 'apple', label: t('arrival.app.apple') }, { value: 'google', label: t('arrival.app.google') }]}/>
        </div>
      </Card>

      {ARRIVAL_SLOTS.map(({ id, Component }) => <Component key={id} app={app} venue={venue} arrival={arrival}/>)}
      {typeof children === 'function' ? children(arrival) : children}
    </section>
  );
}

function EntranceDetails({ app, venue, e, first, onAnswer, ready }) {
  const t = useT();
  const fmt = useFormat();
  const [open, setOpen] = React.useState(null);
  const close = React.useCallback(() => setOpen(null), []);
  const photos = e.photo ? [localPhoto(t, fmt, e.photo)] : [];
  const community = e.source === 'community';
  const H = 'h3';
  return (
    <div style={{ borderTop: first ? 0 : `1px solid ${C2.hair}`, paddingTop: first ? 0 : SPACE.sm, marginTop: first ? 0 : SPACE.sm }}>
      <H style={{ ...TYPE.headline, margin: 0, color: C2.char }}>{entranceTitle(t, e)}</H>
      <p style={{ ...TYPE.footnote, color: C2.slate, margin: '2px 0 0' }}>
        {e.lat != null ? pinWhere(t, venue, e) : t('arrival.notOnMap')}
      </p>
      {e.note && (
        <p style={{ ...TYPE.body, margin: `${SPACE.xs}px 0 0`, color: C2.char }}>“<UserText>{e.note}</UserText>”</p>
      )}
      {photos.length > 0 && (
        <div style={{ marginTop: SPACE.sm }}>
          <PhotoGrid photos={photos} onOpen={setOpen} size={112}/>
          <PhotoViewer photos={photos} index={open} onIndex={setOpen} onClose={close}/>
        </div>
      )}

      {/* Where this comes from, and how recently. */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: SPACE.xs, marginTop: SPACE.sm }}>
        <SourceBadge source={community ? 'community' : 'osm'}/>
        {e.photo && <SourceBadge source="photo"/>}
      </div>
      <p style={{ ...TYPE.footnote, color: C2.char, margin: '6px 0 0' }}>
        {community
          ? t('arrival.source.marked', { who: whoText(t, e.whoNeed, e.whoMore), date: fmt.date(e.at) })
          : t('arrival.source.osm')}
        {e.yes > 0 && <><br/>{t('arrival.source.confirmed', { count: e.yes, date: fmt.date(entranceLast(e)) })}</>}
      </p>

      {e.status === 'changed' && (
        <Banner tone="warn" style={{ marginTop: SPACE.sm }} title={t('arrival.changed.title')}>
          {t('arrival.changed.body', { date: fmt.date(e.lastChanged) })}
        </Banner>
      )}

      {/* After the full list loads: it knows whether this viewer marked it. */}
      {community && ready && <StillTheWayIn app={app} venue={venue} e={e} onAnswer={onAnswer}/>}
    </div>
  );
}

// "Still the way in? Yes / Changed" — one answer per person, latest wins.
function StillTheWayIn({ app, venue, e, onAnswer }) {
  const t = useT();
  const [state, setState] = React.useState('idle'); // idle | sending | yes | changed
  const qId = `still-${e.id}`;
  if (e.mine) return <p style={{ ...TYPE.footnote, color: C2.slate, margin: `${SPACE.xs}px 0 0` }}>{t('arrival.still.mine')}</p>;

  async function send(value) {
    if (state === 'sending') return;
    setState('sending');
    try { await onAnswer(e, value); setState(value); }
    catch { setState('idle'); app.toast(t('arrival.still.failed')); }
  }

  if (state === 'yes') return <Banner tone="success" live="polite" style={{ marginTop: SPACE.sm }}>{t('arrival.still.thanksYes')}</Banner>;
  if (state === 'changed') {
    return (
      <Banner tone="info" live="polite" style={{ marginTop: SPACE.sm }} title={t('arrival.still.thanksChanged')}>
        <Button size="sm" variant="outline" icon="edit" onClick={() => app.goto('review', venue.id)} style={{ marginTop: SPACE.xs }}>
          {t('arrival.still.review')}
        </Button>
      </Banner>
    );
  }
  return (
    <div role="group" aria-labelledby={qId} style={{ marginTop: SPACE.sm }}>
      <p id={qId} style={{ ...TYPE.footnote, fontWeight: 700, color: C2.char, margin: `0 0 ${SPACE.xs}px` }}>
        {t('arrival.still.question')}
        {e.myAnswer && <span style={{ fontWeight: 500, color: C2.slate }}> {t(e.myAnswer === 'yes' ? 'arrival.still.youSaidYes' : 'arrival.still.youSaidChanged')}</span>}
      </p>
      <div style={{ display: 'flex', gap: SPACE.xs, flexWrap: 'wrap' }}>
        <Button size="sm" variant="outline" icon="check" disabled={state === 'sending'} onClick={() => send('yes')}
          aria-label={t('arrival.still.yesAria', { door: t(`arrival.kind.${e.kind}.title`) })} style={{ flex: '1 1 120px' }}>
          {t('arrival.still.yes')}
        </Button>
        <Button size="sm" variant="outline" icon="warn" disabled={state === 'sending'} onClick={() => send('changed')}
          aria-label={t('arrival.still.changedAria', { door: t(`arrival.kind.${e.kind}.title`) })} style={{ flex: '1 1 120px' }}>
          {t('arrival.still.changed')}
        </Button>
      </div>
    </div>
  );
}

/** One line for cards: "Enter at the back — “Ramp via the car park”". */
function EntranceLine({ venue, style }) {
  const t = useT();
  const e = venue.entrance;
  if (!e || e.source !== 'community') return null;
  const ok = routable(e) || (e.status === 'current' && e.lat == null);
  return (
    <p style={{ ...TYPE.footnote, color: C2.char, margin: 0, display: 'flex', gap: 6, alignItems: 'flex-start', ...style }}>
      <span aria-hidden="true" style={{ color: ok ? C2.teal : C2.amber, fontWeight: 800, flexShrink: 0 }}>{ok ? '→' : '!'}</span>
      <span>
        <span style={{ fontWeight: 700 }}>{ok ? t(`arrival.kind.${e.kind}.enter`) : t('arrival.line.changed')}</span>
        {ok && e.note && <> — <UserText>{e.note}</UserText></>}
      </span>
    </p>
  );
}

export { GettingThere, EntranceLine, useVenueEntrances };
