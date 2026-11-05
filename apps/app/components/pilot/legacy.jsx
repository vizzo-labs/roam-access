'use client';
// Roam Access pilot — screens and primitives, ported from the static demo
// (app/src/*.jsx at the repo root). They shared one global scope there, so
// they live in one module here; data now comes from the API via `app`.
/* eslint-disable react-hooks/exhaustive-deps, react-hooks/rules-of-hooks */

import React from 'react';
import { RA2_NEEDS, RA2_TILES, RA2_VOICE_EXAMPLES, RA2_FEATURES } from '@/lib/pilot-data';
import { PilotMap, MapLegend } from './PilotMap';

// Roam Access pilot v2 — shared primitives.
// Principles: one job per screen · voice-first · plain first-person language ·
// big targets · one clear verdict per venue, detail on demand.

// ── Palette ───────────────────────────────────────────────────────────────
// C2 is a LIVE object: the "higher contrast" preference swaps values in place
// and the app re-renders. Read C2.x at render time — never copy into a
// module-level constant.
const C2_BASE = {
  teal: '#0A4F4F', tealDeep: '#073838', rust: '#9C2D0E',
  paper: '#FAF9F6', stone: '#EDEAE2', char: '#1A1A1A',
  tealSoft: '#F0F5F5',
  blue: '#1E5F8B', blueBg: '#E5EEF5',
  amber: '#854D0E', amberBg: '#F6ECDD',
  red: '#9C2D0E', redBg: '#F6E2DA',
  green: '#3F6B53', greenBg: '#E7EFEA',
};
// `hair` is decorative; `line` bounds something operable and must clear 3:1
// against paper (WCAG 1.4.11). Verified: #8A8680 = 3.44:1, #5A5651 = 6.91:1.
const C2_NORMAL = { slate: '#5A5651', hair: '#E5E2DA', line: '#8A8680' };
const C2_HIGH   = { slate: '#3A3733', hair: '#4A4742', line: '#5A5651' };

const C2 = { ...C2_BASE, ...C2_NORMAL };
function RA2SetContrast(high) { Object.assign(C2, high ? C2_HIGH : C2_NORMAL); }

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
  const relevant = list => tags.length
    ? list.filter(f => f.tags.length === 0 || f.tags.some(t => tags.includes(t)))
    : list;
  const barriers = relevant(venue.barriers);
  const checks = relevant(venue.check);
  const works = relevant(venue.works);
  // Nothing known that touches this person's needs → say so. Claiming
  // "works for you" on zero information would betray the product's one promise.
  if (!barriers.length && !checks.length && !works.length) {
    return { kind: 'unknown', why: 'No info for your needs yet — help us verify it', barriers, checks, works };
  }
  const kind = barriers.length ? 'barrier' : checks.length ? 'check' : 'works';
  const why = (kind === 'barrier' ? barriers : kind === 'check' ? [...checks, ...works] : works)
    .slice(0, 3).map(f => f.s).join(' · ');
  return { kind, why, barriers, checks, works };
}

// ── Query parsing (voice + text) ──────────────────────────────────────────
const RA2_CAT_WORDS = {
  food:  /\b(cafes?|coffee|espresso|restaurants?|lunch|dinner|breakfast|brunch|eat|food|drinks?|bars?|pubs?|pizza|seafood|fish|gelato|ice[- ]?cream|bakery|bakeries|takeaway|burgers?)\b/,
  parks: /\b(parks?|outdoors?|walks?|gardens?|wildlife|zoo|beach(es)?|nature|pools?|swim\w*|ocean|reserves?)\b/,
  arts:  /\b(museums?|galler(y|ies)|arts?|exhibits?|librar(y|ies)|cultur\w*)\b/,
  music: /\b(music|gigs?|concerts?|shows?|events?|theatres?|venues?|plays?)\b/,
  stay:  /\b(hotels?|stay|accommodation)\b/,
};
const RA2_TAG_WORDS = {
  stepfree: /\b(step[- ]?free|wheelchairs?|ramps?|no steps?|roll in|accessible entry|mobility)\b/,
  bathroom: /\b(bathrooms?|toilets?|loos?|restrooms?)\b/,
  quiet:    /\b(quiet|low[- ]?stim\w*|sensory|peaceful|not (too )?loud)\b/,
  calm:     /\b(calm|relax\w*|low[- ]?stress|chill)\b/,
  hearing:  /\b(hearing|loops?|auslan|deaf|captions?|captioned)\b/,
  vision:   /\b(blind|low vision|braille|audio[- ]?descri\w*|guide dogs?|large[- ]?print)\b/,
  seats:    /\b(seats?|seating|rest spots?|sit down|benches|fatigue)\b/,
  simple:   /\b(easy to (understand|navigate)|simple|clear signage)\b/,
};
const RA2_CAT_LABEL = {
  food: 'cafes & food', parks: 'parks & beaches', arts: 'arts & culture',
  music: 'shows & venues', stay: 'places to stay',
};
const RA2_TAG_LABEL = {
  stepfree: 'step-free', bathroom: 'accessible bathroom', hearing: 'hearing support',
  vision: 'vision support', seats: 'seating', simple: 'easy to navigate', calm: 'calm',
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
  return { cats, tags, label, raw: text };
}

function ra2Search(venues, query, needIds) {
  const { cats, tags } = query || { cats: [], tags: [] };
  const rank = { works: 3, check: 2, unknown: 1, barrier: 0 };
  return venues
    .filter(v => !cats.length || cats.includes(v.cat))
    .map(v => {
      const verdict = ra2Verdict(v, needIds);
      const all = [...v.works, ...v.check];
      const tagHits = tags.filter(tag => all.some(f => f.tags.includes(tag))).length;
      return { ...v, verdict, score: rank[verdict.kind] * 10 + tagHits * 2 - v.mins / 60 };
    })
    .sort((a, b) => b.score - a.score);
}

// ── Small components ──────────────────────────────────────────────────────
function V2Logo({ size = 18, fill, slashFill }) {
  return (
    <svg width={size * 4.18} height={size} viewBox="0 0 920 220" role="img" aria-label="Roam Access" focusable="false">
      <title>Roam Access</title>
      <g transform="translate(110,150)">
        <text fontFamily={F2} fontWeight="700" fontSize="110" fill={fill || C2.teal} letterSpacing="-5" x="0" y="0">roam</text>
        <text fontFamily={F2} fontWeight="700" fontSize="110" fill={slashFill || C2.rust} x="293" y="0">/</text>
        <text fontFamily={F2} fontWeight="700" fontSize="110" fill={fill || C2.teal} letterSpacing="-5" x="338" y="0">access</text>
      </g>
    </svg>
  );
}

function V2Mic({ size = 28, color = C2.paper }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
      <rect x="9" y="3" width="6" height="11" rx="3" stroke={color} strokeWidth="2"/>
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

// Verdict — THE core pattern. One clear answer: icon + colour + words.
const V2_VERDICT_META = {
  works:   { bg: C2_BASE.blueBg,  fg: C2_BASE.blue,  icon: '✓', label: 'Works for you' },
  check:   { bg: C2_BASE.amberBg, fg: C2_BASE.amber, icon: '!', label: 'Check first' },
  barrier: { bg: C2_BASE.redBg,   fg: C2_BASE.red,   icon: '✗', label: 'Has barriers' },
  unknown: { bg: '#E7EAEF',       fg: '#475569',     icon: '?', label: 'No info yet' }, // 6.28:1
};

function V2Verdict({ kind, big = false, label = null }) {
  const s = V2_VERDICT_META[kind] || V2_VERDICT_META.check;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: big ? 10 : 7,
      background: s.bg, color: s.fg, fontWeight: 700, whiteSpace: 'nowrap',
      fontSize: big ? 17 : 13.5, padding: big ? '10px 16px' : '6px 12px',
      borderRadius: 999, letterSpacing: '-0.01em', flexShrink: 0,
    }}>
      <span aria-hidden="true" style={{
        width: big ? 24 : 18, height: big ? 24 : 18, borderRadius: 999,
        background: s.fg, color: s.bg, fontFamily: M2, fontWeight: 800,
        fontSize: big ? 13 : 10, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      }}>{s.icon}</span>
      {label || s.label}
    </span>
  );
}

// ── Screen scaffold ───────────────────────────────────────────────────────
// Flex column: scrollable content + fixed chrome (action bar, tabs) below it,
// so nothing ever hides under the chrome and the chrome never scrolls away.
function V2Shell({ children, bg = null, scroll = true, bar = null, tabs = null, app = null, active = 'home' }) {
  return (
    <div className="v2-screen" style={{ background: bg || C2.paper }}>
      {scroll
        ? <div className="v2-scroll">{children}</div>
        : <div className="v2-fixed">{children}</div>}
      {bar}
      {tabs && app && <V2TabBar active={active} app={app}/>}
    </div>
  );
}

