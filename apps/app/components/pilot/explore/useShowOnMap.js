'use client';

import React from 'react';

// Desktop (≥ 960px): the map beside the panel mirrors the list on screen.
// A screen calls this with the places it shows (in list order, with their
// verdicts); the map draws only those pins. `fitKey` changes when the list
// itself changes (a new search, filters), and the map then frames it —
// unless `fit` is false (after "Search this area", where the person chose
// the view). Growing the list ("Show more") keeps the same key, so the map
// stays put. No-op on phones, whose map sits inside the list (MapSection).
export function useShowOnMap(app, places, fitKey, fit = true) {
  // Re-publish only when the pins would change (ids + verdicts), not on
  // every render's new array.
  const ids = places.map(p => p.id + ':' + p.verdict.kind).join('|');
  const show = app.showOnMap;
  React.useEffect(() => {
    if (app.wide && show) show({ places, fitKey, fit });
  }, [app.wide, show, ids, fitKey, fit]); // eslint-disable-line react-hooks/exhaustive-deps
}
