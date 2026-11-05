'use client';

import React from 'react';
import { PhotoThumbs, PhotoViewer } from './PhotoViewer';
import { C2, F2 } from '../ui/palette';

// Venue page gallery: photos from visible reviews only. Hidden by an admin =
// gone from here (images are private and served through an auth check).
function useVenuePhotos(app, id) {
  const [photos, setPhotos] = React.useState(null);
  React.useEffect(() => {
    let live = true;
    fetch(`/api/venues/${encodeURIComponent(id)}/photos`)
      .then(r => (r.ok ? r.json() : { photos: [] }))
      .then(d => { if (live) setPhotos(d.photos || []); }, () => { if (live) setPhotos([]); });
    return () => { live = false; };
  }, [id, app.reviewsVersion]);
  return photos;
}

function VenuePhotos({ app, venueId }) {
  const photos = useVenuePhotos(app, venueId);
  const [open, setOpen] = React.useState(null);
  const close = React.useCallback(() => setOpen(null), []);
  if (!photos || !photos.length) return null;
  return (
    <section aria-labelledby="venue-photos-h" style={{ borderRadius: 18, border: `1.5px solid ${C2.line}`, padding: '16px 18px 18px', marginBottom: 16 }}>
      <h2 id="venue-photos-h" style={{ fontSize: 14, fontWeight: 700, color: C2.teal, margin: '0 0 4px', fontFamily: F2, letterSpacing: '0.02em' }}>
        PHOTOS FROM REVIEWERS
      </h2>
      <p style={{ fontSize: 14, color: C2.slate, margin: '0 0 12px', fontFamily: F2, lineHeight: 1.45 }}>
        {photos.length} {photos.length === 1 ? 'photo' : 'photos'} taken by people in the pilot. Each has a description.
      </p>
      <PhotoThumbs photos={photos} onOpen={setOpen}/>
      <PhotoViewer photos={photos} index={open} onIndex={setOpen} onClose={close}/>
    </section>
  );
}

export { VenuePhotos };
