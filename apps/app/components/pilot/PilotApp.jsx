'use client';
// Roam Access pilot — root. Hash routing, server-backed state, a11y prefs.
// Adapted from the static demo's app.jsx: same routing/focus behaviour, but
// profile, venues, reviews and saved places now live in the database.

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth, useClerk } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { PILOT_AREA } from '@/lib/pilot-data';
import { WebLayout, WebWelcome } from './WebLayout';
import { useInstall } from './pwa';
import { ra2Search, ra2Verdict } from '@/lib/pilot/match';
import { C2, F2, RA2SetContrast } from './ui/palette';
import { V2Toast } from './ui/Toast';
import { V2BigBtn } from './ui/Buttons';
import { V2Welcome } from './screens/Welcome';
import { V2Setup } from './screens/Setup';
import { V2SetupName } from './screens/SetupName';
import { V2Home } from './screens/Home';
import { V2Voice } from './screens/Voice';
import { V2Results } from './screens/Results';
import { V2MapView } from './screens/Map';
import { V2VenueView } from './screens/Venue';
import { V2AllReviews } from './screens/AllReviews';
import { V2ReviewView } from './screens/Review';
import { V2Thanks } from './screens/Thanks';
import { V2SavedView } from './screens/Saved';
import { V2Me } from './screens/Me';
import { V2A11ySheet } from './screens/A11ySheet';
import { V2Gaps } from './screens/Gaps';
import { V2NeedsCard } from './screens/NeedsCard';
import { V2Toilets } from './screens/Toilets';
import { V2Beach } from './screens/Beach';
import { V2Facility } from './screens/Facility';
import { useAccessLayers } from './layers/useAccessLayers';
import { I18nProvider, useT } from './i18n';
import { DEFAULT_FILTERS, applyFilters } from './explore/filters';
import { AppSkeleton } from './explore/AppSkeleton';

const PREFS_KEY = 'ra2-a11y';

// Every route; its title (document.title + the route announcer) is app.view.<route>.
const ROUTES = [
  'setup', 'setup-name', 'home', 'voice', 'results', 'map', 'venue', 'reviews', 'review',
  'thanks', 'saved', 'me', 'gaps', 'card', 'toilets', 'beach', 'facility',
];
const viewTitle = (t, view) => t(`app.view.${ROUTES.includes(view) ? view : 'home'}`);
const DARK_VIEWS = ['voice', 'thanks'];
// Screens that render one venue: an id that isn't in the data is not a route.
const VENUE_VIEWS = ['venue', 'reviews', 'review', 'thanks'];
const SCALE_VALUES = [1, 1.125, 1.25, 1.5]; // must match SCALES in V2A11ySheet

const isObj = x => !!x && typeof x === 'object' && !Array.isArray(x);
function readJSON(key) {
  try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch (e) { return null; }
}
function writeJSON(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
}

// Only what the user set in the in-app panel is stored; anything unset
// follows the OS (prefers-contrast / prefers-reduced-motion).
function initialPrefs() {
  const saved = readJSON(PREFS_KEY);
  const s = isObj(saved) ? saved : {};
  const mq = q => typeof window.matchMedia === 'function' && window.matchMedia(q).matches;
  return {
    scale: SCALE_VALUES.includes(s.scale) ? s.scale : 1,
    contrast: typeof s.contrast === 'boolean' ? s.contrast : mq('(prefers-contrast: more)'),
    motion: typeof s.motion === 'boolean' ? s.motion : mq('(prefers-reduced-motion: reduce)'),
  };
}

