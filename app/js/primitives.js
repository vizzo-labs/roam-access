function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
// Roam Access pilot v2 — shared primitives.
// Principles: one job per screen · voice-first · plain first-person language ·
// big targets · one clear verdict per venue, detail on demand.

// ── Palette ───────────────────────────────────────────────────────────────
// C2 is a LIVE object: the "higher contrast" preference swaps values in place
// and the app re-renders. Read C2.x at render time — never copy into a
// module-level constant.
const C2_BASE = {
  teal: '#0A4F4F',
  tealDeep: '#073838',
  rust: '#9C2D0E',
  paper: '#FAF9F6',
  stone: '#EDEAE2',
  char: '#1A1A1A',
  tealSoft: '#F0F5F5',
  blue: '#1E5F8B',
  blueBg: '#E5EEF5',
  amber: '#854D0E',
  amberBg: '#F6ECDD',
  red: '#9C2D0E',
  redBg: '#F6E2DA',
  green: '#3F6B53',
  greenBg: '#E7EFEA'
};
// `hair` is decorative; `line` bounds something operable and must clear 3:1
// against paper (WCAG 1.4.11). Verified: #8A8680 = 3.44:1, #5A5651 = 6.91:1.
const C2_NORMAL = {
  slate: '#5A5651',
  hair: '#E5E2DA',
  line: '#8A8680'
};
const C2_HIGH = {
  slate: '#3A3733',
  hair: '#4A4742',
  line: '#5A5651'
};
const C2 = {
  ...C2_BASE,
  ...C2_NORMAL
};
function RA2SetContrast(high) {
  Object.assign(C2, high ? C2_HIGH : C2_NORMAL);
}
const F2 = `Inter, -apple-system, system-ui, sans-serif`;
const M2 = `"JetBrains Mono", ui-monospace, monospace`;
const RA2_INPUT_FONT = 16; // below 16px iOS Safari zooms on focus and stays zoomed

// ── Match engine ──────────────────────────────────────────────────────────
function ra2NeedTags(needIds) {
  return RA2_NEEDS.filter(n => needIds.includes(n.id)).flatMap(n => n.tags);
}

// One verdict per venue, personalised. A fact with no tags applies to
// everyone; with needs set, only facts touching those needs count — that
// personalisation is the product's whole thesis (a step doesn't stop a deaf
// user; loud music doesn't stop a wheelchair user).
function ra2Verdict(venue, needIds) {
  const tags = ra2NeedTags(needIds);
  const relevant = list => tags.length ? list.filter(f => f.tags.length === 0 || f.tags.some(t => tags.includes(t))) : list;
  const barriers = relevant(venue.barriers);
  const checks = relevant(venue.check);
  const works = relevant(venue.works);
  // Nothing known that touches this person's needs → say so. Claiming
  // "works for you" on zero information would betray the product's one promise.
  if (!barriers.length && !checks.length && !works.length) {
    return {
      kind: 'unknown',
      why: 'No info for your needs yet — help us verify it',
      barriers,
      checks,
      works
    };
  }
  const kind = barriers.length ? 'barrier' : checks.length ? 'check' : 'works';
  const why = (kind === 'barrier' ? barriers : kind === 'check' ? [...checks, ...works] : works).slice(0, 3).map(f => f.s).join(' · ');
  return {
    kind,
    why,
    barriers,
    checks,
    works
  };
}

