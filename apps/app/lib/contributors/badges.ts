// Contributor badges — for PEOPLE, computed from what they already did (no
// badge table). Not to be confused with venue (partner) badges in
// `venue_badges`. Only visible content counts: hidden reviews, photos,
// entrances and arrival steps don't. Pure, so the app and pages share it.
// Badges are recognition only: they never change a verdict or a ranking.

export type ContribCounts = {
  reviews: number;     // visible reviews
  entrances: number;   // step-free entrances marked (visible)
  photos: number;      // described photos on visible reviews or arrival steps
  steps: number;       // visible arrival-step sets
  helped: number;      // distinct people who said "This helped me"
  founding: boolean;   // joined before FOUNDING_BEFORE
  mapper: boolean;     // joined a mapping event
};

export type BadgeId =
  | 'first' | 'regular' | 'local' | 'champion'
  | 'entrance' | 'photographer' | 'pathfinder' | 'founding' | 'mapper';

type Def = { id: BadgeId; icon: string; count?: keyof ContribCounts; goal?: number; flag?: 'founding' | 'mapper' };

// In display order. `icon` is a design-system Icon name.
export const BADGES: Def[] = [
  { id: 'first', icon: 'edit', count: 'reviews', goal: 1 },
  { id: 'regular', icon: 'star', count: 'reviews', goal: 5 },
  { id: 'local', icon: 'pin', count: 'reviews', goal: 15 },
  { id: 'champion', icon: 'sparkle', count: 'reviews', goal: 50 },
  { id: 'entrance', icon: 'directions', count: 'entrances', goal: 3 },
  { id: 'photographer', icon: 'camera', count: 'photos', goal: 10 },
  { id: 'pathfinder', icon: 'map', count: 'steps', goal: 3 },
  { id: 'founding', icon: 'flag', flag: 'founding' },
  { id: 'mapper', icon: 'users', flag: 'mapper' },
];

export type BadgeState = { id: BadgeId; icon: string; earned: boolean; have: number; goal: number };

export function badgeStates(c: ContribCounts): BadgeState[] {
  return BADGES.map(b => {
    if (b.flag) {
      const earned = !!c[b.flag];
      return { id: b.id, icon: b.icon, earned, have: earned ? 1 : 0, goal: 1 };
    }
    const have = Number(c[b.count!] || 0);
    return { id: b.id, icon: b.icon, earned: have >= b.goal!, have: Math.min(have, b.goal!), goal: b.goal! };
  });
}

export const earnedBadges = (c: ContribCounts) => badgeStates(c).filter(b => b.earned).map(b => b.id);
