// Roam Access — App shell (sidebar, bottom nav, topbar, a11y panel, auth modal, toast).

const RA_NAV = [{
  id: 'discover',
  label: 'Discover',
  icon: a => /*#__PURE__*/React.createElement("svg", {
    width: "20",
    height: "20",
    viewBox: "0 0 24 24",
    fill: "none",
    "aria-hidden": "true",
    focusable: "false"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "11",
    cy: "11",
    r: "6.5",
    stroke: a,
    strokeWidth: "1.8"
  }), /*#__PURE__*/React.createElement("path", {
    d: "m20 20-4-4",
    stroke: a,
    strokeWidth: "1.8",
    strokeLinecap: "round"
  }))
}, {
  id: 'saved',
  label: 'Saved',
  icon: a => /*#__PURE__*/React.createElement("svg", {
    width: "20",
    height: "20",
    viewBox: "0 0 24 24",
    fill: "none",
    "aria-hidden": "true",
    focusable: "false"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M6 4h12v17l-6-4-6 4V4Z",
    stroke: a,
    strokeWidth: "1.8",
    strokeLinejoin: "round"
  }))
}, {
  id: 'reviews',
  label: 'My reviews',
  icon: a => /*#__PURE__*/React.createElement("svg", {
    width: "20",
    height: "20",
    viewBox: "0 0 24 24",
    fill: "none",
    "aria-hidden": "true",
    focusable: "false"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M4 6h16M4 12h12M4 18h8",
    stroke: a,
    strokeWidth: "1.8",
    strokeLinecap: "round"
  }))
}, {
  id: 'profile',
  label: 'Profile',
  icon: a => /*#__PURE__*/React.createElement("svg", {
    width: "20",
    height: "20",
    viewBox: "0 0 24 24",
    fill: "none",
    "aria-hidden": "true",
    focusable: "false"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "8",
    r: "3.4",
    stroke: a,
    strokeWidth: "1.8"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M4.5 20c1.5-3.5 4.5-5 7.5-5s6 1.5 7.5 5",
    stroke: a,
    strokeWidth: "1.8",
    strokeLinecap: "round"
  }))
}];

