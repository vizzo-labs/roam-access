'use client';
// Review form (I1): "Show people where this entrance is". A small map with a
// draggable entrance pin, plus ways that don't need the map at all:
//   · "Use my current location" (when you're standing at the door)
//   · four buttons that move the pin 5 m north / south / east / west
//   · describe where it is in words (the note)
// Optional: which door it is (when the form didn't already ask) and one
// entrance photo (the review's photo upload, kind "entrance").
//
// The pin starts on the street address; it's only sent once it has moved, so
// "the entrance is at the address" is never saved by accident.

import React from 'react';
import { C2 } from '../ui/palette';
import { Banner, Button, ChipGroup, FilterChip, IconButton, RADIUS, SPACE, TYPE, edge } from '../ds';
import { useT } from '../i18n';
import { MiniMap } from './MiniMap';
import { PhotoCard } from '../photos/ReviewPhotos';
import { MAX_PHOTOS_PER_REVIEW } from '@/lib/photos/kinds';
import {
  ENTRANCE_KINDS, ENTRANCE_NOTE_MAX, MAX_ENTRANCE_DISTANCE_M, compass, distanceM, offset, roundM,
} from '@/lib/arrival/entrances';

const STEP_M = 5;

/** "About 35 m south-west of the street address" / "On the street address". */
export function pinWhere(t, venue, p) {
  const m = distanceM(venue, p);
  if (m < 3) return t('arrival.pin.atAddress');
  return t('arrival.pin.fromAddress', { m: roundM(m), dir: t(`arrival.compass.${compass(venue, p)}`) });
}

