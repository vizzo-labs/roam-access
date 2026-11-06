'use client';

import React from 'react';
import { C2, M2 } from '../ui/palette';
import { V2Verdict } from '../ui/Verdict';
import { SourceLine } from '../trust/SourceLine';
import { PLACE_ICONS, iconFor } from '../PilotMap';
import { reportBanner, reportType } from '../layers/layerUtils';
import { Banner, Button, IconButton, RADIUS, SPACE, TYPE, elevation } from '../ds';
import { useFormat, useT } from '../i18n';
import { kindLabel } from '@/lib/i18n/data';
import { verdictSourceShortT } from '@/lib/trust/labels';
import { firstQuestion, keyFacts } from '@/lib/pilot/key-facts';

// PlacePreviewCard — what a map pin opens (Domain / Airbnb / Google Maps
// style): a photo on the left, the place, its personalised verdict, the key
// access facts for THIS person's needs and where they come from on the right,
// then "See details" + "Directions". Presentational: the caller wires it to
// the app (explore/MapPlacePreview on desktop, screens/Map on phones) and the
// /ds page shows it with sample data.
//
// variant 'floating' = anchored over the desktop map · 'sheet' = the top of
// the phone's bottom sheet (smaller photo, no shadow).
// With `dialog`, it's a NON-modal dialog (role="dialog", aria-labelledby).
//
// Honesty: the card shows the verdict ra2Verdict gave; facts come from
// lib/pilot/key-facts (OpenStreetMap is only ever "Unconfirmed").

// How the card was opened. Focus moves into the card either way; its outline
// shows only when the last input was the keyboard (Enter/Space on a pin), so
// a mouse or touch open doesn't draw a heavy ring around the whole card.
// Every control inside keeps its own :focus-visible ring (globals.css).
let lastInput = 'pointer';
if (typeof window !== 'undefined') {
  window.addEventListener('keydown', () => { lastInput = 'keyboard'; }, true);
  window.addEventListener('pointerdown', () => { lastInput = 'pointer'; }, true);
}

const STATE = {
  yes:         { icon: '✓', fg: () => C2.blue },
  no:          { icon: '✗', fg: () => C2.red },
  mixed:       { icon: '±', fg: () => C2.amber },
  alt:         { icon: '!', fg: () => C2.amber },
  unconfirmed: { icon: '?', fg: () => C2.slate },
};

