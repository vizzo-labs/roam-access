'use client';
// Getting there (I1): which maps app opens, and where directions go.
//
// The app: Apple Maps on iPhone / iPad, Google Maps elsewhere, until the
// person chooses (saved on this device, like the language).
// Where: the step-free entrance someone marked, when there is one that nobody
// has since said "Changed" — by default for people who said they use a
// wheelchair or mobility aid; for everyone else the street address stays the
// default and the step-free door is one tap away in Getting there.

import React from 'react';
import { STEP_FREE_NEEDS, defaultMapsApp, directionsUrl, routable } from '@/lib/arrival/entrances';
import { useT } from '../i18n';

const KEY = 'ra-maps-app';
const subs = new Set();
let cache = null;
function read() {
  if (cache) return cache;
  let stored = null;
  try { const v = localStorage.getItem(KEY); stored = v === 'apple' || v === 'google' ? v : null; } catch { /* private mode */ }
  const touchMac = /Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1; // iPadOS
  cache = stored || defaultMapsApp(navigator.userAgent, touchMac);
  return cache;
}
function write(app) {
  cache = app;
  try { localStorage.setItem(KEY, app); } catch { /* private mode */ }
  subs.forEach(f => f());
}
const subscribe = f => { subs.add(f); return () => subs.delete(f); };

/** ['apple' | 'google', setter] — shared by every Directions button. */
export function useMapsApp() {
  const app = React.useSyncExternalStore(subscribe, read, () => 'google');
  return [app, write];
}

export const mapsAppName = (t, app) => t(app === 'apple' ? 'arrival.app.apple' : 'arrival.app.google');

/** Does this person get the step-free door by default? */
export const prefersStepFree = needs => (needs || []).some(n => STEP_FREE_NEEDS.includes(n));

/**
 * Everything a Directions button needs for one place:
 *   href / label / ariaLabel  the default Directions (entrance or address)
 *   toEntrance                whether the default goes to the step-free door
 *   entrance                  the routable entrance, or null
 *   entranceHref, addressHref both destinations, for Getting there
 */
export function directionsFor(t, venue, needs, app) {
  const e = routable(venue.entrance) ? venue.entrance : null;
  const appName = mapsAppName(t, app);
  const addressHref = directionsUrl(app, venue);
  const entranceHref = e ? directionsUrl(app, e) : null;
  const toEntrance = !!e && prefersStepFree(needs);
  const where = e ? t(`arrival.kind.${e.kind}.short`) : '';
  return {
    app, appName, entrance: e, toEntrance, entranceHref, addressHref,
    href: toEntrance ? entranceHref : addressHref,
    label: toEntrance ? t('arrival.dir.toEntrance', { where }) : t('venue.action.directions'),
    ariaLabel: toEntrance
      ? t('arrival.dir.toEntranceAria', { name: venue.name, where, app: appName })
      : t('arrival.dir.toAddressAria', { name: venue.name, app: appName }),
    entranceAria: e ? t('arrival.dir.toEntranceAria', { name: venue.name, where, app: appName }) : null,
    addressAria: t('arrival.dir.toAddressAria', { name: venue.name, app: appName }),
  };
}

/** Hook form: re-renders when the maps app or the language changes. */
export function useDirections(venue, needs) {
  const t = useT();
  const [app] = useMapsApp();
  return directionsFor(t, venue, needs, app);
}
