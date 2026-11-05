'use client';
// "What to expect" (#17): a step-by-step visual story of a visit — arrival →
// entrance → inside → toilet — from reviewers' photos and their descriptions,
// with community facts as text. Every step works without photos (text only),
// and each photo's description is shown as text, not hidden in alt.

import React from 'react';
import { C2 } from '../ui/palette';
import { Button, Card, PhotoViewer, SectionHeader, SPACE, TYPE, RADIUS, Tabs, TabPanel } from '../ds';
import { quietHours } from '@/lib/sensory/summary';
import { kindLabel } from '@/lib/i18n/data';
import { UserText, useFormat, useT } from '../i18n';
import { factText, localPhoto } from '../trust/text';
import { sensoryLines } from './SensorySummary';
import { whenText } from './bits';

const STEPS = [
  { id: 'arrival',  kinds: [],                   tags: [] },
  { id: 'entrance', kinds: ['entrance', 'step'], tags: ['stepfree'] },
  { id: 'inside',   kinds: ['seating', 'other'], tags: ['seats', 'simple', 'quiet', 'calm', 'vision', 'hearing'] },
  { id: 'toilet',   kinds: ['toilet'],           tags: ['bathroom'] },
];
const MARK = { works: '✓', check: '!', barrier: '✗' };

// Photos come from the same endpoint as the gallery; one request per place
// and review round, shared by both.
const cache = new Map();
function useStoryPhotos(app, id) {
  const key = `${id}:${app.reviewsVersion}`;
  const [photos, setPhotos] = React.useState(() => (cache.get(key)?.value ?? null));
  React.useEffect(() => {
    let live = true;
    let entry = cache.get(key);
    if (!entry) {
      entry = { value: null };
      entry.promise = fetch(`/api/venues/${encodeURIComponent(id)}/photos`)
        .then(r => (r.ok ? r.json() : { photos: [] })).then(d => d.photos || [], () => [])
        .then(p => { entry.value = p; return p; });
      cache.set(key, entry);
    }
    entry.promise.then(p => { if (live) setPhotos(p); });
    return () => { live = false; };
  }, [key, id]);
  return photos || [];
}

function factLines(venue, tags, t) {
  const pick = (facts, kind) => (facts || [])
    .filter(f => f.kind !== 'experience' && f.tags.some(x => tags.includes(x)))
    .map(f => {
      const text = factText(t, f);
      return { kind, key: kind + f.t, text: f.n ? t('sensory.story.factLine', { text, reports: t('common.reports', { count: f.n }) }) : text };
    });
  return [...pick(venue.barriers, 'barrier'), ...pick(venue.check, 'check'), ...pick(venue.works, 'works')];
}

function buildStory(venue, photos, origin, t, fmt) {
  return STEPS.map(s => {
    const lines = factLines(venue, s.tags, t);
    const notes = [];
    if (s.id === 'arrival') {
      const kind = kindLabel(t, venue.kind);
      notes.push(venue.address
        ? t('sensory.story.at', { kind, address: venue.address, area: venue.area })
        : t('sensory.story.in', { kind, area: venue.area }));
      if (venue.mins) notes.push(t('sensory.story.walk', { mins: venue.mins, origin: origin?.mine ? t('data.yourLocation') : (origin?.name || 'Manly Wharf') }));
      const hours = quietHours(venue.sensory);
      if (hours.length) notes.push(t('sensory.story.quietest', { list: fmt.list(hours.map(h => whenText(t, h.slot, h.day))) }));
    }
    if (s.id === 'inside') {
      for (const l of sensoryLines(venue.sensory, t, fmt)) notes.push(t('sensory.story.dimLine', { heading: l.heading, text: l.text, meta: l.meta }));
    }
    // Photos with kind / who / when in the reader's language (also for PhotoViewer).
    const own = photos.filter(p => s.kinds.includes(p.kind)).map(p => localPhoto(t, fmt, p));
    return { ...s, label: t(`sensory.step.${s.id}`), none: t(`sensory.step.${s.id}.none`), lines, notes, photos: own };
  });
}

