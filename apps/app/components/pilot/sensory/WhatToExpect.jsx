'use client';
// "What to expect" (#17): a step-by-step visual story of a visit — arrival →
// entrance → inside → toilet — from reviewers' photos and their descriptions,
// with community facts as text. Every step works without photos (text only),
// and each photo's description is shown as text, not hidden in alt.

import React from 'react';
import { C2 } from '../ui/palette';
import { Button, Card, PhotoViewer, SectionHeader, SPACE, TYPE, RADIUS, Tabs, TabPanel, plural } from '../ds';
import { sensoryLines, quietHourText } from './SensorySummary';
import { quietHours } from '@/lib/sensory/summary';

const STEPS = [
  { id: 'arrival',  label: 'Arrival',  kinds: [],                   tags: [],                                              none: 'No one has described arriving here yet.' },
  { id: 'entrance', label: 'Entrance', kinds: ['entrance', 'step'], tags: ['stepfree'],                                    none: 'No one has described the entrance yet.' },
  { id: 'inside',   label: 'Inside',   kinds: ['seating', 'other'], tags: ['seats', 'simple', 'quiet', 'calm', 'vision', 'hearing'], none: 'No one has described the inside yet.' },
  { id: 'toilet',   label: 'Toilet',   kinds: ['toilet'],           tags: ['bathroom'],                                    none: 'No one has described the toilet yet.' },
];
const MARK = { works: { sym: '✓', label: 'Works' }, check: { sym: '!', label: 'Check' }, barrier: { sym: '✗', label: 'Barrier' } };

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

function factLines(venue, tags) {
  const pick = (facts, kind) => (facts || [])
    .filter(f => f.kind !== 'experience' && f.tags.some(t => tags.includes(t)))
    .map(f => ({ kind, text: f.t + (f.n ? ` — ${plural(f.n, 'report')}` : ''), key: kind + f.t }));
  return [...pick(venue.barriers, 'barrier'), ...pick(venue.check, 'check'), ...pick(venue.works, 'works')];
}

function buildStory(venue, photos, origin) {
  return STEPS.map(s => {
    const lines = factLines(venue, s.tags);
    const notes = [];
    if (s.id === 'arrival') {
      notes.push(`${venue.kind}${venue.address ? ` at ${venue.address}` : ''}, ${venue.area}.`);
      if (venue.mins) notes.push(`About ${venue.mins} min walk from ${origin?.name || 'Manly Wharf'}.`);
      const hours = quietHours(venue.sensory);
      if (hours.length) notes.push(`Quietest times: ${hours.map(h => quietHourText(h).replace(/^(Usually quiet|Quiet) /, '')).join('; ')}.`);
    }
    if (s.id === 'inside') for (const l of sensoryLines(venue.sensory)) notes.push(`${l.heading}: ${l.text.charAt(0).toLowerCase() + l.text.slice(1)} (${l.meta}).`);
    return { ...s, lines, notes, photos: photos.filter(p => s.kinds.includes(p.kind)) };
  });
}

function StepPhoto({ step, onOpen }) {
  const p = step.photos[0];
  return (
    <figure style={{ margin: `0 0 ${SPACE.sm}px` }}>
      <button type="button" onClick={() => onOpen(0)} className="ds-press"
        aria-label={`Open photo of the ${step.label.toLowerCase()}: ${p.alt}${step.photos.length > 1 ? ` (1 of ${step.photos.length})` : ''}`}
        style={{ display: 'block', width: '100%', padding: 0, border: `1.5px solid ${C2.line}`, borderRadius: RADIUS.md, overflow: 'hidden', background: C2.stone, cursor: 'zoom-in' }}>
        <img src={p.thumb} alt="" loading="lazy" style={{ display: 'block', width: '100%', aspectRatio: '4 / 3', objectFit: 'cover' }}/>
      </button>
      <figcaption style={{ ...TYPE.callout, color: C2.char, marginTop: SPACE.xs }}>
        “{p.alt}” <span style={{ ...TYPE.footnote, color: C2.slate }}>— photo by a {p.who.toLowerCase()}, {p.when}</span>
        {step.photos.length > 1 && <span style={{ ...TYPE.footnote, display: 'block', color: C2.slate }}>{plural(step.photos.length - 1, 'more photo')} — open to see them.</span>}
      </figcaption>
    </figure>
  );
}

export function WhatToExpect({ app, venue }) {
  const photos = useStoryPhotos(app, venue.id);
  const story = buildStory(venue, photos, app.origin);
  const [tab, setTab] = React.useState('arrival');
  const [viewer, setViewer] = React.useState(null); // { step, index }
  const closeViewer = React.useCallback(() => setViewer(null), []);
  const idBase = `story-${venue.id}`.replace(/[^\w-]/g, '_');

  // Worth showing once the community has said something beyond the address.
  const hasContent = story.some(s => s.lines.length || s.photos.length) || !!venue.sensory;
  if (!hasContent) return null;

  const i = Math.max(0, story.findIndex(s => s.id === tab));
  const step = story[i];
  const next = story[i + 1];
  const go = id => {
    setTab(id);
    requestAnimationFrame(() => document.getElementById(`${idBase}-tab-${id}`)?.focus());
  };

  return (
    <Card as="section" aria-labelledby={`${idBase}-h`} style={{ marginBottom: SPACE.md }}>
      <SectionHeader id={`${idBase}-h`} title="What to expect" size="sm"
        description="Your visit step by step, from reviewers’ photos and reports."/>
      <Tabs idBase={idBase} label="Steps of a visit" value={tab} onChange={setTab}
        tabs={story.map(s => ({ id: s.id, label: s.label }))} style={{ marginBottom: SPACE.sm }}/>
      {story.map(s => (
        <TabPanel key={s.id} idBase={idBase} id={s.id} active={s.id === tab}>
          <p className="ra-sr-only">Step {story.indexOf(s) + 1} of {story.length}: {s.label}</p>
          {s.photos.length > 0 && <StepPhoto step={s} onOpen={index => setViewer({ step: s.id, index })}/>}
          {s.notes.map(t => <p key={t} style={{ ...TYPE.callout, color: C2.char, margin: `0 0 ${SPACE.xxs}px` }}>{t}</p>)}
          {s.lines.length > 0 ? (
            <ul style={{ listStyle: 'none', margin: `${SPACE.xs}px 0 0`, padding: 0 }}>
              {s.lines.map(l => (
                <li key={l.key} style={{ display: 'flex', gap: SPACE.xs, ...TYPE.callout, color: C2.char, marginBottom: SPACE.xxs }}>
                  <span aria-hidden="true" style={{ fontWeight: 800, width: 16, flexShrink: 0, textAlign: 'center', color: l.kind === 'works' ? C2.green : l.kind === 'barrier' ? C2.red : C2.amber }}>{MARK[l.kind].sym}</span>
                  <span><span className="ra-sr-only">{MARK[l.kind].label}: </span>{l.text}</span>
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
          ? <Button variant="outline" size="sm" iconRight="forward" onClick={() => go(next.id)}>Next: {next.label}</Button>
          : <Button variant="ghost" size="sm" onClick={() => go(story[0].id)}>Back to the start</Button>}
      </div>
      <PhotoViewer photos={viewer ? story.find(s => s.id === viewer.step).photos : []} index={viewer?.index ?? null}
        onIndex={index => setViewer(v => ({ ...v, index }))} onClose={closeViewer}/>
    </Card>
  );
}
