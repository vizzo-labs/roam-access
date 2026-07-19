// Roam Access pilot v2 — root. Routing, user + world state, a11y prefs.
(function () {
  const {
    useState,
    useEffect,
    useCallback
  } = React;
  const USER_KEY = 'ra2-user';
  const WORLD_KEY = 'ra2-world';
  const PREFS_KEY = 'ra2-a11y';
  const VIEW_TITLES = {
    welcome: 'Welcome',
    setup: 'Set your needs',
    'setup-name': 'Your name',
    home: 'Home',
    voice: 'Voice search',
    results: 'Search results',
    map: 'Map',
    venue: 'Venue details',
    reviews: 'Community reviews',
    review: 'Write a review',
    thanks: 'Thank you',
    saved: 'Saved places',
    me: 'Your profile'
  };
  const ROUTES = Object.keys(VIEW_TITLES);
  // Dark (teal) screens — the phone-frame status bar swaps to light text.
  const DARK_VIEWS = ['voice', 'thanks'];
  function readJSON(key) {
    try {
      return JSON.parse(localStorage.getItem(key) || 'null');
    } catch (e) {
      return null;
    }
  }
  function writeJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {}
  }
  function initialPrefs() {
    const saved = readJSON(PREFS_KEY);
    if (saved) return saved;
    const mq = q => typeof window.matchMedia === 'function' && window.matchMedia(q).matches;
    return {
      scale: 1,
      contrast: mq('(prefers-contrast: more)'),
      motion: mq('(prefers-reduced-motion: reduce)')
    };
  }
  const DEFAULT_WORLD = {
    saved: ['foundry', 'tin-whistle'],
    myReviews: {},
    // venueId -> [review]
    reviewed: [],
    // venueIds already 1-tap reviewed
    visitedId: 'tin-whistle'
  };

  // Returns null for hashes that aren't app routes (e.g. the skip link's
  // #ra-main) — the caller keeps the current screen instead of resetting.
  function parseHashOrNull() {
    const raw = (window.location.hash || '').replace(/^#\/?/, '');
    const [view, id] = raw.split('/');
    if (!ROUTES.includes(view)) return null;
    let decoded = null;
    if (id) {
      try {
        decoded = decodeURIComponent(id);
      } catch (e) {
        decoded = null;
      }
    }
    return {
      view,
      id: decoded
    };
  }
  function parseHash() {
    return parseHashOrNull() || {
      view: 'home',
      id: null
    };
  }
  function App() {
    const [route, setRoute] = useState(parseHash);
    const [user, setUser] = useState(() => readJSON(USER_KEY));
    const [world, setWorld] = useState(() => ({
      ...DEFAULT_WORLD,
      ...(readJSON(WORLD_KEY) || {})
    }));
    const [query, setQuery] = useState(null);
    const [prefs, setPrefs] = useState(initialPrefs);
    const [a11yOpen, setA11yOpen] = useState(false);
    const [toast, setToast] = useState(null);

    // First run goes through onboarding, whatever the URL says.
    const onboarded = !!(user && user.done);
    const view = !onboarded && !['welcome', 'setup', 'setup-name'].includes(route.view) ? 'welcome' : route.view;
    const selectedId = route.id;

    // Accepts partial updates and merges over a ref, so two changes landing in
    // the same tick can never clobber each other.
    const prefsRef = React.useRef(prefs);
    const applyPrefs = useCallback(partial => {
      const next = {
        ...prefsRef.current,
        ...partial
      };
      prefsRef.current = next;
      setPrefs(next);
      const el = document.documentElement;
      el.style.setProperty('--ra-scale', String(next.scale));
      el.dataset.raContrast = next.contrast ? 'high' : '';
      el.dataset.raMotion = next.motion ? 'reduce' : '';
      window.RA2SetContrast(next.contrast);
      writeJSON(PREFS_KEY, next);
    }, []);
    useEffect(() => {
      applyPrefs(prefs);
    }, []); // eslint-disable-line
    useEffect(() => {
      if (user) writeJSON(USER_KEY, user);
    }, [user]);
    useEffect(() => {
      writeJSON(WORLD_KEY, world);
    }, [world]);
    useEffect(() => {
      const onHash = () => {
        const next = parseHashOrNull();
        if (next) setRoute(next); // ignore non-route hashes (skip link target etc.)
      };
      window.addEventListener('hashchange', onHash);
      return () => window.removeEventListener('hashchange', onHash);
    }, []);

    // Phone-frame chrome (status bar / home indicator) follows dark screens.
    useEffect(() => {
      document.documentElement.dataset.raDark = DARK_VIEWS.includes(view) ? '1' : '';
    }, [view]);
    useEffect(() => {
      if (!toast) return;
      const t = setTimeout(() => setToast(null), 3600);
      return () => clearTimeout(t);
    }, [toast]);

    // Where the venue screen's back button returns to: the last list-like view
    // the user opened a venue from (home, results, map or saved).
    const venueOriginRef = React.useRef('home');
    const goto = useCallback((nextView, id) => {
      window.RA2_NAVIGATED = true;
      if (nextView === 'venue') {
        const from = parseHash().view;
        if (['home', 'results', 'map', 'saved'].includes(from)) venueOriginRef.current = from;
      }
      const hash = id ? `#/${nextView}/${encodeURIComponent(id)}` : `#/${nextView}`;
      if (window.location.hash === hash) setRoute(parseHash());else window.location.hash = hash;
    }, []);
    const app = {
      view,
      selectedId,
      user,
      world,
      query,
      venueOrigin: venueOriginRef.current,
      goto,
      setUser,
      toast: setToast,
      openA11y: () => setA11yOpen(true),
      runSearch: parsed => {
        setQuery(parsed);
        goto('results');
      },
      toggleSave: id => {
        setWorld(w => {
          const saved = w.saved.includes(id) ? w.saved.filter(x => x !== id) : [...w.saved, id];
          setToast(w.saved.includes(id) ? 'Removed from your places.' : 'Saved to your places.');
          return {
            ...w,
            saved
          };
        });
      },
      markVisited: id => {
        setWorld(w => w.visitedId === id ? w : {
          ...w,
          visitedId: id
        });
      },
      addReview: (venueId, kind) => {
        const needIds = user?.needs || [];
        const firstNeed = RA2_NEEDS.find(n => needIds.includes(n.id));
        const WHO = {
          mobility: ['Wheelchair user', 'Wheelchair'],
          vision: ['Blind / low-vision person', 'Blind / low vision'],
          hearing: ['Deaf / hard-of-hearing person', 'Deaf'],
          autism: ['Autistic person', 'Autistic'],
          cognitive: ['Community member', 'All'],
          mental: ['Community member', 'All'],
          chronic: ['Person with chronic illness', 'Chronic illness']
        };
        const [who, tag] = firstNeed && WHO[firstNeed.id] || ['Community member', 'All'];
        const review = {
          id: `me-${Date.now()}`,
          who,
          tag,
          when: 'just now',
          v: kind,
          helpful: 0,
          text: {
            works: 'It worked for me — I could get in, get around, and enjoy it.',
            check: 'I managed, but with workarounds worth knowing about.',
            barrier: 'I couldn’t use the venue as I needed.'
          }[kind]
        };
        setWorld(w => ({
          ...w,
          myReviews: {
            ...w.myReviews,
            [venueId]: [review, ...(w.myReviews[venueId] || [])]
          },
          reviewed: w.reviewed.includes(venueId) ? w.reviewed : [...w.reviewed, venueId]
        }));
        setUser(u => u ? {
          ...u,
          stats: {
            reviews: (u.stats?.reviews ?? RA2_DEFAULT_STATS.reviews) + 1,
            helped: (u.stats?.helped ?? RA2_DEFAULT_STATS.helped) + 1,
            votes: u.stats?.votes ?? RA2_DEFAULT_STATS.votes
          }
        } : u);
      },
      resetDemo: () => {
        try {
          localStorage.removeItem(USER_KEY);
          localStorage.removeItem(WORLD_KEY);
        } catch (e) {}
        setUser(null);
        setWorld({
          ...DEFAULT_WORLD
        });
        setQuery(null);
        goto('welcome');
        setToast('Demo reset — fresh start.');
      }
    };

    // Ensure new users start with stats.
    useEffect(() => {
      if (user && user.done && !user.stats) setUser(u => ({
        ...u,
        stats: {
          ...RA2_DEFAULT_STATS
        }
      }));
    }, [user]);
    const screens = {
      welcome: V2Welcome,
      setup: V2Setup,
      'setup-name': V2SetupName,
      home: V2Home,
      voice: V2Voice,
      results: V2Results,
      map: V2MapView,
      venue: V2VenueView,
      reviews: V2AllReviews,
      review: V2ReviewView,
      thanks: V2Thanks,
      saved: V2SavedView,
      me: V2Me
    };
    const Screen = screens[view] || V2Home;
    return /*#__PURE__*/React.createElement("div", {
      id: "ra-main",
      tabIndex: -1,
      style: {
        position: 'absolute',
        inset: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "ra-sr-only",
      role: "status",
      "aria-live": "polite"
    }, VIEW_TITLES[view] || ''), /*#__PURE__*/React.createElement(Screen, {
      app: app
    }), /*#__PURE__*/React.createElement(V2A11ySheet, {
      open: a11yOpen,
      onClose: () => setA11yOpen(false),
      prefs: prefs,
      onChange: applyPrefs
    }), /*#__PURE__*/React.createElement(V2Toast, {
      message: toast
    }));
  }
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(/*#__PURE__*/React.createElement(App, null));
})();