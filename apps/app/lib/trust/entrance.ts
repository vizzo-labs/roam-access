// #5 Entrance nuance — asked after "Step-free way in? No" so a step at the
// main door doesn't hide a ramp round the side. Shared by the review form and
// the view model. Values match reviews.entrance_alt (migration 202611061445).
import type { EntranceAlt } from '../db/schema';

// "Step-free way in through another entrance?" — where the reviewer found it.
export const ENTRANCE_ALTS: { id: EntranceAlt; label: string; where: string; short: string }[] = [
  { id: 'side',  label: 'Yes, at the side',      where: 'at the side',              short: 'Step-free side entrance' },
  { id: 'back',  label: 'Yes, at the back',      where: 'at the back',              short: 'Step-free back entrance' },
  { id: 'lift',  label: 'Yes, via a lift',       where: 'via a lift',               short: 'Step-free via a lift' },
  { id: 'other', label: 'Yes, somewhere else',   where: 'through another door',     short: 'Another step-free entrance' },
  { id: 'none',  label: 'No other way in',       where: '',                         short: 'No step-free way in' },
];

export const ENTRANCE_NOTE_MAX = 120;
