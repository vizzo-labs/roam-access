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

const PREFS_KEY = 'ra2-a11y';

const VIEW_TITLES = {
  setup: 'Set your needs', 'setup-name': 'Your name',
  home: 'Home', voice: 'Voice search', results: 'Search results', map: 'Map',
  venue: 'Venue details', reviews: 'Community reviews', review: 'Write a review',
  thanks: 'Thank you', saved: 'Saved places', me: 'Your profile',
  gaps: 'Help fill the gaps',
  card: 'My needs card',
  toilets: 'Accessible toilets', beach: 'Beach access', facility: 'Access details',
};
const ROUTES = Object.keys(VIEW_TITLES);
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
  return (
    <div role="main" style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 28px', background: C2.paper, fontFamily: F2 }}>
      <div style={{ maxWidth: 420, margin: '0 auto', width: '100%' }}>
        <h1 style={{ fontSize: 28, margin: '0 0 10px', letterSpacing: '-0.02em' }}>
          {offline ? 'You’re offline' : 'Can’t connect right now'}<span style={{ color: C2.rust }}>.</span>
        </h1>
        <p role="status" style={{ fontSize: 17, lineHeight: 1.55, color: C2.slate, margin: '0 0 24px' }}>
          Roam Access needs a connection to load places and reviews. Your reviews and saved places are safe — they’re stored with your account.
        </p>
        <V2BigBtn kind="primary" onClick={() => window.location.reload()}>Try again</V2BigBtn>
      </div>
    </div>
  );
}

export function PilotRoot() {
  const { isLoaded, isSignedIn } = useAuth();
  const { online, slow } = useConnection(isLoaded);
  if (!isLoaded && (!online || slow)) return <CantConnect offline={!online}/>;
  if (!isLoaded) return <div className="ra-loading" role="status">Loading…</div>;
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
        <h1 style={{ fontSize: 26, margin: '0 0 10px', letterSpacing: '-0.02em' }}>Couldn’t load the pilot.</h1>
        <p style={{ fontSize: 17, lineHeight: 1.5, color: C2.slate, margin: '0 0 22px' }}>Check your connection and try again.</p>
        <V2BigBtn kind="primary" onClick={load}>Try again</V2BigBtn>
      </div>
    );
  }
  if (!data) return <div className="ra-loading" role="status">Loading places…</div>;
  return <PilotScreens initial={data} userId={userId}/>;
}

