// Palette, fonts and shared type styles for the pilot UI.

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

const V2_H1 = { fontWeight: 700, letterSpacing: '-0.025em', margin: 0, fontFamily: F2 };

export { C2_BASE, C2_NORMAL, C2_HIGH, C2, RA2SetContrast, F2, M2, RA2_INPUT_FONT, V2_H1 };
