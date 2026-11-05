'use client';
// Anonymous view / search-impression counts for venue and council dashboards.
// Fire-and-forget; one count per place per kind per browser session. The
// server reads the tester's needs itself and stores counts only.

import React from 'react';

function seen(key) {
  try {
    if (sessionStorage.getItem(key)) return true;
    sessionStorage.setItem(key, '1');
  } catch { /* private mode: count anyway */ }
  return false;
}

function send(ids, kind) {
  const fresh = ids.filter(id => !seen(`ra-${kind}-${id}`));
  if (!fresh.length) return;
  fetch('/api/views', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, keepalive: true,
    body: JSON.stringify({ ids: fresh, kind }),
  }).catch(() => {});
}

function useTrackVenueView(id) {
  React.useEffect(() => { if (id) send([id], 'view'); }, [id]);
}

// The first `n` results shown for a search count as search impressions.
function useTrackSearch(results, n = 10) {
  const key = results.slice(0, n).map(r => r.id).join(',');
  React.useEffect(() => {
    if (key) send(key.split(','), 'search');
  }, [key]);
}

export { useTrackVenueView, useTrackSearch };
