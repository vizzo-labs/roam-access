'use client';

import React from 'react';
import { C2, F2 } from '../ui/palette';
import { Icon } from './Icon';
import { RADIUS, TARGET, transition } from './tokens';

// Arrow-key movement shared by both widgets (roving tabindex: one Tab stop,
// arrows move between options, Home/End jump to the ends).
function useRoving(count, index, select) {
  const refs = React.useRef([]);
  const onKeyDown = (e) => {
    const keys = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    let next = null;
    if (e.key in keys) next = (index + keys[e.key] + count) % count;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = count - 1;
    if (next === null) return;
    e.preventDefault();
    select(next);
    refs.current[next]?.focus();
  };
  return { refs, onKeyDown };
}

// SegmentedControl — pick ONE of 2–4 views/modes (List · Map). A radiogroup:
// selecting is immediate and doesn't move focus elsewhere. Selected = a paper
// "thumb" with a teal outline + bold text, never colour alone. Each option is
// a full 44px target.
//   <SegmentedControl label="Show results as" value={mode} onChange={setMode}
//     options={[{ value: 'list', label: 'List', icon: 'list' }, { value: 'map', label: 'Map', icon: 'map' }]}/>
function SegmentedControl({ label, options, value, onChange, full = false, style }) {
  const index = Math.max(0, options.findIndex(o => o.value === value));
  const { refs, onKeyDown } = useRoving(options.length, index, i => onChange(options[i].value));
  return (
    <div role="radiogroup" aria-label={label} onKeyDown={onKeyDown} style={{
      display: full ? 'flex' : 'inline-flex', padding: 3, gap: 2, boxSizing: 'border-box',
      background: C2.stone, borderRadius: RADIUS.pill, border: `1.5px solid ${C2.line}`, ...style,
    }}>
      {options.map((o, i) => {
        const on = i === index;
        return (
          <button key={o.value} ref={el => { refs.current[i] = el; }} type="button" role="radio"
            aria-checked={on} tabIndex={on ? 0 : -1} onClick={() => onChange(o.value)}
            className={on ? undefined : 'ds-press'}
            style={{
              flex: full ? '1 1 0' : '0 0 auto', minWidth: 0, minHeight: TARGET.min, padding: full ? '6px 12px' : '0 16px', borderRadius: RADIUS.pill,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              fontFamily: F2, fontSize: 15, fontWeight: on ? 700 : 600, cursor: 'pointer',
              // `full`: long labels (other languages, 150% text) wrap instead of running off the edge.
              whiteSpace: full ? 'normal' : 'nowrap', textAlign: 'center', lineHeight: 1.2,
              background: on ? C2.paper : 'transparent', color: on ? C2.teal : C2.char,
              border: on ? `2px solid ${C2.teal}` : '2px solid transparent',
              boxShadow: on ? '0 1px 3px rgba(26,26,26,0.12)' : 'none',
              transition: transition(['background-color', 'border-color'], 'fast'),
            }}>
            {o.icon && <Icon name={o.icon} size={18}/>}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

// Tabs — switch between panels of content on one screen (Reviews · Photos ·
// Details). role=tablist with automatic activation; render the panel with
// <TabPanel> using the same idBase.
//   <Tabs idBase="venue" label="Venue sections" tabs={[{ id: 'reviews', label: 'Reviews', count: 4 }, …]} value={tab} onChange={setTab}/>
//   <TabPanel idBase="venue" id="reviews" active={tab === 'reviews'}>…</TabPanel>
function Tabs({ idBase, label, tabs, value, onChange, style }) {
  const index = Math.max(0, tabs.findIndex(t => t.id === value));
  const { refs, onKeyDown } = useRoving(tabs.length, index, i => onChange(tabs[i].id));
  return (
    <div role="tablist" aria-label={label} onKeyDown={onKeyDown} className="ds-scroll-x"
      style={{ display: 'flex', gap: 4, borderBottom: `1px solid ${C2.hair}`, ...style }}>
      {tabs.map((t, i) => {
        const on = i === index;
        return (
          <button key={t.id} ref={el => { refs.current[i] = el; }} type="button" role="tab"
            id={`${idBase}-tab-${t.id}`} aria-controls={`${idBase}-panel-${t.id}`}
            aria-selected={on} tabIndex={on ? 0 : -1} onClick={() => onChange(t.id)} className="ds-press"
            style={{
              flexShrink: 0, minHeight: TARGET.std, padding: '0 14px', background: 'transparent', border: 0,
              borderBottom: `3px solid ${on ? C2.teal : 'transparent'}`, borderRadius: `${RADIUS.sm}px ${RADIUS.sm}px 0 0`,
              fontFamily: F2, fontSize: 15.5, fontWeight: on ? 700 : 600, color: on ? C2.teal : C2.slate,
              cursor: 'pointer', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 6,
            }}>
            {t.label}
            {typeof t.count === 'number' && (
              <span style={{ fontSize: 13, fontWeight: 700, padding: '1px 7px', borderRadius: RADIUS.pill, background: on ? C2.tealSoft : C2.stone, color: on ? C2.teal : C2.char }}>
                <span className="ra-sr-only">, </span>{t.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function TabPanel({ idBase, id, active, children, style }) {
  return (
    <div role="tabpanel" id={`${idBase}-panel-${id}`} aria-labelledby={`${idBase}-tab-${id}`}
      hidden={!active} tabIndex={0} style={style}>
      {active && children}
    </div>
  );
}

export { SegmentedControl, Tabs, TabPanel };
