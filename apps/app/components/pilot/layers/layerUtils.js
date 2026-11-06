// Access layers — pure helpers shared by the screens, the map and the venue
// page. No React here.

import { REPORT_TYPES, reportType, BADGES } from '@/lib/layers/defs';

export function metres(a, b) {
  const R = 6371000, rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad, dLng = (b.lng - a.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
// Same rule as PilotApp: straight line +25% for streets, 80 m a minute.
export const walkMins = (o, v) => Math.max(1, Math.round((metres(o, v) * 1.25) / 80));
// Past ~40 minutes on foot, say the distance instead. Pass the `t` from useT().
export function distanceLabel(o, v, t) {
  const mins = walkMins(o, v);
  if (mins <= 40) return t('common.minWalk', { mins });
  const km = metres(o, v) / 1000;
  return t('layers.kmAway', { km: km < 10 ? km.toFixed(1) : Math.round(km) });
}

// ── Reports ──────────────────────────────────────────────────────────────
export const isLive = (r, now = Date.now()) => Date.parse(r.expiresAt) > now;

export function reportsFor(reports, targetType, targetId, now = Date.now()) {
  return (reports || []).filter(r => r.targetType === targetType && r.targetId === targetId && isLive(r, now));
}

export function reportTypesFor(where) {
  return REPORT_TYPES.filter(t => t.on.includes(where) && !t.id.startsWith('matting_'));
}

export { reportType };

// "Saturday 7 November, 3:00 pm" — Sydney time, in the reader's language
// (`intl` = useLocale().def.intl).
export function until(iso, intl = 'en-AU') {
  return new Date(iso).toLocaleString(intl, {
    weekday: 'long', day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit', timeZone: 'Australia/Sydney',
  });
}

// ── Toilets ──────────────────────────────────────────────────────────────
// Short tags for a list row, most important first: ids, see toiletTagLabels.
export function toiletTags(d) {
  const t = [];
  if (d.changingPlaces) t.push('changingPlaces');
  else if (d.adultChange) t.push('adultChange');
  if (d.accessible) t.push('accessible');
  else if (d.ambulant) t.push('ambulant');
  if (d.mlak24) t.push('mlak24');
  else if (d.mlakAfterHours) t.push('mlakAfterHours');
  if (d.shower || d.acShower) t.push('shower');
  return t;
}
export const toiletTagLabels = (d, t, skip = []) => toiletTags(d).filter(x => !skip.includes(x)).map(x => t(`layers.tag.${x}`));

// Translated labels for layer data (pass the `t` from useT()).
export const reportLabel = (t, id) => t(`layers.report.${reportType(id) ? id : 'other'}.label`);
export const reportBanner = (t, id) => t(`layers.report.${reportType(id) ? id : 'other'}.banner`);
export const FACILITY_KIND_IDS = ['toilet', 'beach', 'liberty_swing', 'ferry', 'walk', 'accessible_parking', 'drop_off', 'accessible_stop', 'wharf'];
export const facilityKindLabel = (t, kind) => t(`layers.kind.${FACILITY_KIND_IDS.includes(kind) ? kind : 'unknown'}`);
export const badgeText = (t, id, field) => t(`layers.badge.${id}.${field}`);

export function hoursLabel(d) {
  const h = (d.openingHours || '').replace(/^OPEN:\s*/i, '').trim();
  return h || null;
}

export function nearestToilet(facilities, from, test = d => d.accessible) {
  let best = null, bestM = Infinity;
  for (const f of facilities || []) {
    if (f.kind !== 'toilet' || !test(f.details || {})) continue;
    const m = metres(from, f);
    if (m < bestM) { best = f; bestM = m; }
  }
  return best ? { facility: best, metres: bestM } : null;
}

// ── Badges ───────────────────────────────────────────────────────────────
export const badgeDef = id => BADGES.find(b => b.id === id);
export { BADGES };

// ── Map pins for facilities ──────────────────────────────────────────────
export const FACILITY_ICON = {
  toilet: 'toilet', beach: 'water', liberty_swing: 'swing', ferry: 'ferry', walk: 'walk',
  // Getting there 2 (I2)
  accessible_parking: 'parking', drop_off: 'car', accessible_stop: 'bus', wharf: 'ferry',
};
