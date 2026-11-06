// Review form (I1): which entrance block is showing, and what to send.

/** Is the entrance pin block on screen? (Its photo is shown there.) */
export function entranceShown(features, entranceAlt, markOpen) {
  if (features.stepfree === 'no') return !!entranceAlt && entranceAlt !== 'none';
  if (features.stepfree === 'yes') return markOpen;
  return false;
}

/**
 * The `entrance` for POST /api/reviews, or undefined.
 *  "Step-free way in? No" + "Yes, at the back" → kind back, the "Where?" note
 *  "Step-free way in? Yes" + "Show where…"      → the chosen kind and its note
 * The pin goes only once it has moved off the street address.
 */
export function entrancePayload({ features, entranceAlt, entranceNote, mark, markOpen, photos }) {
  if (!entranceShown(features, entranceAlt, markOpen)) return undefined;
  const no = features.stepfree === 'no';
  const photo = photos.find(p => p.tag === 'entrance' && p.status === 'ready');
  return {
    kind: no ? entranceAlt : mark.kind,
    lat: mark.pin ? mark.pin.lat : null,
    lng: mark.pin ? mark.pin.lng : null,
    locatedBy: mark.pin ? mark.pin.by : null,
    note: (no ? entranceNote : mark.note) || '',
    photoId: photo ? photo.id : null,
  };
}