// ── Dialog behaviour ──────────────────────────────────────────────────────
// Focus in on open, Escape to leave, Tab cycles inside, focus returns to
// whatever opened it. Shared so the two dialogs cannot drift apart.
const RA_FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
function useRADialog(open, onClose, {
  trap = true
} = {}) {
  const ref = React.useRef(null);
  const restoreTo = React.useRef(null);
  React.useEffect(() => {
    if (!open) return;
    restoreTo.current = document.activeElement;
    const node = ref.current;
    if (node) {
      const first = node.querySelector(RA_FOCUSABLE);
      (first || node).focus();
    }
    function onKey(e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (!trap || e.key !== 'Tab' || !ref.current) return;
      const items = Array.from(ref.current.querySelectorAll(RA_FOCUSABLE)).filter(el => el.offsetParent !== null || el === document.activeElement);
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
  }, [open, onClose, trap]);
  return ref;
}

// ── Sidebar (wide viewports) ──────────────────────────────────────────────
// `display` and `flex-direction` live in the .ra-sidebar rule rather than in
// the inline style below: an inline style would outrank the media query that
// hides this whole column on narrow screens.
function RASidebar({
  view,
  goto,
  user,
  onSignIn
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "ra-sidebar",
    style: {
      borderRight: `1px solid ${RA_C.hair}`,
      background: RA_C.paper,
      padding: '20px 16px',
      boxSizing: 'border-box'
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => goto('discover'),
    style: {
      background: 'transparent',
      border: 0,
      padding: '4px 6px',
      cursor: 'pointer',
      alignSelf: 'flex-start',
      marginBottom: 24
    },
    "aria-label": "Roam Access \u2014 go to Discover"
  }, /*#__PURE__*/React.createElement(RALogo, {
    size: 18
  })), /*#__PURE__*/React.createElement("nav", {
    "aria-label": "Primary",
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 4
    }
  }, RA_NAV.map(it => {
    const on = view === it.id;
    return /*#__PURE__*/React.createElement("button", {
      key: it.id,
      onClick: () => goto(it.id),
      "aria-current": on ? 'page' : undefined,
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '11px 12px',
        minHeight: 44,
        fontSize: 14.5,
        fontWeight: 600,
        background: on ? RA_C.tealSoft : 'transparent',
        color: on ? RA_C.teal : RA_C.char,
        borderRadius: 10,
        border: 0,
        cursor: 'pointer',
        textAlign: 'left',
        position: 'relative',
        boxSizing: 'border-box'
      }
    }, on && /*#__PURE__*/React.createElement("span", {
      "aria-hidden": "true",
      style: {
        position: 'absolute',
        left: 0,
        top: 8,
        bottom: 8,
        width: 3,
        background: RA_C.rust,
        borderRadius: 2
      }
    }), it.icon(on ? RA_C.teal : RA_C.slate), it.label);
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 24,
      padding: 12,
      borderRadius: 12,
      background: RA_C.stone
    }
  }, /*#__PURE__*/React.createElement(RAEyebrow, {
    style: {
      marginBottom: 6
    }
  }, "Pre-launch"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 12.5,
      color: RA_C.char,
      lineHeight: 1.45,
      margin: '0 0 8px'
    }
  }, "Pilot v0.1 \xB7 8 sample venues in Sydney. The behaviour is real; the venue data is illustrative."), /*#__PURE__*/React.createElement("a", {
    href: "/",
    style: {
      fontSize: 12.5,
      color: RA_C.teal,
      fontWeight: 600,
      textDecoration: 'underline',
      textUnderlineOffset: 3,
      display: 'inline-block',
      padding: '4px 0'
    }
  }, "About roam/access \u2192")), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }), !user.signedIn ? /*#__PURE__*/React.createElement(RABtn, {
    kind: "primary",
    fullWidth: true,
    onClick: onSignIn
  }, "Sign in") : /*#__PURE__*/React.createElement("button", {
    onClick: () => goto('profile'),
    "aria-label": `Open profile for ${user.name}`,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: 8,
      borderRadius: 10,
      background: 'transparent',
      border: `1px solid ${RA_C.line}`,
      cursor: 'pointer',
      width: '100%'
    }
  }, /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      width: 36,
      height: 36,
      borderRadius: 999,
      background: RA_C.teal,
      color: RA_C.paper,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 700,
      fontSize: 13,
      flexShrink: 0
    }
  }, user.initials), /*#__PURE__*/React.createElement("span", {
    style: {
      textAlign: 'left',
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      fontSize: 13.5,
      fontWeight: 600,
      color: RA_C.char
    }
  }, user.name), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      fontSize: 11.5,
      color: RA_C.slate
    }
  }, user.city))));
}

// ── Bottom nav (narrow viewports) ─────────────────────────────────────────
function RABottomNav({
  view,
  goto
}) {
  return /*#__PURE__*/React.createElement("nav", {
    className: "ra-bottom-nav",
    "aria-label": "Primary"
  }, RA_NAV.map(it => {
    const on = view === it.id;
    return /*#__PURE__*/React.createElement("button", {
      key: it.id,
      onClick: () => goto(it.id),
      "aria-current": on ? 'page' : undefined,
      style: {
        flex: 1,
        minHeight: 60,
        padding: '8px 4px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3,
        background: 'transparent',
        border: 0,
        cursor: 'pointer',
        color: on ? RA_C.teal : RA_C.slate,
        fontSize: 11,
        fontWeight: 600,
        borderTop: `3px solid ${on ? RA_C.rust : 'transparent'}`
      }
    }, it.icon(on ? RA_C.teal : RA_C.slate), it.label);
  }));
}