// ── Query parsing (voice + text) ──────────────────────────────────────────
const RA2_CAT_WORDS = {
  food: /\b(cafes?|coffee|espresso|restaurants?|lunch|dinner|breakfast|brunch|eat|food|drinks?|bars?|pubs?)\b/,
  parks: /\b(parks?|outdoors?|walks?|gardens?|wildlife|zoo|beach|nature)\b/,
  arts: /\b(museums?|galler(y|ies)|arts?|exhibits?|shopping|shops?|arcade)\b/,
  music: /\b(music|gigs?|concerts?|shows?|events?|theatres?|venues?|plays?)\b/,
  stay: /\b(hotels?|stay|accommodation)\b/
};
const RA2_TAG_WORDS = {
  stepfree: /\b(step[- ]?free|wheelchairs?|ramps?|no steps?|roll in|accessible entry|mobility)\b/,
  bathroom: /\b(bathrooms?|toilets?|loos?|restrooms?)\b/,
  quiet: /\b(quiet|low[- ]?stim\w*|sensory|peaceful|not (too )?loud)\b/,
  calm: /\b(calm|relax\w*|low[- ]?stress|chill)\b/,
  hearing: /\b(hearing|loops?|auslan|deaf|captions?|captioned)\b/,
  vision: /\b(blind|low vision|braille|audio[- ]?descri\w*|guide dogs?|large[- ]?print)\b/,
  seats: /\b(seats?|seating|rest spots?|sit down|benches|fatigue)\b/,
  simple: /\b(easy to (understand|navigate)|simple|clear signage)\b/
};
const RA2_CAT_LABEL = {
  food: 'cafes & food',
  parks: 'parks',
  arts: 'museums & galleries',
  music: 'shows & venues',
  stay: 'places to stay'
};
const RA2_TAG_LABEL = {
  stepfree: 'step-free',
  bathroom: 'accessible bathroom',
  hearing: 'hearing support',
  vision: 'vision support',
  seats: 'seating',
  simple: 'easy to navigate',
  calm: 'calm'
};

// Phrases whose words would otherwise read as categories: "show me…" is not
// a show, "a quiet room" is not a hotel, "park the car" is not a park.
const RA2_NOISE = /\b(show me|can you show|(where|somewhere|place|can i|to) park( my| the)?( car)?|parking|(can'?t|cannot|not) walk( far| much)?)\b/g;
function ra2ParseQuery(text) {
  const t = (text || '').toLowerCase().replace(RA2_NOISE, ' ');
  const cats = Object.keys(RA2_CAT_WORDS).filter(c => RA2_CAT_WORDS[c].test(t));
  const tags = Object.keys(RA2_TAG_WORDS).filter(k => RA2_TAG_WORDS[k].test(t));
  let label;
  if (!cats.length && !tags.length) {
    label = text ? `“${text.length > 42 ? text.slice(0, 42) + '…' : text}”` : 'All places';
  } else {
    const quiet = tags.includes('quiet');
    const catWord = cats.length ? cats.map(c => RA2_CAT_LABEL[c]).join(' & ') : 'places';
    const extras = tags.filter(x => x !== 'quiet' && x !== 'calm').map(x => RA2_TAG_LABEL[x]);
    label = `${quiet ? 'Quiet ' : ''}${catWord}${extras.length ? ', ' + extras.join(', ') : ''}`;
    label = label.charAt(0).toUpperCase() + label.slice(1);
  }
  return {
    cats,
    tags,
    label,
    raw: text
  };
}
function ra2Search(query, needIds) {
  const {
    cats,
    tags
  } = query || {
    cats: [],
    tags: []
  };
  const rank = {
    works: 3,
    check: 2,
    unknown: 1,
    barrier: 0
  };
  return RA2_VENUES.filter(v => !cats.length || cats.includes(v.cat)).map(v => {
    const verdict = ra2Verdict(v, needIds);
    const all = [...v.works, ...v.check];
    const tagHits = tags.filter(tag => all.some(f => f.tags.includes(tag))).length;
    return {
      ...v,
      verdict,
      score: rank[verdict.kind] * 10 + tagHits * 2 - v.mins / 60
    };
  }).sort((a, b) => b.score - a.score);
}

// ── Small components ──────────────────────────────────────────────────────
function V2Logo({
  size = 18,
  fill,
  slashFill
}) {
  return /*#__PURE__*/React.createElement("svg", {
    width: size * 4.18,
    height: size,
    viewBox: "0 0 920 220",
    role: "img",
    "aria-label": "Roam Access",
    focusable: "false"
  }, /*#__PURE__*/React.createElement("title", null, "Roam Access"), /*#__PURE__*/React.createElement("g", {
    transform: "translate(110,150)"
  }, /*#__PURE__*/React.createElement("text", {
    fontFamily: F2,
    fontWeight: "700",
    fontSize: "110",
    fill: fill || C2.teal,
    letterSpacing: "-5",
    x: "0",
    y: "0"
  }, "roam"), /*#__PURE__*/React.createElement("text", {
    fontFamily: F2,
    fontWeight: "700",
    fontSize: "110",
    fill: slashFill || C2.rust,
    x: "293",
    y: "0"
  }, "/"), /*#__PURE__*/React.createElement("text", {
    fontFamily: F2,
    fontWeight: "700",
    fontSize: "110",
    fill: fill || C2.teal,
    letterSpacing: "-5",
    x: "338",
    y: "0"
  }, "access")));
}
function V2Mic({
  size = 28,
  color = C2.paper
}) {
  return /*#__PURE__*/React.createElement("svg", {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    "aria-hidden": "true",
    focusable: "false"
  }, /*#__PURE__*/React.createElement("rect", {
    x: "9",
    y: "3",
    width: "6",
    height: "11",
    rx: "3",
    stroke: color,
    strokeWidth: "2"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M5 11a7 7 0 0 0 14 0M12 18v3",
    stroke: color,
    strokeWidth: "2",
    strokeLinecap: "round"
  }));
}

// Verdict — THE core pattern. One clear answer: icon + colour + words.
const V2_VERDICT_META = {
  works: {
    bg: C2_BASE.blueBg,
    fg: C2_BASE.blue,
    icon: '✓',
    label: 'Works for you'
  },
  check: {
    bg: C2_BASE.amberBg,
    fg: C2_BASE.amber,
    icon: '!',
    label: 'Check first'
  },
  barrier: {
    bg: C2_BASE.redBg,
    fg: C2_BASE.red,
    icon: '✗',
    label: 'Has barriers'
  },
  unknown: {
    bg: '#E7EAEF',
    fg: '#475569',
    icon: '?',
    label: 'No info yet'
  } // 6.28:1
};
function V2Verdict({
  kind,
  big = false
}) {
  const s = V2_VERDICT_META[kind] || V2_VERDICT_META.check;
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: big ? 10 : 7,
      background: s.bg,
      color: s.fg,
      fontWeight: 700,
      whiteSpace: 'nowrap',
      fontSize: big ? 17 : 13.5,
      padding: big ? '10px 16px' : '6px 12px',
      borderRadius: 999,
      letterSpacing: '-0.01em',
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      width: big ? 24 : 18,
      height: big ? 24 : 18,
      borderRadius: 999,
      background: s.fg,
      color: s.bg,
      fontFamily: M2,
      fontWeight: 800,
      fontSize: big ? 13 : 10,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, s.icon), s.label);
}

