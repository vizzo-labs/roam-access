// Getting there 6 · "Route avoiding mapped steps" — what GET /api/route returns.
// Shared by the server (lib/routing/*) and the client (arrival/RouteAvoidingSteps).
// Plain data only: the client turns every code here into words with t().
//
// Honesty: a route is OpenStreetMap data run through Valhalla, never checked
// by people. It never changes a verdict, and the app always labels it
// "Route avoiding mapped steps · Based on OpenStreetMap, not checked by people".

export type LngLat = [number, number];

/** Slope class of a stretch, from the elevation model (≈30 m resolution). */
export type Grade = 'gentle' | 'moderate' | 'steep';
/** 5% and 8%: AS 1428.1 walkways are 1:20 (5%); 8% is where many manual wheelchair users struggle. */
export const MODERATE_GRADE = 5;
export const STEEP_GRADE = 8;
/** A route that ends further than this from where it should is flagged. */
export const END_GAP_M = 25;

export type RouteStep = {
  /** start · continue · slightLeft · left · sharpLeft · slightRight · right · sharpRight · uturn · roundabout · lift · enter · exit · arrive */
  type: string;
  street: string | null;        // OSM name (a proper noun), or null for an unnamed path
  /** For unnamed ways: what it is (from Valhalla's edge use). */
  way?: 'crossing' | 'footpath' | 'path' | 'street';
  m: number;                    // metres until the next step
  at: LngLat;
};

export type CheckKind =
  | 'kerbUnknown'   // crossings with no kerb mapped (or only one side, or height unknown)
  | 'kerbRaised'    // a crossing mapped with a raised kerb (only if the router used it anyway)
  | 'kerbRolled'    // rolled (mountable) kerb
  | 'steep' | 'moderate'
  | 'incline'       // an `incline` tag on a path
  | 'surface'       // unsealed surface
  | 'steps'         // mapped steps on the route (should never happen)
  | 'lift'          // a lift on the way
  | 'endGap'        // the route stops short of the entrance / place
  | 'noEntrance'    // no confirmed step-free entrance: ends at the place's map point
  | 'barrier'       // a temporary report near the route that we couldn't avoid
  | 'venueReport';  // a temporary report at the place itself

/** A place on the route: a crossing (kerbs), or a 5–8% slope (grade, m, up). */
export type RoutePoint = { at: LngLat; near: string | null; n?: number; grade?: number; m?: number; up?: boolean };

export type RouteCheck = {
  kind: CheckKind;
  /** Map marker number (1…) when this check has a place on the map. */
  n?: number;
  at?: LngLat;
  points?: RoutePoint[];         // kerbUnknown: every crossing
  near?: string | null;          // street name nearby (OSM)
  m?: number;                    // length (steep, surface) or distance (endGap)
  grade?: number;                // steep / moderate: max grade, %
  up?: boolean;                  // steep / moderate: uphill in the direction of travel
  value?: string;                // incline tag, surface, report type …
  date?: string;                 // reports: when it was last confirmed
  count?: number;
};

export type RouteSegment = { grade: Grade; coords: LngLat[] };

export type RouteEnd = {
  lat: number; lng: number;
  /** entrance: a community-marked step-free entrance · venue: the place's map point */
  kind: 'entrance' | 'venue';
  entranceKind?: string;
};

export type RouteFrom = { lat: number; lng: number; kind: 'wharf' | 'me' };

export type RouteVM = {
  status: 'ok' | 'partial' | 'none';
  from: RouteFrom;
  to: RouteEnd;
  /** Present unless status is 'none'. */
  summary?: { m: number; minutes: number; climbM: number; descentM: number };
  segments?: RouteSegment[];
  steps?: RouteStep[];
  checks: RouteCheck[];
  crossings?: { total: number; lowered: number; unknown: number; raised: number };
  /** Temporary reports the route was sent around. */
  avoided: { type: string; name: string; date: string }[];
  /** status 'partial': how close a route without steps gets. */
  partial?: { gapM: number; steps: number; at: LngLat };
  /** Why we picked this route over Valhalla's first choice, if we did. */
  chose?: 'fewerUnknownKerbs' | null;
  source: { osmDate: string | null; engine: 'valhalla' };
};
