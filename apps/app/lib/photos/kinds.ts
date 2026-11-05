// Shared by server and client. Plain data only.

export type PhotoKind = 'entrance' | 'toilet' | 'step' | 'seating' | 'other';

export const PHOTO_KINDS: { id: PhotoKind; label: string }[] = [
  { id: 'entrance', label: 'Entrance' },
  { id: 'toilet',   label: 'Toilet' },
  { id: 'step',     label: 'Step or ramp' },
  { id: 'seating',  label: 'Seating' },
  { id: 'other',    label: 'Something else' },
];
export const PHOTO_KIND_IDS = PHOTO_KINDS.map(k => k.id);

export const MAX_PHOTOS_PER_REVIEW = 5;
export const ALT_MIN = 5;
export const ALT_MAX = 250;

// Client resizes to these before upload; the server enforces the byte caps.
export const PHOTO_MAX_EDGE = 1600;
export const THUMB_MAX_EDGE = 480;
export const PHOTO_MAX_BYTES = 2_500_000;
export const THUMB_MAX_BYTES = 400_000;

// The review questions a photo can suggest an answer for (#16).
export const SUGGESTABLE = ['stepfree', 'bathroom', 'seats'] as const;
export type SuggestableId = typeof SUGGESTABLE[number];

// Per-user daily limits for the AI features (Australia/Sydney day).
export const AI_LIMITS = { ask: 20, photo: 30 } as const;