function parseHashOrNull(ids) {
  const raw = (window.location.hash || '').replace(/^#\/?/, '');
  const [view, id] = raw.split('/');
  if (!ROUTES.includes(view)) return null;
  let decoded = null;
  if (id) { try { decoded = decodeURIComponent(id); } catch (e) { decoded = null; } }
  if (VENUE_VIEWS.includes(view) && !ids.has(decoded)) return null;
  return { view, id: decoded };
}
const parseHash = ids => parseHashOrNull(ids) || { view: 'home', id: null };
const isAppHash = () => /^#\//.test(window.location.hash || '');

function metres(a, b) {
  const R = 6371000, rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad, dLng = (b.lng - a.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
// Walking minutes: straight-line distance, +25% for streets, 80 m/min.
const walkMins = (o, v) => Math.max(1, Math.round((metres(o, v) * 1.25) / 80));
// Farther than this from Manly Wharf, "minutes from you" stops being useful.
const PILOT_RADIUS_M = 15000;

async function api(path, opts = {}) {
  const res = await fetch(path, { ...opts, headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) } });
  if (!res.ok) {
    const err = new Error(`${res.status} ${path}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

// Web app layout from 960px; the mobile app below that.
const WIDE_QUERY = '(min-width: 960px)';
function useWide() {
  const [wide, setWide] = useState(() => window.matchMedia(WIDE_QUERY).matches);
  useEffect(() => {
    const mq = window.matchMedia(WIDE_QUERY);
    const on = () => setWide(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  useEffect(() => { document.documentElement.classList.toggle('ra-wide', wide); }, [wide]);
  return wide;
}

// ── Entry: signed out → Welcome; signed in → the app ─────────────────────
// Offline, or sign-in can't reach Clerk: say so instead of loading forever.
function useConnection(isLoaded) {
  const [online, setOnline] = useState(true);
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update); };
  }, []);
  useEffect(() => {
    if (isLoaded) return;
    const t = setTimeout(() => setSlow(true), 10000);
    return () => clearTimeout(t);
  }, [isLoaded]);
  return { online, slow };
}

function CantConnect({ offline }) {
  const t = useT();
  return (
    <div role="main" style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 28px', background: C2.paper, fontFamily: F2 }}>
      <div style={{ maxWidth: 420, margin: '0 auto', width: '100%' }}>
        <h1 style={{ fontSize: 28, margin: '0 0 10px', letterSpacing: '-0.02em' }}>
          {offline ? t('common.offline') : t('app.cantConnect')}<span style={{ color: C2.rust }}>.</span>
        </h1>
        <p role="status" style={{ fontSize: 17, lineHeight: 1.55, color: C2.slate, margin: '0 0 24px' }}>
          {t('app.needsConnection')}
        </p>
        <V2BigBtn kind="primary" onClick={() => window.location.reload()}>{t('common.retry')}</V2BigBtn>
      </div>
    </div>
  );
}

// Every screen is inside the language provider (#21).
export function PilotRoot() {
  return <I18nProvider><PilotRootInner/></I18nProvider>;
}

function PilotRootInner() {
  const t = useT();
  const { isLoaded, isSignedIn } = useAuth();
  const { online, slow } = useConnection(isLoaded);
  if (!isLoaded && (!online || slow)) return <CantConnect offline={!online}/>;
  if (!isLoaded) return <div className="ra-loading" role="status">{t('common.loading')}</div>;
  if (!isSignedIn) return <SignedOut/>;
  return <RA2ErrorBoundary><PilotApp/></RA2ErrorBoundary>;
}

function SignedOut() {
  const router = useRouter();
  const wide = useWide();
  const app = { signUp: () => router.push('/sign-up'), signIn: () => router.push('/sign-in'), toast: () => {}, wide };
  const screen = (
    <div id="ra-main" role="main" tabIndex={-1} style={{ position: 'absolute', inset: 0 }}>
      <V2Welcome app={app}/>
    </div>
  );
  if (!wide) return screen;
  return <WebWelcome origin={PILOT_AREA.origin} signIn={app.signIn}>{screen}</WebWelcome>;
}

function PilotApp() {
  const t = useT();
  const { userId } = useAuth();
  const [data, setData] = useState(null);
  const [failed, setFailed] = useState(false);
  const load = useCallback(() => {
    setFailed(false);
    api('/api/bootstrap').then(setData, () => setFailed(true));
  }, []);
  useEffect(() => { load(); }, [load]);

  if (failed) {
    return (
      <div role="main" style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 28px', background: C2.paper, fontFamily: F2 }}>
        <h1 style={{ fontSize: 26, margin: '0 0 10px', letterSpacing: '-0.02em' }}>{t('app.loadFailed')}</h1>
        <p style={{ fontSize: 17, lineHeight: 1.5, color: C2.slate, margin: '0 0 22px' }}>{t('common.checkConnection')}</p>
        <V2BigBtn kind="primary" onClick={load}>{t('common.retry')}</V2BigBtn>
      </div>
    );
  }
  if (!data) return <AppSkeleton/>;
  return <PilotScreens initial={data} userId={userId}/>;
}

function PilotScreens({ initial, userId }) {
  const t = useT();
  const { signOut } = useClerk();
  const wide = useWide();
  const install = useInstall();
  const layers = useAccessLayers();
  const [me, setMe] = useState(initial.me);
  const [venues, setVenues] = useState(initial.venues);
  const [savedIds, setSavedIds] = useState(initial.saved);
  const [reviewed, setReviewed] = useState(initial.reviewed);
  const [myStats, setMyStats] = useState(initial.myStats);
  const [pilot, setPilot] = useState(initial.pilot);
  // Updates from saved places (in the app only — see lib/notify): the ids
  // this person has marked as seen; the updates come from saved places.
  const [seenNotices, setSeenNotices] = useState(() => new Set(initial.seenNotices || []));
  const [lastSubmit, setLastSubmit] = useState(null);
  const [origin, setOrigin] = useState({ ...PILOT_AREA.origin, mine: false });
  const visitKey = `ra2-visited-${userId}`;
  const [visitedId, setVisitedId] = useState(() => { try { return localStorage.getItem(visitKey); } catch (e) { return null; } });

  const venueIds = useMemo(() => new Set(venues.map(v => v.id)), [venues]);
  const idsRef = useRef(venueIds);
  idsRef.current = venueIds;
  const withMins = useMemo(() => venues.map(v => ({ ...v, mins: walkMins(origin, v) })), [venues, origin]);
  const byId = useMemo(() => new Map(withMins.map(v => [v.id, v])), [withMins]);

  const [route, setRoute] = useState(() => parseHash(venueIds));
  const [query, setQuery] = useState(null);
  const [filters, setFiltersState] = useState(DEFAULT_FILTERS);
  const [hoverId, setHoverId] = useState(null);
  const [lastVenueId, setLastVenueId] = useState(null);
  const [prefs, setPrefs] = useState(initialPrefs);
  const [a11yOpen, setA11yOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const reviewsCache = useRef({});
  const farToastShown = useRef(false);
  const [reviewsVersion, setReviewsVersion] = useState(0);

  // New testers go through needs + name first, whatever the URL says.
  const onboarded = me.onboarded;
  const routeView = wide && route.view === 'map' ? 'results' : route.view;
  const view = !onboarded && !['setup', 'setup-name'].includes(routeView) ? 'setup' : routeView;
  const selectedId = route.id;

  const prefsRef = useRef(prefs);
  const applyPrefs = useCallback((partial, persist = true) => {
    const next = { ...prefsRef.current, ...partial };
    prefsRef.current = next;
    setPrefs(next);
    const el = document.documentElement;
    el.style.setProperty('--ra-scale', String(next.scale));
    el.dataset.raContrast = next.contrast ? 'high' : '';
    el.dataset.raMotion = next.motion ? 'reduce' : '';
    RA2SetContrast(next.contrast);
    if (persist) {
      const stored = readJSON(PREFS_KEY);
      writeJSON(PREFS_KEY, { ...(isObj(stored) ? stored : {}), ...partial });
    }
  }, []);
  useEffect(() => { applyPrefs(prefs, false); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const toHome = () => {
      history.replaceState(history.state, '', '#/home');
      setRoute({ view: 'home', id: null });
    };
    if (!parseHashOrNull(idsRef.current) && isAppHash()) toHome();
    const onHash = () => {
      const next = parseHashOrNull(idsRef.current);
      if (next) setRoute(next);
      else if (isAppHash()) toHome(); // bad app link; skip-link hashes are ignored
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.raDark = DARK_VIEWS.includes(view) ? '1' : '';
    document.title = t('app.docTitle', { title: viewTitle(t, view) });
    setA11yOpen(false);
    setHoverId(null); // rows unmount without a mouseleave
  }, [view, selectedId, t]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3600);
    return () => clearTimeout(t);
  }, [toast]);

  const venueOriginRef = useRef('home');

  // { replace: true } swaps the current history entry: used when leaving the
  // voice screen (it would listen again on Back) and a sent review form.
  const goto = useCallback((nextView, id, opts) => {
    window.RA2_NAVIGATED = true;
    if (nextView === 'venue') {
      setLastVenueId(id);
      const from = parseHash(idsRef.current).view;
      if (['home', 'results', 'map', 'saved', 'toilets', 'beach'].includes(from)) venueOriginRef.current = from;
    }
    const hash = id ? `#/${nextView}/${encodeURIComponent(id)}` : `#/${nextView}`;
    if (opts && opts.replace) {
      history.replaceState(history.state, '', hash);
      setRoute(parseHash(idsRef.current));
    } else if (window.location.hash === hash) setRoute(parseHash(idsRef.current));
    else window.location.hash = hash;
  }, []);

  const user = { name: me.name, needs: me.needs, done: me.onboarded };

  // Web layout: the map always shows places (grouped into bubbles until you
  // zoom in). A search or saved list narrows it and frames the best matches;
  // otherwise it's every place in the area, without moving the camera.
  const mapView = useMemo(() => {
    if (!wide) return { list: [], fit: false };
    const needIds = me.needs;
    let list = [], fit = true;
    if (view === 'saved') list = savedIds.map(id => byId.get(id)).filter(Boolean);
    else if (query && ['results', 'venue', 'reviews', 'review', 'thanks', 'voice'].includes(view)) list = applyFilters(ra2Search(withMins, query, needIds), filters);
    if (!list.length) { list = withMins; fit = false; }
    const sel = VENUE_VIEWS.includes(view) && selectedId && byId.get(selectedId);
    if (sel && !list.some(v => v.id === sel.id)) list = [...list, sel];
    return { list: list.map(v => (v.verdict ? v : { ...v, verdict: ra2Verdict(v, needIds) })), fit };
  }, [wide, view, query, filters, savedIds, withMins, byId, selectedId, me.needs]);

  // "Updates from your saved places": each saved place's live notices.
  const savedUpdates = useMemo(() => savedIds
    .flatMap(id => { const v = byId.get(id); return (v?.notices || []).map(n => ({ ...n, venueId: id, venueName: v.name, seen: seenNotices.has(n.id) })); })
    .sort((a, b) => (a.at < b.at ? 1 : -1)), [savedIds, byId, seenNotices]);

  // "your location" is shown in the app's language; Manly Wharf is a name.
  const shownOrigin = origin.mine ? { ...origin, name: t('data.yourLocation') } : origin;

  const app = {
    view, selectedId, user, query, origin: shownOrigin, wide,
    // Explore: filters shared by list + maps; setQuery narrows without navigating.
    filters,
    setFilters: (partial) => setFiltersState(f => ({ ...f, ...partial })),
    setQuery,
    // Desktop: hovering/focusing a row highlights its pin (no-op on phones).
    hover: wide ? setHoverId : null,
    lastVenueId,
    installable: !install.standalone,
    canPromptInstall: install.canPrompt,
    install: async () => {
      if (install.standalone) return;
      if (install.canPrompt) {
        if (await install.prompt()) setToast(t('app.toast.installed'));
        return;
      }
      setToast(install.ios
        ? t('app.toast.installIos')
        : t('app.toast.installOther'));
    },
    venues: withMins,
    venueById: id => byId.get(id),
    world: { saved: savedIds, reviewed, visitedId },
    // Live updates from places this person saved, newest first.
    updates: savedUpdates,
    unseenUpdates: savedUpdates.filter(u => !u.seen).length,
    markUpdatesSeen: (ids) => {
      setSeenNotices(s => new Set([...s, ...ids]));
      api('/api/notices/seen', { method: 'POST', body: JSON.stringify({ ids }) }).catch(() => {
        setSeenNotices(s => new Set([...s].filter(x => !ids.includes(x))));
        setToast(t('owner.updates.seenFailed'));
      });
    },
    myStats, pilot, lastSubmit,
    layers,
    venueOrigin: venueOriginRef.current,
    goto,
    toast: setToast,
    openA11y: () => setA11yOpen(true),
    reviewsCache: reviewsCache.current,
    reviewsVersion,

    // Setup calls this with the new needs, then the name step with done:true.
    // Saved to the server once the profile is complete (or when editing it).
    setUser: (next) => {
      const n = typeof next === 'function' ? next(user) : next;
      const updated = { name: n.name ?? me.name, needs: n.needs ?? me.needs, onboarded: !!n.done || me.onboarded };
      const firstTime = !me.onboarded && updated.onboarded;
      setMe(updated);
      if (!updated.onboarded) return;
      if (firstTime) setPilot(p => ({ ...p, testers: p.testers + 1 }));
      api('/api/profile', { method: 'PUT', body: JSON.stringify({ name: updated.name, needs: updated.needs, onboarded: true }) })
        .then(p => setMe(p))
        .catch(() => setToast(t('app.toast.profileFailed')));
    },

    runSearch: (parsed) => {
      setQuery(parsed);
      goto('results', null, { replace: parseHash(idsRef.current).view === 'voice' });
    },

    toggleSave: (id) => {
      const on = !savedIds.includes(id);
      setSavedIds(s => (on ? [id, ...s.filter(x => x !== id)] : s.filter(x => x !== id)));
      setToast(on ? t('app.toast.saved') : t('app.toast.unsaved'));
      api('/api/saved', { method: 'PUT', body: JSON.stringify({ venueId: id, saved: on }) }).catch(() => {
        setSavedIds(s => (on ? s.filter(x => x !== id) : [id, ...s]));
        setToast(t('app.toast.savedFailed'));
      });
    },

    markVisited: (id) => {
      setVisitedId(id);
      try { localStorage.setItem(visitKey, id); } catch (e) {}
    },

    loadReviews: async (id) => {
      const r = await api(`/api/venues/${encodeURIComponent(id)}/reviews`);
      reviewsCache.current[id] = r.reviews;
      return r.reviews;
    },

    // A fresh view model from the server (e.g. after "Still accurate? Yes").
    updateVenue: (venue) => setVenues(vs => vs.map(v => (v.id === venue.id ? venue : v))),

    submitReview: async ({ venueId, verdict, features, note, entranceAlt, entranceNote, entrance, photos, sensory }) => {
      try {
        const r = await api('/api/reviews', { method: 'POST', body: JSON.stringify({ venueId, verdict, features, note, entranceAlt, entranceNote, entrance, photos, sensory }) });
        if (r.venue) setVenues(vs => vs.map(v => (v.id === venueId ? r.venue : v)));
        setReviewed(x => (x.includes(venueId) ? x : [...x, venueId]));
        setMyStats(r.myStats);
        setLastSubmit({ venueId, venueReviews: r.venueReviews });
        delete reviewsCache.current[venueId];
        setReviewsVersion(x => x + 1);
        return true;
      } catch (e) {
        setToast(t('app.toast.reviewFailed'));
        return false;
      }
    },

    // "Help fill the gaps": one yes/no answer. Updates the place's facts.
    answerQuick: async ({ venueId, feature, answer }) => {
      try {
        const r = await api('/api/micro-answers', { method: 'POST', body: JSON.stringify({ venueId, feature, answer }) });
        if (r.venue) setVenues(vs => vs.map(v => (v.id === venueId ? r.venue : v)));
        return true;
      } catch (e) {
        setToast(t('app.toast.answerFailed'));
        return false;
      }
    },

    // From the map's "my location" button (also fires as the tester moves).
    locateFromMap: ({ lat, lng }) => {
      const here = { lat, lng };
      if (metres(PILOT_AREA.origin, here) > PILOT_RADIUS_M) {
        if (!farToastShown.current) setToast(t('app.toast.outsideArea'));
        farToastShown.current = true;
        return;
      }
      if (origin.mine && metres(origin, here) < 40) return; // ignore GPS jitter
      if (!origin.mine) setToast(t('app.toast.showingYou'));
      setOrigin({ name: 'your location', lat, lng, mine: true });
    },
    locateError: () => setToast(t('app.toast.locateError')),

    locateMe: () => {
      if (!navigator.geolocation) { setToast(t('app.toast.noLocation')); return; }
      navigator.geolocation.getCurrentPosition(
        p => {
          const here = { lat: p.coords.latitude, lng: p.coords.longitude };
          if (metres(PILOT_AREA.origin, here) > PILOT_RADIUS_M) {
            setToast(t('app.toast.outsideArea'));
            return;
          }
          setOrigin({ name: 'your location', ...here, mine: true });
          setToast(t('app.toast.walkFromYou'));
        },
        () => setToast(t('app.toast.locateFailed')),
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
      );
    },

    invite: async () => {
      const url = window.location.origin;
      const text = t('app.invite.text');
      try {
        if (navigator.share) { await navigator.share({ title: t('app.invite.title'), text, url }); return; }
        await navigator.clipboard.writeText(url);
        setToast(t('app.toast.linkCopied'));
      } catch (e) { /* share sheet dismissed */ }
    },

    signOut: () => signOut({ redirectUrl: '/' }),

    deleteAccount: async () => {
      if (!window.confirm(t('app.deleteConfirm'))) return;
      try {
        await api('/api/profile', { method: 'DELETE' });
        try { localStorage.removeItem(visitKey); } catch (e) {}
        await signOut({ redirectUrl: '/' });
      } catch (e) {
        setToast(t('app.toast.deleteFailed'));
      }
    },
  };

  const screens = {
    setup: V2Setup, 'setup-name': V2SetupName,
    home: V2Home, voice: V2Voice, results: V2Results, map: V2MapView,
    venue: V2VenueView, reviews: V2AllReviews, review: V2ReviewView,
    thanks: V2Thanks, saved: V2SavedView, me: V2Me,
    gaps: V2Gaps,
    card: V2NeedsCard,
    toilets: V2Toilets, beach: V2Beach, facility: V2Facility,
  };
  const Screen = screens[view] || V2Home;

  const content = (
    <div id="ra-main" role="main" tabIndex={-1} style={{ position: 'absolute', inset: 0 }}>
      <div className="ra-sr-only" role="status" aria-live="polite">{viewTitle(t, view)}</div>
      <Screen app={app}/>
      <V2A11ySheet open={a11yOpen} onClose={() => setA11yOpen(false)} prefs={prefs} onChange={p => applyPrefs(p)}/>
      <V2Toast message={toast}/>
    </div>
  );
  if (!wide) return content;
  return (
    <WebLayout app={app} mapResults={mapView.list} mapFit={mapView.fit} hoverId={hoverId} selectedId={VENUE_VIEWS.includes(view) ? selectedId : null}>
      {content}
    </WebLayout>
  );
}

// Any render error shows a way out instead of a blank phone.
class RA2ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { failed: false }; }
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(err) { try { console.error('[roam-access]', err); } catch (e) {} }
  render() {
    if (!this.state.failed) return this.props.children;
    return <CrashScreen/>;
  }
}

function CrashScreen() {
  const t = useT();
  return (
      <div role="main" style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '0 28px', background: C2.paper, color: C2.char, fontFamily: F2,
      }}>
        <h1 style={{ fontSize: 28, lineHeight: 1.15, margin: '0 0 12px', letterSpacing: '-0.02em' }}>{t('app.crash.title')}</h1>
        <p style={{ fontSize: 17, lineHeight: 1.5, color: C2.slate, margin: '0 0 24px' }}>
          {t('app.crash.body')}
        </p>
        <V2BigBtn kind="primary" onClick={() => { history.replaceState(null, '', window.location.pathname); window.location.reload(); }}>
          {t('app.crash.reload')}
        </V2BigBtn>
      </div>
  );
}
