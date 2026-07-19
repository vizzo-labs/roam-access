// Roam Access — shared brand primitives for the web app.

// ── Palette ───────────────────────────────────────────────────────────────
// RA_C is a LIVE object: the "higher contrast" preference swaps its values in
// place (see RASetContrast) and the app re-renders. Components must therefore
// read RA_C.x at render time — never destructure it into a module constant.
const RA_PALETTE_BASE = {
  teal:    '#0A4F4F',
  tealDeep:'#073838',
  rust:    '#9C2D0E',
  rustDeep:'#7E2208',
  paper:   '#FAF9F6',
  stone:   '#EDEAE2',
  char:    '#1A1A1A',
  blue:    '#1E5F8B',
  amber:   '#854D0E',
  red:     '#9C2D0E',
  unver:   '#475569',
  blueBg:  '#E5EEF5',
  amberBg: '#F6ECDD',
  redBg:   '#F6E2DA',
  unverBg: '#E7EAEF',
  greenBg: '#E7EFEA',
  green:   '#3F6B53',
  tealSoft:'#F0F5F5',
};

// Tokens that the contrast preference actually moves. `hair` is decorative
// (separators, card edges); `line` bounds something you can operate — inputs,
// chips, option cards — and so has to clear 3:1 against paper for SC 1.4.11.
const RA_PALETTE_NORMAL = {
  slate: '#5A5651',  // 6.91:1 on paper
  hair:  '#E5E2DA',
  line:  '#8A8680',  // 3.44:1 on paper, 3.01:1 on stone
};

const RA_PALETTE_HIGH = {
  slate: '#3A3733',  // 11.24:1 on paper
  hair:  '#4A4742',  //  8.78:1 on paper
  line:  '#5A5651',  //  6.91:1 on paper
};

const RA_C = { ...RA_PALETTE_BASE, ...RA_PALETTE_NORMAL };

function RASetContrast(high) {
  Object.assign(RA_C, high ? RA_PALETTE_HIGH : RA_PALETTE_NORMAL);
}

const RA_FONT_SANS = `Inter, -apple-system, BlinkMacSystemFont, system-ui, sans-serif`;
const RA_FONT_MONO = `"JetBrains Mono", ui-monospace, monospace`;

// Form controls sit at 16px minimum: below that, iOS Safari zooms the page on
// focus and never zooms back out.
const RA_INPUT_FONT = 16;

// ── Match scoring ─────────────────────────────────────────────────────────
// One definition, used by Discover, Venue and Saved alike. An empty access
// profile means "no preferences expressed", not "nothing is accessible", so it
// falls back to scoring across every category and reports itself as general
// rather than personalised.
function RAScore(venue, accessProfile) {
  const personalised = Array.isArray(accessProfile) && accessProfile.length > 0;
  const cats = personalised ? accessProfile : RA_CATEGORIES.map(c => c.id);
  const total = cats.length;
  const accessible = cats.filter(c => venue.status[c] === 'accessible').length;
  const partial = cats.filter(c => venue.status[c] === 'partial').length;
  const score = Math.round(((accessible + partial * 0.5) / total) * 10);
  return { score, accessible, partial, total, cats, personalised };
}

// Score → colour, shared by the list pills, the saved cards and the map pins so
// the same venue never reads as two different colours in two places.
function RAScoreTone(score) {
  if (score >= 7) return { fg: RA_C.green, bg: RA_C.greenBg, pin: '#2F5540', band: '7–10 · Strong match' };
  if (score >= 4) return { fg: RA_C.amber, bg: RA_C.amberBg, pin: '#6B3E0B', band: '4–6 · Partial' };
  return { fg: RA_C.red, bg: RA_C.redBg, pin: '#7E2208', band: '0–3 · Likely barriers' };
}

function RAEyebrow({ children, color = RA_C.slate, style = {}, as: Tag = 'div', id }) {
  return (
    <Tag id={id} style={{
      fontFamily: RA_FONT_MONO, fontWeight: 500, fontSize: 11,
      letterSpacing: '0.12em', textTransform: 'uppercase', color,
      margin: 0, ...style,
    }}>{children}</Tag>
  );
}

function RALogo({ size = 22, fill = RA_C.teal, slashFill = RA_C.rust, ariaLabel = 'Roam Access' }) {
  return (
    <svg width={size * 4.18} height={size} viewBox="0 0 920 220" role="img" aria-label={ariaLabel} focusable="false">
      <title>{ariaLabel}</title>
      <g transform="translate(110,150)">
        <text fontFamily={RA_FONT_SANS} fontWeight="700" fontSize="110" fill={fill} letterSpacing="-5" x="0" y="0">roam</text>
        <text fontFamily={RA_FONT_SANS} fontWeight="700" fontSize="110" fill={slashFill} x="293" y="0">/</text>
        <text fontFamily={RA_FONT_SANS} fontWeight="700" fontSize="110" fill={fill} letterSpacing="-5" x="338" y="0">access</text>
      </g>
    </svg>
  );
}

