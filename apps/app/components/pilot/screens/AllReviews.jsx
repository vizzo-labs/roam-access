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
import { UserText, useFormat, useT } from '../i18n';
import { localPhoto, reviewItems, reviewText, reviewWhen, reviewWho } from '../trust/text';

// ─────────────────────────────────────────────────────────────
// ALL REVIEWS — filter by lived experience
// ─────────────────────────────────────────────────────────────
function V2AllReviews({ app }) {
  const t = useT();
  const fmt = useFormat();
  const v = app.venueById(app.selectedId);
  const h = useV2Heading('reviews-' + v.id);
  const [filter, setFilter] = React.useState('all'); // 'all' or a need id
  const { reviews: loaded, error } = useVenueReviews(app, v.id);
  const says = useVenueSays(v.id);
  const all = loaded || [];
  const filters = ['all', ...RA2_NEEDS.map(n => n.id)];
  const filterLabel = f => (f === 'all' ? t('review.all.everyone') : t(`data.need.${f}.filter`));
  const needFilter = id => RA2_NEEDS.find(n => n.id === id)?.filter;
  const shown = filter === 'all' ? all : all.filter(r => (r.needs ? r.needs.includes(filter) : r.filters.includes(needFilter(filter))));
  const photosOf = r => (r.photos || []).map(p => localPhoto(t, fmt, p));
  const [viewer, setViewer] = React.useState(null); // { photos, index }
  const closeViewer = () => setViewer(null);

  return (
    <V2Shell tabs app={app} active="home">
      <ScreenHeader compact headingRef={h} title={t('review.all.title', { name: v.name })}
        back={{ label: t('review.all.back', { name: v.name }), onClick: () => app.goto('venue', v.id) }}
        subtitle={loaded ? t('review.all.count', { count: all.length }) : error ? t('review.all.failed') : t('review.all.loading')}/>

      <div style={{ padding: `${SPACE.md}px ${GUTTER}px 0` }}>
        <ChipGroup label={t('review.all.filter')} bleed>
          {filters.map(f => <FilterChip key={f} selected={filter === f} onChange={() => setFilter(f)}>{filterLabel(f)}</FilterChip>)}
        </ChipGroup>
      </div>

      <div style={{ padding: `${SPACE.md}px ${GUTTER}px ${SPACE.xl}px` }}>
        {!loaded && !error && <SkeletonList variant="card" count={2} label={t('review.all.loading')}/>}
        {shown.map((r, i) => (
          <article key={r.id || i} style={{
            border: `1.5px solid ${C2.hair}`, borderRadius: 18, padding: 18, marginBottom: 12,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: C2.teal, fontFamily: F2 }}>{reviewWho(t, r)}</span>
              <V2Verdict kind={r.v} label={t(`review.v.${r.v}`)}/>
            </div>
            <p style={{ fontSize: 15.5, lineHeight: 1.5, margin: '0 0 12px', color: C2.char, fontFamily: F2 }}>
              {r.own === false ? reviewText(t, r) : <UserText>{r.text}</UserText>}
            </p>
            {(r.items?.length > 0 || r.details) && (
              <p style={{ fontSize: 14, lineHeight: 1.5, margin: '0 0 12px', color: C2.slate, fontFamily: F2 }}>
                {reviewItems(t, fmt, r).map((it, k) => (
                  <React.Fragment key={k}>
                    {k > 0 && ' · '}
                    {it.ok === null ? it.text : (
                      <><span aria-hidden="true">{it.ok ? '✓' : '✗'} </span><span className="ra-sr-only">{t(it.ok ? 'review.item.yes' : 'review.item.no')} </span>{it.text}</>
                    )}
                  </React.Fragment>
                ))}
              </p>
            )}
            {r.photos?.length > 0 && (
              <div style={{ margin: '0 0 12px' }}>
                <div style={{ marginBottom: 8 }}>
                  <SourceBadge source="photo">{t('review.all.withPhotos', { count: r.photos.length })}</SourceBadge>
                </div>
                <PhotoGrid photos={photosOf(r)} size={72} onOpen={i => setViewer({ photos: photosOf(r), index: i })}/>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: C2.slate, fontFamily: F2 }}>
                {reviewWhen(fmt, r)}{r.mine ? ` · ${t('review.yours')}` : ''}
              </span>
            </div>
            <VenueReply reply={says?.replies?.[r.id]} venueName={v.name}/>
          </article>
        ))}
        {loaded && !shown.length && (
          <EmptyState compact icon="users" title={t('review.all.noneFor', { filter: filterLabel(filter) })}
            body={t('review.all.firstHint')}
            secondary={filter !== 'all' ? { label: t('review.all.showAll'), onClick: () => setFilter('all') } : null}/>
        )}
        <Button full size="lg" icon="edit" onClick={() => app.goto('review', v.id)} style={{ marginTop: SPACE.sm }}>{t('venue.writeReview')}</Button>
        <PhotoViewer photos={viewer?.photos || []} index={viewer ? viewer.index : null}
          onIndex={i => setViewer(x => ({ ...x, index: i }))} onClose={closeViewer}/>
      </div>
    </V2Shell>
  );
}

export { V2AllReviews };