function StepPhoto({ step, onOpen, t }) {
  const p = step.photos[0];
  const n = step.photos.length;
  return (
    <figure style={{ margin: `0 0 ${SPACE.sm}px` }}>
      <button type="button" onClick={() => onOpen(0)} className="ds-press"
        aria-label={n > 1 ? t('sensory.story.openPhotoOf', { step: step.label, total: n, alt: p.alt }) : t('sensory.story.openPhoto', { step: step.label, alt: p.alt })}
        style={{ display: 'block', width: '100%', padding: 0, border: `1.5px solid ${C2.line}`, borderRadius: RADIUS.md, overflow: 'hidden', background: C2.stone, cursor: 'zoom-in' }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- private, auth-checked thumbnail; next/image can't proxy it */}
        <img src={p.thumb} alt="" loading="lazy" style={{ display: 'block', width: '100%', aspectRatio: '4 / 3', objectFit: 'cover' }}/>
      </button>
      <figcaption style={{ ...TYPE.callout, color: C2.char, marginTop: SPACE.xs }}>
        “<UserText>{p.alt}</UserText>” <span style={{ ...TYPE.footnote, color: C2.slate }}>— {t('sensory.story.byline', { who: p.who || t('sensory.story.someone'), when: p.when })}</span>
        {n > 1 && <span style={{ ...TYPE.footnote, display: 'block', color: C2.slate }}>{t('sensory.story.morePhotos', { count: n - 1 })}</span>}
      </figcaption>
    </figure>
  );
}

export function WhatToExpect({ app, venue }) {
  const t = useT();
  const fmt = useFormat();
  const photos = useStoryPhotos(app, venue.id);
  const story = buildStory(venue, photos, app.origin, t, fmt);
  const [tab, setTab] = React.useState('arrival');
  const [viewer, setViewer] = React.useState(null); // { step, index }
  const closeViewer = () => setViewer(null);
  const idBase = `story-${venue.id}`.replace(/[^\w-]/g, '_');

  // Worth showing once the community has said something beyond the address.
  const hasContent = story.some(s => s.lines.length || s.photos.length) || !!venue.sensory;
  if (!hasContent) return null;

  const i = Math.max(0, story.findIndex(s => s.id === tab));
  const next = story[i + 1];
  const go = id => {
    setTab(id);
    requestAnimationFrame(() => document.getElementById(`${idBase}-tab-${id}`)?.focus());
  };

  return (
    <Card as="section" aria-labelledby={`${idBase}-h`} style={{ marginBottom: SPACE.md }}>
      <SectionHeader id={`${idBase}-h`} title={t('sensory.story.title')} size="sm" description={t('sensory.story.desc')}/>
      <Tabs idBase={idBase} label={t('sensory.story.tabs')} value={tab} onChange={setTab}
        tabs={story.map(s => ({ id: s.id, label: s.label }))} style={{ marginBottom: SPACE.sm }}/>
      {story.map((s, n) => (
        <TabPanel key={s.id} idBase={idBase} id={s.id} active={s.id === tab}>
          <p className="ra-sr-only">{t('sensory.story.stepOf', { n: n + 1, total: story.length, label: s.label })}</p>
          {s.photos.length > 0 && <StepPhoto step={s} t={t} onOpen={index => setViewer({ step: s.id, index })}/>}
          {s.notes.map(x => <p key={x} style={{ ...TYPE.callout, color: C2.char, margin: `0 0 ${SPACE.xxs}px` }}>{x}</p>)}
          {s.lines.length > 0 ? (
            <ul style={{ listStyle: 'none', margin: `${SPACE.xs}px 0 0`, padding: 0 }}>
              {s.lines.map(l => (
                <li key={l.key} style={{ display: 'flex', gap: SPACE.xs, ...TYPE.callout, color: C2.char, marginBottom: SPACE.xxs }}>
                  <span aria-hidden="true" style={{ fontWeight: 800, width: 16, flexShrink: 0, textAlign: 'center', color: l.kind === 'works' ? C2.green : l.kind === 'barrier' ? C2.red : C2.amber }}>{MARK[l.kind]}</span>
                  <span><span className="ra-sr-only">{t(`sensory.mark.${l.kind}`)}: </span>{l.text}</span>
                </li>
              ))}
            </ul>
          ) : s.id !== 'arrival' && !s.photos.length && !s.notes.length ? (
            <p style={{ ...TYPE.callout, color: C2.slate, margin: 0 }}>{s.none}</p>
          ) : null}
        </TabPanel>
      ))}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: SPACE.sm }}>
        {next
          ? <Button variant="outline" size="sm" iconRight="forward" onClick={() => go(next.id)}>{t('sensory.story.next', { label: next.label })}</Button>
          : <Button variant="ghost" size="sm" onClick={() => go(story[0].id)}>{t('sensory.story.restart')}</Button>}
      </div>
      <PhotoViewer photos={viewer ? story.find(s => s.id === viewer.step).photos : []} index={viewer?.index ?? null}
        onIndex={index => setViewer(v => ({ ...v, index }))} onClose={closeViewer}/>
    </Card>
  );
}
