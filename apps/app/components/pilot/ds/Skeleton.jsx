'use client';

import React from 'react';
import { C2 } from '../ui/palette';
import { GUTTER, RADIUS, SPACE } from './tokens';

// Skeletons hold the layout while data loads. The shapes are hidden from
// assistive tech; ONE status message ("Loading places…") is announced by the
// wrapper. The shimmer stops when motion is reduced (ds.css).

function Skeleton({ width = '100%', height = 16, radius = RADIUS.sm, style }) {
  return <span aria-hidden="true" className="ds-skel" style={{ display: 'block', width, height, borderRadius: radius, ...style }}/>;
}

function SkeletonText({ lines = 2, lastWidth = '60%', size = 14, gap = 8 }) {
  return (
    <span aria-hidden="true" style={{ display: 'flex', flexDirection: 'column', gap }}>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} height={size} width={i === lines - 1 && lines > 1 ? lastWidth : '100%'}/>
      ))}
    </span>
  );
}

// A place row: title, subtitle, verdict pill.
function SkeletonRow({ padX = GUTTER }) {
  return (
    <div aria-hidden="true" style={{ display: 'flex', alignItems: 'center', gap: SPACE.sm, padding: `16px ${padX}px`, borderTop: `1px solid ${C2.hair}` }}>
      <div style={{ flex: 1 }}>
        <Skeleton width="55%" height={17}/>
        <Skeleton width="38%" height={13} style={{ marginTop: 8 }}/>
      </div>
      <Skeleton width={104} height={30} radius={RADIUS.pill}/>
    </div>
  );
}

function SkeletonCard({ media = false, lines = 2 }) {
  return (
    <div aria-hidden="true" style={{ border: `1.5px solid ${C2.hair}`, borderRadius: RADIUS.lg, overflow: 'hidden' }}>
      {media && <Skeleton height={140} radius={0}/>}
      <div style={{ padding: SPACE.md }}>
        <Skeleton width="50%" height={18} style={{ marginBottom: 12 }}/>
        <SkeletonText lines={lines}/>
      </div>
    </div>
  );
}

// Loading region: announces `label` once, shows `count` placeholder rows.
function SkeletonList({ label = 'Loading places…', count = 5, variant = 'row', padX }) {
  return (
    <div role="status" aria-live="polite">
      <span className="ra-sr-only">{label}</span>
      {variant === 'card'
        ? <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE.sm }}>{Array.from({ length: count }, (_, i) => <SkeletonCard key={i}/>)}</div>
        : Array.from({ length: count }, (_, i) => <SkeletonRow key={i} padX={padX}/>)}
    </div>
  );
}

export { Skeleton, SkeletonText, SkeletonRow, SkeletonCard, SkeletonList };
