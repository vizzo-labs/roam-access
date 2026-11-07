'use client';

import React from 'react';
import { Card, PhotoGrid, PhotoViewer, SectionHeader, SourceBadge, SPACE } from '../ds';
import { useFormat, useT } from '../i18n';
import { localPhoto } from '../trust/text';
import { C2 } from '../ui/palette';

// Venue page gallery: photos from visible reviews only. Hidden by an admin =
// gone from here (images are private and served through an auth check).
// Then, always AFTER the community's and labelled "From the venue", the
// photos the venue uploaded (business portal v2) — never the cover photo.
function useVenuePhotos(app, id) {
  const [photos, setPhotos] = React.useState(null);
  React.useEffect(() => {
    let live = true;
    fetch(`/api/venues/${encodeURIComponent(id)}/photos`)
      .then(r => (r.ok ? r.json() : { photos: [] }))
      .then(d => { if (live) setPhotos({ community: d.photos || [], venue: d.venuePhotos || [] }); }, () => { if (live) setPhotos({ community: [], venue: [] }); });
    return () => { live = false; };
  }, [id, app.reviewsVersion]);
  return photos;
}

// The venue's photos carry their provenance in the kind label, so the
// thumbnail's name and the viewer both say "from the venue".
const venuePhoto = (t, p) => ({ ...p, kindLabel: t('owner.photo.kind', { kind: t(`photos.kind.${p.kind}`) }), who: null, when: null });

function VenuePhotos({ app, venueId }) {
  const t = useT();
  const fmt = useFormat();
  const raw = useVenuePhotos(app, venueId);
  const photos = raw && raw.community.map(p => localPhoto(t, fmt, p));
  const fromVenue = raw && raw.venue.map(p => venuePhoto(t, p));
  const [open, setOpen] = React.useState(null);
  const [openVenue, setOpenVenue] = React.useState(null);
  const close = React.useCallback(() => setOpen(null), []);
  const closeVenue = React.useCallback(() => setOpenVenue(null), []);
  if (!raw || (!photos.length && !fromVenue.length)) return null;
  return (
    <>
      {photos.length > 0 && (
        <Card as="section" aria-labelledby="venue-photos-h" style={{ marginBottom: SPACE.md }}>
          <SectionHeader id="venue-photos-h" title={t('photos.gallery.title')} size="sm"
            description={t('photos.gallery.description', { count: photos.length })}/>
          <PhotoGrid photos={photos} onOpen={setOpen}/>
          <PhotoViewer photos={photos} index={open} onIndex={setOpen} onClose={close}/>
        </Card>
      )}
      {fromVenue.length > 0 && (
        <Card as="section" aria-labelledby="venue-own-photos-h" style={{ marginBottom: SPACE.md, border: `1.5px dashed ${C2.line}` }}>
          <SectionHeader id="venue-own-photos-h" title={t('owner.photo.title')} size="sm"
            description={t('owner.photo.desc', { count: fromVenue.length })}/>
          <div style={{ marginBottom: SPACE.sm }}><SourceBadge source="venue">{t('owner.photo.badge')}</SourceBadge></div>
          <PhotoGrid photos={fromVenue} onOpen={setOpenVenue}/>
          <PhotoViewer photos={fromVenue} index={openVenue} onIndex={setOpenVenue} onClose={closeVenue}/>
        </Card>
      )}
    </>
  );
}

export { VenuePhotos };