function KeyFactList({ facts, t }) {
  return (
    <ul aria-label={t('preview.factsLabel')} style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
      {facts.map(({ feature, state }) => {
        const s = STATE[state];
        return (
          <li key={feature} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', columnGap: 8, rowGap: 2, ...TYPE.footnote, color: C2.char }}>
            <span style={{ fontWeight: 600 }}>{t(`preview.feature.${feature}`)}</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: s.fg(), fontWeight: 700 }}>
              <span aria-hidden="true" style={{
                width: 18, height: 18, borderRadius: 999, background: s.fg(), color: C2.paper, flexShrink: 0,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: M2, fontSize: 10.5, fontWeight: 800,
              }}>{s.icon}</span>
              <span><span className="ra-sr-only">: </span>{t(`preview.state.${state}`)}</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

// Left column: the cover photo, or the category icon + "add the first".
function Cover({ place, size, onAddPhoto, t }) {
  const [broken, setBroken] = React.useState(false);
  const photo = !broken && place.coverPhoto;
  const box = { width: size, minHeight: size, alignSelf: 'stretch', flexShrink: 0, borderRadius: RADIUS.md, overflow: 'hidden', boxSizing: 'border-box' };
  if (photo) {
    return (
      <div style={{ ...box, background: C2.stone }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- private photo route, not optimisable */}
        <img src={photo.url} alt={photo.alt || t('preview.photoAlt', { name: place.name })} onError={() => setBroken(true)}
          loading="lazy" decoding="async"
          style={{ display: 'block', width: '100%', height: '100%', minHeight: size, objectFit: 'cover' }}/>
      </div>
    );
  }
  return (
    <div style={{
      ...box, background: C2.stone, padding: SPACE.xs, gap: 4,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center',
    }}>
      <svg width={size > 100 ? 36 : 28} height={size > 100 ? 36 : 28} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d={PLACE_ICONS[iconFor(place)]} fill="none" stroke={C2.slate} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <span style={{ ...TYPE.caption, color: C2.slate }}>{t('preview.noPhoto')}</span>
      {onAddPhoto && (
        <Button variant="plain" size="sm" onClick={onAddPhoto} aria-label={t('preview.addFirstAria', { name: place.name })}
          style={{ padding: '0 4px', minHeight: 44, fontSize: 13.5, whiteSpace: 'normal' }}>
          {t('preview.addFirst')}
        </Button>
      )}
    </div>
  );
}

// "Answer 1 question": the help-fill-the-gaps micro-task for this place.
function QuickQuestion({ place, feature, onAnswer, onCancel, t }) {
  const [busy, setBusy] = React.useState(false);
  const qRef = React.useRef(null);
  React.useEffect(() => { qRef.current?.focus(); }, []);
  const qId = `pp-q-${place.id}`;
  async function answer(val) {
    setBusy(true);
    const ok = await onAnswer(feature, val);
    setBusy(false);
    if (!ok) qRef.current?.focus();
  }
  return (
    <div style={{ marginTop: SPACE.sm }}>
      <p id={qId} ref={qRef} tabIndex={-1} style={{ ...TYPE.headline, margin: 0, color: C2.char }}>{t(`community.q.${feature}`)}</p>
      <p style={{ ...TYPE.footnote, color: C2.slate, margin: '2px 0 0' }}>{t('preview.answerHelps')}</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: SPACE.xs, marginTop: SPACE.xs }}>
        <Button size="sm" variant="outline" icon="check" disabled={busy} aria-describedby={qId} onClick={() => answer('yes')} style={{ flex: '1 1 90px' }}>{t('common.yes')}</Button>
        <Button size="sm" variant="outline" icon="close" disabled={busy} aria-describedby={qId} onClick={() => answer('no')} style={{ flex: '1 1 90px' }}>{t('common.no')}</Button>
        <Button size="sm" variant="ghost" disabled={busy} onClick={onCancel} style={{ flex: '1 1 90px' }}>{t('preview.notNow')}</Button>
      </div>
    </div>
  );
}

const PlacePreviewCard = React.forwardRef(function PlacePreviewCard({
  place: v, needs = [], saved = false, onToggleSave, onDetails, directionsHref, onClose,
  onAnswer, onAddPhoto, reports = [], variant = 'floating', dialog = true,
  headingLevel = 2, onKeyDown, style,
}, ref) {
  const t = useT();
  const fmt = useFormat();
  const verdict = v.verdict;
  const sheet = variant === 'sheet';
  const headingId = `pp-name-${variant}-${v.id}`;
  const H = `h${headingLevel}`;
  const facts = keyFacts(v, needs, 3);
  const unknown = verdict.kind === 'unknown';
  const [asking, setAsking] = React.useState(false);
  const [thanked, setThanked] = React.useState(false);
  const askRef = React.useRef(null);
  const thanksRef = React.useRef(null);
  // A different place in the same card: start over.
  const [shownId, setShownId] = React.useState(v.id);
  if (shownId !== v.id) { setShownId(v.id); setAsking(false); setThanked(false); }

  const dirHref = directionsHref ?? `https://www.google.com/maps/dir/?api=1&destination=${v.lat},${v.lng}`;
  const canAsk = unknown && !!onAnswer && !thanked;
  const feature = canAsk ? firstQuestion(v, needs) : null;
  const report = reports[0];

  async function answer(f, val) {
    const ok = await onAnswer(f, val);
    if (ok) {
      setAsking(false); setThanked(true);
      // The question's buttons are gone: keep focus in the card, on the thanks.
      requestAnimationFrame(() => thanksRef.current?.focus());
    }
    return ok;
  }
  function cancelAsk() {
    setAsking(false);
    requestAnimationFrame(() => askRef.current?.focus());
  }

  const surface = sheet
    ? { background: C2.paper }
    : { background: C2.paper, border: `1.5px solid ${C2.line}`, borderRadius: RADIUS.lg, ...elevation(3) };

  return (
    <div ref={ref} className="ra-preview-card" tabIndex={dialog ? -1 : undefined}
      data-focus-ring={lastInput === 'keyboard' ? 'on' : 'off'}
      role={dialog ? 'dialog' : 'group'} aria-labelledby={headingId}
      onKeyDown={onKeyDown}
      style={{ boxSizing: 'border-box', padding: sheet ? `0 0 ${SPACE.xs}px` : SPACE.sm, color: C2.char, ...surface, ...style }}>
      {/* Big text on a phone: the details wrap under the photo instead of squeezing. */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: SPACE.sm, alignItems: 'flex-start' }}>
        <Cover place={v} size={sheet ? 88 : 120} onAddPhoto={onAddPhoto} t={t}/>
        <div style={{ flex: '1 1 190px', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 4 }}>
            <H id={headingId} style={{ ...TYPE.headline, fontSize: 17, margin: '10px 0 0', flex: 1, minWidth: 0, overflowWrap: 'break-word' }}>{v.name}</H>
            {onToggleSave && (
              <IconButton icon="bookmark" size="sm" variant="ghost" pressed={saved}
                label={saved ? t('explore.unsaveNamed', { name: v.name }) : t('explore.saveNamed', { name: v.name })}
                onClick={onToggleSave}/>
            )}
            {onClose && <IconButton icon="close" size="sm" variant="ghost" label={t('preview.close', { name: v.name })} onClick={onClose}/>}
          </div>
          <p style={{ ...TYPE.footnote, color: C2.slate, margin: '2px 0 8px' }}>
            {[kindLabel(t, v.kind), v.area, v.mins != null ? t('common.minWalk', { mins: v.mins }) : null].filter(Boolean).join(' · ')}
          </p>
          <V2Verdict kind={verdict.kind}/>
          {!asking && (
            <div style={{ marginTop: SPACE.xs }}>
              {facts.length > 0 && <KeyFactList facts={facts} t={t}/>}
              {unknown && !facts.length && <p style={{ ...TYPE.footnote, margin: 0, color: C2.char }}>{t('preview.noInfo')}</p>}
              {!unknown && (
                <SourceLine compact src={v.ev?.length ? 'community' : 'osm'}
                  text={verdictSourceShortT(t, fmt, v, verdict, needs)} style={{ marginTop: 6 }}/>
              )}
            </div>
          )}
          {thanked && <p ref={thanksRef} tabIndex={-1} role="status" style={{ ...TYPE.footnote, fontWeight: 600, color: C2.green, margin: '6px 0 0' }}>{t('preview.thanks')}</p>}
        </div>
      </div>

      {asking && feature && <QuickQuestion place={v} feature={feature} onAnswer={answer} onCancel={cancelAsk} t={t}/>}

      {/* today's temporary problem (F3): news, never a verdict */}
      {report && !asking && (
        <Banner tone={reportType(report.type)?.positive ? 'success' : 'warn'} style={{ marginTop: SPACE.sm, padding: '8px 12px' }}
          title={<><span className="ra-sr-only">{reportType(report.type)?.positive ? t('layers.report.srCommunity') : t('layers.report.srProblem')}</span>{reportBanner(t, report.type)}</>}>
          {reports.length > 1 ? t('preview.moreReports', { count: reports.length - 1 }) : null}
        </Banner>
      )}

      {!asking && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: SPACE.xs, marginTop: SPACE.sm }}>
          {canAsk ? (
            <>
              <Button ref={askRef} size="sm" icon="edit" onClick={() => setAsking(true)} aria-label={t('preview.answerOneAria', { name: v.name })}
                style={{ flex: '2 1 150px' }}>{t('preview.answerOne')}</Button>
              <Button size="sm" variant="outline" onClick={onDetails} aria-label={t('preview.seeDetailsAria', { name: v.name })}
                style={{ flex: '1 1 90px' }}>{t('preview.details')}</Button>
            </>
          ) : (
            <Button size="sm" iconRight="forward" onClick={onDetails} aria-label={t('preview.seeDetailsAria', { name: v.name })}
              style={{ flex: '2 1 150px' }}>{t('explore.seeDetails')}</Button>
          )}
          <Button size="sm" variant="outline" icon="directions" href={dirHref} external
            aria-label={t('venue.action.directionsAria', { name: v.name })} style={{ flex: '1 1 110px' }}>
            {t('venue.action.directions')}
          </Button>
        </div>
      )}
    </div>
  );
});

export { PlacePreviewCard };
