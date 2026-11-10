'use client';
// Access layers state for the whole app: toilets + beach items, partner
// badges, live temporary reports, and which map layers are switched on.
// Loaded after the bootstrap so the first screen never waits on it.

import React from 'react';
import { reportsFor } from './layerUtils';

const SHOWN_KEY = 'ra2-layers';

function readShown() {
  try {
    const s = JSON.parse(localStorage.getItem(SHOWN_KEY) || 'null');
    return { toilets: !!s?.toilets, beach: !!s?.beach, arrival: !!s?.arrival };
  } catch { return { toilets: false, beach: false, arrival: false }; }
}

async function call(path, body) {
  const res = await fetch(path, {
    method: body ? 'POST' : 'GET',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) { const e = new Error(json.error || `${res.status}`); e.status = res.status; throw e; }
  return json;
}

// Dev-only `?mapStress=1`: synthetic toilets across Sydney (never sent anywhere).
async function withStressFacilities(d) {
  const { mapStressOn, stressFacilities } = await import('../explore/mapStress');
  if (!mapStressOn()) return d;
  return { ...d, facilities: [...(d.facilities || []), ...stressFacilities()] };
}

export function useAccessLayers() {
  const [data, setData] = React.useState({ facilities: [], badges: {}, reports: [], loaded: false, failed: false });
  const [shown, setShown] = React.useState(readShown);
  // A clock that ticks each minute, so expired reports vanish on their own.
  const [now, setNow] = React.useState(() => Date.now());

  const load = React.useCallback(() => {
    call('/api/layers').then(withStressFacilities).then(
      d => setData({ ...d, loaded: true, failed: false }),
      () => setData(x => ({ ...x, loaded: true, failed: true })),
    );
  }, []);

  React.useEffect(() => {
    load();
    const tick = setInterval(() => setNow(Date.now()), 60000);
    // Back to the app after a while: fetch today's reports again.
    let last = Date.now();
    const onVisible = () => {
      if (document.visibilityState === 'visible' && Date.now() - last > 120000) { last = Date.now(); load(); }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => { clearInterval(tick); document.removeEventListener('visibilitychange', onVisible); };
  }, [load]);

  const byId = React.useMemo(() => new Map(data.facilities.map(f => [f.id, f])), [data.facilities]);
  const live = React.useMemo(() => data.reports.filter(r => Date.parse(r.expiresAt) > now), [data.reports, now]);
  const alertIds = React.useMemo(
    () => new Set(live.filter(r => r.type !== 'matting_down').map(r => r.targetId)),
    [live],
  );

  const setReports = reports => setData(x => ({ ...x, reports }));

  return {
    ...data,
    reports: live,
    now,
    shown,
    alertIds,
    facilityById: id => byId.get(id),
    setShown: (layer, on) => {
      setShown(s => {
        const next = { ...s, [layer]: on };
        try { localStorage.setItem(SHOWN_KEY, JSON.stringify(next)); } catch { /* private mode */ }
        return next;
      });
    },
    reportsFor: (targetType, targetId) => reportsFor(live, targetType, targetId, now),
    badgesFor: venueId => data.badges[venueId] || [],
    // Each returns true on success; the caller shows the toast.
    report: async ({ targetType, targetId, type, note }) => {
      const r = await call('/api/reports', { targetType, targetId, type, note });
      setReports(r.reports);
      return r;
    },
    confirm: async id => { const r = await call(`/api/reports/${id}`, { action: 'confirm' }); setReports(r.reports); return r; },
    gone: async id => { const r = await call(`/api/reports/${id}`, { action: 'gone' }); setReports(r.reports); return r; },
    reload: load,
  };
}
