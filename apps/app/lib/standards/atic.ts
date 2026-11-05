// How Roam Access needs and review questions line up with the five ATIC
// Accessible Tourism categories (Australian Tourism Industry Council, run by
// Quality Tourism Australia). Documented in docs/standards.md. Plain data —
// shared by the council report, the A11yJSON export and the docs.

import type { FeatureId, NeedId } from '../pilot-data';

export type AticId = 'wheelchair' | 'mobility' | 'hearing' | 'vision' | 'cognitive';

export const ATIC_CATEGORIES: { id: AticId; label: string }[] = [
  { id: 'wheelchair', label: 'Wheelchair / scooter users' },
  { id: 'mobility',   label: 'Limited mobility' },
  { id: 'hearing',    label: 'Deaf or hard of hearing' },
  { id: 'vision',     label: 'Blind or low vision' },
  { id: 'cognitive',  label: 'Cognitive, including autism' },
];

// fit: 'direct' = same group of people; 'partial' = overlaps, ATIC has no exact category.
export const NEED_TO_ATIC: Record<NeedId, { atic: AticId[]; fit: 'direct' | 'partial'; note?: string }> = {
  mobility:  { atic: ['wheelchair', 'mobility'], fit: 'direct' },
  vision:    { atic: ['vision'], fit: 'direct' },
  hearing:   { atic: ['hearing'], fit: 'direct' },
  autism:    { atic: ['cognitive'], fit: 'direct' },
  cognitive: { atic: ['cognitive'], fit: 'direct' },
  mental:    { atic: ['cognitive'], fit: 'partial', note: 'ATIC has no category for mental health or anxiety; calm spaces sit closest to its cognitive category.' },
  chronic:   { atic: ['mobility'], fit: 'partial', note: 'ATIC has no category for chronic illness or fatigue; seating and rest spots sit under limited mobility.' },
};

export const FEATURE_TO_ATIC: Record<FeatureId, AticId[]> = {
  stepfree: ['wheelchair', 'mobility'],
  bathroom: ['wheelchair'],
  seats:    ['mobility'],
  hearing:  ['hearing'],
  vision:   ['vision'],
  quiet:    ['cognitive'],
  calm:     ['cognitive'],
  simple:   ['cognitive'],
};

export const aticLabel = (id: AticId) => ATIC_CATEGORIES.find(c => c.id === id)?.label ?? id;