function V2TabBar({ active, app }) {
  if (app.wide) return null; // the web layout's header carries navigation
  const items = [
    { id: 'home',  label: 'Home',  d: 'M4 11.5 12 4l8 7.5M6 10v9h12v-9' },
    { id: 'saved', label: 'Saved', d: 'M6 4h12v17l-6-4-6 4V4Z' },
    { id: 'me',    label: 'Me',    d: 'M12 11a3.4 3.4 0 1 0 0-6.8A3.4 3.4 0 0 0 12 11ZM4.5 20c1.5-3.5 4.5-5 7.5-5s6 1.5 7.5 5' },
  ];
  return (
    <nav aria-label="Primary" style={{
      paddingTop: 8, paddingBottom: 'var(--ra-tabs-pad)',
      background: C2.paper, borderTop: `1px solid ${C2.hair}`,
      display: 'flex', flexShrink: 0,
    }}>
      {items.map(it => {
        const on = it.id === active;
        const col = on ? C2.teal : C2.slate;
        return (
          <button key={it.id} onClick={() => app.goto(it.id)} aria-current={on ? 'page' : undefined}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              minHeight: 54, padding: '4px 0', background: 'transparent', border: 0,
              cursor: 'pointer', fontFamily: F2,
            }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
              <path d={it.d} stroke={col} strokeWidth={on ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span style={{ fontSize: 12.5, fontWeight: on ? 700 : 600, color: col }}>{it.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

function V2BigBtn({ children, kind = 'primary', onClick, style = {}, disabled = false, type = 'button', ariaLabel, ariaDescribedBy }) {
  const kinds = {
    primary: { background: C2.teal, color: C2.paper, border: 0 },
    rust:    { background: C2.rust, color: C2.paper, border: 0 },
    outline: { background: C2.paper, color: C2.teal, border: `2.5px solid ${C2.teal}` },
    ghost:   { background: C2.paper, color: C2.char, border: `1.5px solid ${C2.line}` },
  };
  const off = disabled ? { background: C2.stone, color: C2.slate, border: 0 } : null;
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      aria-label={ariaLabel} aria-describedby={ariaDescribedBy}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        width: '100%', minHeight: 60, borderRadius: 16,
        fontFamily: F2, fontWeight: 700, fontSize: 18, letterSpacing: '-0.01em',
        cursor: disabled ? 'not-allowed' : 'pointer',
        ...kinds[kind], ...off, ...style,
      }}>{children}</button>
  );
}

// Round icon button (back, save) — 48px circle.
function V2RoundBtn({ children, onClick, ariaLabel, pressed, style = {} }) {
  return (
    <button onClick={onClick} aria-label={ariaLabel} aria-pressed={pressed}
      style={{
        width: 48, height: 48, borderRadius: 999, border: `1.5px solid ${C2.line}`,
        background: C2.paper, cursor: 'pointer', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        ...style,
      }}>{children}</button>
  );
}

function V2Back({ app, to = 'home', id = null, label = 'Back' }) {
  return (
    <V2RoundBtn onClick={() => app.goto(to, id)} ariaLabel={label}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
        <path d="M15 5l-7 7 7 7" stroke={C2.char} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </V2RoundBtn>
  );
}

// Standalone switch — a real role="switch". Only used where it is NOT inside
// another control.
function V2Switch({ checked, onChange, label }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={onChange}
      style={{
        width: 52, height: 32, borderRadius: 999, padding: 0, position: 'relative',
        background: checked ? C2.teal : C2.paper,
        border: `2px solid ${checked ? C2.teal : C2.line}`,
        cursor: 'pointer', flexShrink: 0, transition: 'background-color .15s, border-color .15s',
        boxSizing: 'border-box',
      }}>
      <span style={{
        position: 'absolute', top: 3, left: 3, width: 22, height: 22, borderRadius: 999,
        background: checked ? C2.paper : C2.line,
        transform: checked ? 'translateX(20px)' : 'translateX(0)',
        transition: 'transform .15s, background-color .15s',
      }}/>
    </button>
  );
}

// Placeholder photo plate.
function V2Plate({ h = 150, label = 'venue photo', style = {} }) {
  return (
    <div aria-hidden="true" style={{
      height: h, borderRadius: 18,
      background: `repeating-linear-gradient(135deg, ${C2.hair} 0 1px, transparent 1px 12px), ${C2.stone}`,
      display: 'flex', alignItems: 'flex-end', padding: 12,
      fontFamily: M2, fontSize: 11, color: C2.slate, textTransform: 'uppercase', letterSpacing: '0.08em',
      boxSizing: 'border-box', ...style,
    }}>{label}</div>
  );
}

// Category tile icons (from the design).
function V2TileIcon({ id, size = 26 }) {
  const p = { stroke: C2.teal, strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none' };
  const paths = {
    food:  <path d="M7 3v7a2.5 2.5 0 0 0 5 0V3M9.5 3v18M17 3c-1.5 1-2.5 3-2.5 6v3h3v9" {...p}/>,
    parks: <path d="M12 3 6 12h4l-4 7h12l-4-7h4L12 3ZM12 19v2" {...p}/>,
    arts:  <path d="M4 10 12 4l8 6M6 10v8M10 10v8M14 10v8M18 10v8M4 18h16" {...p}/>,
    music: <path d="M9 18V6l10-2v12M9 18a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Zm10-2a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z" {...p}/>,
    stay:  <path d="M3 6v13M3 14h18M21 19v-5a3 3 0 0 0-3-3h-8v3M6.5 11.5a1.5 1.5 0 1 0 0-.01" {...p}/>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false">{paths[id]}</svg>;
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
      if (e.key === 'Escape') { e.preventDefault(); onCloseRef.current(); return; }
      if (e.key !== 'Tab' || !ref.current) return;
      const items = Array.from(ref.current.querySelectorAll(RA2_FOCUSABLE))
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
function V2Toast({ message }) {
  return (
    <div role="status" aria-live="polite" style={{
      position: 'absolute', left: '50%', bottom: 'calc(var(--ra-tabs-pad) + 76px)',
      transform: 'translateX(-50%)', zIndex: 200, width: 'max-content', maxWidth: '86%',
      pointerEvents: 'none',
    }}>
      {message && (
        <div style={{
          background: C2.char, color: C2.paper, padding: '12px 18px',
          borderRadius: 999, fontSize: 14, fontWeight: 600, fontFamily: F2,
          boxShadow: '0 6px 20px rgba(26,26,26,0.28)', textAlign: 'center', lineHeight: 1.35,
        }}>{message}</div>
      )}
    </div>
  );
}

const V2_H1 = { fontWeight: 700, letterSpacing: '-0.025em', margin: 0, fontFamily: F2 };

// Roam Access pilot v2 — screens: Welcome, Setup (needs, name), Home, Voice, Results.

// ─────────────────────────────────────────────────────────────
// WELCOME
// ─────────────────────────────────────────────────────────────
function V2Welcome({ app }) {
  const h = useV2Heading('welcome');
  return (
    <V2Shell>
      {!app.wide && (
        <div style={{ padding: '22px 26px 0' }}>
          <V2Logo size={30}/>
        </div>
      )}
      <div style={{ padding: '48px 26px 0' }}>
        <p style={{ fontFamily: M2, fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase', color: C2.slate, margin: '0 0 18px' }}>
          For people with disability
        </p>
        <h1 ref={h} tabIndex={-1} style={{ ...V2_H1, fontSize: 40, lineHeight: 1.06, marginBottom: 18 }}>
          Find places that actually work for you<span style={{ color: C2.rust }}>.</span>
        </h1>
        <p style={{ fontSize: 18, lineHeight: 1.5, color: C2.char, margin: 0, maxWidth: 320 }}>
          Real accessibility, checked by people with lived experience — not what venues claim.
        </p>
      </div>

      <div style={{ padding: '32px 26px 0' }}>
        {[
          'Built with the disability community',
          'Every disability — not just wheelchair access',
          'Free for you. Always.',
        ].map(t => (
          <div key={t} style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 14 }}>
            <span aria-hidden="true" style={{
              width: 26, height: 26, borderRadius: 999, background: C2.tealSoft, flexShrink: 0,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="13" height="10" viewBox="0 0 16 12" fill="none"><path d="M1 6l5 5L15 1" stroke={C2.teal} strokeWidth="2.5" strokeLinecap="round"/></svg>
            </span>
            <span style={{ fontSize: 16.5, fontWeight: 600, color: C2.char }}>{t}</span>
          </div>
        ))}
      </div>

      <div style={{ padding: '30px 26px 24px' }}>
        <V2BigBtn kind="primary" onClick={() => app.signUp()}>Join the pilot</V2BigBtn>
        <button onClick={() => app.signIn()}
          style={{
            width: '100%', minHeight: 56, marginTop: 8, borderRadius: 16, border: 0,
            background: 'transparent', color: C2.teal, fontFamily: F2, fontSize: 17, fontWeight: 700,
            cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 4,
          }}>I already have an account</button>
        <p style={{ fontSize: 12.5, color: C2.slate, textAlign: 'center', margin: '14px 0 0', lineHeight: 1.45 }}>
          Pilot in Manly & surrounds — real places, reviewed by the people taking part.
        </p>
      </div>
    </V2Shell>
  );
}

// ─────────────────────────────────────────────────────────────
// SETUP · step 2 — first-person needs
// ─────────────────────────────────────────────────────────────
function V2Setup({ app }) {
  const h = useV2Heading('setup');
  const [needs, setNeeds] = React.useState(new Set(app.user?.needs || []));

  function toggle(id) {
    setNeeds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const bar = (
    <div style={{ padding: '14px 24px calc(var(--ra-tabs-pad) + 8px)', background: C2.paper, borderTop: `1px solid ${C2.hair}`, flexShrink: 0 }}>
      <V2BigBtn kind="primary" onClick={() => {
        app.setUser({ ...(app.user || {}), needs: Array.from(needs) });
        app.goto('setup-name');
      }}>Continue →</V2BigBtn>
    </div>
  );

  return (
    <V2Shell bar={bar}>
      <div style={{ padding: '14px 24px 24px' }}>
        <div style={{ display: 'flex', gap: 5, marginBottom: 24 }} aria-hidden="true">
          <div style={{ flex: 1, height: 5, borderRadius: 3, background: C2.teal }}/>
          <div style={{ flex: 1, height: 5, borderRadius: 3, background: C2.teal }}/>
          <div style={{ flex: 1, height: 5, borderRadius: 3, background: C2.line }}/>
        </div>
        <p className="ra-sr-only">Step 2 of 3</p>

        <h1 ref={h} tabIndex={-1} style={{ ...V2_H1, fontSize: 29, lineHeight: 1.12, marginBottom: 10 }}>
          What do you need to enjoy a place<span style={{ color: C2.rust }}>?</span>
        </h1>
        <p style={{ fontSize: 16.5, color: C2.char, lineHeight: 1.5, margin: '0 0 22px' }}>
          Pick as many as you like. We'll rank places by what fits — you can change this anytime, or skip it.
        </p>

        {RA2_NEEDS.map(n => {
          const on = needs.has(n.id);
          return (
            <button key={n.id} onClick={() => toggle(n.id)} aria-pressed={on} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 14,
              minHeight: 68, borderRadius: 16, padding: '10px 16px', marginBottom: 10,
              border: on ? `2.5px solid ${C2.teal}` : `1.5px solid ${C2.line}`,
              background: on ? C2.tealSoft : C2.paper,
              cursor: 'pointer', fontFamily: F2, textAlign: 'left', boxSizing: 'border-box',
            }}>
              <span aria-hidden="true" style={{
                width: 30, height: 30, borderRadius: 999, flexShrink: 0,
                border: on ? 0 : `2px solid ${C2.line}`,
                background: on ? C2.teal : 'transparent',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                boxSizing: 'border-box',
              }}>
                {on && <svg width="15" height="12" viewBox="0 0 16 12" fill="none"><path d="M1 6l5 5L15 1" stroke={C2.paper} strokeWidth="2.5" strokeLinecap="round"/></svg>}
              </span>
              <span style={{ fontSize: 17, fontWeight: 600, lineHeight: 1.35, color: C2.char }}>{n.label}</span>
            </button>
          );
        })}

        <p style={{ fontSize: 14, color: C2.slate, lineHeight: 1.5, marginTop: 14, marginBottom: 0 }}>
          Stored securely to personalise your results. Reviews show your lived experience (like “Wheelchair user”), never your name. Delete everything anytime from Me.
        </p>
      </div>
    </V2Shell>
  );
}

// ─────────────────────────────────────────────────────────────
// SETUP · step 3 — name
// ─────────────────────────────────────────────────────────────
function V2SetupName({ app }) {
  const h = useV2Heading('setup-name');
  const [name, setName] = React.useState(app.user?.name || '');

  function finish() {
    app.setUser({ ...(app.user || {}), name: name.trim(), needs: app.user?.needs || [], done: true });
    app.goto('home');
    app.toast('You’re set. Thanks for joining the pilot.');
  }

  const bar = (
    <div style={{ padding: '14px 24px calc(var(--ra-tabs-pad) + 8px)', background: C2.paper, borderTop: `1px solid ${C2.hair}`, flexShrink: 0 }}>
      <V2BigBtn kind="primary" onClick={finish}>Finish →</V2BigBtn>
    </div>
  );

  return (
    <V2Shell bar={bar}>
      <div style={{ padding: '14px 24px 24px' }}>
        <div style={{ display: 'flex', gap: 5, marginBottom: 24 }} aria-hidden="true">
          <div style={{ flex: 1, height: 5, borderRadius: 3, background: C2.teal }}/>
          <div style={{ flex: 1, height: 5, borderRadius: 3, background: C2.teal }}/>
          <div style={{ flex: 1, height: 5, borderRadius: 3, background: C2.teal }}/>
        </div>
        <p className="ra-sr-only">Step 3 of 3</p>

        <h1 ref={h} tabIndex={-1} style={{ ...V2_H1, fontSize: 29, lineHeight: 1.12, marginBottom: 10 }}>
          What should we call you<span style={{ color: C2.rust }}>?</span>
        </h1>
        <p style={{ fontSize: 16.5, color: C2.char, lineHeight: 1.5, margin: '0 0 22px' }}>
          Totally optional — pick anything. Your reviews never show your name, only your lived experience.
        </p>

        <label htmlFor="setup-name" style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Your name</label>
        <input id="setup-name" value={name} onChange={e => setName(e.target.value)}
          autoComplete="nickname" placeholder="e.g. Naomi"
          style={{
            width: '100%', boxSizing: 'border-box', minHeight: 60,
            border: `1.5px solid ${C2.line}`, borderRadius: 16, padding: '0 18px',
            fontSize: RA2_INPUT_FONT + 1, fontFamily: F2, color: C2.char, background: C2.paper,
          }}/>
      </div>
    </V2Shell>
  );
}

// ─────────────────────────────────────────────────────────────
// HOME — one question, voice first
// ─────────────────────────────────────────────────────────────
function V2Home({ app }) {
  const h = useV2Heading('home');
  const [typing, setTyping] = React.useState(false);
  const [typed, setTyped] = React.useState('');
  const inputRef = React.useRef(null);

  React.useEffect(() => { if (typing && inputRef.current) inputRef.current.focus(); }, [typing]);

  const name = app.user?.name;
  const visited = app.venueById(app.world.visitedId);
  const showPrompt = visited && !app.world.reviewed.includes(visited.id);
  const needIds = app.user?.needs || [];
  const byDistance = app.venues.map(v => ({ v, verdict: ra2Verdict(v, needIds) })).sort((x, y) => x.v.mins - y.v.mins);
  const worksNear = byDistance.filter(x => x.verdict.kind === 'works').slice(0, 3);
  const firstReviews = byDistance.filter(x => x.v.verified === 0).slice(0, 3);
  const nearbyList = worksNear.length ? worksNear : firstReviews;

  function runTyped(e) {
    e.preventDefault();
    if (!typed.trim()) return;
    app.runSearch(ra2ParseQuery(typed.trim()));
  }

  return (
    <V2Shell tabs app={app} active="home">
      {!app.wide && (
        <div style={{ padding: '10px 22px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <V2Logo size={26}/>
          <button onClick={() => app.goto('me')} aria-label="Open your profile" style={{
            width: 44, height: 44, borderRadius: 999, background: C2.teal, color: C2.paper,
            border: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: F2,
          }}>{(name || 'You').charAt(0).toUpperCase()}</button>
        </div>
      )}

      <div style={{ padding: '26px 22px 0' }}>
        <h1 ref={h} tabIndex={-1} style={{ ...V2_H1, fontSize: 34, letterSpacing: '-0.03em', lineHeight: 1.08, marginBottom: 24 }}>
          {name ? <>Hi {name}.<br/></> : <>Hi.<br/></>}
          Where do you want to go today<span style={{ color: C2.rust }}>?</span>
        </h1>

        {/* Voice — the primary action */}
        <button onClick={() => app.goto('voice')} style={{
          width: '100%', minHeight: 92, borderRadius: 20, border: 0,
          background: C2.teal, color: C2.paper, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 16, padding: '14px 22px',
          textAlign: 'left', fontFamily: F2, boxSizing: 'border-box',
        }}>
          <span aria-hidden="true" style={{
            width: 56, height: 56, borderRadius: 999, background: 'rgba(250,249,246,0.14)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}><V2Mic size={30}/></span>
          <span>
            <span style={{ display: 'block', fontSize: 19, fontWeight: 700, marginBottom: 3 }}>Tap and speak</span>
            <span style={{ display: 'block', fontSize: 14, opacity: 0.88, lineHeight: 1.35 }}>"Find a quiet cafe with step-free entry"</span>
          </span>
        </button>

        {/* Type instead */}
        {!typing ? (
          <button onClick={() => setTyping(true)} style={{
            width: '100%', minHeight: 58, borderRadius: 16, marginTop: 10,
            background: C2.stone, border: 0, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 12, padding: '0 18px',
            fontFamily: F2, fontSize: 16.5, color: C2.slate, textAlign: 'left',
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
              <circle cx="11" cy="11" r="6.5" stroke={C2.slate} strokeWidth="2"/>
              <path d="m20 20-4-4" stroke={C2.slate} strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Or type what you're looking for
          </button>
        ) : (
          <form onSubmit={runTyped} style={{
            display: 'flex', gap: 8, marginTop: 10,
          }}>
            <label htmlFor="home-search" className="ra-sr-only">Search for places</label>
            <input id="home-search" ref={inputRef} value={typed} onChange={e => setTyped(e.target.value)}
              placeholder="Try “quiet cafe with step-free entry”"
              style={{
                flex: 1, minWidth: 0, minHeight: 58, borderRadius: 16,
                border: `1.5px solid ${C2.line}`, padding: '0 16px',
                fontSize: RA2_INPUT_FONT, fontFamily: F2, color: C2.char, background: C2.paper,
                boxSizing: 'border-box',
              }}/>
            <button type="submit" aria-label="Search" style={{
              minHeight: 58, minWidth: 58, borderRadius: 16, border: 0, background: C2.teal,
              color: C2.paper, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
                <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="2"/>
                <path d="m20 20-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </form>
        )}
      </div>

      {/* 1-tap review prompt — the community loop */}
      {showPrompt && (
        <div style={{ padding: '26px 22px 0' }}>
          <button onClick={() => app.goto('review', visited.id)} style={{
            width: '100%', textAlign: 'left', cursor: 'pointer', fontFamily: F2,
            background: C2.tealSoft, border: `2px solid ${C2.teal}`, borderRadius: 18,
            padding: 18, display: 'flex', alignItems: 'center', gap: 14, boxSizing: 'border-box',
          }}>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: 'block', fontFamily: M2, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: C2.slate, marginBottom: 6 }}>1-tap review</span>
              <span style={{ display: 'block', fontSize: 17.5, fontWeight: 700, letterSpacing: '-0.015em', color: C2.char, marginBottom: 3 }}>
                How was {visited.name}?
              </span>
              <span style={{ display: 'block', fontSize: 14, color: C2.slate, lineHeight: 1.4 }}>One tap helps other people plan their day.</span>
            </span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" style={{ flexShrink: 0 }}>
              <path d="M9 5l7 7-7 7" stroke={C2.teal} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      )}

      {/* Browse tiles */}
      <div style={{ padding: '26px 22px 0' }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 12px', letterSpacing: '-0.01em', fontFamily: F2 }}>Or browse</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {RA2_TILES.map(t => (
            <button key={t.id} onClick={() => app.runSearch({ cats: t.cats, tags: [], label: t.label, raw: '' })} style={{
              minHeight: 104, borderRadius: 16, border: `1.5px solid ${C2.line}`,
              background: C2.paper, cursor: 'pointer', fontFamily: F2,
              display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
              justifyContent: 'space-between', padding: 16, boxSizing: 'border-box',
            }}>
              <V2TileIcon id={t.id}/>
              <span style={{ fontSize: 15.5, fontWeight: 700, color: C2.char, letterSpacing: '-0.01em', textAlign: 'left' }}>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Nearby — what works, or where a first review helps most */}
      {nearbyList.length > 0 && (
        <div style={{ padding: '26px 22px 24px' }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 4px', letterSpacing: '-0.01em', fontFamily: F2 }}>
            {worksNear.length ? 'Works for you, nearby' : 'Nearby, waiting for a first review'}
          </h2>
          <p style={{ fontSize: 14, color: C2.slate, margin: '0 0 12px', fontFamily: F2, lineHeight: 1.45 }}>
            {worksNear.length ? `Confirmed by people in the pilot · walking from ${app.origin.name}` : 'Been to one of these? Your review is the first data point.'}
          </p>
          {nearbyList.map(({ v, verdict }) => (
            <button key={v.id} onClick={() => app.goto('venue', v.id)} style={{
              width: '100%', borderRadius: 16, border: `1.5px solid ${C2.line}`, padding: 16, marginBottom: 10,
              display: 'flex', alignItems: 'center', gap: 14, background: C2.paper,
              cursor: 'pointer', fontFamily: F2, textAlign: 'left', boxSizing: 'border-box',
            }}>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 16.5, fontWeight: 700, marginBottom: 3, color: C2.char }}>{v.name}</span>
                <span style={{ display: 'block', fontSize: 13.5, color: C2.slate }}>{v.kind} · {v.mins} min walk</span>
              </span>
              <V2Verdict kind={verdict.kind}/>
            </button>
          ))}
        </div>
      )}
    </V2Shell>
  );
}

// ─────────────────────────────────────────────────────────────
// VOICE — real speech recognition, seamless scripted fallback
// ─────────────────────────────────────────────────────────────
function V2Voice({ app }) {
  const [mode, setMode] = React.useState('starting'); // starting | listening | demo
  const [transcript, setTranscript] = React.useState('');
  // Set by the effect below; lets the example chips finish the flow too.
  const finalizeRef = React.useRef(() => {});

  // One self-contained lifecycle, mounted once per visit. Everything —
  // recognition, scripted fallback, timers — lives and dies inside it, so no
  // re-render can strand the screen. The demo can never dead-end: no mic, no
  // permission, no speech, and even a hung permission prompt all fall through
  // to the scripted search.
  React.useEffect(() => {
    let done = false;
    let demoRunning = false;
    let rec = null;
    const timers = [];
    const later = (fn, ms) => { const t = setTimeout(fn, ms); timers.push(t); return t; };

    const finalize = (text) => {
      if (done) return;
      done = true;
      if (rec) { try { rec.abort(); } catch (e) {} }
      app.runSearch(ra2ParseQuery(text));
    };
    finalizeRef.current = finalize;

    // No speech engine, no permission, or nothing heard: say so plainly and
    // offer the examples or typing — never invent a query for the tester.
    const startDemo = () => {
      if (done || demoRunning) return;
      demoRunning = true;
      if (rec) { try { rec.abort(); } catch (e) {} rec = null; }
      setMode('unavailable');
    };

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      startDemo();
    } else {
      let latest = '';
      let silence = null;
      rec = new SR();
      rec.lang = 'en-AU';
      rec.interimResults = true;
      rec.continuous = false;
      rec.maxAlternatives = 1;
      rec.onstart = () => { if (!done && !demoRunning) setMode('listening'); };
      rec.onresult = (e) => {
        if (done || demoRunning) return;
        let text = '';
        let final = false;
        for (const res of e.results) {
          text += res[0].transcript;
          if (res.isFinal) final = true;
        }
        latest = text.trim();
        setTranscript(latest);
        // Some engines (iOS Safari) never send a final result or onend; a
        // short silence after the last words finalizes instead.
        if (silence) clearTimeout(silence);
        if (final && latest) later(() => finalize(latest), 500);
        else if (latest) silence = later(() => finalize(latest), 2000);
      };
      rec.onerror = () => { if (!latest) startDemo(); };
      rec.onend = () => {
        if (done || demoRunning) return;
        if (latest) finalize(latest);
        else startDemo();
      };
      try { rec.start(); } catch (e) { startDemo(); }
      // Safety net: mic silent, permission hung, anything — 7s then demo.
      later(() => { if (!latest) startDemo(); }, 7000);
      // Hard cap: whatever was heard by now is the query.
      later(() => { if (latest) finalize(latest); }, 15000);
    }

    return () => {
      done = true;
      if (rec) { try { rec.abort(); } catch (e) {} }
      timers.forEach(clearTimeout);
    };
  }, []); // eslint-disable-line

  const finalize = (text) => finalizeRef.current(text);

  const statusLabel = mode === 'listening' ? 'Listening…' : mode === 'unavailable' ? 'Couldn’t hear you' : 'Getting ready…';
  const h = useV2Heading('voice');

  return (
    <V2Shell bg={C2.teal}>
      <h1 ref={h} tabIndex={-1} className="ra-sr-only">Voice search</h1>
      <div data-ra-oncolor="" style={{ padding: '14px 22px 0', display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={() => app.goto('home')} style={{
          minHeight: 48, padding: '0 20px', borderRadius: 999, border: '1.5px solid rgba(250,249,246,0.45)',
          background: 'transparent', color: C2.paper, fontFamily: F2, fontSize: 16, fontWeight: 600, cursor: 'pointer',
        }}>Cancel</button>
      </div>

      <div style={{ padding: '34px 26px 0', textAlign: 'center' }} data-ra-oncolor="">
        <div aria-hidden="true" style={{
          width: 120, height: 120, borderRadius: 999, margin: '0 auto 14px',
          background: 'rgba(250,249,246,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div className={mode === 'listening' ? 'ra-pulse' : ''} style={{
            width: 84, height: 84, borderRadius: 999, background: C2.rust,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <V2Mic size={38}/>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 5, justifyContent: 'center', marginBottom: 26, height: 32, alignItems: 'center' }} aria-hidden="true">
          {[10, 22, 14, 30, 18, 26, 12].map((hh, i) => (
            <span key={i} className={mode === 'listening' ? 'ra-bar' : ''} style={{
              width: 5, height: hh, borderRadius: 3, background: 'rgba(250,249,246,0.65)',
              animationDelay: `${i * 0.12}s`,
            }}/>
          ))}
        </div>

        <p role="status" style={{ fontFamily: M2, fontSize: 12, letterSpacing: '0.14em', color: 'rgba(250,249,246,0.7)', textTransform: 'uppercase', margin: '0 0 16px' }}>
          {statusLabel}
        </p>

        {/* Deliberately NOT a live region: the typewriter and interim speech
            results mutate this dozens of times — a live region here would
            announce every keystroke. The route announcer covers arrival on
            the results screen. */}
        <p style={{
          fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.25,
          color: C2.paper, margin: '0 auto', maxWidth: 300, minHeight: 96, fontFamily: F2,
        }}>
          {transcript ? `“${transcript}”` : mode === 'unavailable'
            ? <span style={{ display: 'block', fontSize: 18, fontWeight: 500, letterSpacing: 0, lineHeight: 1.45 }}>Voice isn’t available here, or the mic wasn’t allowed. Tap an example below, or go back and type.</span>
            : ' '}
        </p>
      </div>

      <div data-ra-oncolor="" style={{ padding: '20px 26px 30px' }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, color: 'rgba(250,249,246,0.75)', margin: '0 0 12px', fontFamily: F2 }}>
          You can ask for things like
        </h2>
        {RA2_VOICE_EXAMPLES.map(s => (
          <button key={s} onClick={() => finalize(s.replace(/[“”]/g, ''))} style={{
            width: '100%', textAlign: 'left', fontSize: 15.5, color: C2.paper, padding: '14px 16px',
            borderRadius: 12, background: 'rgba(250,249,246,0.1)', marginBottom: 8, lineHeight: 1.4,
            border: 0, cursor: 'pointer', fontFamily: F2, boxSizing: 'border-box',
          }}>{s}</button>
        ))}
      </div>
    </V2Shell>
  );
}

// ─────────────────────────────────────────────────────────────
// RESULTS — one verdict per card
// ─────────────────────────────────────────────────────────────
function V2Results({ app }) {
  const h = useV2Heading('results-' + (app.query?.label || ''));
  const query = app.query || { cats: [], tags: [], label: 'All places' };
  const all = ra2Search(app.venues, query, app.user?.needs || []);
  const [limit, setLimit] = React.useState(25);
  const results = all.slice(0, limit);
  const needShorts = RA2_NEEDS.filter(n => (app.user?.needs || []).includes(n.id)).map(n => n.short);

  return (
    <V2Shell tabs app={app} active="home">
      {/* what you asked */}
      <div style={{ padding: '10px 22px 0', display: 'flex', gap: 8 }}>
        <button onClick={() => app.goto('home')} style={{
          display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0,
          minHeight: 56, borderRadius: 999, border: `1.5px solid ${C2.line}`,
          background: C2.paper, padding: '0 18px', cursor: 'pointer',
          fontFamily: F2, fontSize: 16, fontWeight: 600, color: C2.char, textAlign: 'left',
          boxSizing: 'border-box',
        }} aria-label={`Back to home. Current search: ${query.label}`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" style={{ flexShrink: 0 }}>
            <path d="M15 5l-7 7 7 7" stroke={C2.char} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{query.label}</span>
        </button>
        <V2RoundBtn onClick={() => app.goto('voice')} ariaLabel="Search again by voice" style={{ width: 56, height: 56 }}>
          <V2Mic size={22} color={C2.teal}/>
        </V2RoundBtn>
        {!app.wide && (
          <V2RoundBtn onClick={() => app.goto('map')} ariaLabel="Show results on the map" style={{ width: 56, height: 56 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
              <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2ZM9 4v14M15 6v14" stroke={C2.char} strokeWidth="1.8" strokeLinejoin="round"/>
            </svg>
          </V2RoundBtn>
        )}
      </div>

      <div style={{ padding: '20px 22px 24px' }}>
        <h1 ref={h} tabIndex={-1} style={{ ...V2_H1, fontSize: 24, marginBottom: 4 }}>
          {all.length} {all.length === 1 ? 'place' : 'places'} found<span style={{ color: C2.rust }}>.</span>
        </h1>
        <p style={{ fontSize: 15.5, color: C2.slate, margin: '0 0 16px', lineHeight: 1.45, fontFamily: F2 }}>
          {needShorts.length
            ? `Matched to your needs: ${needShorts.join(' + ')}.`
            : 'Showing general access — set your needs to personalise.'}
        </p>
        <p style={{ fontSize: 14, color: C2.slate, margin: '-6px 0 14px', fontFamily: F2, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span>Walking times from {app.origin.name}.</span>
          {!app.origin.mine && (
            <button onClick={app.locateMe} style={{
              minHeight: 44, padding: '0 4px', border: 0, background: 'transparent', color: C2.teal,
              fontFamily: F2, fontSize: 14, fontWeight: 700, textDecoration: 'underline', textUnderlineOffset: 3, cursor: 'pointer',
            }}>Use my location</button>
          )}
        </p>

        {results.map(r => (
          <button key={r.id} onClick={() => app.goto('venue', r.id)} style={{
            width: '100%', textAlign: 'left', cursor: 'pointer', fontFamily: F2,
            background: C2.paper, border: `1.5px solid ${C2.line}`, borderRadius: 18,
            padding: 18, marginBottom: 12, display: 'block', boxSizing: 'border-box',
          }}>
            <span style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
              <span style={{ minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 19, fontWeight: 700, letterSpacing: '-0.015em', marginBottom: 3, color: C2.char }}>{r.name}</span>
                <span style={{ display: 'block', fontSize: 14, color: C2.slate }}>{r.kind} · {r.area} · {r.mins} min walk</span>
              </span>
              <V2Verdict kind={r.verdict.kind}/>
            </span>
            <span style={{ display: 'block', fontSize: 15, color: C2.char, lineHeight: 1.5 }}>{r.verdict.why}</span>
          </button>
        ))}

        {all.length > results.length && (
          <V2BigBtn kind="ghost" onClick={() => setLimit(l => l + 25)}>
            Show {Math.min(25, all.length - results.length)} more
          </V2BigBtn>
        )}

        {!results.length && (
          <p style={{ padding: 24, textAlign: 'center', color: C2.slate, fontSize: 15, border: `1.5px dashed ${C2.line}`, borderRadius: 16 }}>
            Nothing matched that. Try “quiet cafe” or browse from Home.
          </p>
        )}
      </div>
    </V2Shell>
  );
}

// Roam Access pilot v2 — screens: Map, Venue, AllReviews, Review, Thanks, Saved, Me, A11ySheet.

// ─────────────────────────────────────────────────────────────
// MAP — verdict-coded pins, one card at a time
// ─────────────────────────────────────────────────────────────
function V2MapView({ app }) {
  const query = app.query || { cats: [], tags: [], label: 'All places' };
  const results = ra2Search(app.venues, query, app.user?.needs || []);
  const [selId, setSelId] = React.useState(results[0]?.id || null);
  const sel = results.find(r => r.id === selId) || results[0];
  const h = useV2Heading('map');
  const pinColor = { works: C2.blue, check: C2.amber, barrier: C2.red, unknown: '#475569' };
  const pinIcon = { works: '✓', check: '!', barrier: '✗', unknown: '?' };
  // Remap data coords into the band clear of the floating search chrome above
  // and the selected card below, so no pin ever renders under either.
  const pinX = x => `${(0.06 + x * 0.88) * 100}%`;
  const pinY = y => `${(0.2 + y * 0.5) * 100}%`;
  const legendKinds = [...new Set(results.map(r => r.verdict.kind))];

  return (
    <V2Shell scroll={false} tabs app={app} active="home">
      <h1 ref={h} tabIndex={-1} className="ra-sr-only">Map of results — {query.label}</h1>
      <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
        <PilotMap results={results} selectedId={selId} onSelect={setSelId} origin={app.origin}
          colors={pinColor} icons={pinIcon} labels={Object.fromEntries(Object.entries(V2_VERDICT_META).map(([k, m]) => [k, m.label]))}
          onLocate={app.locateFromMap} onLocateError={app.locateError} autoLocate={app.origin.mine}
          locateStyle={{ right: 18, bottom: sel ? 232 : 24 }}/>

        {/* top: search pill + list toggle */}
        <div style={{ position: 'absolute', top: 'var(--ra-shell-top)', left: 18, right: 18, display: 'flex', gap: 8, zIndex: 3 }}>
          <button onClick={() => app.goto('results')} style={{
            flex: 1, minWidth: 0, minHeight: 54, borderRadius: 999, border: `1.5px solid ${C2.line}`,
            background: C2.paper, padding: '0 18px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 10,
            fontFamily: F2, fontSize: 15.5, fontWeight: 600, color: C2.char, textAlign: 'left',
            boxSizing: 'border-box',
          }} aria-label={`Back to list. Current search: ${query.label}`}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" style={{ flexShrink: 0 }}>
              <path d="M15 5l-7 7 7 7" stroke={C2.char} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{query.label}</span>
            <V2Mic size={18} color={C2.teal}/>
          </button>
          <button onClick={() => app.goto('results')} aria-label="Show as list" style={{
            minHeight: 54, minWidth: 54, borderRadius: 999, border: `1.5px solid ${C2.line}`,
            background: C2.paper, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
              <path d="M4 6h16M4 12h16M4 18h16" stroke={C2.char} strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* legend */}
        <MapLegend compact kinds={legendKinds} colors={pinColor} icons={pinIcon}
          labels={Object.fromEntries(Object.entries(V2_VERDICT_META).map(([k, m]) => [k, m.label]))}
          style={{ top: 'calc(var(--ra-shell-top) + 66px)', left: 18 }}/>

        {/* selected card */}
        {sel && (
          <div style={{
            position: 'absolute', bottom: 16, left: 18, right: 18, zIndex: 3,
            background: C2.paper, borderRadius: 20, border: `1.5px solid ${C2.line}`,
            padding: 18, boxShadow: '0 12px 32px rgba(26,26,26,0.10)', boxSizing: 'border-box',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: F2, fontSize: 19, fontWeight: 700, letterSpacing: '-0.015em', color: C2.char, marginBottom: 3 }}>{sel.name}</div>
                <div style={{ fontFamily: F2, fontSize: 14, color: C2.slate }}>{sel.kind} · {sel.area} · {sel.mins} min walk</div>
              </div>
              <V2Verdict kind={sel.verdict.kind}/>
            </div>
            <div style={{ fontFamily: F2, fontSize: 14.5, color: C2.char, lineHeight: 1.45, marginBottom: 14 }}>
              {sel.verdict.why}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => app.goto('venue', sel.id)} style={{
                flex: 1, minHeight: 50, borderRadius: 12, border: 0, background: C2.teal, color: C2.paper,
                fontFamily: F2, fontSize: 15.5, fontWeight: 700, cursor: 'pointer',
              }}>See details</button>
              <button onClick={() => app.toggleSave(sel.id)}
                aria-label={app.world.saved.includes(sel.id) ? `Remove ${sel.name} from saved` : `Save ${sel.name}`}
                aria-pressed={app.world.saved.includes(sel.id)}
                style={{
                  minHeight: 50, minWidth: 50, borderRadius: 12, border: `1.5px solid ${C2.line}`,
                  background: app.world.saved.includes(sel.id) ? C2.tealSoft : C2.paper,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill={app.world.saved.includes(sel.id) ? C2.teal : 'none'} aria-hidden="true" focusable="false">
                  <path d="M6 4h12v17l-6-4-6 4V4Z" stroke={app.world.saved.includes(sel.id) ? C2.teal : C2.char} strokeWidth="2" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </V2Shell>
  );
}

// ─────────────────────────────────────────────────────────────
// VENUE — verdict first, plain language, detail on demand
// ─────────────────────────────────────────────────────────────
function V2VenueView({ app }) {
  const v = app.venueById(app.selectedId);
  const h = useV2Heading('venue-' + v.id);
  const verdict = ra2Verdict(v, app.user?.needs || []);
  const saved = app.world.saved.includes(v.id);
  const meta = V2_VERDICT_META[verdict.kind];
  const { reviews: loaded } = useVenueReviews(app, v.id);
  const written = v.verified;
  const firstReview = loaded && loaded[0];

  React.useEffect(() => { app.markVisited(v.id); }, [v.id]); // eslint-disable-line

  const nRev = `${v.verified} community ${v.verified === 1 ? 'review' : 'reviews'}`;
  const verdictLead = {
    works: `${verdict.works.slice(0, 3).map(f => f.s).join(', ')} — from ${nRev}.`,
    check: v.verified
      ? `Things to know before you go, from ${nRev}.`
      : 'Not yet confirmed by anyone in the pilot. Check before you go — then tell us how it was.',
    barrier: `People in the pilot have flagged real barriers here, from ${nRev}.`,
    unknown: 'Nobody with your access needs has reviewed this place yet. Your visit could be the first data point.',
  }[verdict.kind];

  const bar = (
    <div style={{
      padding: '14px 22px calc(var(--ra-tabs-pad) + 8px)', background: C2.paper,
      borderTop: `1px solid ${C2.hair}`, display: 'flex', gap: 10, flexShrink: 0,
    }}>
      <V2BigBtn kind="primary" style={{ flex: 1.5 }} ariaLabel={`Directions to ${v.name} (opens Google Maps)`}
        onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${v.lat},${v.lng}`, '_blank', 'noopener')}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
          <path d="M12 21s-7-6.2-7-11a7 7 0 1 1 14 0c0 4.8-7 11-7 11Z" stroke={C2.paper} strokeWidth="2"/>
          <circle cx="12" cy="10" r="2.5" stroke={C2.paper} strokeWidth="2"/>
        </svg>
        Directions
      </V2BigBtn>
      {v.phone ? (
        <V2BigBtn kind="outline" style={{ flex: 1 }} ariaLabel={`Call ${v.name}`}
          onClick={() => { window.location.href = 'tel:' + v.phone.replace(/[^+\d]/g, ''); }}>Call</V2BigBtn>
      ) : v.website ? (
        <V2BigBtn kind="outline" style={{ flex: 1 }} ariaLabel={`${v.name} website (opens in a new tab)`}
          onClick={() => window.open(v.website, '_blank', 'noopener')}>Website</V2BigBtn>
      ) : null}
    </div>
  );

  return (
    <V2Shell bar={bar}>
      <div style={{ padding: '10px 22px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <V2Back app={app} to={app.venueOrigin} label="Back"/>
        <V2RoundBtn onClick={() => app.toggleSave(v.id)} pressed={saved}
          ariaLabel={saved ? `Remove ${v.name} from saved` : `Save ${v.name}`}
          style={saved ? { background: C2.tealSoft, borderColor: C2.teal } : {}}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill={saved ? C2.teal : 'none'} aria-hidden="true" focusable="false">
            <path d="M6 4h12v17l-6-4-6 4V4Z" stroke={saved ? C2.teal : C2.char} strokeWidth="2" strokeLinejoin="round"/>
          </svg>
        </V2RoundBtn>
      </div>

      <div style={{ padding: '16px 22px 24px' }}>
        <h1 ref={h} tabIndex={-1} style={{ ...V2_H1, fontSize: 30, lineHeight: 1.05, marginBottom: 4 }}>
          {v.name}<span style={{ color: C2.rust }}>.</span>
        </h1>
        <p style={{ fontSize: 15, color: C2.slate, margin: '0 0 16px', fontFamily: F2 }}>{v.kind} · {v.address ? `${v.address}, ` : ''}{v.area} · {v.mins} min walk</p>

        {/* THE verdict */}
        <div style={{ background: meta.bg, borderRadius: 18, padding: 20, marginBottom: 10 }}>
          <V2Verdict kind={verdict.kind} big/>
          <p style={{ fontSize: 16.5, lineHeight: 1.5, color: C2.char, margin: '12px 0 0', fontFamily: F2 }}>
            {verdictLead}
          </p>
        </div>

        {/* barriers — first when they exist */}
        {verdict.barriers.length > 0 && (
          <section style={{ borderRadius: 18, border: `1.5px solid ${C2.line}`, overflow: 'hidden', marginBottom: 10 }}>
            <h2 style={{ padding: '16px 18px 6px', fontSize: 14, fontWeight: 700, color: C2.red, margin: 0, fontFamily: F2, letterSpacing: '0.02em' }}>BARRIERS</h2>
            {verdict.barriers.map(f => (
              <div key={f.t} style={{ display: 'flex', gap: 12, padding: '12px 18px', alignItems: 'flex-start', borderTop: `1px solid ${C2.hair}` }}>
                <span aria-hidden="true" style={{
                  width: 22, height: 22, borderRadius: 999, background: C2.red, color: C2.redBg, flexShrink: 0,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, fontFamily: M2,
                }}>✗</span>
                <span style={{ fontSize: 16, lineHeight: 1.45, fontFamily: F2 }}>{f.t}</span>
              </div>
            ))}
          </section>
        )}

        {/* what works */}
        {verdict.works.length > 0 && (
          <section style={{ borderRadius: 18, border: `1.5px solid ${C2.line}`, overflow: 'hidden', marginBottom: 10 }}>
            <h2 style={{ padding: '16px 18px 6px', fontSize: 14, fontWeight: 700, color: C2.blue, margin: 0, fontFamily: F2, letterSpacing: '0.02em' }}>WHAT WORKS</h2>
            {verdict.works.map(f => (
              <div key={f.t} style={{ display: 'flex', gap: 12, padding: '12px 18px', alignItems: 'flex-start', borderTop: `1px solid ${C2.hair}` }}>
                <span aria-hidden="true" style={{
                  width: 22, height: 22, borderRadius: 999, background: C2.blue, color: C2.blueBg, flexShrink: 0,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, fontFamily: M2,
                }}>✓</span>
                <span style={{ fontSize: 16, lineHeight: 1.45, fontFamily: F2 }}>{f.t}</span>
              </div>
            ))}
          </section>
        )}

        {/* check before you go */}
        {verdict.checks.length > 0 && (
          <section style={{ borderRadius: 18, border: `1.5px solid ${C2.line}`, overflow: 'hidden', marginBottom: 16 }}>
            <h2 style={{ padding: '16px 18px 6px', fontSize: 14, fontWeight: 700, color: C2.amber, margin: 0, fontFamily: F2, letterSpacing: '0.02em' }}>CHECK BEFORE YOU GO</h2>
            {verdict.checks.map(f => (
              <div key={f.t} style={{ display: 'flex', gap: 12, padding: '12px 18px', alignItems: 'flex-start', borderTop: `1px solid ${C2.hair}` }}>
                <span aria-hidden="true" style={{
                  width: 22, height: 22, borderRadius: 999, background: C2.amber, color: C2.amberBg, flexShrink: 0,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, fontFamily: M2,
                }}>!</span>
                <span style={{ fontSize: 16, lineHeight: 1.45, fontFamily: F2 }}>{f.t}</span>
              </div>
            ))}
          </section>
        )}

        {/* community voice */}
        {firstReview && (
          <div style={{ background: C2.stone, borderRadius: 18, padding: 18, marginBottom: 16 }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: C2.slate, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: M2, margin: '0 0 10px' }}>From the community</h2>
            <p style={{ fontSize: 16, lineHeight: 1.5, margin: '0 0 10px', fontFamily: F2 }}>
              “{firstReview.text}”
            </p>
            <p style={{ fontSize: 13.5, color: C2.slate, fontWeight: 600, margin: 0, fontFamily: F2 }}>{firstReview.who} · {firstReview.when}</p>
          </div>
        )}

        {written > 0 ? (
          <V2BigBtn kind="ghost" onClick={() => app.goto('reviews', v.id)}>
            Read all {written} {written === 1 ? 'review' : 'reviews'}
          </V2BigBtn>
        ) : (
          <V2BigBtn kind="ghost" onClick={() => app.goto('review', v.id)}>
            No reviews yet — be the first
          </V2BigBtn>
        )}
        <div style={{ height: 10 }}/>
        <V2BigBtn kind="outline" onClick={() => app.goto('review', v.id)}>
          Share your experience
        </V2BigBtn>

        <p style={{ fontSize: 13.5, color: C2.slate, textAlign: 'center', margin: '18px 0 0', lineHeight: 1.5, fontFamily: F2 }}>
          Place details from{' '}
          <a href={v.osmUrl} target="_blank" rel="noopener noreferrer" style={{ color: C2.teal, fontWeight: 600 }}>
            OpenStreetMap<span className="ra-sr-only"> (opens in a new tab)</span>
          </a>. Spot something wrong? Say so in your review.
        </p>
      </div>
    </V2Shell>
  );
}

// ─────────────────────────────────────────────────────────────
// ALL REVIEWS — filter by lived experience
// ─────────────────────────────────────────────────────────────
function V2AllReviews({ app }) {
  const v = app.venueById(app.selectedId);
  const h = useV2Heading('reviews-' + v.id);
  const [filter, setFilter] = React.useState('All');
  const { reviews: loaded, error } = useVenueReviews(app, v.id);
  const all = loaded || [];
  const filters = ['All', ...RA2_NEEDS.map(n => n.filter)];
  const shown = filter === 'All' ? all : all.filter(r => r.filters.includes(filter));

  return (
    <V2Shell tabs app={app} active="home">
      <div style={{ padding: '10px 22px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
        <V2Back app={app} to="venue" id={v.id} label={`Back to ${v.name}`}/>
        <div>
          <h1 ref={h} tabIndex={-1} style={{ ...V2_H1, fontSize: 19, letterSpacing: '-0.015em' }}>{v.name} reviews</h1>
          <p style={{ fontSize: 13.5, color: C2.slate, margin: 0, fontFamily: F2 }}>
            {loaded ? `${all.length} ${all.length === 1 ? 'review' : 'reviews'} from the pilot` : error ? 'Couldn’t load reviews' : 'Loading reviews…'}
          </p>
        </div>
      </div>

      <div style={{ padding: '18px 22px 0', display: 'flex', gap: 7, flexWrap: 'wrap' }} role="group" aria-label="Filter reviews by lived experience">
        {filters.map(f => {
          const on = filter === f;
          return (
            <button key={f} onClick={() => setFilter(f)} aria-pressed={on} style={{
              minHeight: 44, padding: '0 16px', borderRadius: 999, cursor: 'pointer',
              border: on ? `1.5px solid ${C2.teal}` : `1.5px solid ${C2.line}`,
              background: on ? C2.teal : C2.paper,
              color: on ? C2.paper : C2.char,
              fontFamily: F2, fontSize: 14.5, fontWeight: 600,
            }}>{f}</button>
          );
        })}
      </div>

      <div style={{ padding: '18px 22px 24px' }}>
        {shown.map((r, i) => (
          <article key={r.id || i} style={{
            border: `1.5px solid ${C2.hair}`, borderRadius: 18, padding: 18, marginBottom: 12,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: C2.teal, fontFamily: F2 }}>{r.who}</span>
              <V2Verdict kind={r.v} label={{ works: 'It worked', check: 'Some barriers', barrier: 'Didn’t work' }[r.v]}/>
            </div>
            <p style={{ fontSize: 15.5, lineHeight: 1.5, margin: '0 0 12px', color: C2.char, fontFamily: F2 }}>{r.text}</p>
            {r.details && <p style={{ fontSize: 14, lineHeight: 1.5, margin: '0 0 12px', color: C2.slate, fontFamily: F2 }}>{r.details}</p>}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: C2.slate, fontFamily: F2 }}>
                {r.when}{r.mine ? ' · yours' : ''}
              </span>
            </div>
          </article>
        ))}
        {loaded && !shown.length && (
          <p style={{ padding: 24, textAlign: 'center', color: C2.slate, fontSize: 15, border: `1.5px dashed ${C2.line}`, borderRadius: 16, fontFamily: F2 }}>
            No reviews from this lived experience yet — yours could be the first.
          </p>
        )}
        <V2BigBtn kind="primary" onClick={() => app.goto('review', v.id)}>Share your experience</V2BigBtn>
      </div>
    </V2Shell>
  );
}

// ─────────────────────────────────────────────────────────────
// THANKS — the community loop, made visible
// ─────────────────────────────────────────────────────────────
function V2Thanks({ app }) {
  const v = app.venueById(app.selectedId);
  const h = useV2Heading('thanks');
  const name = app.user?.name;
  return (
    <V2Shell bg={C2.teal}>
      <div style={{ padding: '56px 26px 0', textAlign: 'center' }} data-ra-oncolor="">
        <div aria-hidden="true" style={{
          width: 88, height: 88, borderRadius: 999, margin: '0 auto 26px',
          background: 'rgba(250,249,246,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="40" height="32" viewBox="0 0 16 12" fill="none"><path d="M1 6l5 5L15 1" stroke={C2.paper} strokeWidth="2" strokeLinecap="round"/></svg>
        </div>
        <h1 ref={h} tabIndex={-1} style={{ ...V2_H1, fontSize: 34, letterSpacing: '-0.03em', lineHeight: 1.1, color: C2.paper, marginBottom: 12 }}>
          Thanks{name ? `, ${name}` : ''}<span style={{ color: 'rgba(250,249,246,0.55)' }}>.</span>
        </h1>
        <p style={{ fontSize: 17.5, lineHeight: 1.5, color: 'rgba(250,249,246,0.9)', margin: '0 auto', maxWidth: 300, fontFamily: F2 }}>
          Your review of {v.name} is live — everyone in the pilot can see it now.
        </p>
      </div>

      <div style={{ padding: '30px 26px 0' }}>
        {[
          { n: String(app.lastSubmit?.venueReviews ?? v.verified), l: `${(app.lastSubmit?.venueReviews ?? v.verified) === 1 ? 'review' : 'reviews'} of ${v.name} so far` },
          { n: String(app.myStats.places), l: `${app.myStats.places === 1 ? 'place' : 'places'} you’ve reviewed in the pilot` },
          { n: String(app.pilot.testers), l: `${app.pilot.testers === 1 ? 'person' : 'people'} taking part in the pilot` },
        ].map(s => (
          <div key={s.l} style={{
            display: 'flex', alignItems: 'baseline', gap: 14,
            padding: '16px 18px', borderRadius: 16, marginBottom: 10,
            background: 'rgba(250,249,246,0.09)',
          }}>
            <span style={{ fontFamily: M2, fontSize: 26, fontWeight: 700, color: C2.paper, whiteSpace: 'nowrap' }}>{s.n}</span>
            <span style={{ fontSize: 15, color: 'rgba(250,249,246,0.88)', lineHeight: 1.4, fontFamily: F2 }}>{s.l}</span>
          </div>
        ))}
      </div>

      <div style={{ padding: '24px 26px 30px' }} data-ra-oncolor="">
        <V2BigBtn kind="rust" onClick={() => app.goto('home')}>Done</V2BigBtn>
      </div>
    </V2Shell>
  );
}

// ─────────────────────────────────────────────────────────────
// SAVED — plan your day out
// ─────────────────────────────────────────────────────────────
function V2SavedView({ app }) {
  const h = useV2Heading('saved');
  const places = app.world.saved.map(id => app.venueById(id)).filter(Boolean);
  return (
    <V2Shell tabs app={app} active="saved">
      <div style={{ padding: '16px 22px 24px' }}>
        <h1 ref={h} tabIndex={-1} style={{ ...V2_H1, fontSize: 30, marginBottom: 6 }}>
          Saved<span style={{ color: C2.rust }}>.</span>
        </h1>
        <p style={{ fontSize: 15.5, color: C2.slate, margin: '0 0 18px', lineHeight: 1.45, fontFamily: F2 }}>
          Your places, with what people in the pilot say now.
        </p>

        {places.map(p => {
          const verdict = ra2Verdict(p, app.user?.needs || []);
          return (
            <button key={p.id} onClick={() => app.goto('venue', p.id)} style={{
              width: '100%', textAlign: 'left', cursor: 'pointer', fontFamily: F2,
              background: C2.paper, border: `1.5px solid ${C2.line}`, borderRadius: 18,
              padding: 18, marginBottom: 12, display: 'block', boxSizing: 'border-box',
            }}>
              <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: 18, fontWeight: 700, letterSpacing: '-0.015em', color: C2.char, marginBottom: 3 }}>{p.name}</span>
                  <span style={{ display: 'block', fontSize: 13.5, color: C2.slate }}>{p.kind} · {p.area}</span>
                </span>
                <V2Verdict kind={verdict.kind}/>
              </span>
              <span style={{ fontSize: 14.5, color: C2.char, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span aria-hidden="true" style={{ color: C2.rust, fontWeight: 700 }}>/</span>{p.note || (p.verified ? `${p.verified} ${p.verified === 1 ? 'review' : 'reviews'}` : 'No reviews yet — be the first')}
              </span>
            </button>
          );
        })}

        {!places.length && (
          <div style={{ padding: 28, textAlign: 'center', border: `1.5px dashed ${C2.line}`, borderRadius: 18 }}>
            <p style={{ fontSize: 15.5, color: C2.slate, margin: '0 0 16px', fontFamily: F2 }}>
              Nothing saved yet. Find somewhere that works and keep it here.
            </p>
            <V2BigBtn kind="primary" onClick={() => app.goto('home')}>Explore places</V2BigBtn>
          </div>
        )}
      </div>
    </V2Shell>
  );
}

// ─────────────────────────────────────────────────────────────
// ME — profile, needs, impact, settings
// ─────────────────────────────────────────────────────────────
function V2Me({ app }) {
  const h = useV2Heading('me');
  const name = app.user?.name;
  const needChips = RA2_NEEDS.filter(n => (app.user?.needs || []).includes(n.id)).map(n => n.chip);
  const stats = app.myStats;

  const rows = [
    { l: 'Accessibility settings', m: 'Text size · contrast · motion', hi: true, fn: () => app.openA11y() },
    ...(app.installable ? [{ l: 'Install the app', m: 'Add Roam Access to your home screen', hi: false, fn: () => app.install() }] : []),
    { l: 'Invite someone to the pilot', m: 'Every new voice makes the map better', fn: () => app.invite() },
    { l: 'Sign out', m: 'Your reviews and saved places stay', fn: () => app.signOut() },
    { l: 'Delete my account', m: 'Removes your needs, reviews and saved places', fn: () => app.deleteAccount() },
  ];

  return (
    <V2Shell tabs app={app} active="me">
      <div style={{ padding: '16px 22px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 22 }}>
          <span aria-hidden="true" style={{
            width: 64, height: 64, borderRadius: 999, background: C2.teal, color: C2.paper,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 22, fontFamily: F2,
          }}>{(name || 'You').charAt(0).toUpperCase()}</span>
          <div>
            <h1 ref={h} tabIndex={-1} style={{ ...V2_H1, fontSize: 24, letterSpacing: '-0.02em' }}>
              {name || 'You'}<span style={{ color: C2.rust }}>.</span>
            </h1>
            <p style={{ fontSize: 14, color: C2.slate, margin: 0, fontFamily: F2 }}>Manly pilot · tester</p>
          </div>
        </div>

        {/* my needs */}
        <section style={{ background: C2.stone, borderRadius: 18, padding: 18, marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h2 style={{ fontSize: 15.5, fontWeight: 700, margin: 0, fontFamily: F2 }}>What I need</h2>
            <button onClick={() => app.goto('setup')} style={{
              minHeight: 44, padding: '0 14px', borderRadius: 999, border: 0, background: 'transparent',
              color: C2.teal, fontFamily: F2, fontSize: 14.5, fontWeight: 700, cursor: 'pointer',
              textDecoration: 'underline', textUnderlineOffset: 4,
            }}>Edit</button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
            {needChips.length ? needChips.map(t => (
              <span key={t} style={{
                fontSize: 13.5, fontWeight: 600, padding: '8px 13px', borderRadius: 999,
                background: C2.paper, color: C2.char, border: `1px solid ${C2.line}`, fontFamily: F2,
              }}>{t}</span>
            )) : (
              <span style={{ fontSize: 14, color: C2.slate, fontFamily: F2 }}>Nothing set — showing general access for now.</span>
            )}
          </div>
        </section>

        {/* impact */}
        <section style={{ background: C2.teal, borderRadius: 18, padding: 18, marginBottom: 18, color: C2.paper }} data-ra-oncolor="">
          <h2 style={{ fontSize: 15.5, fontWeight: 700, margin: '0 0 12px', fontFamily: F2 }}>Your impact</h2>
          <div style={{ display: 'flex', gap: 10 }}>
            {[[String(stats.reviews), stats.reviews === 1 ? 'review' : 'reviews'], [String(stats.places), stats.places === 1 ? 'place reviewed' : 'places reviewed'], [String(app.pilot.testers), app.pilot.testers === 1 ? 'person in the pilot' : 'people in the pilot']].map(([n, l]) => (
              <div key={l} style={{ flex: 1, background: 'rgba(250,249,246,0.1)', borderRadius: 12, padding: '12px 10px' }}>
                <div style={{ fontFamily: M2, fontSize: 24, fontWeight: 700, marginBottom: 3 }}>{n}</div>
                <div style={{ fontSize: 12, opacity: 0.88, lineHeight: 1.3, fontFamily: F2 }}>{l}</div>
              </div>
            ))}
          </div>
        </section>

        {/* settings rows */}
        {rows.map(r => (
          <button key={r.l} onClick={r.fn} style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
            minHeight: 66, padding: '10px 16px', marginBottom: 8, cursor: 'pointer', textAlign: 'left',
            borderRadius: 16, fontFamily: F2, boxSizing: 'border-box',
            border: r.hi ? `2px solid ${C2.teal}` : `1.5px solid ${C2.line}`,
            background: r.hi ? C2.tealSoft : C2.paper,
          }}>
            <span>
              <span style={{ display: 'block', fontSize: 16, fontWeight: 700, color: C2.char, marginBottom: 2 }}>{r.l}</span>
              <span style={{ display: 'block', fontSize: 13, color: C2.slate }}>{r.m}</span>
            </span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" style={{ flexShrink: 0 }}>
              <path d="M9 5l7 7-7 7" stroke={C2.slate} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        ))}

        <p style={{ fontFamily: M2, fontSize: 10.5, letterSpacing: '0.08em', textTransform: 'uppercase', color: C2.slate, textAlign: 'center', margin: '16px 0 0' }}>
          Roam Access pilot · Manly · map data © OpenStreetMap contributors
        </p>
      </div>
    </V2Shell>
  );
}

// ─────────────────────────────────────────────────────────────
// ACCESSIBILITY SHEET — text size, contrast, motion (all real)
// ─────────────────────────────────────────────────────────────
function V2A11ySheet({ open, onClose, prefs, onChange }) {
  const ref = useRA2Dialog(open, onClose);
  const scaleRefs = React.useRef([]);
  const SCALES = [
    { v: 1, label: 'Default text size' },
    { v: 1.125, label: 'Large text size, 112%' },
    { v: 1.25, label: 'Larger text size, 125%' },
    { v: 1.5, label: 'Largest text size, 150%' },
  ];
  if (!open) return null;

  function onScaleKey(e, i) {
    const map = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    const d = map[e.key];
    if (!d) return;
    e.preventDefault();
    const next = (i + d + SCALES.length) % SCALES.length;
    onChange({ scale: SCALES[next].v });
    const el = scaleRefs.current[next];
    if (el) el.focus();
  }

  const row = {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
    paddingTop: 14, marginTop: 12, borderTop: `1px solid ${C2.hair}`,
  };

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 120, background: 'rgba(26,26,26,0.5)' }} onClick={onClose}>
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby="a11y-h" tabIndex={-1}
        onClick={e => e.stopPropagation()}
        style={{
          position: 'absolute', left: 0, right: 0, bottom: 0,
          background: C2.paper, borderRadius: '22px 22px 0 0', padding: '20px 22px',
          paddingBottom: 'calc(var(--ra-tabs-pad) + 16px)',
          maxHeight: '82%', overflowY: 'auto', boxSizing: 'border-box',
        }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <h2 id="a11y-h" style={{ fontSize: 19, fontWeight: 700, margin: 0, fontFamily: F2 }}>Accessibility</h2>
          <button onClick={onClose} aria-label="Close accessibility settings" style={{
            background: 'transparent', border: 0, cursor: 'pointer', padding: 14, margin: -14, lineHeight: 0,
          }}>
            <svg width="16" height="16" viewBox="0 0 14 14" fill="none" aria-hidden="true" focusable="false">
              <path d="M1 1l12 12M13 1L1 13" stroke={C2.char} strokeWidth="2" strokeLinecap="square"/>
            </svg>
          </button>
        </div>
        <p style={{ fontSize: 13.5, color: C2.slate, margin: '4px 0 6px', fontFamily: F2 }}>
          Adjust how the app works for you. Saved on this device.
        </p>

        <div style={row}>
          <div>
            <div id="a11y-scale-label" style={{ fontSize: 15.5, fontWeight: 600, fontFamily: F2 }}>Text size</div>
            <div style={{ fontSize: 13, color: C2.slate, fontFamily: F2 }}>Scales the whole app.</div>
          </div>
          <div role="radiogroup" aria-labelledby="a11y-scale-label" style={{
            display: 'inline-flex', border: `1px solid ${C2.line}`, borderRadius: 999, padding: 2, gap: 2, flexShrink: 0,
          }}>
            {SCALES.map((s, i) => {
              const on = prefs.scale === s.v;
              return (
                <button key={s.v} type="button" role="radio" aria-checked={on} aria-label={s.label}
                  ref={el => { scaleRefs.current[i] = el; }}
                  tabIndex={on ? 0 : -1}
                  onKeyDown={e => onScaleKey(e, i)}
                  onClick={() => onChange({ scale: s.v })}
                  style={{
                    minWidth: 44, minHeight: 44, padding: '0 6px',
                    fontSize: 11 + (s.v - 1) * 8, fontWeight: 600, borderRadius: 999, cursor: 'pointer',
                    background: on ? C2.char : 'transparent',
                    color: on ? C2.paper : C2.char, border: 0, fontFamily: F2,
                  }}><span aria-hidden="true">A</span></button>
              );
            })}
          </div>
        </div>

        <div style={row}>
          <div>
            <div style={{ fontSize: 15.5, fontWeight: 600, fontFamily: F2 }}>Higher contrast</div>
            <div style={{ fontSize: 13, color: C2.slate, fontFamily: F2 }}>Darkens borders and secondary text.</div>
          </div>
          <V2Switch checked={prefs.contrast} onChange={() => onChange({ contrast: !prefs.contrast })} label="Higher contrast"/>
        </div>

        <div style={row}>
          <div>
            <div style={{ fontSize: 15.5, fontWeight: 600, fontFamily: F2 }}>Reduce motion</div>
            <div style={{ fontSize: 13, color: C2.slate, fontFamily: F2 }}>Disables animation and movement.</div>
          </div>
          <V2Switch checked={prefs.motion} onChange={() => onChange({ motion: !prefs.motion })} label="Reduce motion"/>
        </div>

        <div style={row}>
          <div>
            <div style={{ fontSize: 15.5, fontWeight: 600, fontFamily: F2 }}>Voice</div>
            <div style={{ fontSize: 13, color: C2.slate, fontFamily: F2, maxWidth: 220 }}>
              Search and reviews work by voice wherever you see the mic.
            </div>
          </div>
          <V2Mic size={24} color={C2.teal}/>
        </div>

        <div style={{ ...row, alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: C2.slate, fontFamily: F2 }}>Saved on this device</span>
          <button onClick={() => onChange({ scale: 1, contrast: false, motion: false })} style={{
            fontSize: 14, color: C2.teal, fontWeight: 700, background: 'transparent', border: 0,
            padding: '10px 6px', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 3, fontFamily: F2,
          }}>Reset</button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PILOT ADDITIONS — real reviews, dictation, data hooks
// ─────────────────────────────────────────────────────────────

// Reviews for one venue: cached copy first (instant), then fresh from the API.
function useVenueReviews(app, id) {
  const [state, setState] = React.useState(() => ({ reviews: app.reviewsCache[id] || null, error: false }));
  React.useEffect(() => {
    let live = true;
    app.loadReviews(id).then(
      r => { if (live) setState({ reviews: r, error: false }); },
      () => { if (live) setState(s => ({ ...s, error: true })); },
    );
    return () => { live = false; };
  }, [id, app.reviewsVersion]);
  return state;
}

// Dictation into a text field. Hidden where the browser has no speech engine.
function V2Dictate({ onText }) {
  const [state, setState] = React.useState('idle'); // idle | listening | unsupported
  const recRef = React.useRef(null);
  const onTextRef = React.useRef(onText);
  onTextRef.current = onText;

  React.useEffect(() => {
    if (!(window.SpeechRecognition || window.webkitSpeechRecognition)) setState('unsupported');
    return () => { try { if (recRef.current) recRef.current.abort(); } catch (e) {} };
  }, []);

  if (state === 'unsupported') return null;

  function toggle() {
    if (state === 'listening') { try { recRef.current.stop(); } catch (e) {} return; }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    recRef.current = rec;
    rec.lang = 'en-AU';
    rec.interimResults = false;
    rec.continuous = false;
    rec.onresult = (e) => {
      const t = Array.from(e.results).map(r => r[0].transcript).join(' ').trim();
      if (t) onTextRef.current(t);
    };
    rec.onend = () => setState('idle');
    rec.onerror = () => setState('idle');
    try { rec.start(); setState('listening'); } catch (e) { setState('idle'); }
  }

  const on = state === 'listening';
  return (
    <button type="button" onClick={toggle} aria-pressed={on} style={{
      marginTop: 8, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
      minHeight: 52, borderRadius: 14, border: `1.5px dashed ${C2.teal}`,
      background: on ? C2.teal : C2.tealSoft, color: on ? C2.paper : C2.teal,
      fontFamily: F2, fontSize: 16, fontWeight: 700, cursor: 'pointer',
    }}>
      <V2Mic size={20} color={on ? C2.paper : C2.teal}/>
      {on ? 'Listening… tap to stop' : 'Prefer to talk? Dictate instead'}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// REVIEW — one tap required, everything else optional
// ─────────────────────────────────────────────────────────────
function V2ReviewView({ app }) {
  const v = app.venueById(app.selectedId);
  const h = useV2Heading('review-' + v.id);
  const [choice, setChoice] = React.useState(null);
  const [features, setFeatures] = React.useState({});
  const [note, setNote] = React.useState('');
  const [sending, setSending] = React.useState(false);

  // Questions that touch this tester's own needs come first.
  const mine = ra2NeedTags(app.user?.needs || []);
  const questions = [...RA2_FEATURES].sort((x, y) => (mine.includes(y.id) ? 1 : 0) - (mine.includes(x.id) ? 1 : 0));

  const options = [
    { kind: 'works',   label: 'It worked for me',  sub: 'I could get in, get around, and enjoy it' },
    { kind: 'check',   label: 'Some barriers',     sub: 'I managed, but with workarounds' },
    { kind: 'barrier', label: "It didn't work",    sub: "I couldn't use the venue as I needed" },
  ];

  // Tapping the selected answer again clears it ("not sure").
  const setFeature = (id, val) => setFeatures(f => {
    const next = { ...f };
    if (next[id] === val) delete next[id]; else next[id] = val;
    return next;
  });

  async function send() {
    if (!choice || sending) return;
    setSending(true);
    const ok = await app.submitReview({ venueId: v.id, verdict: choice, features, note });
    if (ok) app.goto('thanks', v.id, { replace: true }); // Back must not reopen a sent form
    else setSending(false);
  }

  return (
    <V2Shell>
      <div style={{ padding: '10px 22px 0', display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={() => app.goto('venue', v.id)} style={{
          minHeight: 48, padding: '0 18px', borderRadius: 999, border: 0,
          background: 'transparent', color: C2.slate, fontFamily: F2, fontSize: 16, fontWeight: 600, cursor: 'pointer',
          textDecoration: 'underline', textUnderlineOffset: 4,
        }}>Skip</button>
      </div>

      <div style={{ padding: '14px 24px 24px' }}>
        <p style={{ fontFamily: M2, fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: C2.slate, margin: '0 0 10px' }}>
          Your experience
        </p>
        <h1 ref={h} tabIndex={-1} style={{ ...V2_H1, fontSize: 30, lineHeight: 1.1, marginBottom: 8 }}>
          How was {v.name}<span style={{ color: C2.rust }}>?</span>
        </h1>
        <p style={{ fontSize: 16.5, color: C2.char, lineHeight: 1.5, margin: '0 0 26px', fontFamily: F2 }}>
          One tap helps other people plan their day. Everything else is optional.
        </p>

        {options.map(o => {
          const meta = V2_VERDICT_META[o.kind];
          const on = choice === o.kind;
          return (
            <button key={o.kind} onClick={() => setChoice(o.kind)} aria-pressed={on} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 16,
              minHeight: 84, borderRadius: 18, padding: '12px 18px', marginBottom: 10,
              border: on ? `2.5px solid ${meta.fg}` : `1.5px solid ${C2.line}`,
              background: on ? meta.bg : C2.paper, cursor: 'pointer',
              fontFamily: F2, textAlign: 'left', boxSizing: 'border-box',
            }}>
              <span aria-hidden="true" style={{
                width: 44, height: 44, borderRadius: 999, background: meta.fg, color: meta.bg, flexShrink: 0,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 19, fontWeight: 800, fontFamily: M2,
              }}>{meta.icon}</span>
              <span>
                <span style={{ display: 'block', fontSize: 18.5, fontWeight: 700, letterSpacing: '-0.01em', marginBottom: 3, color: C2.char }}>{o.label}</span>
                <span style={{ display: 'block', fontSize: 14.5, color: C2.slate, lineHeight: 1.35 }}>{o.sub}</span>
              </span>
            </button>
          );
        })}

        <section aria-labelledby="rev-more" style={{ marginTop: 22 }}>
          <h2 id="rev-more" style={{ fontSize: 17, fontWeight: 700, margin: '0 0 4px', fontFamily: F2 }}>
            Tell us more <span style={{ fontWeight: 500, color: C2.slate }}>(optional)</span>
          </h2>
          <p style={{ fontSize: 14.5, color: C2.slate, margin: '0 0 10px', lineHeight: 1.45, fontFamily: F2 }}>
            Answer only what you noticed. Tap an answer again to clear it.
          </p>
          {questions.map(q => (
            <div key={q.id} role="group" aria-labelledby={`q-${q.id}`} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '10px 0', borderTop: `1px solid ${C2.hair}`,
            }}>
              <span id={`q-${q.id}`} style={{ flex: 1, fontSize: 15.5, lineHeight: 1.35, fontWeight: 600, fontFamily: F2, color: C2.char }}>{q.question}</span>
              {['yes', 'no'].map(val => {
                const on = features[q.id] === val;
                return (
                  <button key={val} type="button" aria-pressed={on} onClick={() => setFeature(q.id, val)} style={{
                    minWidth: 58, minHeight: 44, borderRadius: 999, flexShrink: 0,
                    border: on ? `2px solid ${C2.teal}` : `1.5px solid ${C2.line}`,
                    background: on ? C2.teal : C2.paper, color: on ? C2.paper : C2.char,
                    fontWeight: 700, fontSize: 15, fontFamily: F2, cursor: 'pointer',
                  }}>{val === 'yes' ? 'Yes' : 'No'}</button>
                );
              })}
            </div>
          ))}
        </section>

        <div style={{ marginTop: 18 }}>
          <label htmlFor="rev-note" style={{ display: 'block', fontSize: 17, fontWeight: 700, marginBottom: 8, fontFamily: F2 }}>
            Anything else? <span style={{ fontWeight: 500, color: C2.slate }}>(optional)</span>
          </label>
          <textarea id="rev-note" value={note} onChange={e => setNote(e.target.value)} rows={4} maxLength={1000}
            placeholder="e.g. The ramp is round the side; staff were great"
            style={{
              width: '100%', boxSizing: 'border-box', borderRadius: 16, border: `1.5px solid ${C2.line}`,
              padding: 14, fontSize: RA2_INPUT_FONT, fontFamily: F2, lineHeight: 1.45, color: C2.char,
              background: C2.paper, resize: 'vertical',
            }}/>
          <V2Dictate onText={t => setNote(n => (n ? n.trimEnd() + ' ' : '') + t)}/>
        </div>

        <div style={{ marginTop: 20 }}>
          <V2BigBtn kind="primary" onClick={send} disabled={!choice || sending} ariaDescribedBy="rev-hint">
            {sending ? 'Sending…' : 'Send it →'}
          </V2BigBtn>
        </div>
        <p id="rev-hint" style={{ fontSize: 13.5, color: C2.slate, textAlign: 'center', marginTop: 12, lineHeight: 1.4, fontFamily: F2 }}>
          {choice ? 'Shown with your lived experience — never your name.' : 'Choose one of the three options above to send.'}
        </p>
      </div>
    </V2Shell>
  );
}

export {
  C2, F2, M2, RA2SetContrast, V2_VERDICT_META,
  V2Welcome, V2Setup, V2SetupName, V2Home, V2Voice, V2Results,
  V2MapView, V2VenueView, V2AllReviews, V2ReviewView, V2Thanks, V2SavedView, V2Me, V2A11ySheet,
  V2Toast, V2BigBtn, V2Logo, V2Shell, ra2ParseQuery, ra2Search, ra2Verdict,
};
