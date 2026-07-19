// Roam Access — App shell (sidebar, bottom nav, topbar, a11y panel, auth modal, toast).

const RA_NAV = [
  { id: 'discover', label: 'Discover',  icon: (a) => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false"><circle cx="11" cy="11" r="6.5" stroke={a} strokeWidth="1.8"/><path d="m20 20-4-4" stroke={a} strokeWidth="1.8" strokeLinecap="round"/></svg>) },
  { id: 'saved',    label: 'Saved',     icon: (a) => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false"><path d="M6 4h12v17l-6-4-6 4V4Z" stroke={a} strokeWidth="1.8" strokeLinejoin="round"/></svg>) },
  { id: 'reviews',  label: 'My reviews',icon: (a) => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false"><path d="M4 6h16M4 12h12M4 18h8" stroke={a} strokeWidth="1.8" strokeLinecap="round"/></svg>) },
  { id: 'profile',  label: 'Profile',   icon: (a) => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false"><circle cx="12" cy="8" r="3.4" stroke={a} strokeWidth="1.8"/><path d="M4.5 20c1.5-3.5 4.5-5 7.5-5s6 1.5 7.5 5" stroke={a} strokeWidth="1.8" strokeLinecap="round"/></svg>) },
];

// ── Dialog behaviour ──────────────────────────────────────────────────────
// Focus in on open, Escape to leave, Tab cycles inside, focus returns to
// whatever opened it. Shared so the two dialogs cannot drift apart.
const RA_FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function useRADialog(open, onClose, { trap = true } = {}) {
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
      if (e.key === 'Escape') { e.preventDefault(); onClose(); return; }
      if (!trap || e.key !== 'Tab' || !ref.current) return;
      const items = Array.from(ref.current.querySelectorAll(RA_FOCUSABLE))
        .filter(el => el.offsetParent !== null || el === document.activeElement);
      if (!items.length) return;
      const first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
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
function RASidebar({ view, goto, user, onSignIn }) {
  return (
    <div className="ra-sidebar" style={{
      borderRight: `1px solid ${RA_C.hair}`, background: RA_C.paper,
      padding: '20px 16px', boxSizing: 'border-box',
    }}>
      <button onClick={() => goto('discover')} style={{
        background: 'transparent', border: 0, padding: '4px 6px',
        cursor: 'pointer', alignSelf: 'flex-start', marginBottom: 24,
      }} aria-label="Roam Access — go to Discover">
        <RALogo size={18}/>
      </button>

      <nav aria-label="Primary" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {RA_NAV.map(it => {
          const on = view === it.id;
          return (
            <button key={it.id} onClick={() => goto(it.id)} aria-current={on ? 'page' : undefined}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '11px 12px', minHeight: 44,
                fontSize: 14.5, fontWeight: 600,
                background: on ? RA_C.tealSoft : 'transparent',
                color: on ? RA_C.teal : RA_C.char,
                borderRadius: 10, border: 0, cursor: 'pointer',
                textAlign: 'left', position: 'relative', boxSizing: 'border-box',
              }}>
              {on && <span aria-hidden="true" style={{ position: 'absolute', left: 0, top: 8, bottom: 8, width: 3, background: RA_C.rust, borderRadius: 2 }} />}
              {it.icon(on ? RA_C.teal : RA_C.slate)}
              {it.label}
            </button>
          );
        })}
      </nav>

      <div style={{ marginTop: 24, padding: 12, borderRadius: 12, background: RA_C.stone }}>
        <RAEyebrow style={{ marginBottom: 6 }}>Pre-launch</RAEyebrow>
        <p style={{ fontSize: 12.5, color: RA_C.char, lineHeight: 1.45, margin: '0 0 8px' }}>
          Pilot v0.1 · 8 sample venues in Sydney. The behaviour is real; the venue data is illustrative.
        </p>
        <a href="/" style={{ fontSize: 12.5, color: RA_C.teal, fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: 3, display: 'inline-block', padding: '4px 0' }}>
          About roam/access →
        </a>
      </div>

      <div style={{ flex: 1 }} />

      {!user.signedIn ? (
        <RABtn kind="primary" fullWidth onClick={onSignIn}>Sign in</RABtn>
      ) : (
        <button onClick={() => goto('profile')} aria-label={`Open profile for ${user.name}`} style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: 8, borderRadius: 10,
          background: 'transparent', border: `1px solid ${RA_C.line}`, cursor: 'pointer', width: '100%',
        }}>
          <span aria-hidden="true" style={{
            width: 36, height: 36, borderRadius: 999, background: RA_C.teal, color: RA_C.paper,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: 13, flexShrink: 0,
          }}>{user.initials}</span>
          <span style={{ textAlign: 'left', flex: 1, minWidth: 0 }}>
            <span style={{ display: 'block', fontSize: 13.5, fontWeight: 600, color: RA_C.char }}>{user.name}</span>
            <span style={{ display: 'block', fontSize: 11.5, color: RA_C.slate }}>{user.city}</span>
          </span>
        </button>
      )}
    </div>
  );
}

// ── Bottom nav (narrow viewports) ─────────────────────────────────────────
function RABottomNav({ view, goto }) {
  return (
    <nav className="ra-bottom-nav" aria-label="Primary">
      {RA_NAV.map(it => {
        const on = view === it.id;
        return (
          <button key={it.id} onClick={() => goto(it.id)} aria-current={on ? 'page' : undefined}
            style={{
              flex: 1, minHeight: 60, padding: '8px 4px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
              background: 'transparent', border: 0, cursor: 'pointer',
              color: on ? RA_C.teal : RA_C.slate,
              fontSize: 11, fontWeight: 600,
              borderTop: `3px solid ${on ? RA_C.rust : 'transparent'}`,
            }}>
            {it.icon(on ? RA_C.teal : RA_C.slate)}
            {it.label}
          </button>
        );
      })}
    </nav>
  );
}

// ── Topbar ────────────────────────────────────────────────────────────────
function RATopbar({ user, onSearch, search, onSignIn, onOpenA11y, goto, a11yBtnRef }) {
  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 30,
      background: 'rgba(250,249,246,0.95)', backdropFilter: 'saturate(140%) blur(8px)',
      borderBottom: `1px solid ${RA_C.hair}`,
    }}>
      <div className="ra-topbar-inner" style={{ padding: '12px 20px' }}>
        <search style={{
          flex: '1 1 240px', minWidth: 0, maxWidth: 520,
          display: 'flex', alignItems: 'center', gap: 10,
          background: RA_C.paper, borderRadius: 10, padding: '0 14px',
          minHeight: 44, border: `1.5px solid ${RA_C.line}`, boxSizing: 'border-box',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" style={{ flexShrink: 0 }}>
            <circle cx="11" cy="11" r="6.5" stroke={RA_C.slate} strokeWidth="1.8"/>
            <path d="m20 20-4-4" stroke={RA_C.slate} strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
          <label htmlFor="ra-search" className="ra-sr-only">Search venues</label>
          <input
            id="ra-search"
            type="search"
            placeholder="Search cafes, parks, venues"
            value={search}
            onChange={e => onSearch(e.target.value)}
            style={{
              flex: 1, minWidth: 0, background: 'transparent', border: 0,
              fontSize: RA_INPUT_FONT, color: RA_C.char, fontFamily: RA_FONT_SANS,
              paddingTop: 10, paddingBottom: 10,
            }}
          />
          <span aria-hidden="true" className="ra-hide-sm" style={{ fontFamily: RA_FONT_MONO, fontSize: 11, color: RA_C.slate, flexShrink: 0 }}>⌘K</span>
        </search>

        <div className="ra-topbar-actions">
          <RABtn kind="ghost" size="sm" onClick={onOpenA11y} ariaLabel="Accessibility settings">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <circle cx="12" cy="6.5" r="1.4" fill="currentColor"/>
              <path d="M7 9.5h10M12 9.5v8M9 17.5l3-5 3 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="ra-hide-sm">Accessibility</span>
          </RABtn>

          {user.signedIn ? (
            <button onClick={() => goto('profile')} aria-label={`Open profile for ${user.name}`} style={{
              width: 44, height: 44, borderRadius: 999, background: RA_C.teal, color: RA_C.paper,
              border: 0, cursor: 'pointer', fontWeight: 700, fontSize: 13, flexShrink: 0,
            }}>{user.initials}</button>
          ) : (
            <RABtn kind="rust" size="sm" onClick={onSignIn}>Sign in</RABtn>
          )}
        </div>
      </div>
    </header>
  );
}