// ── Topbar ────────────────────────────────────────────────────────────────
function RATopbar({
  user,
  onSearch,
  search,
  onSignIn,
  onOpenA11y,
  goto,
  a11yBtnRef
}) {
  return /*#__PURE__*/React.createElement("header", {
    style: {
      position: 'sticky',
      top: 0,
      zIndex: 30,
      background: 'rgba(250,249,246,0.95)',
      backdropFilter: 'saturate(140%) blur(8px)',
      borderBottom: `1px solid ${RA_C.hair}`
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "ra-topbar-inner",
    style: {
      padding: '12px 20px'
    }
  }, /*#__PURE__*/React.createElement("search", {
    style: {
      flex: '1 1 240px',
      minWidth: 0,
      maxWidth: 520,
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      background: RA_C.paper,
      borderRadius: 10,
      padding: '0 14px',
      minHeight: 44,
      border: `1.5px solid ${RA_C.line}`,
      boxSizing: 'border-box'
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "16",
    height: "16",
    viewBox: "0 0 24 24",
    fill: "none",
    "aria-hidden": "true",
    focusable: "false",
    style: {
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "11",
    cy: "11",
    r: "6.5",
    stroke: RA_C.slate,
    strokeWidth: "1.8"
  }), /*#__PURE__*/React.createElement("path", {
    d: "m20 20-4-4",
    stroke: RA_C.slate,
    strokeWidth: "1.8",
    strokeLinecap: "round"
  })), /*#__PURE__*/React.createElement("label", {
    htmlFor: "ra-search",
    className: "ra-sr-only"
  }, "Search venues"), /*#__PURE__*/React.createElement("input", {
    id: "ra-search",
    type: "search",
    placeholder: "Search cafes, parks, venues",
    value: search,
    onChange: e => onSearch(e.target.value),
    style: {
      flex: 1,
      minWidth: 0,
      background: 'transparent',
      border: 0,
      fontSize: RA_INPUT_FONT,
      color: RA_C.char,
      fontFamily: RA_FONT_SANS,
      paddingTop: 10,
      paddingBottom: 10
    }
  }), /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    className: "ra-hide-sm",
    style: {
      fontFamily: RA_FONT_MONO,
      fontSize: 11,
      color: RA_C.slate,
      flexShrink: 0
    }
  }, "\u2318K")), /*#__PURE__*/React.createElement("div", {
    className: "ra-topbar-actions"
  }, /*#__PURE__*/React.createElement(RABtn, {
    kind: "ghost",
    size: "sm",
    onClick: onOpenA11y,
    ariaLabel: "Accessibility settings"
  }, /*#__PURE__*/React.createElement("svg", {
    width: "16",
    height: "16",
    viewBox: "0 0 24 24",
    fill: "none",
    "aria-hidden": "true",
    focusable: "false"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "10",
    stroke: "currentColor",
    strokeWidth: "2"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "6.5",
    r: "1.4",
    fill: "currentColor"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M7 9.5h10M12 9.5v8M9 17.5l3-5 3 5",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  })), /*#__PURE__*/React.createElement("span", {
    className: "ra-hide-sm"
  }, "Accessibility")), user.signedIn ? /*#__PURE__*/React.createElement("button", {
    onClick: () => goto('profile'),
    "aria-label": `Open profile for ${user.name}`,
    style: {
      width: 44,
      height: 44,
      borderRadius: 999,
      background: RA_C.teal,
      color: RA_C.paper,
      border: 0,
      cursor: 'pointer',
      fontWeight: 700,
      fontSize: 13,
      flexShrink: 0
    }
  }, user.initials) : /*#__PURE__*/React.createElement(RABtn, {
    kind: "rust",
    size: "sm",
    onClick: onSignIn
  }, "Sign in"))));
}