// ── Screen scaffold ───────────────────────────────────────────────────────
// Flex column: scrollable content + fixed chrome (action bar, tabs) below it,
// so nothing ever hides under the chrome and the chrome never scrolls away.
function V2Shell({
  children,
  bg = null,
  scroll = true,
  bar = null,
  tabs = null,
  app = null,
  active = 'home'
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "v2-screen",
    style: {
      background: bg || C2.paper
    }
  }, scroll ? /*#__PURE__*/React.createElement("div", {
    className: "v2-scroll"
  }, children) : /*#__PURE__*/React.createElement("div", {
    className: "v2-fixed"
  }, children), bar, tabs && app && /*#__PURE__*/React.createElement(V2TabBar, {
    active: active,
    app: app
  }));
}
function V2TabBar({
  active,
  app
}) {
  const items = [{
    id: 'home',
    label: 'Home',
    d: 'M4 11.5 12 4l8 7.5M6 10v9h12v-9'
  }, {
    id: 'saved',
    label: 'Saved',
    d: 'M6 4h12v17l-6-4-6 4V4Z'
  }, {
    id: 'me',
    label: 'Me',
    d: 'M12 11a3.4 3.4 0 1 0 0-6.8A3.4 3.4 0 0 0 12 11ZM4.5 20c1.5-3.5 4.5-5 7.5-5s6 1.5 7.5 5'
  }];
  return /*#__PURE__*/React.createElement("nav", {
    "aria-label": "Primary",
    style: {
      paddingTop: 8,
      paddingBottom: 'var(--ra-tabs-pad)',
      background: C2.paper,
      borderTop: `1px solid ${C2.hair}`,
      display: 'flex',
      flexShrink: 0
    }
  }, items.map(it => {
    const on = it.id === active;
    const col = on ? C2.teal : C2.slate;
    return /*#__PURE__*/React.createElement("button", {
      key: it.id,
      onClick: () => app.goto(it.id),
      "aria-current": on ? 'page' : undefined,
      style: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        minHeight: 54,
        padding: '4px 0',
        background: 'transparent',
        border: 0,
        cursor: 'pointer',
        fontFamily: F2
      }
    }, /*#__PURE__*/React.createElement("svg", {
      width: "26",
      height: "26",
      viewBox: "0 0 24 24",
      fill: "none",
      "aria-hidden": "true",
      focusable: "false"
    }, /*#__PURE__*/React.createElement("path", {
      d: it.d,
      stroke: col,
      strokeWidth: on ? 2.2 : 1.8,
      strokeLinecap: "round",
      strokeLinejoin: "round"
    })), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12.5,
        fontWeight: on ? 700 : 600,
        color: col
      }
    }, it.label));
  }));
}
function V2BigBtn({
  children,
  kind = 'primary',
  onClick,
  style = {},
  disabled = false,
  type = 'button',
  ariaLabel,
  ariaDescribedBy
}) {
  const kinds = {
    primary: {
      background: C2.teal,
      color: C2.paper,
      border: 0
    },
    rust: {
      background: C2.rust,
      color: C2.paper,
      border: 0
    },
    outline: {
      background: C2.paper,
      color: C2.teal,
      border: `2.5px solid ${C2.teal}`
    },
    ghost: {
      background: C2.paper,
      color: C2.char,
      border: `1.5px solid ${C2.line}`
    }
  };
  const off = disabled ? {
    background: C2.stone,
    color: C2.slate,
    border: 0
  } : null;
  return /*#__PURE__*/React.createElement("button", {
    type: type,
    onClick: onClick,
    disabled: disabled,
    "aria-label": ariaLabel,
    "aria-describedby": ariaDescribedBy,
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      width: '100%',
      minHeight: 60,
      borderRadius: 16,
      fontFamily: F2,
      fontWeight: 700,
      fontSize: 18,
      letterSpacing: '-0.01em',
      cursor: disabled ? 'not-allowed' : 'pointer',
      ...kinds[kind],
      ...off,
      ...style
    }
  }, children);
}