// ── Auth modal (sign-in / sign-up) ────────────────────────────────────────
function RAAuthModal({ open, onClose, onAuth }) {
  const [mode, setMode] = React.useState('signin');
  const [email, setEmail] = React.useState('');
  const [pwd, setPwd] = React.useState('');
  const dialogRef = useRADialog(open, onClose);

  if (!open) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(26,26,26,0.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      overflowY: 'auto',
    }} onClick={onClose}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="auth-h" tabIndex={-1}
        onClick={e => e.stopPropagation()} style={{
          background: RA_C.paper, borderRadius: 20, padding: 28,
          width: 'min(440px, 100%)', boxSizing: 'border-box',
          border: `1px solid ${RA_C.hair}`,
        }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
          <RALogo size={18}/>
          <button onClick={onClose} aria-label="Close sign in" style={{
            background: 'transparent', border: 0, cursor: 'pointer', padding: 14,
            margin: -14, color: RA_C.char, lineHeight: 0,
          }}>
            <svg width="16" height="16" viewBox="0 0 14 14" fill="none" aria-hidden="true" focusable="false"><path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="square"/></svg>
          </button>
        </div>

        <h2 id="auth-h" style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 6px' }}>
          {mode === 'signin' ? 'Welcome back' : 'Create your account'}<span style={{ color: RA_C.rust }}>.</span>
        </h2>
        <p style={{ fontSize: 14, color: RA_C.slate, margin: '0 0 8px' }}>
          {mode === 'signin'
            ? 'Sign in to save places, write reviews and sync your access profile.'
            : 'It takes 30 seconds. Your access profile is private to you.'}
        </p>
        <RAPilotNote style={{ marginBottom: 18 }}>
          Pilot · no account is created and nothing is sent anywhere
        </RAPilotNote>

        <form onSubmit={e => { e.preventDefault(); onAuth({ email: email || 'you@example.com' }); }}>
          <label htmlFor="auth-email" style={FIELD_LABEL}>Email</label>
          <input id="auth-email" type="email" autoComplete="email" value={email}
                 onChange={e => setEmail(e.target.value)} required style={inputStyle} />

          <label htmlFor="auth-pwd" style={{ ...FIELD_LABEL, marginTop: 12 }}>Password</label>
          <input id="auth-pwd" type="password" autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                 value={pwd} onChange={e => setPwd(e.target.value)} required style={inputStyle} />

          <RABtn kind="primary" type="submit" fullWidth style={{ marginTop: 18 }}>
            {mode === 'signin' ? 'Sign in' : 'Create account'}
          </RABtn>
        </form>

        <div style={{ marginTop: 16, fontSize: 13.5, color: RA_C.slate, textAlign: 'center' }}>
          {mode === 'signin' ? 'New here? ' : 'Already have an account? '}
          <button onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')} style={{
            background: 'transparent', border: 0, cursor: 'pointer',
            color: RA_C.teal, fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: 3,
            padding: '8px 4px', fontSize: 'inherit', fontFamily: 'inherit',
          }}>
            {mode === 'signin' ? 'Create an account' : 'Sign in instead'}
          </button>
        </div>
      </div>
    </div>
  );
}

