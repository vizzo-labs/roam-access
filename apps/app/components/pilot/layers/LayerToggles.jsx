'use client';
// Map layer switches: "Accessible toilets" and "Beach access". Each row is
// one real role="switch" (≥ 44px), with the layer's pin as its key. The list
// equivalents are the Toilets and Beach access screens.

import React from 'react';
import { facilitySvg } from '../PilotMap';
import { FACILITY_ICON } from './layerUtils';

const PAPER = '#FAF9F6', CHAR = '#1A1A1A', TEAL = '#0A4F4F', LINE = '#8A8680', SLATE = '#5A5651';

export const LAYERS = [
  { id: 'toilets', label: 'Accessible toilets', icon: 'toilet' },
  { id: 'beach', label: 'Beach access', icon: 'water' },
];

export function LayerToggles({ shown, onChange, forced = {}, style = {}, compact = false }) {
  return (
    <div role="group" aria-label="Map layers" style={{
      position: 'absolute', zIndex: 3, background: PAPER, border: `1px solid ${LINE}`, borderRadius: 12,
      padding: compact ? '4px 8px' : '6px 10px', display: 'flex', flexDirection: compact ? 'row' : 'column', gap: compact ? 4 : 0,
      font: '600 13.5px Inter, system-ui, sans-serif', color: CHAR, boxShadow: '0 4px 14px rgba(26,26,26,0.10)', ...style,
    }}>
      {!compact && <span style={{ fontSize: 11.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: SLATE, padding: '4px 2px 2px' }}>Layers</span>}
      {LAYERS.map(l => {
        const on = !!shown[l.id] || !!forced[l.id];
        const locked = !!forced[l.id];
        return (
          <button key={l.id} type="button" role="switch" aria-checked={on} aria-disabled={locked || undefined}
            onClick={() => { if (!locked) onChange(l.id, !shown[l.id]); }}
            title={locked ? 'Shown while you’re on this list' : undefined}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, minHeight: 44, padding: '0 4px',
              background: 'transparent', border: 0, cursor: locked ? 'default' : 'pointer',
              font: 'inherit', color: CHAR, textAlign: 'left',
            }}>
            <span aria-hidden="true" style={{ lineHeight: 0 }} dangerouslySetInnerHTML={{ __html: facilitySvg({ w: 18, icon: l.icon }) }}/>
            <span style={{ flex: 1, whiteSpace: 'nowrap' }}>{l.label}{locked && <span className="ra-sr-only"> (always shown on this list)</span>}</span>
            <span aria-hidden="true" style={{
              width: 38, height: 22, borderRadius: 999, position: 'relative', flexShrink: 0, boxSizing: 'border-box',
              background: on ? TEAL : PAPER, border: `2px solid ${on ? TEAL : LINE}`,
            }}>
              <span style={{
                position: 'absolute', top: 2, left: on ? 18 : 2, width: 14, height: 14, borderRadius: 999,
                background: on ? PAPER : LINE,
              }}/>
            </span>
          </button>
        );
      })}
    </div>
  );
}

// Facility markers for the map from what's switched on.
export function layerExtras(layers, { forced = {}, onlyAccessible = false } = {}) {
  const on = id => !!layers.shown[id] || !!forced[id];
  return layers.facilities
    .filter(f => on(f.layer))
    .filter(f => !onlyAccessible || f.kind !== 'toilet' || f.details?.accessible)
    .map(f => ({
      id: f.id, lat: f.lat, lng: f.lng,
      icon: FACILITY_ICON[f.kind] || 'water',
      muted: f.kind === 'toilet' && !f.details?.accessible && !f.details?.adultChange,
      label: facilityAria(f),
    }));
}

function facilityAria(f) {
  if (f.kind === 'toilet') {
    const d = f.details || {};
    const what = d.changingPlaces ? 'Changing Places toilet' : d.adultChange ? 'toilet with adult change room'
      : d.accessible ? 'accessible toilet' : 'public toilet, not listed as accessible';
    return `${f.name}, ${what}, listed on the National Public Toilet Map`;
  }
  const kind = { beach: 'beach access', liberty_swing: 'Liberty Swing', ferry: 'ferry wharf', walk: 'accessible walk' }[f.kind] || 'access information';
  return `${f.name}, ${kind}, listed by ${f.source}`;
}

// Phones: one 48px "Layers" button that opens the switches.
export function LayerMenu({ shown, onChange, style = {} }) {
  const [open, setOpen] = React.useState(false);
  const count = LAYERS.filter(l => shown[l.id]).length;
  return (
    <div style={{ position: 'absolute', zIndex: 4, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, ...style }}>
      <button type="button" aria-expanded={open} aria-controls="ra-layer-menu" onClick={() => setOpen(o => !o)} style={{
        minHeight: 48, padding: '0 14px', borderRadius: 999, cursor: 'pointer',
        border: `1.5px solid ${count ? TEAL : LINE}`, background: count ? '#F0F5F5' : PAPER, color: count ? TEAL : CHAR,
        font: '700 14.5px Inter, system-ui, sans-serif', display: 'inline-flex', alignItems: 'center', gap: 8,
        boxShadow: '0 4px 14px rgba(26,26,26,0.12)',
      }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
          <path d="m12 3 9 5-9 5-9-5 9-5ZM3 13l9 5 9-5" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
        </svg>
        Layers{count ? ` (${count} on)` : ''}
      </button>
      {open && (
        <div id="ra-layer-menu" style={{ position: 'relative' }}>
          <LayerToggles shown={shown} onChange={onChange} style={{ position: 'relative' }}/>
        </div>
      )}
    </div>
  );
}