// ── Auth modal (sign-in / sign-up) ────────────────────────────────────────
function RAAuthModal({
  open,
  onClose,
  onAuth
}) {
  const [mode, setMode] = React.useState('signin');
  const [email, setEmail] = React.useState('');
  const [pwd, setPwd] = React.useState('');
  const dialogRef = useRADialog(open, onClose);
  if (!open) return null;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'fixed',
      inset: 0,
      zIndex: 100,
      background: 'rgba(26,26,26,0.55)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
      overflowY: 'auto'
    },
    onClick: onClose
  }, /*#__PURE__*/React.createElement("div", {
    ref: dialogRef,
    role: "dialog",
    "aria-modal": "true",
    "aria-labelledby": "auth-h",
    tabIndex: -1,
    onClick: e => e.stopPropagation(),
    style: {
      background: RA_C.paper,
      borderRadius: 20,
      padding: 28,
      width: 'min(440px, 100%)',
      boxSizing: 'border-box',
      border: `1px solid ${RA_C.hair}`
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement(RALogo, {
    size: 18
  }), /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    "aria-label": "Close sign in",
    style: {
      background: 'transparent',
      border: 0,
      cursor: 'pointer',
      padding: 14,
      margin: -14,
      color: RA_C.char,
      lineHeight: 0
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "16",
    height: "16",
    viewBox: "0 0 14 14",
    fill: "none",
    "aria-hidden": "true",
    focusable: "false"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M1 1l12 12M13 1L1 13",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "square"
  })))), /*#__PURE__*/React.createElement("h2", {
    id: "auth-h",
    style: {
      fontSize: 26,
      fontWeight: 700,
      letterSpacing: '-0.02em',
      margin: '0 0 6px'
    }
  }, mode === 'signin' ? 'Welcome back' : 'Create your account', /*#__PURE__*/React.createElement("span", {
    style: {
      color: RA_C.rust
    }
  }, ".")), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 14,
      color: RA_C.slate,
      margin: '0 0 8px'
    }
  }, mode === 'signin' ? 'Sign in to save places, write reviews and sync your access profile.' : 'It takes 30 seconds. Your access profile is private to you.'), /*#__PURE__*/React.createElement(RAPilotNote, {
    style: {
      marginBottom: 18
    }
  }, "Pilot \xB7 no account is created and nothing is sent anywhere"), /*#__PURE__*/React.createElement("form", {
    onSubmit: e => {
      e.preventDefault();
      onAuth({
        email: email || 'you@example.com'
      });
    }
  }, /*#__PURE__*/React.createElement("label", {
    htmlFor: "auth-email",
    style: FIELD_LABEL
  }, "Email"), /*#__PURE__*/React.createElement("input", {
    id: "auth-email",
    type: "email",
    autoComplete: "email",
    value: email,
    onChange: e => setEmail(e.target.value),
    required: true,
    style: inputStyle
  }), /*#__PURE__*/React.createElement("label", {
    htmlFor: "auth-pwd",
    style: {
      ...FIELD_LABEL,
      marginTop: 12
    }
  }, "Password"), /*#__PURE__*/React.createElement("input", {
    id: "auth-pwd",
    type: "password",
    autoComplete: mode === 'signin' ? 'current-password' : 'new-password',
    value: pwd,
    onChange: e => setPwd(e.target.value),
    required: true,
    style: inputStyle
  }), /*#__PURE__*/React.createElement(RABtn, {
    kind: "primary",
    type: "submit",
    fullWidth: true,
    style: {
      marginTop: 18
    }
  }, mode === 'signin' ? 'Sign in' : 'Create account')), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 16,
      fontSize: 13.5,
      color: RA_C.slate,
      textAlign: 'center'
    }
  }, mode === 'signin' ? 'New here? ' : 'Already have an account? ', /*#__PURE__*/React.createElement("button", {
    onClick: () => setMode(mode === 'signin' ? 'signup' : 'signin'),
    style: {
      background: 'transparent',
      border: 0,
      cursor: 'pointer',
      color: RA_C.teal,
      fontWeight: 600,
      textDecoration: 'underline',
      textUnderlineOffset: 3,
      padding: '8px 4px',
      fontSize: 'inherit',
      fontFamily: 'inherit'
    }
  }, mode === 'signin' ? 'Create an account' : 'Sign in instead'))));
}
const FIELD_LABEL = {
  display: 'block',
  fontSize: 13,
  fontWeight: 600,
  color: RA_C.char,
  marginBottom: 6
};
const inputStyle = {
  width: '100%',
  boxSizing: 'border-box',
  background: RA_C.paper,
  color: RA_C.char,
  border: `1.5px solid ${RA_C.line}`,
  borderRadius: 10,
  padding: '12px 14px',
  fontSize: RA_INPUT_FONT,
  fontFamily: RA_FONT_SANS
};

