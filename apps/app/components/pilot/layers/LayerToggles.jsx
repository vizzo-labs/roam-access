'use client';
// Map layers: "Accessible toilets" and "Beach access" as toggle chips
// (aria-pressed), with the layer's pin shown as its key. The list
// equivalents are the Toilets and Beach access screens.

import React from 'react';
import { C2 } from '../ui/palette';
import { facilitySvg } from '../PilotMap';
import { Button, ChipGroup, FilterChip, RADIUS, SPACE, TYPE, elevation } from '../ds';
import { FACILITY_ICON } from './layerUtils';

export const LAYERS = [
  { id: 'toilets', label: 'Accessible toilets', icon: 'toilet' },
  { id: 'beach', label: 'Beach access', icon: 'water' },
];

const pin = icon => (
  <span aria-hidden="true" style={{ lineHeight: 0, display: 'inline-flex' }} dangerouslySetInnerHTML={{ __html: facilitySvg({ w: 16, icon }) }}/>
);

export function LayerToggles({ shown, onChange, forced = {}, style = {} }) {
  return (
    <div style={{
      position: 'absolute', zIndex: 3, background: C2.paper, border: `1px solid ${C2.line}`, borderRadius: RADIUS.md,
      padding: `${SPACE.xs}px ${SPACE.sm}px ${SPACE.sm}px`, ...elevation(1), ...style,
    }}>
      <p style={{ ...TYPE.overline, color: C2.slate, margin: `2px 0 ${SPACE.xs}px` }}>Map layers</p>
      <ChipGroup label="Map layers" wrap style={{ flexDirection: 'column', alignItems: 'stretch' }}>
        {LAYERS.map(l => {
          const locked = !!forced[l.id];
          const on = !!shown[l.id] || locked;
          return (
            <FilterChip key={l.id} selected={on}
              onChange={sel => { if (!locked) onChange(l.id, sel); }}
              aria-disabled={locked || undefined}
              style={{ justifyContent: 'flex-start' }}>
              {!on && pin(l.icon)}{!on && ' '}{l.label}
              {locked && <span className="ra-sr-only"> (always shown on this list)</span>}
            </FilterChip>
          );
        })}
      </ChipGroup>
      <p style={{ ...TYPE.caption, fontWeight: 400, color: C2.slate, margin: `${SPACE.xs}px 0 0`, maxWidth: 190, display: 'flex', gap: 6, alignItems: 'flex-start' }}>
        {pin('toilet')}<span>Square pins are listings, not verdicts.</span>
      </p>
    </div>
  );
}

// Facility markers for the map from what's switched on.
export function layerExtras(layers, { forced = {} } = {}) {
  const on = id => !!layers.shown[id] || !!forced[id];
  return layers.facilities
    .filter(f => on(f.layer))
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

// Phones: one "Layers" button that opens the toggles.
export function LayerMenu({ shown, onChange, style = {} }) {
  const [open, setOpen] = React.useState(false);
  const count = LAYERS.filter(l => shown[l.id]).length;
  return (
    <div style={{ position: 'absolute', zIndex: 4, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: SPACE.xs, ...style }}>
      <Button size="sm" variant={count ? 'secondary' : 'outline'} icon="sliders" aria-expanded={open} aria-controls="ra-layer-menu"
        onClick={() => setOpen(o => !o)} style={{ borderRadius: RADIUS.pill, ...elevation(2) }}>
        Layers{count ? ` (${count} on)` : ''}
      </Button>
      {open && (
        <div id="ra-layer-menu">
          <LayerToggles shown={shown} onChange={onChange} style={{ position: 'relative' }}/>
        </div>
      )}
    </div>
  );
}
