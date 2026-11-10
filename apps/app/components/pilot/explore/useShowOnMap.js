'use client';

import React from 'react';

// Desktop (≥ 960px): the map beside the panel shows every place of the
// search (`all`, memoised by the caller; null = every place) and the places
// the list shows (in list order, with their verdicts) as its focusable pins. `fitKey` changes when the list
// itself changes (a new search, filters), and the map then frames it —
// unless `fit` is false (after "Search this area", where the person chose
// the view). Growing the list ("Show more") keeps the same key, so the map
// stays put. No-op on phones, whose map sits inside the list (MapSection).
export function useShowOnMap(app, places, fitKey, fit = true, all = null) {
  // Re-publish only when the pins would change (ids + verdicts), not on
  // every render's new array.
  const ids = places.map(p => p.id + ':' + p.verdict.kind).join('|');
  const show = app.showOnMap;
  React.useEffect(() => {
    if (app.wide && show) show({ places, fitKey, fit, all });
  }, [app.wide, show, ids, fitKey, fit, all]); // eslint-disable-line react-hooks/exhaustive-deps
}