function RASlash({ size = 14, color = RA_C.rust, style = {} }) {
  return (
    <span aria-hidden="true" style={{
      display: 'inline-block', fontFamily: RA_FONT_SANS, fontWeight: 700,
      fontSize: size, color, lineHeight: 1, letterSpacing: '-0.05em', ...style,
    }}>/</span>
  );
}

function RACatIcon({ name, size = 22, color = RA_C.teal }) {
  const s = size;
  const p = { stroke: color, strokeWidth: 1.8, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' };
  // Always decorative: every caller pairs the icon with a visible text label.
  const svg = { width: s, height: s, viewBox: '0 0 24 24', 'aria-hidden': 'true', focusable: 'false' };
  switch (name) {
    case 'mobility':
      return (<svg {...svg}><path d="M4 19h6l4-6 5 6" {...p}/><circle cx="9" cy="6" r="2.2" {...p}/></svg>);
    case 'vision':
      return (<svg {...svg}><circle cx="12" cy="12" r="3" {...p}/><path d="M2 12c3-5 7-7 10-7s7 2 10 7c-3 5-7 7-10 7s-7-2-10-7Z" {...p}/></svg>);
    case 'hearing':
      return (<svg {...svg}><path d="M7 12a5 5 0 1 1 10 0c0 4-4 4-4 7a2 2 0 0 1-4 0" {...p}/><path d="M4 7c1-2 3-3 5-3" {...p}/></svg>);
    case 'cognitive':
      return (<svg {...svg}><circle cx="12" cy="12" r="8" {...p}/><path d="M8 12h8M12 8v8" {...p}/></svg>);
    case 'mental':
      return (<svg {...svg}><path d="M5 16c-2-3 0-9 7-9s9 6 7 9c-1 2-4 3-7 3s-6-1-7-3Z" {...p}/><path d="M9 12c1-1 2-1 3 0 1-1 2-1 3 0" {...p}/></svg>);
    case 'autism':
      return (<svg {...svg}><path d="M12 3v18M3 12h18M5.5 5.5l13 13M18.5 5.5l-13 13" {...p}/></svg>);
    case 'chronic':
      return (<svg {...svg}><path d="M3 12c2-4 4-4 6 0s4 4 6 0 4-4 6 0" {...p}/></svg>);
    default: return null;
  }
}

function RAStatusBadge({ kind, compact = false, withDot = true }) {
  const map = {
    accessible:  { bg: RA_C.blueBg,  fg: RA_C.blue,  label: 'Accessible',           icon: '✓' },
    partial:     { bg: RA_C.amberBg, fg: RA_C.amber, label: 'Partially accessible', icon: '!' },
    notAccess:   { bg: RA_C.redBg,   fg: RA_C.red,   label: 'Not accessible',       icon: '✗' },
    unverified:  { bg: RA_C.unverBg, fg: RA_C.unver, label: 'Not yet verified',     icon: '?' },
  };
  const s = map[kind] || map.unverified;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      background: s.bg, color: s.fg,
      padding: compact ? '3px 9px' : '4px 11px',
      borderRadius: 999, fontSize: compact ? 11 : 12, fontWeight: 600,
      letterSpacing: 0.1, whiteSpace: 'nowrap',
    }}>
      {withDot && (
        <span aria-hidden="true" style={{
          width: 14, height: 14, borderRadius: 999, background: s.fg, color: s.bg,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 9, fontWeight: 800, fontFamily: RA_FONT_MONO, lineHeight: 1, flexShrink: 0,
        }}>{s.icon}</span>
      )}
      {s.label}
    </span>
  );
}

// ── Toggle ────────────────────────────────────────────────────────────────
// `presentational` renders the same switch shape as inert decoration. Several
// screens put a toggle inside a card that is itself the button; nesting a real
// control there would be invalid HTML and would give one setting two tab stops
// reporting two different states.
function RAToggle({ checked = false, onChange, label, presentational = false }) {
  const track = {
    width: 48, height: 30, borderRadius: 999,
    background: checked ? RA_C.teal : RA_C.paper,
    // The OFF state needs its own visible boundary — a pale track on pale paper
    // is a 1.2:1 edge, which is no edge at all.
    border: `2px solid ${checked ? RA_C.teal : RA_C.line}`,
    padding: 0, position: 'relative', cursor: presentational ? 'inherit' : 'pointer',
    transition: 'background-color .15s, border-color .15s',
    flexShrink: 0, boxSizing: 'border-box',
  };
  const knob = {
    position: 'absolute', top: 3, left: 3,
    width: 20, height: 20, borderRadius: 999,
    background: checked ? RA_C.paper : RA_C.line,
    transform: checked ? 'translateX(18px)' : 'translateX(0)',
    transition: 'transform .15s, background-color .15s',
  };

  if (presentational) {
    return (
      <span aria-hidden="true" style={{ ...track, display: 'inline-block' }}>
        <span style={knob} />
      </span>
    );
  }

  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label}
            onClick={onChange} style={track}>
      <span style={knob} />
    </button>
  );
}