const FIELD_LABEL = { display: 'block', fontSize: 13, fontWeight: 600, color: RA_C.char, marginBottom: 6 };

const inputStyle = {
  width: '100%', boxSizing: 'border-box',
  background: RA_C.paper, color: RA_C.char,
  border: `1.5px solid ${RA_C.line}`, borderRadius: 10,
  padding: '12px 14px', fontSize: RA_INPUT_FONT, fontFamily: RA_FONT_SANS,
};

// ── Accessibility panel ───────────────────────────────────────────────────
// `onChange` is the single write path: it persists, applies to the DOM and
// re-renders. Reset goes through it too, so the switches can never claim a
// state the app is not actually in.
function RAA11yPanel({ open, onClose, prefs, onChange }) {
  const dialogRef = useRADialog(open, onClose);
  const scaleRefs = React.useRef([]);
  const SCALES = [
    { v: 1,     label: 'Default text size' },
    { v: 1.125, label: 'Large text size, 112%' },
    { v: 1.25,  label: 'Larger text size, 125%' },
    { v: 1.5,   label: 'Largest text size, 150%' },
  ];

  if (!open) return null;

  // Arrow keys move between radios, as a radiogroup is expected to.
  function onScaleKey(e, i) {
    const map = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    const d = map[e.key];
    if (!d) return;
    e.preventDefault();
    const next = (i + d + SCALES.length) % SCALES.length;
    onChange({ ...prefs, scale: SCALES[next].v });
    const el = scaleRefs.current[next];
    if (el) el.focus();
  }

  return (
    <div ref={dialogRef} className="ra-a11y-panel" role="dialog" aria-modal="false"
         aria-labelledby="a11y-h" tabIndex={-1}
         style={{
           background: RA_C.paper, borderRadius: 16,
           border: `1px solid ${RA_C.line}`, padding: 18,
           boxShadow: '0 8px 28px rgba(26,26,26,0.14)', boxSizing: 'border-box',
         }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4, gap: 8 }}>
        <h2 id="a11y-h" style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>Accessibility</h2>
        <button onClick={onClose} aria-label="Close accessibility settings" style={{
          background: 'transparent', border: 0, cursor: 'pointer', padding: 14, margin: -14, lineHeight: 0,
        }}>
          <svg width="16" height="16" viewBox="0 0 14 14" fill="none" aria-hidden="true" focusable="false"><path d="M1 1l12 12M13 1L1 13" stroke={RA_C.char} strokeWidth="2" strokeLinecap="square"/></svg>
        </button>
      </div>
      <p style={{ fontSize: 13, color: RA_C.slate, margin: '0 0 4px' }}>
        Adjust how the app works for you. Saved on this device.
      </p>

      <div style={ROW_STYLE}>
        <div>
          <div id="a11y-scale-label" style={{ fontSize: 14.5, fontWeight: 600 }}>Text size</div>
          <div style={{ fontSize: 12.5, color: RA_C.slate }}>Scales the whole app.</div>
        </div>
        <div role="radiogroup" aria-labelledby="a11y-scale-label" style={{
          display: 'inline-flex', border: `1px solid ${RA_C.line}`, borderRadius: 999, padding: 2, gap: 2, flexShrink: 0,
        }}>
          {SCALES.map((s, i) => {
            const on = prefs.scale === s.v;
            return (
              <button key={s.v} type="button" role="radio" aria-checked={on} aria-label={s.label}
                ref={el => { scaleRefs.current[i] = el; }}
                tabIndex={on ? 0 : -1}
                onKeyDown={e => onScaleKey(e, i)}
                onClick={() => onChange({ ...prefs, scale: s.v })}
                style={{
                  minWidth: 44, minHeight: 44, padding: '0 8px',
                  fontSize: 11 + (s.v - 1) * 8,
                  fontWeight: 600, borderRadius: 999, cursor: 'pointer',
                  background: on ? RA_C.char : 'transparent',
                  color: on ? RA_C.paper : RA_C.char, border: 0,
                }}><span aria-hidden="true">A</span></button>
            );
          })}
        </div>
      </div>

      <div style={ROW_STYLE}>
        <div>
          <div style={{ fontSize: 14.5, fontWeight: 600 }}>Higher contrast</div>
          <div style={{ fontSize: 12.5, color: RA_C.slate }}>Darkens borders and secondary text.</div>
        </div>
        <RAToggle checked={prefs.contrast} onChange={() => onChange({ ...prefs, contrast: !prefs.contrast })} label="Higher contrast" />
      </div>

      <div style={ROW_STYLE}>
        <div>
          <div style={{ fontSize: 14.5, fontWeight: 600 }}>Reduce motion</div>
          <div style={{ fontSize: 12.5, color: RA_C.slate }}>Disables transitions and movement.</div>
        </div>
        <RAToggle checked={prefs.motion} onChange={() => onChange({ ...prefs, motion: !prefs.motion })} label="Reduce motion" />
      </div>

      <div style={{ ...ROW_STYLE, marginTop: 14 }}>
        <span style={{ fontSize: 12.5, color: RA_C.slate }}>Saved on this device</span>
        <button onClick={() => onChange({ scale: 1, contrast: false, motion: false })} style={{
          fontSize: 13, color: RA_C.teal, fontWeight: 600, background: 'transparent', border: 0,
          padding: '10px 6px', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 3,
        }}>Reset</button>
      </div>
    </div>
  );
}

