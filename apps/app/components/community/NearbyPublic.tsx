// Public summary (/v/[id]) · "Parking & transport nearby" (I4): the same list
// the venue page shows (components/pilot/arrival/ArrivalNearby.jsx, chosen by
// the shared nearbyPicks()), rendered on the server. Public open data only —
// accessible parking, drop-off points, stops and wharves from OpenStreetMap
// (always "unconfirmed") and the nearest accessible toilet from the National
// Public Toilet Map — with the same source labels. The community's own
// step-by-step arrival stays in the app, like review photos.
import { COUNCIL_ACCESS_MAP, NEARBY_WALK_MINS, OSM } from '@/lib/arrival/places';
import { routable, type EntranceVM } from '@/lib/arrival/entrances';
import type { NearbyListing } from '@/lib/data/arrival-nearby';
import type { T } from '@/lib/i18n/core';
import {
  TOILET_MAX_MINS, arrivalDetails, arrivalName, directionsHref, distanceText, isWalkFrom, nearbyPicks,
} from '@/components/pilot/arrival/nearbyUtils';
import { metres, toiletTagLabels, walkMins } from '@/components/pilot/layers/layerUtils';

type Place = { id: string; name: string; lat: number; lng: number };

/** Fill {placeholders} in a translated sentence with nodes (links). */
function withParts(text: string, parts: Record<string, React.ReactNode>) {
  return text.split(/(\{\w+\})/g).map((seg, i) => {
    const m = /^\{(\w+)\}$/.exec(seg);
    return m && parts[m[1]] !== undefined ? <span key={i}>{parts[m[1]]}</span> : seg;
  });
}

function Ext({ t, href, children, lang }: { t: T; href: string; children: React.ReactNode; lang?: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      <span lang={lang}>{children}</span><span className="ra-sr-only"> {t('common.opensNewTab')}</span>
    </a>
  );
}

export function NearbyPublic({ t, venue, entrance, listings }: {
  t: T; venue: Place; entrance: EntranceVM | null; listings: NearbyListing[];
}) {
  // Walking routes end at the step-free entrance when someone marked one.
  const to = routable(entrance) ? { lat: entrance.lat, lng: entrance.lng } : { lat: venue.lat, lng: venue.lng };
  const { picks, missing } = nearbyPicks(listings, venue);
  const hid = 'pub-nearby-h';
  return (
    <section aria-labelledby={hid}>
      <h3 id={hid}>{t('nearby.title')}</h3>
      <p className="pub-muted pub-small">{t('nearby.desc', { mins: NEARBY_WALK_MINS })}</p>
      {picks.length > 0 && (
        <div className="pub-card">
          <ul className="pub-list">
            {picks.map(({ kind, facility: f }: { kind: string; facility: NearbyListing }) => {
              const toilet = kind === 'toilet';
              const name = toilet ? f.name : arrivalName(t, f);
              const mins = walkMins(venue, f);
              const sub = [
                mins <= TOILET_MAX_MINS ? t('common.minWalk', { mins }) : null,
                distanceText(t, metres(venue, f)),
                ...(toilet ? toiletTagLabels(f.details || {}, t, ['accessible']) : arrivalDetails(t, f)),
              ].filter(Boolean).join(' · ');
              const osmId = !toilet && Array.isArray(f.details?.osm) ? (f.details.osm as string[])[0] : null;
              const sourceHref = toilet ? f.sourceUrl : osmId ? OSM.fixUrl(osmId) : null;
              const sourceLabel = toilet ? t('nearby.source.toiletMap') : t('ds.badge.osm');
              const walking = isWalkFrom(f);
              return (
                <li key={f.id}>
                  <span className="pub-src">{t(`nearby.label.${kind}`)}</span>
                  <strong>{name}</strong>
                  <span className="pub-src">{sub}</span>
                  <span className={`pub-source${toilet ? '' : ' osm'}`}>
                    {sourceHref ? <Ext t={t} href={sourceHref} lang="en">{sourceLabel}</Ext> : sourceLabel}
                  </span>
                  <span className="pub-dir">
                    <span>{walking ? t('nearby.public.walkTo', { name: venue.name }) : t('nearby.public.directions')}</span>
                    {(['google', 'apple'] as const).map(app => {
                      const appName = t(app === 'apple' ? 'arrival.app.apple' : 'arrival.app.google');
                      const label = walking
                        ? t('nearby.walkFromLabel', { from: name, to: venue.name, app: appName })
                        : t('nearby.directionsLabel', { name, app: appName });
                      return (
                        <a key={app} href={directionsHref(f, to, app)} target="_blank" rel="noopener" aria-label={`${label} ${t('common.opensNewTab')}`}>
                          {appName}
                        </a>
                      );
                    })}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      {missing.length > 0 && (
        <p className="pub-muted pub-small" style={{ margin: '10px 0 0' }}>
          {t('nearby.missingLine', { list: missing.map((k: string) => t(`nearby.missing.${k}`)).join(' · ') })}
        </p>
      )}
      <p className="pub-small" style={{ margin: '10px 0 0' }}>
        {withParts(t('nearby.council'), {
          link: <Ext t={t} href={COUNCIL_ACCESS_MAP.url} lang="en-AU">{COUNCIL_ACCESS_MAP.name}</Ext>,
        })}
      </p>
      <p className="pub-small">{t('nearby.public.stepsInApp')}</p>
      <p className="pub-muted pub-small">
        {withParts(t('nearby.attribution'), {
          osm: <Ext t={t} href={OSM.copyrightUrl} lang="en">{OSM.credit}</Ext>,
          licence: <Ext t={t} href={OSM.licenceUrl} lang="en">{OSM.licence}</Ext>,
        })}
      </p>
    </section>
  );
}
