'use client';

import React from 'react';
import { C2 } from '../ui/palette';
import { V2Logo } from '../ui/Logo';
import { GUTTER, RADIUS, SPACE, Skeleton, SkeletonList } from '../ds';

// While the pilot's data loads: the shape of Home (greeting, voice button,
// search, a list) instead of a blank screen. One "Loading places…" status.
function AppSkeleton() {
  return (
    <div style={{ position: 'absolute', inset: 0, background: C2.paper, overflow: 'hidden', paddingTop: 'var(--ra-shell-top, 18px)' }}>
      <div style={{ maxWidth: 480 }}>
      <div style={{ padding: `10px ${GUTTER}px 0` }}>
        <V2Logo size={26}/>
        <div aria-hidden="true" style={{ marginTop: SPACE.xl }}>
          <Skeleton width="45%" height={30}/>
          <Skeleton width="80%" height={30} style={{ marginTop: 10 }}/>
          <Skeleton height={92} radius={RADIUS.lg + 2} style={{ marginTop: SPACE.xl }}/>
          <Skeleton height={56} radius={RADIUS.pill} style={{ marginTop: 10 }}/>
          <Skeleton width="35%" height={18} style={{ marginTop: SPACE.xl }}/>
        </div>
      </div>
      <div style={{ marginTop: SPACE.sm }}>
        <SkeletonList count={4}/>
      </div>
      </div>
    </div>
  );
}

export { AppSkeleton };
