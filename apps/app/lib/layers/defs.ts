// Access layers (F3) — plain data shared by server and client: partner
// badges, temporary report types, facility kinds and their sources.
//
// Honesty rules (AGENTS.md) that shape everything here:
// - A partner badge is the PARTNER'S claim. It never changes a verdict, a
//   ranking, or which reviews are shown.
// - Toilets and beach items are listings from their source (government data,
//   council pages), shown as "listed by …", never as community-confirmed.
// - A temporary report is today's news, not a verdict: it expires.

export type BadgeId = 'companion_card' | 'sunflower' | 'aspect_autism_friendly' | 'atic' | 'changing_places';

export const BADGES: {
  id: BadgeId; label: string; short: string; partner: string; what: string; directory: string;
}[] = [
  { id: 'companion_card', label: 'Companion Card affiliate', short: 'Companion Card', partner: 'NSW Companion Card',
    what: 'Companion Card holders’ companions get in free.', directory: 'https://www.nsw.gov.au/community-services/companion-card' },
  { id: 'sunflower', label: 'Hidden Disabilities Sunflower member', short: 'Sunflower', partner: 'Hidden Disabilities Sunflower',
    what: 'Takes part in the Sunflower program for hidden disabilities.', directory: 'https://hdsunflower.com/au' },
  { id: 'aspect_autism_friendly', label: 'Aspect Autism Friendly', short: 'Autism Friendly', partner: 'Autism Spectrum Australia (Aspect)',
    what: 'Recognised by Aspect as autism friendly.', directory: 'https://www.autismspectrum.org.au' },
  { id: 'atic', label: 'ATIC accessible tourism accredited', short: 'ATIC accredited', partner: 'Australian Tourism Industry Council',
    what: 'Accredited under ATIC’s accessible tourism program.', directory: 'https://www.qualitytourismaustralia.com' },
  { id: 'changing_places', label: 'Changing Places toilet', short: 'Changing Places', partner: 'Changing Places Australia',
    what: 'Has a certified Changing Places toilet (hoist, adult change table, room for carers).', directory: 'https://changingplaces.org.au/find' },
];
export const BADGE_IDS = BADGES.map(b => b.id);

// ── Temporary reports ────────────────────────────────────────────────────
// `hours` = default life of a report; "Still there?" pushes the expiry to at
// least now + hours. `on` = where the type can be reported.
export type ReportTarget = 'venue' | 'toilets' | 'beach' | 'arrival';
export type ReportTypeId =
  | 'lift_out' | 'ramp_blocked' | 'roadworks' | 'event_noise' | 'toilet_closed'
  | 'low_tide' | 'matting_missing' | 'matting_down' | 'other';

export const REPORT_TYPES: {
  id: ReportTypeId; label: string; banner: string; hours: number; on: ReportTarget[]; positive?: boolean;
}[] = [
  { id: 'lift_out',        label: 'Lift out of order',                  banner: 'Lift out of order',                       hours: 72, on: ['venue'] },
  { id: 'ramp_blocked',    label: 'Ramp or step-free way blocked',      banner: 'Ramp or step-free way blocked',           hours: 48, on: ['venue', 'toilets', 'beach', 'arrival'] },
  { id: 'roadworks',       label: 'Roadworks or footpath closed',       banner: 'Roadworks or footpath closed nearby',     hours: 72, on: ['venue', 'toilets', 'beach', 'arrival'] },
  { id: 'event_noise',     label: 'Event or loud noise',                banner: 'Event on — expect noise and crowds',      hours: 24, on: ['venue', 'beach'] },
  { id: 'toilet_closed',   label: 'Accessible toilet closed or locked', banner: 'Accessible toilet closed or locked',      hours: 48, on: ['venue', 'toilets', 'beach'] },
  // Tides turn about every 6 hours, so a low-tide report goes stale fast.
  { id: 'low_tide',        label: 'Low tide — ramp is steep',           banner: 'Low tide — the ramp is steep',            hours: 6,  on: ['beach'] },
  // "Is there matting today?" — the two answers are reports too.
  { id: 'matting_missing', label: 'No beach matting today',             banner: 'No beach matting today',                  hours: 12, on: ['beach'] },
  { id: 'matting_down',    label: 'Beach matting is down',              banner: 'Beach matting is down today',             hours: 12, on: ['beach'], positive: true },
  { id: 'other',           label: 'Something else',                     banner: 'Temporary problem reported',              hours: 48, on: ['venue', 'toilets', 'beach', 'arrival'] },
];
export const REPORT_TYPE_IDS = REPORT_TYPES.map(t => t.id);
export const reportType = (id: string) => REPORT_TYPES.find(t => t.id === id);
// Answering the matting question replaces the opposite answer.
export const REPORT_OPPOSITE: Partial<Record<ReportTypeId, ReportTypeId>> = {
  matting_missing: 'matting_down', matting_down: 'matting_missing',
};
export const REPORT_NOTE_MAX = 280;