function EntranceMarker({ venue, value, onChange, showKinds = false, showNote = false, photos }) {
  const t = useT();
  const { kind, pin, note } = value; // pin = { lat, lng, by: 'pin' | 'gps' } | null
  const [msg, setMsg] = React.useState(null); // { tone, text }
  const [say, setSay] = React.useState('');   // live: where the pin is now
  const [locating, setLocating] = React.useState(false);
  const fileRef = React.useRef(null);
  const ids = React.useId();
  const shown = pin || { lat: venue.lat, lng: venue.lng };
  const set = patch => onChange({ ...value, ...patch });

  function movePin(p, by) {
    if (distanceM(venue, p) > MAX_ENTRANCE_DISTANCE_M) {
      setMsg({ tone: 'warn', text: t('arrival.pin.tooFar', { max: MAX_ENTRANCE_DISTANCE_M }) });
      return false;
    }
    setMsg(null);
    set({ pin: { lat: p.lat, lng: p.lng, by } });
    setSay(pinWhere(t, venue, p));
    return true;
  }

  function nudge(north, east) {
    movePin(offset(shown, north, east), 'pin');
  }

  function locate() {
    if (!navigator.geolocation) { setMsg({ tone: 'warn', text: t('arrival.gps.unavailable') }); return; }
    setLocating(true); setMsg(null);
    navigator.geolocation.getCurrentPosition(pos => {
      setLocating(false);
      const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      const far = distanceM(venue, p);
      if (far > MAX_ENTRANCE_DISTANCE_M) {
        setMsg({ tone: 'warn', text: t('arrival.gps.far', { m: roundM(far) }) });
        return;
      }
      movePin(p, 'gps');
      const acc = Math.round(pos.coords.accuracy || 0);
      if (acc > 25) setMsg({ tone: 'info', text: t('arrival.gps.rough', { m: roundM(acc) }) });
      else setMsg({ tone: 'success', text: t('arrival.gps.done') });
    }, err => {
      setLocating(false);
      setMsg({ tone: 'warn', text: err.code === 1 ? t('arrival.gps.denied') : t('arrival.gps.failed') });
    }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 });
  }

  function reset() {
    set({ pin: null });
    setMsg(null);
    setSay(t('arrival.pin.resetDone'));
  }

  const entrancePhoto = photos?.photos.find(p => p.tag === 'entrance');
  const roomForPhoto = photos && photos.photos.length < MAX_PHOTOS_PER_REVIEW;

  return (
    <div role="group" aria-labelledby={`${ids}-h`} style={{
      marginTop: SPACE.sm, padding: SPACE.sm, borderRadius: RADIUS.md, background: C2.paper, border: edge(),
    }}>
      <p id={`${ids}-h`} style={{ ...TYPE.headline, margin: 0 }}>
        {t('arrival.mark.title')} <span style={{ fontWeight: 500, color: C2.slate }}>{t('common.optional')}</span>
      </p>
      <p id={`${ids}-hint`} style={{ ...TYPE.footnote, color: C2.slate, margin: `2px 0 ${SPACE.sm}px` }}>{t('arrival.mark.hint')}</p>

      {showKinds && (<>
        <p aria-hidden="true" style={{ ...TYPE.footnote, fontWeight: 700, color: C2.char, margin: '0 0 6px' }}>{t('arrival.mark.kind')}</p>
        <ChipGroup label={t('arrival.mark.kind')} wrap style={{ marginBottom: SPACE.sm }}>
          {ENTRANCE_KINDS.map(k => (
            <FilterChip key={k} selected={kind === k} onChange={on => on && set({ kind: k })}>{t(`arrival.kind.${k}.chip`)}</FilterChip>
          ))}
        </ChipGroup>
      </>)}

      <MiniMap venue={venue} pin={shown} height={220}
        label={t('arrival.map.editLabel', { name: venue.name })}
        onPin={p => movePin(p, 'pin')}/>

      {/* Where the pin is, in words — also what a screen reader hears after each move. */}
      <p style={{ ...TYPE.callout, fontWeight: 600, margin: `${SPACE.sm}px 0 0`, color: C2.char }}>
        {pin ? pinWhere(t, venue, pin) : t('arrival.pin.notMoved')}
      </p>
      <p className="ra-sr-only" role="status" aria-live="polite">{say}</p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: SPACE.xs, marginTop: SPACE.sm }}>
        <Button size="sm" variant="secondary" icon="locate" onClick={locate} disabled={locating} style={{ flex: '1 1 200px' }}>
          {locating ? t('arrival.gps.finding') : t('arrival.gps.use')}
        </Button>
        {pin && (
          <Button size="sm" variant="ghost" icon="refresh" onClick={reset} style={{ flex: '1 1 160px' }}>{t('arrival.pin.reset')}</Button>
        )}
      </div>

      {/* Move the pin without the map: keyboard, switch and screen-reader users. */}
      <div role="group" aria-label={t('arrival.pin.moveGroup')} style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: SPACE.xs, marginTop: SPACE.sm }}>
        <span aria-hidden="true" style={{ ...TYPE.footnote, fontWeight: 600, color: C2.char, flexBasis: '100%' }}>{t('arrival.pin.move')}</span>
        <IconButton icon="up" size="sm" label={t('arrival.pin.moveN', { m: STEP_M })} onClick={() => nudge(STEP_M, 0)}/>
        <IconButton icon="down" size="sm" label={t('arrival.pin.moveS', { m: STEP_M })} onClick={() => nudge(-STEP_M, 0)}/>
        <IconButton icon="back" size="sm" label={t('arrival.pin.moveW', { m: STEP_M })} onClick={() => nudge(0, -STEP_M)}/>
        <IconButton icon="forward" size="sm" label={t('arrival.pin.moveE', { m: STEP_M })} onClick={() => nudge(0, STEP_M)}/>
      </div>

      {msg && <Banner tone={msg.tone} live="polite" style={{ marginTop: SPACE.sm }}>{msg.text}</Banner>}

      {showNote && (
        <div style={{ marginTop: SPACE.md }}>
          <label htmlFor={`${ids}-note`} style={{ ...TYPE.headline, fontSize: 15, display: 'block', marginBottom: 2 }}>
            {t('arrival.mark.describe')} <span style={{ fontWeight: 500, color: C2.slate }}>{t('common.optional')}</span>
          </label>
          <p id={`${ids}-note-hint`} style={{ ...TYPE.footnote, color: C2.slate, margin: '0 0 6px' }}>{t('arrival.mark.describeHint')}</p>
          <input id={`${ids}-note`} type="text" value={note} maxLength={ENTRANCE_NOTE_MAX} aria-describedby={`${ids}-note-hint`}
            onChange={e => set({ note: e.target.value })} placeholder={t('arrival.mark.placeholder')}
            style={{
              ...TYPE.input, width: '100%', boxSizing: 'border-box', minHeight: 48, borderRadius: RADIUS.sm,
              border: edge(), padding: '0 12px', color: C2.char, background: C2.paper,
            }}/>
        </div>
      )}
      {!showNote && <p style={{ ...TYPE.footnote, color: C2.slate, margin: `${SPACE.sm}px 0 0` }}>{t('arrival.mark.orDescribe')}</p>}

      {photos && (
        <div style={{ marginTop: SPACE.md }}>
          {entrancePhoto ? (
            <PhotoCard p={entrancePhoto} n={1} title={t('arrival.photo.title')} venueName={venue.name} fixedKind
              patch={photos.patch} remove={photos.remove} retry={photos.retry}/>
          ) : (
            <>
              <input ref={fileRef} type="file" accept="image/*" hidden tabIndex={-1} aria-hidden="true"
                onChange={e => { photos.add(e.target.files, { kind: 'entrance', tag: 'entrance', max: 1 }); e.target.value = ''; }}/>
              <Button size="sm" variant="outline" icon="camera" full disabled={!roomForPhoto} onClick={() => fileRef.current?.click()}>
                {t('arrival.photo.add')}
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export { EntranceMarker };