// ── Accessibility panel ───────────────────────────────────────────────────
// `onChange` is the single write path: it persists, applies to the DOM and
// re-renders. Reset goes through it too, so the switches can never claim a
// state the app is not actually in.
function RAA11yPanel({
  open,
  onClose,
  prefs,
  onChange
}) {
  const dialogRef = useRADialog(open, onClose);
  const scaleRefs = React.useRef([]);
  const SCALES = [{
    v: 1,
    label: 'Default text size'
  }, {
    v: 1.125,
    label: 'Large text size, 112%'
  }, {
    v: 1.25,
    label: 'Larger text size, 125%'
  }, {
    v: 1.5,
    label: 'Largest text size, 150%'
  }];
  if (!open) return null;

  // Arrow keys move between radios, as a radiogroup is expected to.
  function onScaleKey(e, i) {
    const map = {
      ArrowRight: 1,
      ArrowDown: 1,
      ArrowLeft: -1,
      ArrowUp: -1
    };
    const d = map[e.key];
    if (!d) return;
    e.preventDefault();
    const next = (i + d + SCALES.length) % SCALES.length;
    onChange({
      ...prefs,
      scale: SCALES[next].v
    });
    const el = scaleRefs.current[next];
    if (el) el.focus();
  }
  return /*#__PURE__*/React.createElement("div", {
    ref: dialogRef,
    className: "ra-a11y-panel",
    role: "dialog",
    "aria-modal": "false",
    "aria-labelledby": "a11y-h",
    tabIndex: -1,
    style: {
      background: RA_C.paper,
      borderRadius: 16,
      border: `1px solid ${RA_C.line}`,
      padding: 18,
      boxShadow: '0 8px 28px rgba(26,26,26,0.14)',
      boxSizing: 'border-box'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 4,
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("h2", {
    id: "a11y-h",
    style: {
      fontSize: 17,
      fontWeight: 700,
      margin: 0
    }
  }, "Accessibility"), /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    "aria-label": "Close accessibility settings",
    style: {
      background: 'transparent',
      border: 0,
      cursor: 'pointer',
      padding: 14,
      margin: -14,
      lineHeight: 0
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "16",
    height: "16",
    viewBox: "0 0 14 14",
    fill: "none",
    "aria-hidden": "true",
    focusable: "false"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M1 1l12 12M13 1L1 13",
    stroke: RA_C.char,
    strokeWidth: "2",
    strokeLinecap: "square"
  })))), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 13,
      color: RA_C.slate,
      margin: '0 0 4px'
    }
  }, "Adjust how the app works for you. Saved on this device."), /*#__PURE__*/React.createElement("div", {
    style: ROW_STYLE
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    id: "a11y-scale-label",
    style: {
      fontSize: 14.5,
      fontWeight: 600
    }
  }, "Text size"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: RA_C.slate
    }
  }, "Scales the whole app.")), /*#__PURE__*/React.createElement("div", {
    role: "radiogroup",
    "aria-labelledby": "a11y-scale-label",
    style: {
      display: 'inline-flex',
      border: `1px solid ${RA_C.line}`,
      borderRadius: 999,
      padding: 2,
      gap: 2,
      flexShrink: 0
    }
  }, SCALES.map((s, i) => {
    const on = prefs.scale === s.v;
    return /*#__PURE__*/React.createElement("button", {
      key: s.v,
      type: "button",
      role: "radio",
      "aria-checked": on,
      "aria-label": s.label,
      ref: el => {
        scaleRefs.current[i] = el;
      },
      tabIndex: on ? 0 : -1,
      onKeyDown: e => onScaleKey(e, i),
      onClick: () => onChange({
        ...prefs,
        scale: s.v
      }),
      style: {
        minWidth: 44,
        minHeight: 44,
        padding: '0 8px',
        fontSize: 11 + (s.v - 1) * 8,
        fontWeight: 600,
        borderRadius: 999,
        cursor: 'pointer',
        background: on ? RA_C.char : 'transparent',
        color: on ? RA_C.paper : RA_C.char,
        border: 0
      }
    }, /*#__PURE__*/React.createElement("span", {
      "aria-hidden": "true"
    }, "A"));
  }))), /*#__PURE__*/React.createElement("div", {
    style: ROW_STYLE
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14.5,
      fontWeight: 600
    }
  }, "Higher contrast"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: RA_C.slate
    }
  }, "Darkens borders and secondary text.")), /*#__PURE__*/React.createElement(RAToggle, {
    checked: prefs.contrast,
    onChange: () => onChange({
      ...prefs,
      contrast: !prefs.contrast
    }),
    label: "Higher contrast"
  })), /*#__PURE__*/React.createElement("div", {
    style: ROW_STYLE
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14.5,
      fontWeight: 600
    }
  }, "Reduce motion"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: RA_C.slate
    }
  }, "Disables transitions and movement.")), /*#__PURE__*/React.createElement(RAToggle, {
    checked: prefs.motion,
    onChange: () => onChange({
      ...prefs,
      motion: !prefs.motion
    }),
    label: "Reduce motion"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      ...ROW_STYLE,
      marginTop: 14
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12.5,
      color: RA_C.slate
    }
  }, "Saved on this device"), /*#__PURE__*/React.createElement("button", {
    onClick: () => onChange({
      scale: 1,
      contrast: false,
      motion: false
    }),
    style: {
      fontSize: 13,
      color: RA_C.teal,
      fontWeight: 600,
      background: 'transparent',
      border: 0,
      padding: '10px 6px',
      cursor: 'pointer',
      textDecoration: 'underline',
      textUnderlineOffset: 3
    }
  }, "Reset")));
}
const ROW_STYLE = {
  marginTop: 10,
  paddingTop: 12,
  borderTop: `1px solid ${RA_C.hair}`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12
};

