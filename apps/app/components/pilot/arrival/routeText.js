// Getting there 6 · words for a route (RouteVM from /api/route). Helpers take
// `t` (and `fmt`) as arguments, never a global (lib/i18n/README.md).

/** "350 m" / "2.4 km". */
export function distanceText(t, m) {
  if (m < 1000) return t('route.metres', { m: Math.max(10, Math.round(m / 10) * 10) });
  return t('route.km', { km: (Math.round(m / 100) / 10).toFixed(1) });
}

const named = (t, key, near, params) => (near ? t(key, { ...params, near }) : t(`${key}NoName`, params));

/** One "Check before you go" line (kerbUnknown/kerbRolled return the heading; points are listed under it). */
export function checkText(t, fmt, c) {
  const m = c.m != null ? distanceText(t, c.m) : '';
  const report = what => t(`layers.report.${what}.label`);
  switch (c.kind) {
    case 'steps': return t('route.check.steps', { m });
    case 'kerbRaised': return named(t, 'route.check.kerbRaised', c.near, {});
    case 'kerbUnknown': return t('route.check.kerbUnknown', { count: c.count });
    case 'kerbRolled': return t('route.check.kerbRolled', { count: c.count });
    case 'steep': return named(t, c.up ? 'route.check.steepUp' : 'route.check.steepDown', c.near, { grade: c.grade, m });
    case 'moderate': return c.points ? t('route.check.moderateMany', { count: c.count }) : named(t, c.up ? 'route.check.moderateUp' : 'route.check.moderateDown', c.near, { grade: c.grade, m });
    case 'surface': return named(t, 'route.check.surface', c.near, { m, surface: t(`route.surface.${c.value}`) });
    case 'incline': return named(t, 'route.check.incline', c.near, { value: c.value });
    case 'lift': return t('route.check.lift');
    case 'endGap': return t('route.check.endGap', { m });
    case 'noEntrance': return t('route.check.noEntrance');
    case 'venueReport': return t('route.check.venueReport', { what: report(c.value), date: fmt.date(c.date) });
    case 'barrier': return t('route.check.barrier', { what: report(c.value), near: c.near, date: fmt.date(c.date) });
    default: return '';
  }
}

/** One place under a grouped check: a crossing, or a 5–8% slope. */
export function pointText(t, p) {
  if (p.grade != null) return named(t, p.up ? 'route.check.slopeUp' : 'route.check.slopeDown', p.near, { grade: p.grade, m: distanceText(t, p.m) });
  return p.near ? t('route.check.crossingNear', { near: p.near }) : t('route.check.crossingNoName');
}

/** Icon + tone for a check (the words carry the meaning; this is a second cue). */
export function checkLook(kind) {
  if (['steps', 'kerbRaised', 'venueReport', 'barrier', 'endGap', 'steep'].includes(kind)) return { icon: 'warn', tone: 'danger' };
  if (['kerbUnknown', 'kerbRolled'].includes(kind)) return { icon: 'question', tone: 'warn' };
  if (kind === 'noEntrance') return { icon: 'pin', tone: 'warn' };
  return { icon: 'info', tone: 'warn' };
}

/** "Turn left onto Darley Road" — the street name is an OSM proper noun. */
export function stepText(t, s) {
  return s.street ? t(`route.step.${s.type}`, { street: s.street }) : t(`route.step.${s.type}Path`, { what: t(`route.way.${s.way || 'path'}`) });
}
