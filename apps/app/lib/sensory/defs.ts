// Sensory content (#17) — shared by server and client. Plain data only.
// Sensory facts describe the place (noise, light, crowds, quiet times). They
// come from community reports and NEVER change a verdict.

import type { SensoryNoise, SensoryLight, SensoryCrowd, SensorySlot, SensoryDayKind } from '../db/schema';

export type { SensoryNoise, SensoryLight, SensoryCrowd, SensorySlot, SensoryDayKind };
export type SensoryDim = 'noise' | 'light' | 'crowd';

type Opt<T extends string> = { id: T; label: string; fact: string; tone: 'calm' | 'mid' | 'intense' };

// `label` = the answer button; `fact` = how it reads in the venue summary.
export const NOISE: Opt<SensoryNoise>[] = [
  { id: 'quiet', label: 'Quiet',      fact: 'Quiet',              tone: 'calm' },
  { id: 'some',  label: 'Some noise', fact: 'Some noise',         tone: 'mid' },
  { id: 'loud',  label: 'Loud',       fact: 'Loud',               tone: 'intense' },
];
export const LIGHT: Opt<SensoryLight>[] = [
  { id: 'soft',   label: 'Soft or natural',     fact: 'Soft or natural light', tone: 'calm' },
  { id: 'bright', label: 'Bright',              fact: 'Bright light',          tone: 'mid' },
  { id: 'harsh',  label: 'Harsh or flickering', fact: 'Harsh or flickering light', tone: 'intense' },
];
export const CROWD: Opt<SensoryCrowd>[] = [
  { id: 'few',  label: 'Few people', fact: 'Few people',   tone: 'calm' },
  { id: 'some', label: 'Some people', fact: 'Some people', tone: 'mid' },
  { id: 'busy', label: 'Crowded',    fact: 'Crowded',      tone: 'intense' },
];
export const SENSORY_DIMS: { id: SensoryDim; question: string; heading: string; options: Opt<string>[] }[] = [
  { id: 'noise', question: 'How noisy was it?',     heading: 'Noise',  options: NOISE },
  { id: 'light', question: 'What was the lighting like?', heading: 'Light', options: LIGHT },
  { id: 'crowd', question: 'How crowded was it?',   heading: 'Crowds', options: CROWD },
];

// Times of day, in Sydney time. `phrase` completes "Usually quiet …".
export const SLOTS: { id: SensorySlot; label: string; phrase: string; from: number; to: number }[] = [
  { id: 'early',     label: 'Before 10am',  phrase: 'before 10am',       from: 0,  to: 10 },
  { id: 'midday',    label: '10am to 2pm',  phrase: 'from 10am to 2pm',  from: 10, to: 14 },
  { id: 'afternoon', label: '2pm to 5pm',   phrase: 'from 2pm to 5pm',   from: 14, to: 17 },
  { id: 'evening',   label: 'After 5pm',    phrase: 'after 5pm',         from: 17, to: 24 },
];
export const DAY_KINDS: { id: SensoryDayKind; label: string; phrase: string }[] = [
  { id: 'weekday', label: 'Weekday', phrase: 'on weekdays' },
  { id: 'weekend', label: 'Weekend', phrase: 'on weekends' },
];

export const NOISE_IDS = NOISE.map(o => o.id);
export const LIGHT_IDS = LIGHT.map(o => o.id);
export const CROWD_IDS = CROWD.map(o => o.id);
export const SLOT_IDS = SLOTS.map(s => s.id);
export const DAY_KIND_IDS = DAY_KINDS.map(d => d.id);

// A check-in counts as "right now" for this long.
export const LIVE_WINDOW_MS = 90 * 60 * 1000;
// One check-in per person per place inside this window (a new one replaces it).
export const CHECKIN_REPLACE_MS = 2 * 3600 * 1000;

const TZ = 'Australia/Sydney';
const hourFmt = new Intl.DateTimeFormat('en-AU', { timeZone: TZ, hour: 'numeric', hourCycle: 'h23' });
const dayFmt = new Intl.DateTimeFormat('en-AU', { timeZone: TZ, weekday: 'short' });

/** The time-of-day slot a moment falls in, in Sydney time. */
export function slotOf(d: Date | string | number): SensorySlot {
  const h = Number(hourFmt.format(new Date(d))) % 24;
  return SLOTS.find(s => h >= s.from && h < s.to)!.id;
}
export function dayKindOf(d: Date | string | number): SensoryDayKind {
  const w = dayFmt.format(new Date(d));
  return w === 'Sat' || w === 'Sun' ? 'weekend' : 'weekday';
}

export const slotLabel = (id: string) => SLOTS.find(s => s.id === id)?.label ?? id;
export const optionOf = (dim: SensoryDim, id: string | null | undefined) =>
  id ? SENSORY_DIMS.find(d => d.id === dim)!.options.find(o => o.id === id) ?? null : null;

/** quiet | busy | some — how one observation reads for "quiet times". */
export function classify(o: { noise?: string | null; crowd?: string | null }): 'quiet' | 'busy' | 'some' | null {
  if (!o.noise && !o.crowd) return null;
  if (o.noise === 'loud' || o.crowd === 'busy') return 'busy';
  if (o.noise === 'quiet' || (!o.noise && o.crowd === 'few')) return 'quiet';
  return 'some';
}
