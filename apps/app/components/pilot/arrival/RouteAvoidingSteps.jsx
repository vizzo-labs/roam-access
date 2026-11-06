'use client';
// Getting there 6 · "Route avoiding mapped steps" — a Getting there slot
// (./slots.js). From the person's location (or Manly Wharf) to the
// step-free entrance someone marked (else the place's map point), via our
// own Valhalla server and our checks (lib/routing/*).
//
// Only where routing is switched on: /api/route answers 404 when there's no
// VALHALLA_URL (production today), and this slot then renders nothing.
//
// Honesty: never "accessible route". Always "Based on OpenStreetMap, not
// checked by people", a "Check before you go" list, and where the route
// ends. It never changes a verdict.
// Access: the whole route is text (summary, check list, step-by-step); the
// map is a picture with a text alternative and numbered points that match
// the list; slopes are never colour alone; one polite live region.

import React from 'react';
import { C2 } from '../ui/palette';
import { Badge, Banner, Button, Card, Icon, SectionHeader, SegmentedControl, Skeleton, SourceBadge, SPACE, TYPE, tone } from '../ds';
import { useFormat, useT } from '../i18n';
import { RouteMap } from './RouteMap';
import { checkLook, checkText, distanceText, pointText, stepText } from './routeText';

function useRoute(venueId, from, version) {
  const [attempt, setAttempt] = React.useState(0);
  const key = `${venueId}|${from}|${version}|${attempt}`;
  // { key, phase: 'ok' | 'hidden' | 'error', route?, error? } — loading while key differs.
  const [result, setResult] = React.useState({ key: null, phase: 'loading' });
  React.useEffect(() => {
    let live = true;
    const done = r => { if (live) setResult(prev => ({ ...prev, ...r, key, route: r.route ?? (r.phase === 'error' ? null : prev.route) })); };
    const q = new URLSearchParams({ venue: venueId });
    if (from) q.set('from', from);
    fetch(`/api/route?${q}`)
      .then(async (r) => {
        if (r.status === 404 || r.status === 401) return done({ phase: 'hidden' });
        const d = await r.json().catch(() => ({}));
        if (r.ok && d.route) return done({ phase: 'ok', route: d.route, error: null });
        if (r.status === 429) return done({ phase: 'error', error: 'rateLimited' });
        if (r.status === 422 && d.error === 'outside') return done({ phase: 'error', error: 'outside' });
        return done({ phase: 'error', error: 'unavailable' });
      }, () => done({ phase: 'error', error: 'unavailable' }));
    return () => { live = false; };
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  const state = result.phase === 'hidden' ? result : result.key === key ? result : { ...result, phase: 'loading' };
  return [state, () => setAttempt(a => a + 1)];
}

export function RouteAvoidingSteps({ app, venue, arrival }) {
  const t = useT();
  const fmt = useFormat();
  const origin = app.origin || {};
  const [choice, setChoice] = React.useState(origin.mine ? 'me' : 'wharf');
  const useMe = choice === 'me' && origin.mine;
  const locating = choice === 'me' && !origin.mine;
  const from = useMe ? `${origin.lat.toFixed(5)},${origin.lng.toFixed(5)}` : '';
  // Re-plan when the entrance changes (someone marks one, or says "Changed").
  const version = `${arrival?.entrance?.id || ''}:${arrival?.entrance?.status || ''}:${app.reviewsVersion || 0}`;
  const [state, retry] = useRoute(venue.id, from, version);
  const [showSteps, setShowSteps] = React.useState(false);
  const h = `route-h-${venue.id}`;

  // "My location" asks for it (the app shows a message if it can't); if
  // nothing arrives in 12 s, go back to the wharf.
  const pickFrom = (v) => {
    setChoice(v);
    if (v === 'me' && !origin.mine) app.locateMe?.();
  };
  React.useEffect(() => {
    if (!locating) return;
    const timer = setTimeout(() => setChoice('wharf'), 12000);
    return () => clearTimeout(timer);
  }, [locating]);

  if (state.phase === 'hidden') return null;
  const route = state.route;
  const loading = state.phase === 'loading';
  const ok = route && route.status !== 'none';

  // The one polite announcement for this section.
  let live = '';
  if (loading) live = t('route.loading');
  else if (route?.status === 'ok') live = t('route.foundLive', { distance: distanceText(t, route.summary.m), mins: route.summary.minutes, count: route.checks.length });
  else if (route?.status === 'partial') live = t('route.partialLive', { gap: distanceText(t, route.partial.gapM) });
  else if (route?.status === 'none') live = t('route.noneLive');
  else if (state.error) live = t(`route.error.${state.error}`);

  const fromName = route?.from.kind === 'me' ? t('route.from.me') : t('route.from.wharf');
  return (
    <section aria-labelledby={h} aria-busy={loading || undefined} style={{ marginBottom: SPACE.md }}>
      <SectionHeader id={h} level={3} size="sm" title={t('route.title')}
        description={route ? t(route.from.kind === 'me' ? 'route.from.descMe' : 'route.from.descWharf') : null}/>
      <p role="status" className="ra-sr-only">{live}</p>

      <Card variant="outline">
        {/* Where it starts. */}
        <p id={`${h}-from`} style={{ ...TYPE.footnote, fontWeight: 700, color: C2.char, margin: `0 0 6px` }}>{t('route.from.label')}</p>
        <SegmentedControl full label={t('route.from.label')} value={choice} onChange={pickFrom}
          options={[{ value: 'wharf', label: t('route.from.wharf') }, { value: 'me', label: t('route.from.me') }]}/>
        {locating && <p style={{ ...TYPE.footnote, color: C2.slate, margin: `${SPACE.xs}px 0 0` }}>{t('route.from.locating')}</p>}

        {/* The honest label, always. */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: SPACE.xs, margin: `${SPACE.sm}px 0 0` }}>
          <SourceBadge source="osm"/>
          <span style={{ ...TYPE.footnote, color: C2.char }}>{t('route.honest')}</span>
        </div>

        {loading && !route && (
          <div style={{ marginTop: SPACE.md }} aria-hidden="true">
            <Skeleton height={20} width="60%"/>
            <Skeleton height={220} style={{ marginTop: SPACE.sm }}/>
          </div>
        )}
        {state.phase === 'error' && (
          <Banner tone={state.error === 'outside' ? 'info' : 'warn'} style={{ marginTop: SPACE.md }}
            action={state.error === 'outside' ? null : <Button size="sm" variant="outline" icon="refresh" onClick={retry}>{t('route.retry')}</Button>}>
            {t(`route.error.${state.error}`)}
          </Banner>
        )}

        {route && (
          <div style={{ opacity: loading ? 0.55 : 1, transition: 'opacity .2s' }}>
            {route.status === 'none' && (
              <Banner tone="warn" style={{ marginTop: SPACE.md }} title={t('route.none.title')}>
                {t('route.none.body', { name: venue.name })}
              </Banner>
            )}
            {route.status === 'partial' && (
              <Banner tone="warn" style={{ marginTop: SPACE.md }} title={t('route.partial.title')}>
                {route.partial.steps > 0
                  ? t('route.partial.bodySteps', { count: route.partial.steps, gap: distanceText(t, route.partial.gapM), name: venue.name })
                  : t('route.partial.bodyPath', { gap: distanceText(t, route.partial.gapM), name: venue.name })}
              </Banner>
            )}

            {ok && (
              <>
                <p style={{ ...TYPE.headline, color: C2.char, margin: `${SPACE.md}px 0 2px` }}>
                  {[distanceText(t, route.summary.m), t('route.summary.time', { mins: route.summary.minutes }), t('route.summary.climb', { m: route.summary.climbM })].join(' · ')}
                </p>
                {route.status === 'ok' && (
                  <p style={{ ...TYPE.footnote, color: C2.char, margin: '0 0 2px' }}>
                    {route.to.kind === 'entrance'
                      ? t('route.end.entrance', { door: t(`arrival.kind.${route.to.entranceKind || 'main'}.short`) })
                      : t('route.end.venue')}
                  </p>
                )}
                <p style={{ ...TYPE.footnote, color: C2.slate, margin: 0 }}>
                  {route.crossings.total
                    ? t('route.crossings', { count: route.crossings.total, lowered: route.crossings.lowered, unknown: route.crossings.unknown })
                    : t('route.crossingsNone')}
                </p>
                {route.chose && <p style={{ ...TYPE.footnote, color: C2.slate, margin: '2px 0 0' }}>{t('route.chose')}</p>}

                <RouteMap route={route} style={{ marginTop: SPACE.sm }}
                  label={t('route.map.label', { from: fromName, name: venue.name })}/>
              </>
            )}

            <CheckList t={t} fmt={fmt} route={route} h={h}/>

            {ok && route.steps?.length > 0 && (
              <div style={{ marginTop: SPACE.md }}>
                <Button variant="outline" size="sm" icon={showSteps ? 'up' : 'down'} aria-expanded={showSteps} aria-controls={`${h}-steps`}
                  onClick={() => setShowSteps(s => !s)} style={{ whiteSpace: 'normal' }}>
                  {showSteps ? t('route.steps.hide') : t('route.steps.show', { count: route.steps.length })}
                </Button>
                <div id={`${h}-steps`} hidden={!showSteps}>
                  <h4 style={{ ...TYPE.headline, fontSize: 15.5, color: C2.char, margin: `${SPACE.sm}px 0 ${SPACE.xs}px` }}>{t('route.steps.title')}</h4>
                  <ol style={{ margin: 0, paddingLeft: 24, ...TYPE.body, color: C2.char }}>
                    {route.steps.map((s, i) => (
                      <li key={i} style={{ padding: '4px 0', borderTop: i ? `1px solid ${C2.hair}` : 0 }}>
                        {stepText(t, s)}
                        {s.m > 0 && s.type !== 'arrive' && <span style={{ color: C2.slate }}> · {t('route.step.for', { distance: distanceText(t, s.m) })}</span>}
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            )}

            <p style={{ ...TYPE.caption, color: C2.slate, margin: `${SPACE.md}px 0 0` }}>
              {route.source.osmDate ? t('route.source', { date: fmt.date(route.source.osmDate) }) : t('route.sourceNoDate')}
              {' '}{t('route.devNote')}
            </p>
          </div>
        )}
      </Card>
    </section>
  );
}

function NumberBadge({ n, t }) {
  return (
    <span style={{ flexShrink: 0, minWidth: 26, height: 26, borderRadius: 999, border: `2px solid ${C2.char}`, background: C2.paper, color: C2.char, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13, boxSizing: 'border-box' }}>
      <span aria-hidden="true">{n}</span>
      <span className="ra-sr-only">{t('route.check.number', { n })}:</span>
    </span>
  );
}

function CheckList({ t, fmt, route, h }) {
  const checks = route.checks || [];
  const row = { display: 'flex', gap: SPACE.xs, alignItems: 'flex-start', padding: `${SPACE.xs}px 0` };
  return (
    <div style={{ marginTop: SPACE.md }}>
      <h4 id={`${h}-check`} style={{ ...TYPE.headline, fontSize: 15.5, color: C2.char, margin: `0 0 ${SPACE.xs}px` }}>{t('route.check.title')}</h4>
      {route.avoided?.length > 0 && (
        <div style={{ marginBottom: SPACE.xs }}>
          <Badge tone="success" icon="check" size="sm">{t('route.avoided.title')}</Badge>
          <ul style={{ margin: '4px 0 0', paddingLeft: 20, ...TYPE.footnote, color: C2.char }}>
            {route.avoided.map((a, i) => (
              <li key={i}>{t('route.avoided.item', { what: t(`layers.report.${a.type}.label`), name: a.name, date: fmt.date(a.date) })}</li>
            ))}
          </ul>
        </div>
      )}
      {route.status !== 'none' && checks.length === 0 && (
        <p style={{ ...TYPE.callout, color: C2.char, margin: 0 }}>{t('route.check.empty')}</p>
      )}
      {checks.length > 0 && (
        <ul aria-labelledby={`${h}-check`} style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {checks.map((c, i) => {
            const look = checkLook(c.kind);
            return (
              <li key={i} style={{ ...row, borderTop: i ? `1px solid ${C2.hair}` : 0 }}>
                {c.n ? <NumberBadge n={c.n} t={t}/> : (
                  <span aria-hidden="true" style={{ color: tone(look.tone).fg, flexShrink: 0, width: 26, display: 'inline-flex', justifyContent: 'center', paddingTop: 1 }}>
                    <Icon name={look.icon} size={20}/>
                  </span>
                )}
                <div style={{ ...TYPE.callout, color: C2.char, minWidth: 0 }}>
                  {checkText(t, fmt, c)}
                  {c.points && (
                    <ul style={{ listStyle: 'none', margin: '4px 0 0', padding: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {c.points.map((p, j) => (
                        <li key={j} style={{ display: 'flex', gap: SPACE.xs, alignItems: 'center', ...TYPE.footnote }}>
                          {p.n ? <NumberBadge n={p.n} t={t}/> : <span aria-hidden="true" style={{ width: 26, flexShrink: 0, textAlign: 'center', color: C2.slate }}>–</span>}
                          <span>{pointText(t, p)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <p style={{ ...TYPE.footnote, color: C2.slate, margin: `${SPACE.xs}px 0 0` }}>{t('route.check.always')}</p>
    </div>
  );
}
