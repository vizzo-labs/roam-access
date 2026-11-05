'use client';

import React from 'react';
import { RA2_NEEDS } from '@/lib/pilot-data';
import { useVenueReviews } from './useVenueReviews';
import { V2Shell } from '../ui/Shell';
import { V2Verdict } from '../ui/Verdict';
import { C2, F2 } from '../ui/palette';
import { useV2Heading } from '../ui/useHeading';
import { Button, ChipGroup, EmptyState, FilterChip, GUTTER, PhotoGrid, PhotoViewer, SPACE, ScreenHeader, SkeletonList, SourceBadge } from '../ds';
import { useVenueSays, VenueReply } from './VenueSays';

// ─────────────────────────────────────────────────────────────
// ALL REVIEWS — filter by lived experience
// ─────────────────────────────────────────────────────────────
function V2AllReviews({ app }) {
  const v = app.venueById(app.selectedId);
  const h = useV2Heading('reviews-' + v.id);
  const [filter, setFilter] = React.useState('All');
  const { reviews: loaded, error } = useVenueReviews(app, v.id);
  const says = useVenueSays(v.id);
  const all = loaded || [];
  const filters = ['All', ...RA2_NEEDS.map(n => n.filter)];
  const shown = filter === 'All' ? all : all.filter(r => r.filters.includes(filter));
  const [viewer, setViewer] = React.useState(null); // { photos, index }
  const closeViewer = React.useCallback(() => setViewer(null), []);

  return (
    <V2Shell tabs app={app} active="home">
      <ScreenHeader compact headingRef={h} title={`${v.name} reviews`}
        back={{ label: `Back to ${v.name}`, onClick: () => app.goto('venue', v.id) }}
        subtitle={loaded ? `${all.length} ${all.length === 1 ? 'review' : 'reviews'} from the pilot` : error ? 'Couldn’t load reviews' : 'Loading reviews…'}/>

      <div style={{ padding: `${SPACE.md}px ${GUTTER}px 0` }}>
        <ChipGroup label="Filter reviews by lived experience" bleed>
          {filters.map(f => <FilterChip key={f} selected={filter === f} onChange={() => setFilter(f)}>{f}</FilterChip>)}
        </ChipGroup>
      </div>

      <div style={{ padding: `${SPACE.md}px ${GUTTER}px ${SPACE.xl}px` }}>
        {!loaded && !error && <SkeletonList variant="card" count={2} label="Loading reviews…"/>}
        {shown.map((r, i) => (
          <article key={r.id || i} style={{
            border: `1.5px solid ${C2.hair}`, borderRadius: 18, padding: 18, marginBottom: 12,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: C2.teal, fontFamily: F2 }}>{r.who}</span>
              <V2Verdict kind={r.v} label={{ works: 'It worked', check: 'Some barriers', barrier: 'Didn’t work' }[r.v]}/>
            </div>
            <p style={{ fontSize: 15.5, lineHeight: 1.5, margin: '0 0 12px', color: C2.char, fontFamily: F2 }}>{r.text}</p>
            {r.details && <p style={{ fontSize: 14, lineHeight: 1.5, margin: '0 0 12px', color: C2.slate, fontFamily: F2 }}>{r.details}</p>}
            {r.photos?.length > 0 && (
              <div style={{ margin: '0 0 12px' }}>
                <div style={{ marginBottom: 8 }}>
                  <SourceBadge source="photo">{r.photos.length === 1 ? 'With photo' : `With ${r.photos.length} photos`}</SourceBadge>
                </div>
                <PhotoGrid photos={r.photos} size={72} onOpen={i => setViewer({ photos: r.photos, index: i })}/>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: C2.slate, fontFamily: F2 }}>
                {r.when}{r.mine ? ' · yours' : ''}
              </span>
            </div>
            <VenueReply reply={says?.replies?.[r.id]} venueName={v.name}/>
          </article>
        ))}
        {loaded && !shown.length && (
          <EmptyState compact icon="users" title={`No reviews from “${filter}” yet`}
            body="Yours could be the first."
            secondary={filter !== 'All' ? { label: 'Show all reviews', onClick: () => setFilter('All') } : null}/>
        )}
        <Button full size="lg" icon="edit" onClick={() => app.goto('review', v.id)} style={{ marginTop: SPACE.sm }}>Share your experience</Button>
        <PhotoViewer photos={viewer?.photos || []} index={viewer ? viewer.index : null}
          onIndex={i => setViewer(x => ({ ...x, index: i }))} onClose={closeViewer}/>
      </div>
    </V2Shell>
  );
}

export { V2AllReviews };