// ── Facilities ───────────────────────────────────────────────────────────
// 'arrival' (I2): parking, drop-off, accessible stops, wharves — see lib/arrival/places.ts.
export type FacilityLayer = 'toilets' | 'beach' | 'arrival';
export type FacilityKind = 'toilet' | 'beach' | 'liberty_swing' | 'ferry' | 'walk'
  | 'accessible_parking' | 'drop_off' | 'accessible_stop' | 'wharf';

export const FACILITY_KINDS: { id: FacilityKind; label: string; layer: FacilityLayer }[] = [
  { id: 'toilet', label: 'Public toilet', layer: 'toilets' },
  { id: 'beach', label: 'Beach', layer: 'beach' },
  { id: 'liberty_swing', label: 'Liberty Swing', layer: 'beach' },
  { id: 'ferry', label: 'Ferry wharf', layer: 'beach' },
  { id: 'walk', label: 'Accessible walk', layer: 'beach' },
  { id: 'accessible_parking', label: 'Accessible parking', layer: 'arrival' },
  { id: 'drop_off', label: 'Drop-off point', layer: 'arrival' },
  { id: 'accessible_stop', label: 'Accessible stop', layer: 'arrival' },
  { id: 'wharf', label: 'Ferry wharf', layer: 'arrival' },
];

export const NPTM = {
  name: 'National Public Toilet Map',
  owner: 'Australian Government Department of Health, Disability and Ageing',
  licence: 'CC BY 3.0 AU',
  licenceUrl: 'https://creativecommons.org/licenses/by/3.0/au/',
  datasetUrl: 'https://data.gov.au/data/dataset/national-public-toilet-map',
  siteUrl: 'https://toiletmap.gov.au',
};

export const MLAK_URL = 'https://masterlocksmiths.com.au/mlak/';
export const CHANGING_PLACES_FINDER = 'https://changingplaces.org.au/find';

// Toilet attributes kept from the National Public Toilet Map export.
export type ToiletDetails = {
  accessible: boolean; ambulant: boolean; unisex: boolean;
  mlak24: boolean; mlakAfterHours: boolean; keyRequired: boolean; paymentRequired: boolean;
  adultChange: boolean; changingPlaces: boolean; byoSling: boolean; acShower: boolean;
  shower: boolean; babyChange: boolean; parkingAccessible: boolean;
  lhTransfer: boolean; rhTransfer: boolean;
  openingHours: string | null; openingHoursNote: string | null;
  accessNote: string | null; toiletNote: string | null; adultChangeNote: string | null;
  facilityType: string | null;
};

// Beach items: what the source lists there.
export type BeachDetails = {
  features?: string[];   // "Free beach wheelchair (book ahead)", "Accessible showers" …
  bookings?: { label: string; url?: string; phone?: string }[];
  mattingQuestion?: boolean;
  lowTideNote?: boolean;
  sources?: { label: string; url: string }[];
};