const ROW_STYLE = {
  marginTop: 10, paddingTop: 12, borderTop: `1px solid ${RA_C.hair}`,
  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
};

// ── Toast ─────────────────────────────────────────────────────────────────
// The live region is always in the DOM; only its text changes. A region that
// appears in the same commit as its message is frequently never announced.
function RAToast({ message }) {
  return (
    <div role="status" aria-live="polite" style={{
      position: 'fixed', left: '50%', bottom: 28, transform: 'translateX(-50%)',
      zIndex: 200, maxWidth: 'calc(100vw - 32px)',
      pointerEvents: 'none',
    }}>
      {message && (
        <div style={{
          background: RA_C.char, color: RA_C.paper, padding: '12px 18px',
          borderRadius: 999, fontSize: 14, fontWeight: 600,
          display: 'inline-flex', alignItems: 'center', gap: 10,
          boxShadow: '0 6px 20px rgba(26,26,26,0.24)',
        }}>
          <span aria-hidden="true" style={{
            width: 18, height: 18, borderRadius: 999, background: RA_C.green, color: RA_C.paper,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 800, flexShrink: 0,
          }}>✓</span>
          {message}
        </div>
      )}
    </div>
  );
}

Object.assign(window, { RA_NAV, RASidebar, RABottomNav, RATopbar, RAAuthModal, RAA11yPanel, RAToast, useRADialog });
