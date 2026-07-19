// Roam Access — web app root. Owns routing, user state, venue data and a11y prefs.
(function () {
const { useState, useEffect, useCallback, useMemo, useRef } = React;

const PREFS_KEY = 'ra-webapp-a11y';
const USER_KEY  = 'ra-webapp-user';

const VIEW_TITLES = {
  discover:   'Discover',
  saved:      'Saved places',
  reviews:    'Your contributions',
  profile:    'Profile',
  onboarding: 'Set up your profile',
  venue:      'Venue details',
  review:     'Write a review',
};

// ── Persistence ───────────────────────────────────────────────────────────
function readJSON(key) {
  try { return JSON.parse(localStorage.getItem(key) || 'null'); }
  catch (e) { return null; }
}
function writeJSON(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
}

function initialPrefs() {
  const saved = readJSON(PREFS_KEY);
  if (saved) return saved;
  // With nothing stored, start from what the OS already says about this
  // person rather than reporting "off" for settings that are in fact on.
  const mq = q => typeof window.matchMedia === 'function' && window.matchMedia(q).matches;
  return {
    scale: 1,
    contrast: mq('(prefers-contrast: more)'),
    motion: mq('(prefers-reduced-motion: reduce)'),
  };
}

function initialUser() {
  const saved = readJSON(USER_KEY);
  if (saved) return saved;
  // A cold visitor is a visitor — not a signed-in stranger whose disabilities
  // and saved venues they inherit.
  return { ...window.RA_DEFAULT_USER, signedIn: false, accessProfile: [], savedIds: [] };
}

// ── Routing ───────────────────────────────────────────────────────────────
// The hash is the single source of truth, so Back/Forward work, and a venue
// can be linked and shared.
const ROUTES = ['discover', 'saved', 'reviews', 'profile', 'onboarding', 'venue', 'review'];

function parseHash() {
  const raw = (window.location.hash || '').replace(/^#\/?/, '');
  const [view, id] = raw.split('/');
  if (!ROUTES.includes(view)) return { view: 'discover', venueId: null };
  return { view, venueId: id ? decodeURIComponent(id) : null };
}

function App() {
  const [route, setRoute] = useState(parseHash);
  const [venues, setVenues] = useState(() => window.RA_VENUES);
  const [user, setUser] = useState(initialUser);
  const [search, setSearch] = useState('');
  const [authOpen, setAuthOpen] = useState(false);
  const [a11yOpen, setA11yOpen] = useState(false);
  const [prefs, setPrefs] = useState(initialPrefs);
  const [toast, setToast] = useState(null);

  const { view } = route;
  const selectedVenueId = route.venueId || venues[0].id;

  // ── a11y preferences: one write path, so the switches can never claim a
  // state the app is not actually in.
  const applyPrefs = useCallback((next) => {
    setPrefs(next);
    const el = document.documentElement;
    el.style.setProperty('--ra-scale', String(next.scale));
    el.dataset.raContrast = next.contrast ? 'high' : '';
    el.dataset.raMotion = next.motion ? 'reduce' : '';
    window.RASetContrast(next.contrast);
    writeJSON(PREFS_KEY, next);
  }, []);

  useEffect(() => { applyPrefs(prefs); /* on mount only */ }, []); // eslint-disable-line

  useEffect(() => { writeJSON(USER_KEY, user); }, [user]);

  useEffect(() => {
    const onHash = () => setRoute(parseHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    function onKey(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const el = document.getElementById('ra-search');
        if (el) el.focus();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const goto = useCallback((nextView, id) => {
    window.RA_NAVIGATED = true;
    const hash = id ? `#/${nextView}/${encodeURIComponent(id)}` : `#/${nextView}`;
    if (window.location.hash === hash) setRoute(parseHash());
    else window.location.hash = hash;
    window.scrollTo(0, 0);
  }, []);

  const app = {
    view, selectedVenueId, user, search, venues,
    goto,
    setUser,
    openVenue: (id) => goto('venue', id),
    openReview: (id) => goto('review', id),
    toggleSave: (id) => {
      const ids = new Set(user.savedIds);
      const adding = !ids.has(id);
      adding ? ids.add(id) : ids.delete(id);
      setUser({ ...user, savedIds: Array.from(ids) });
      setToast(adding ? 'Saved to your places.' : 'Removed from your places.');
    },
    addReview: (venueId, review) => {
      setVenues(prev => prev.map(v => v.id === venueId
        ? { ...v, reviews: [{ ...review, id: `me-${Date.now()}`, mine: true }, ...v.reviews] }
        : v));
    },
    signOut: () => {
      setUser({ ...window.RA_DEFAULT_USER, signedIn: false, accessProfile: [], savedIds: [] });
      goto('discover');
      setToast('Signed out.');
    },
    toast: setToast,
    openA11y: () => setA11yOpen(true),
  };

  const a11yPanel = (
    <RAA11yPanel open={a11yOpen} onClose={() => setA11yOpen(false)}
                 prefs={prefs} onChange={applyPrefs}/>
  );

  // Route changes are announced deliberately in a small region. The previous
  // build made all of <main> a live region, which re-read the entire page on
  // every keystroke and filter toggle.
  const announcement = (
    <div className="ra-sr-only" role="status" aria-live="polite">
      {VIEW_TITLES[view] || ''}
    </div>
  );

  if (view === 'onboarding') {
    return (
      <div style={{ minHeight: '100vh', background: RA_C.paper }}>
        {announcement}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
          padding: '12px 20px', borderBottom: `1px solid ${RA_C.hair}`, flexWrap: 'wrap',
        }}>
          <RALogo size={18}/>
          {/* Onboarding is the longest reading task in the app, so the text-size
              and contrast controls have to be reachable from it. */}
          <RABtn kind="ghost" size="sm" onClick={() => setA11yOpen(true)} ariaLabel="Accessibility settings">
            Accessibility
          </RABtn>
        </div>
        <main id="ra-main" tabIndex={-1}>
          <RAOnboarding app={app} />
        </main>
        {a11yPanel}
        <RAToast message={toast} />
      </div>
    );
  }

  return (
    <div className="ra-shell" style={{ background: RA_C.paper }}>
      {announcement}

      <RASidebar view={view} goto={goto} user={user} onSignIn={() => setAuthOpen(true)} />

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <RATopbar
          user={user} search={search}
          onSearch={(v) => { setSearch(v); if (view !== 'discover') goto('discover'); }}
          onSignIn={() => setAuthOpen(true)}
          onOpenA11y={() => setA11yOpen(true)}
          goto={goto}
        />

        <main id="ra-main" tabIndex={-1} style={{ flex: 1, background: RA_C.paper }}>
          {view === 'discover' && <RADiscover app={app}/>}
          {view === 'venue'    && <RAVenue    app={app}/>}
          {view === 'review'   && <RAReview   app={app}/>}
          {view === 'saved'    && <RASaved    app={app}/>}
          {view === 'reviews'  && <RAReviews  app={app}/>}
          {view === 'profile'  && <RAProfile  app={app}/>}
        </main>

        <footer style={{
          borderTop: `1px solid ${RA_C.hair}`,
          padding: '12px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 8, flexWrap: 'wrap',
          fontSize: 12.5, color: RA_C.slate,
          background: RA_C.paper,
        }}>
          <span>roam/access · pilot v0.1 · pre-launch</span>
          <span style={{ display: 'inline-flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={() => goto('onboarding')} style={FOOTER_LINK}>Re-run onboarding</button>
            <a href="/" style={FOOTER_LINK}>Main site</a>
            <a href="/accessibility.html" style={FOOTER_LINK}>Accessibility statement</a>
          </span>
        </footer>
      </div>

      <RABottomNav view={view} goto={goto} />

      <RAAuthModal open={authOpen}
                   onClose={() => setAuthOpen(false)}
                   onAuth={(u) => {
                     setUser({ ...user, ...u, signedIn: true });
                     setAuthOpen(false);
                     goto('onboarding');
                     setToast('Account ready — let’s set up your access profile.');
                   }}/>
      {a11yPanel}
      <RAToast message={toast}/>
    </div>
  );
}

const FOOTER_LINK = {
  background: 'transparent', border: 0,
  padding: '10px 4px', minHeight: 44,
  display: 'inline-flex', alignItems: 'center',
  cursor: 'pointer', color: RA_C.slate,
  textDecoration: 'underline', textUnderlineOffset: 3,
  fontSize: 'inherit', fontFamily: 'inherit',
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
})();
