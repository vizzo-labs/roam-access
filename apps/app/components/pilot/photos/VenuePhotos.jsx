'use client';

import React from 'react';
import { Card, PhotoGrid, PhotoViewer, SectionHeader, SPACE, plural } from '../ds';

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
    <Card as="section" aria-labelledby="venue-photos-h" style={{ marginBottom: SPACE.md }}>
      <SectionHeader id="venue-photos-h" title="Photos from reviewers" size="sm"
        description={`${plural(photos.length, 'photo')} taken by people in the pilot, each with a description.`}/>
      <PhotoGrid photos={photos} onOpen={setOpen}/>
      <PhotoViewer photos={photos} index={open} onIndex={setOpen} onClose={close}/>
    </Card>
  );
}

export { VenuePhotos };