function RABtn({ children, kind = 'primary', size = 'md', onClick, type = 'button', style = {}, fullWidth = false, disabled = false, ariaLabel, ariaDescribedBy }) {
  const base = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    gap: 8, fontFamily: RA_FONT_SANS, fontWeight: 600,
    fontSize: size === 'lg' ? 16 : size === 'sm' ? 13 : 15,
    minHeight: size === 'lg' ? 52 : size === 'sm' ? 40 : 44,
    padding: size === 'sm' ? '0 14px' : '0 18px',
    borderRadius: 10, border: '2px solid transparent',
    cursor: disabled ? 'not-allowed' : 'pointer',
    width: fullWidth ? '100%' : 'auto',
    transition: 'background-color .15s ease, color .15s ease, border-color .15s ease',
    boxSizing: 'border-box',
  };
  const styles = {
    primary: { background: RA_C.teal,  color: RA_C.paper, borderColor: RA_C.teal },
    rust:    { background: RA_C.rust,  color: RA_C.paper, borderColor: RA_C.rust },
    outline: { background: 'transparent', color: RA_C.teal, borderColor: RA_C.teal },
    ghost:   { background: 'transparent', color: RA_C.char, borderColor: RA_C.line },
    link:    { background: 'transparent', color: RA_C.teal, padding: 0, minHeight: 0, borderColor: 'transparent', textDecoration: 'underline', textUnderlineOffset: 4 },
  };
  // A blanket opacity:0.5 drags the label to ~2.6:1. Disabled still has to be
  // readable — it just must not read as available.
  const off = disabled ? { background: RA_C.stone, color: RA_C.slate, borderColor: RA_C.stone } : null;
  return (
    <button type={type} aria-label={ariaLabel} aria-describedby={ariaDescribedBy}
            disabled={disabled} onClick={onClick}
            style={{ ...base, ...styles[kind], ...off, ...style }}>
      {children}
    </button>
  );
}

// Image placeholder (subtle stripe pattern, monospace label)
function RAPlate({ w = '100%', h = 120, label, style = {} }) {
  return (
    <div aria-hidden="true" style={{
      width: w, height: h, borderRadius: 12,
      background:
        `repeating-linear-gradient(135deg, ${RA_C.hair} 0 1px, transparent 1px 14px), ${RA_C.stone}`,
      display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-start',
      padding: 12, color: RA_C.slate, fontFamily: RA_FONT_MONO, fontSize: 11,
      letterSpacing: 0.08, textTransform: 'uppercase', boxSizing: 'border-box',
      flexShrink: 0,
      ...style,
    }}>{label}</div>
  );
}

function RACard({ children, style = {}, padding = 20, hairline = true }) {
  return (
    <div style={{
      background: RA_C.paper,
      border: hairline ? `1px solid ${RA_C.hair}` : 'none',
      borderRadius: 16, padding,
      ...style,
    }}>{children}</div>
  );
}

// Tappable category chip
function RACatChip({ id, label, active = false, onToggle, size = 'md' }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={active}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        minHeight: size === 'sm' ? 36 : 40, padding: '0 12px',
        fontSize: size === 'sm' ? 12.5 : 13.5, fontWeight: 600,
        borderRadius: 999, cursor: 'pointer',
        background: active ? RA_C.teal : RA_C.paper,
        color: active ? RA_C.paper : RA_C.char,
        border: `1.5px solid ${active ? RA_C.teal : RA_C.line}`,
        boxSizing: 'border-box',
      }}
    >
      <RACatIcon name={id} size={14} color={active ? RA_C.paper : RA_C.teal}/>
      {label}
    </button>
  );
}

// Honest framing for anything the pilot shows but does not actually do.
function RAPilotNote({ children, style = {} }) {
  return (
    <p style={{
      margin: 0, fontFamily: RA_FONT_MONO, fontSize: 10.5,
      letterSpacing: '0.08em', textTransform: 'uppercase',
      color: RA_C.slate, ...style,
    }}>{children}</p>
  );
}

Object.assign(window, {
  RA_C, RA_FONT_SANS, RA_FONT_MONO, RA_INPUT_FONT, RASetContrast,
  RAScore, RAScoreTone,
  RAEyebrow, RALogo, RASlash, RACatIcon, RAStatusBadge, RAToggle, RABtn,
  RAPlate, RACard, RACatChip, RAPilotNote,
});