// Round icon button (back, save) — 48px circle.
function V2RoundBtn({
  children,
  onClick,
  ariaLabel,
  pressed,
  style = {}
}) {
  return /*#__PURE__*/React.createElement("button", {
    onClick: onClick,
    "aria-label": ariaLabel,
    "aria-pressed": pressed,
    style: {
      width: 48,
      height: 48,
      borderRadius: 999,
      border: `1.5px solid ${C2.line}`,
      background: C2.paper,
      cursor: 'pointer',
      flexShrink: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      ...style
    }
  }, children);
}
function V2Back({
  app,
  to = 'home',
  id = null,
  label = 'Back'
}) {
  return /*#__PURE__*/React.createElement(V2RoundBtn, {
    onClick: () => app.goto(to, id),
    ariaLabel: label
  }, /*#__PURE__*/React.createElement("svg", {
    width: "18",
    height: "18",
    viewBox: "0 0 24 24",
    fill: "none",
    "aria-hidden": "true",
    focusable: "false"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M15 5l-7 7 7 7",
    stroke: C2.char,
    strokeWidth: "2.2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  })));
}

// Standalone switch — a real role="switch". Only used where it is NOT inside
// another control.
function V2Switch({
  checked,
  onChange,
  label
}) {
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    role: "switch",
    "aria-checked": checked,
    "aria-label": label,
    onClick: onChange,
    style: {
      width: 52,
      height: 32,
      borderRadius: 999,
      padding: 0,
      position: 'relative',
      background: checked ? C2.teal : C2.paper,
      border: `2px solid ${checked ? C2.teal : C2.line}`,
      cursor: 'pointer',
      flexShrink: 0,
      transition: 'background-color .15s, border-color .15s',
      boxSizing: 'border-box'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      top: 3,
      left: 3,
      width: 22,
      height: 22,
      borderRadius: 999,
      background: checked ? C2.paper : C2.line,
      transform: checked ? 'translateX(20px)' : 'translateX(0)',
      transition: 'transform .15s, background-color .15s'
    }
  }));
}

// Placeholder photo plate.
function V2Plate({
  h = 150,
  label = 'venue photo',
  style = {}
}) {
  return /*#__PURE__*/React.createElement("div", {
    "aria-hidden": "true",
    style: {
      height: h,
      borderRadius: 18,
      background: `repeating-linear-gradient(135deg, ${C2.hair} 0 1px, transparent 1px 12px), ${C2.stone}`,
      display: 'flex',
      alignItems: 'flex-end',
      padding: 12,
      fontFamily: M2,
      fontSize: 11,
      color: C2.slate,
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
      boxSizing: 'border-box',
      ...style
    }
  }, label);
}

