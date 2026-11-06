// Getting there, stage 2 (I2) — what's around the arrival: accessible
// parking, drop-off points, accessible stops and wharves (rows in
// `facilities`, layer 'arrival'), and the community's step-by-step arrival
// notes (`arrival_steps`). Plain data, shared by server and client.
//
// Honesty rules (AGENTS.md):
// - Parking, stops and wharves are LISTINGS from OpenStreetMap: always shown
//   as "unconfirmed". They never change a verdict.
// - Arrival steps describe how to get in; they never change a verdict either.

export type ArrivalKind = 'accessible_parking' | 'drop_off' | 'accessible_stop' | 'wharf';
export const ARRIVAL_KINDS: ArrivalKind[] = ['accessible_parking', 'drop_off', 'accessible_stop', 'wharf'];
export const ARRIVAL_LAYER = 'arrival' as const;

// What OpenStreetMap kept for each kind (details jsonb).
export type ArrivalDetails = {
  osm: string[];                 // 'way/1382157002', … (every OSM object merged into this row)
  spaces?: number | null;        // accessible spaces, when OSM says how many
  fee?: 'yes' | 'no' | null;
  maxstay?: string | null;       // OSM's words, e.g. "12 hours"
  operator?: string | null;
  parking?: string | null;       // surface | street_side | multi-storey …
  dropOff?: 'taxi_rank' | 'drop_off';
  wheelchair?: 'yes' | 'limited' | null;
  mode?: 'bus' | 'ferry';
  ref?: string | null;           // stop number
  shelter?: boolean | null;
  bench?: boolean | null;
  tactilePaving?: boolean | null;
  lowTideNote?: boolean;         // ferry ramps get steeper at low tide
  rampFacilityId?: string;       // the beach-layer item with the ramp note
};

export const OSM = {
  name: 'OpenStreetMap',
  credit: '© OpenStreetMap contributors',
  licence: 'ODbL 1.0',
  licenceUrl: 'https://opendatacommons.org/licenses/odbl/1-0/',
  copyrightUrl: 'https://www.openstreetmap.org/copyright',
  fixUrl: (osm: string) => `https://www.openstreetmap.org/${osm}`,
};

// Northern Beaches Council publishes mobility parking on an interactive map
// with no download and no reuse licence (its site terms reserve all rights,
// November 2026), so we link to it instead of importing it.
export const COUNCIL_ACCESS_MAP = {
  name: 'Northern Beaches Council — Access your area',
  url: 'https://www.northernbeaches.nsw.gov.au/services/disability-services/access-your-area',
};

// "Nearby": further than this on foot and we say there's none listed close.
export const NEARBY_WALK_MINS = 15;

// ── Arrival steps (community) ────────────────────────────────────────────
export const ARRIVAL_STEP_MAX = 160;      // characters per step
export const ARRIVAL_STEPS_MAX = 6;       // steps per set
export const ARRIVAL_FROM_MAX = 80;       // "From The Corso"
export const ARRIVAL_STEP_MIN = 3;