function PilotScreens({ initial, userId }) {
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
    document.title = `${VIEW_TITLES[view] || 'Home'} · Roam Access pilot`;
    setA11yOpen(false);
  }, [view, selectedId]);

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
    else if (query && ['results', 'venue', 'reviews', 'review', 'thanks', 'voice'].includes(view)) list = ra2Search(withMins, query, needIds);
    if (!list.length) { list = withMins; fit = false; }
    const sel = VENUE_VIEWS.includes(view) && selectedId && byId.get(selectedId);
    if (sel && !list.some(v => v.id === sel.id)) list = [...list, sel];
    return { list: list.map(v => (v.verdict ? v : { ...v, verdict: ra2Verdict(v, needIds) })), fit };
  }, [wide, view, query, savedIds, withMins, byId, selectedId, me.needs]);

  const app = {
    view, selectedId, user, query, origin, wide,
    installable: !install.standalone,
    canPromptInstall: install.canPrompt,
    install: async () => {
      if (install.standalone) return;
      if (install.canPrompt) {
        if (await install.prompt()) setToast('Installed — Roam Access is on your home screen.');
        return;
      }
      setToast(install.ios
        ? 'In Safari, tap Share, then “Add to Home Screen”.'
        : 'Open your browser menu and choose “Install app” or “Add to Home screen”.');
    },
    venues: withMins,
    venueById: id => byId.get(id),
    world: { saved: savedIds, reviewed, visitedId },
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
        .catch(() => setToast('Couldn’t save your profile — check your connection.'));
    },

    runSearch: (parsed) => {
      setQuery(parsed);
      goto('results', null, { replace: parseHash(idsRef.current).view === 'voice' });
    },

    toggleSave: (id) => {
      const on = !savedIds.includes(id);
      setSavedIds(s => (on ? [id, ...s.filter(x => x !== id)] : s.filter(x => x !== id)));
      setToast(on ? 'Saved to your places.' : 'Removed from your places.');
      api('/api/saved', { method: 'PUT', body: JSON.stringify({ venueId: id, saved: on }) }).catch(() => {
        setSavedIds(s => (on ? s.filter(x => x !== id) : [id, ...s]));
        setToast('Couldn’t update your saved places — check your connection.');
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

    submitReview: async ({ venueId, verdict, features, note, entranceAlt, entranceNote, photos, sensory }) => {
      try {
        const r = await api('/api/reviews', { method: 'POST', body: JSON.stringify({ venueId, verdict, features, note, entranceAlt, entranceNote, photos, sensory }) });
        if (r.venue) setVenues(vs => vs.map(v => (v.id === venueId ? r.venue : v)));
        setReviewed(x => (x.includes(venueId) ? x : [...x, venueId]));
        setMyStats(r.myStats);
        setLastSubmit({ venueId, venueReviews: r.venueReviews });
        delete reviewsCache.current[venueId];
        setReviewsVersion(x => x + 1);
        return true;
      } catch (e) {
        setToast('Couldn’t send your review — check your connection and try again.');
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
        setToast('Couldn’t save your answer — check your connection and try again.');
        return false;
      }
    },

    // From the map's "my location" button (also fires as the tester moves).
    locateFromMap: ({ lat, lng }) => {
      const here = { lat, lng };
      if (metres(PILOT_AREA.origin, here) > PILOT_RADIUS_M) {
        if (!farToastShown.current) setToast('You’re outside the pilot area — walking times stay from Manly Wharf.');
        farToastShown.current = true;
        return;
      }
      if (origin.mine && metres(origin, here) < 40) return; // ignore GPS jitter
      if (!origin.mine) setToast('Showing where you are — walking times now start from you.');
      setOrigin({ name: 'your location', lat, lng, mine: true });
    },
    locateError: () => setToast('Couldn’t get your location — check that location is allowed for this site.'),

    locateMe: () => {
      if (!navigator.geolocation) { setToast('Location isn’t available on this device.'); return; }
      navigator.geolocation.getCurrentPosition(
        p => {
          const here = { lat: p.coords.latitude, lng: p.coords.longitude };
          if (metres(PILOT_AREA.origin, here) > PILOT_RADIUS_M) {
            setToast('You’re outside the pilot area — walking times stay from Manly Wharf.');
            return;
          }
          setOrigin({ name: 'your location', ...here, mine: true });
          setToast('Walking times now start from where you are.');
        },
        () => setToast('Couldn’t get your location — still measuring from Manly Wharf.'),
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
      );
    },

    invite: async () => {
      const url = window.location.origin;
      const text = 'Help test Roam Access — find places in Manly that actually work for people with disability.';
      try {
        if (navigator.share) { await navigator.share({ title: 'Roam Access pilot', text, url }); return; }
        await navigator.clipboard.writeText(url);
        setToast('Link copied — paste it anywhere to invite someone.');
      } catch (e) { /* share sheet dismissed */ }
    },

    signOut: () => signOut({ redirectUrl: '/' }),

    deleteAccount: async () => {
      if (!window.confirm('Delete your account? This removes your needs, reviews and saved places from the pilot. It can’t be undone.')) return;
      try {
        await api('/api/profile', { method: 'DELETE' });
        try { localStorage.removeItem(visitKey); } catch (e) {}
        await signOut({ redirectUrl: '/' });
      } catch (e) {
        setToast('Couldn’t delete your account — try again.');
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
      <div className="ra-sr-only" role="status" aria-live="polite">{VIEW_TITLES[view] || ''}</div>
      <Screen app={app}/>
      <V2A11ySheet open={a11yOpen} onClose={() => setA11yOpen(false)} prefs={prefs} onChange={p => applyPrefs(p)}/>
      <V2Toast message={toast}/>
    </div>
  );
  if (!wide) return content;
  return (
    <WebLayout app={app} mapResults={mapView.list} mapFit={mapView.fit} selectedId={VENUE_VIEWS.includes(view) ? selectedId : null}>
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
    return (
      <div role="main" style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '0 28px', background: C2.paper, color: C2.char, fontFamily: F2,
      }}>
        <h1 style={{ fontSize: 28, lineHeight: 1.15, margin: '0 0 12px', letterSpacing: '-0.02em' }}>Something went wrong.</h1>
        <p style={{ fontSize: 17, lineHeight: 1.5, color: C2.slate, margin: '0 0 24px' }}>
          Reloading usually fixes it. Your reviews and saved places are safe.
        </p>
        <V2BigBtn kind="primary" onClick={() => { history.replaceState(null, '', window.location.pathname); window.location.reload(); }}>
          Reload
        </V2BigBtn>
      </div>
    );
  }
}