// ── Toast ─────────────────────────────────────────────────────────────────
// The live region is always in the DOM; only its text changes. A region that
// appears in the same commit as its message is frequently never announced.
function RAToast({
  message
}) {
  return /*#__PURE__*/React.createElement("div", {
    role: "status",
    "aria-live": "polite",
    style: {
      position: 'fixed',
      left: '50%',
      bottom: 28,
      transform: 'translateX(-50%)',
      zIndex: 200,
      maxWidth: 'calc(100vw - 32px)',
      pointerEvents: 'none'
    }
  }, message && /*#__PURE__*/React.createElement("div", {
    style: {
      background: RA_C.char,
      color: RA_C.paper,
      padding: '12px 18px',
      borderRadius: 999,
      fontSize: 14,
      fontWeight: 600,
      display: 'inline-flex',
      alignItems: 'center',
      gap: 10,
      boxShadow: '0 6px 20px rgba(26,26,26,0.24)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      width: 18,
      height: 18,
      borderRadius: 999,
      background: RA_C.green,
      color: RA_C.paper,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 11,
      fontWeight: 800,
      flexShrink: 0
    }
  }, "\u2713"), message));
}
Object.assign(window, {
  RA_NAV,
  RASidebar,
  RABottomNav,
  RATopbar,
  RAAuthModal,
  RAA11yPanel,
  RAToast,
  useRADialog
});