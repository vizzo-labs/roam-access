'use client';
// /ds samples for the place preview card: photo · no photo · no info yet
// (with the "Answer 1 question" micro-task) · a temporary barrier, plus the
// phone's bottom-sheet variant. Fictional places only.

import React from 'react';
import { ra2Verdict } from '@/lib/pilot/match';
import { PlacePreviewCard } from './PlacePreviewCard';
import { C2 } from '../ui/palette';
import { RADIUS, SPACE, TYPE } from '../ds';

const NEEDS = ['mobility'];
const ago = d => new Date(Date.now() - d * 86400000).toISOString();
const fact = (tag, kind, d = 2) => ({ t: '', s: '', tags: [tag], src: 'community', kind, n: 1, last: ago(d) });
const base = { area: 'Sample area', lat: -33.8, lng: 151.28, mins: 4, cat: 'food', works: [], check: [], barriers: [], ev: [] };

const PLACES = [
  { label: 'With a photo · works for you', place: {
    ...base, id: 'ds-pp-a', name: 'Sample Café', kind: 'Cafe',
    works: [fact('stepfree', 'feature'), fact('bathroom', 'feature')],
    ev: [{ n: ['mobility'], f: ['stepfree', 'bathroom'], at: ago(2) }],
    coverPhoto: { url: '/icons/icon-512.png', alt: 'Sample: wide level doorway with an automatic door' },
  } },
  { label: 'No photo · check first (one fact unconfirmed)', place: {
    ...base, id: 'ds-pp-b', name: 'Harbour Kiosk (sample)', kind: 'Takeaway', mins: 7,
    works: [fact('stepfree', 'feature', 9)],
    check: [{ t: '', s: '', tags: ['bathroom'], src: 'osm', kind: 'hint' }],
    ev: [{ n: ['mobility'], f: ['stepfree'], at: ago(9) }],
  } },
  { label: 'No info yet · Answer 1 question', place: {
    ...base, id: 'ds-pp-c', name: 'Demo Beach Pool', kind: 'Ocean pool', cat: 'parks', mins: 12,
  } },
  { label: 'Temporary barrier · has barriers', place: {
    ...base, id: 'ds-pp-d', name: 'Example Gallery', kind: 'Gallery', cat: 'arts', mins: 8,
    barriers: [fact('stepfree', 'absence', 20)], works: [fact('bathroom', 'feature', 20)],
    ev: [{ n: ['mobility'], f: ['stepfree', 'bathroom'], at: ago(20) }],
  }, reports: [{ id: 'ds-r1', type: 'lift_out' }] },
];

export function PlacePreviewSamples() {
  const [saved, setSaved] = React.useState({});
  const [, force] = React.useReducer(x => x + 1, 0);
  const props = (p) => ({
    place: { ...p, verdict: ra2Verdict(p, NEEDS) }, needs: NEEDS,
    saved: !!saved[p.id], onToggleSave: () => setSaved(s => ({ ...s, [p.id]: !s[p.id] })),
    onDetails: () => {}, onClose: () => {}, onAddPhoto: () => {}, directionsHref: '#',
    onAnswer: () => new Promise(r => setTimeout(() => { force(); r(true); }, 400)),
  });
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(400px, 100%), 1fr))', gap: SPACE.lg, alignItems: 'start' }}>
        {PLACES.map(({ label, place, reports }) => (
          <div key={place.id}>
            <p style={{ ...TYPE.overline, color: C2.slate, margin: '0 0 8px' }}>{label}</p>
            <PlacePreviewCard {...props(place)} reports={reports} headingLevel={3} dialog={false} style={{ maxWidth: 400 }}/>
          </div>
        ))}
      </div>
      <p style={{ ...TYPE.overline, color: C2.slate, margin: '24px 0 8px' }}>Phone · top of the bottom sheet (compact)</p>
      <div style={{ width: 390, maxWidth: '100%', border: `1.5px solid ${C2.line}`, borderRadius: RADIUS.xl, padding: `${SPACE.md}px 22px`, boxSizing: 'border-box' }}>
        <PlacePreviewCard {...props(PLACES[0].place)} variant="sheet" headingLevel={3} dialog={false}/>
      </div>
    </>
  );
}
