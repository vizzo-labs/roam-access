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
// Past ~40 minutes on foot, say the distance instead.
export function distanceLabel(o, v) {
  const mins = walkMins(o, v);
  if (mins <= 40) return `${mins} min walk`;
  const km = metres(o, v) / 1000;
  return `${km < 10 ? km.toFixed(1) : Math.round(km)} km away`;
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

export function ago(iso, now = Date.now()) {
  const s = Math.max(0, Math.round((now - Date.parse(iso)) / 1000));
  if (s < 90) return 'just now';
  const m = Math.round(s / 60); if (m < 60) return `${m} minutes ago`;
  const h = Math.round(m / 60); if (h < 24) return `${h} ${h === 1 ? 'hour' : 'hours'} ago`;
  const d = Math.round(h / 24); return `${d} ${d === 1 ? 'day' : 'days'} ago`;
}

// "3:00 pm Saturday 7 November" — Sydney time, en-AU.
export function until(iso) {
  const d = new Date(iso);
  const time = d.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', timeZone: 'Australia/Sydney' });
  const day = d.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Australia/Sydney' });
  return `${time} ${day}`;
}

// ── Toilets ──────────────────────────────────────────────────────────────
// Short tags for a list row, most important first.
export function toiletTags(d) {
  const t = [];
  if (d.changingPlaces) t.push('Changing Places');
  else if (d.adultChange) t.push('Adult change room');
  if (d.accessible) t.push('Accessible');
  else if (d.ambulant) t.push('Ambulant only');
  if (d.mlak24) t.push('MLAK 24 hours');
  else if (d.mlakAfterHours) t.push('MLAK after hours');
  if (d.shower || d.acShower) t.push('Shower');
  return t;
}

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
export const FACILITY_ICON = { toilet: 'toilet', beach: 'water', liberty_swing: 'swing', ferry: 'ferry', walk: 'walk' };