// Category tile icons (from the design).
function V2TileIcon({
  id,
  size = 26
}) {
  const p = {
    stroke: C2.teal,
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    fill: 'none'
  };
  const paths = {
    food: /*#__PURE__*/React.createElement("path", _extends({
      d: "M7 3v7a2.5 2.5 0 0 0 5 0V3M9.5 3v18M17 3c-1.5 1-2.5 3-2.5 6v3h3v9"
    }, p)),
    parks: /*#__PURE__*/React.createElement("path", _extends({
      d: "M12 3 6 12h4l-4 7h12l-4-7h4L12 3ZM12 19v2"
    }, p)),
    arts: /*#__PURE__*/React.createElement("path", _extends({
      d: "M4 10 12 4l8 6M6 10v8M10 10v8M14 10v8M18 10v8M4 18h16"
    }, p)),
    music: /*#__PURE__*/React.createElement("path", _extends({
      d: "M9 18V6l10-2v12M9 18a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Zm10-2a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z"
    }, p))
  };
  return /*#__PURE__*/React.createElement("svg", {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    "aria-hidden": "true",
    focusable: "false"
  }, paths[id]);
}

// ── Dialog behaviour (ported from v1): focus in, trap, Escape, restore ────
const RA2_FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
function useRA2Dialog(open, onClose) {
  const ref = React.useRef(null);
  const restoreTo = React.useRef(null);
  // onClose lives in a ref so an unstable callback identity can never re-run
  // the effect — re-running would yank focus back to the first control on
  // every settings change inside the dialog.
  const onCloseRef = React.useRef(onClose);
  onCloseRef.current = onClose;
  React.useEffect(() => {
    if (!open) return;
    restoreTo.current = document.activeElement;
    const node = ref.current;
    if (node) {
      const first = node.querySelector(RA2_FOCUSABLE);
      (first || node).focus();
    }
    function onKey(e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab' || !ref.current) return;
      const items = Array.from(ref.current.querySelectorAll(RA2_FOCUSABLE)).filter(el => el.offsetParent !== null || el === document.activeElement);
      if (!items.length) return;
      const first = items[0],
        last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('keydown', onKey, true);
      const back = restoreTo.current;
      if (back && typeof back.focus === 'function' && document.contains(back)) back.focus();
    };
  }, [open]);
  return ref;
}

// Move focus to the screen heading on navigation (not on first paint, so the
// skip link and page context aren't skipped).
function useV2Heading(dep) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!window.RA2_NAVIGATED) return;
    if (ref.current) ref.current.focus();
  }, [dep]);
  return ref;
}

// Toast — live region always mounted, only the text swaps.
function V2Toast({
  message
}) {
  return /*#__PURE__*/React.createElement("div", {
    role: "status",
    "aria-live": "polite",
    style: {
      position: 'absolute',
      left: '50%',
      bottom: 'calc(var(--ra-tabs-pad) + 76px)',
      transform: 'translateX(-50%)',
      zIndex: 200,
      width: 'max-content',
      maxWidth: '86%',
      pointerEvents: 'none'
    }
  }, message && /*#__PURE__*/React.createElement("div", {
    style: {
      background: C2.char,
      color: C2.paper,
      padding: '12px 18px',
      borderRadius: 999,
      fontSize: 14,
      fontWeight: 600,
      fontFamily: F2,
      boxShadow: '0 6px 20px rgba(26,26,26,0.28)',
      textAlign: 'center',
      lineHeight: 1.35
    }
  }, message));
}
const V2_H1 = {
  fontWeight: 700,
  letterSpacing: '-0.025em',
  margin: 0,
  fontFamily: F2
};
Object.assign(window, {
  C2,
  F2,
  M2,
  RA2_INPUT_FONT,
  RA2SetContrast,
  ra2NeedTags,
  ra2Verdict,
  ra2ParseQuery,
  ra2Search,
  V2Logo,
  V2Mic,
  V2Verdict,
  V2_VERDICT_META,
  V2Shell,
  V2TabBar,
  V2BigBtn,
  V2RoundBtn,
  V2Back,
  V2Switch,
  V2Plate,
  V2TileIcon,
  V2Toast,
  V2_H1,
  useRA2Dialog,
  useV2Heading
});