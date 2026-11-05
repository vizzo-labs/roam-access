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

  // Stored state is untrusted: an older build, a hand edit or a half-written
  // value must never blank the app. Every reader below coerces to the shape the
  // screens expect and falls back to defaults field by field.
  const isObj = x => !!x && typeof x === 'object' && !Array.isArray(x);
  const strIds = a => Array.isArray(a) ? a.filter(x => typeof x === 'string') : null;
  const SCALE_VALUES = [1, 1.125, 1.25, 1.5]; // must match SCALES in V2A11ySheet

  // Only what the user set in the in-app panel is stored; anything unset
  // follows the OS (prefers-contrast / prefers-reduced-motion) on every visit.
  function initialPrefs() {
    const saved = readJSON(PREFS_KEY);
    const s = isObj(saved) ? saved : {};
    const mq = q => typeof window.matchMedia === 'function' && window.matchMedia(q).matches;
    return {
      scale: SCALE_VALUES.includes(s.scale) ? s.scale : 1,
      contrast: typeof s.contrast === 'boolean' ? s.contrast : mq('(prefers-contrast: more)'),
      motion: typeof s.motion === 'boolean' ? s.motion : mq('(prefers-reduced-motion: reduce)')
    };
  }
  function readUser() {
    const u = readJSON(USER_KEY);
    if (!isObj(u)) return null;
    const st = isObj(u.stats) ? u.stats : null;
    const num = x => typeof x === 'number' && isFinite(x) ? x : undefined;
    return {
      ...u,
      name: typeof u.name === 'string' ? u.name : '',
      needs: strIds(u.needs) || [],
      stats: st ? {
        reviews: num(st.reviews),
        helped: num(st.helped),
        votes: num(st.votes)
      } : undefined
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
  function readWorld() {
    const w = readJSON(WORLD_KEY);
    if (!isObj(w)) return {
      ...DEFAULT_WORLD
    };
    const myReviews = {};
    if (isObj(w.myReviews)) {
      for (const [id, list] of Object.entries(w.myReviews)) {
        if (Array.isArray(list)) myReviews[id] = list.filter(r => isObj(r) && typeof r.text === 'string');
      }
    }
    return {
      saved: strIds(w.saved) || DEFAULT_WORLD.saved,
      myReviews,
      reviewed: strIds(w.reviewed) || [],
      visitedId: typeof w.visitedId === 'string' ? w.visitedId : DEFAULT_WORLD.visitedId
    };
  }

  // Screens that render one venue: an id that isn't in the data is not a route.
  const VENUE_VIEWS = ['venue', 'reviews', 'review', 'thanks'];

  // Returns null for hashes that aren't app routes (e.g. the skip link's
  // #ra-main, or #/venue/<unknown id>).
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
    if (VENUE_VIEWS.includes(view) && !RA2_VENUES.some(v => v.id === decoded)) return null;
    return {
      view,
      id: decoded
    };
  }
  // An app-shaped hash ("#/…") that didn't parse is a bad link: show Home and
  // make the URL agree. Other hashes (skip-link targets) are left alone.
  function isAppHash() {
    return /^#\//.test(window.location.hash || '');
  }
  function parseHash() {
    return parseHashOrNull() || {
      view: 'home',
      id: null
    };
  }
  function App() {
    const [route, setRoute] = useState(parseHash);
    const [user, setUser] = useState(readUser);
    const [world, setWorld] = useState(readWorld);
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
    // Persists only the keys the user actually changed (see initialPrefs).
    const applyPrefs = useCallback((partial, persist = true) => {
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
      if (persist) {
        const stored = readJSON(PREFS_KEY);
        writeJSON(PREFS_KEY, {
          ...(isObj(stored) ? stored : {}),
          ...partial
        });
      }
    }, []);
    useEffect(() => {
      applyPrefs(prefs, false);
    }, []); // eslint-disable-line
    useEffect(() => {
      if (user) writeJSON(USER_KEY, user);
    }, [user]);
    useEffect(() => {
      writeJSON(WORLD_KEY, world);
    }, [world]);
    useEffect(() => {
      const toHome = () => {
        history.replaceState(history.state, '', '#/home');
        setRoute({
          view: 'home',
          id: null
        });
      };
      if (!parseHashOrNull() && isAppHash()) toHome();
      const onHash = () => {
        const next = parseHashOrNull();
        if (next) setRoute(next);else if (isAppHash()) toHome(); // bad app link; skip-link hashes are ignored
      };
      window.addEventListener('hashchange', onHash);
      return () => window.removeEventListener('hashchange', onHash);
    }, []);

    // Phone-frame chrome (status bar / home indicator) follows dark screens;
    // the tab title names the screen; a modal never outlives its screen
    // (browser Back while the settings sheet is open).
    useEffect(() => {
      document.documentElement.dataset.raDark = DARK_VIEWS.includes(view) ? '1' : '';
      document.title = `${VIEW_TITLES[view] || 'Home'} · Roam Access pilot demo`;
      setA11yOpen(false);
    }, [view, selectedId]);
    useEffect(() => {
      if (!toast) return;
      const t = setTimeout(() => setToast(null), 3600);
      return () => clearTimeout(t);
    }, [toast]);

    // Where the venue screen's back button returns to: the last list-like view
    // the user opened a venue from (home, results, map or saved).
    const venueOriginRef = React.useRef('home');

    // { replace: true } swaps the current history entry instead of pushing one.
    // Use it when leaving a screen that must not be re-entered via Back: the
    // voice screen (it would start listening again and re-run a search) and the
    // review form (it would let the same review be sent twice).
    const goto = useCallback((nextView, id, opts) => {
      window.RA2_NAVIGATED = true;
      if (nextView === 'venue') {
        const from = parseHash().view;
        if (['home', 'results', 'map', 'saved'].includes(from)) venueOriginRef.current = from;
      }
      const hash = id ? `#/${nextView}/${encodeURIComponent(id)}` : `#/${nextView}`;
      if (opts && opts.replace) {
        // replaceState fires no hashchange — update the route directly.
        history.replaceState(history.state, '', hash);
        setRoute(parseHash());
      } else if (window.location.hash === hash) setRoute(parseHash());else window.location.hash = hash;
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
        goto('results', null, {
          replace: parseHash().view === 'voice'
        });
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
      role: "main",
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
      onChange: p => applyPrefs(p)
    }), /*#__PURE__*/React.createElement(V2Toast, {
      message: toast
    }));
  }

  // Last line of defence for a live demo: any render error shows a way out
  // instead of a blank phone.
  class RA2ErrorBoundary extends React.Component {
    constructor(props) {
      super(props);
      this.state = {
        failed: false
      };
    }
    static getDerivedStateFromError() {
      return {
        failed: true
      };
    }
    componentDidCatch(err) {
      try {
        console.error('[roam-access]', err);
      } catch (e) {}
    }
    restart() {
      try {
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem(WORLD_KEY);
      } catch (e) {}
      history.replaceState(null, '', window.location.pathname + window.location.search);
      window.location.reload();
    }
    render() {
      if (!this.state.failed) return this.props.children;
      return /*#__PURE__*/React.createElement("div", {
        role: "main",
        style: {
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '0 28px',
          background: C2.paper,
          color: C2.char,
          fontFamily: F2
        }
      }, /*#__PURE__*/React.createElement("h1", {
        style: {
          fontSize: 28,
          lineHeight: 1.15,
          margin: '0 0 12px',
          letterSpacing: '-0.02em'
        }
      }, "Something went wrong."), /*#__PURE__*/React.createElement("p", {
        style: {
          fontSize: 17,
          lineHeight: 1.5,
          color: C2.slate,
          margin: '0 0 24px'
        }
      }, "The demo hit a snag. Restarting clears this device\u2019s demo data and starts fresh."), /*#__PURE__*/React.createElement("button", {
        type: "button",
        onClick: () => this.restart(),
        style: {
          minHeight: 56,
          borderRadius: 16,
          border: 0,
          background: C2.teal,
          color: C2.paper,
          fontFamily: F2,
          fontSize: 17,
          fontWeight: 700,
          cursor: 'pointer'
        }
      }, "Restart the demo"));
    }
  }
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(/*#__PURE__*/React.createElement(RA2ErrorBoundary, null, /*#__PURE__*/React.createElement(App, null)));
})();