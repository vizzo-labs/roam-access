'use client';
// Map layers: "Accessible toilets" and "Beach access" as toggle chips
// (aria-pressed), with the layer's pin shown as its key. The list
// equivalents are the Toilets and Beach access screens.

import React from 'react';
import { C2 } from '../ui/palette';
import { facilitySvg } from '../PilotMap';
import { Button, ChipGroup, FilterChip, RADIUS, SPACE, TYPE, elevation } from '../ds';
import { useT } from '../i18n';
import { FACILITY_ICON } from './layerUtils';
import { arrivalName } from '../arrival/nearbyUtils';

export const LAYERS = [
  { id: 'toilets', label: 'layers.toggle.toilets', icon: 'toilet' },
  { id: 'beach', label: 'layers.toggle.beach', icon: 'water' },
  // Getting there 2 (I2): accessible parking, drop-off, accessible stops, wharves (OpenStreetMap).
  { id: 'arrival', label: 'layers.toggle.arrival', icon: 'parking' },
];

const pin = icon => (
  <span aria-hidden="true" style={{ lineHeight: 0, display: 'inline-flex' }} dangerouslySetInnerHTML={{ __html: facilitySvg({ w: 16, icon }) }}/>
);

export function LayerToggles({ shown, onChange, forced = {}, style = {} }) {
  const t = useT();
  return (
    <div style={{
      position: 'absolute', zIndex: 3, background: C2.paper, border: `1px solid ${C2.line}`, borderRadius: RADIUS.md,
      padding: `${SPACE.xs}px ${SPACE.sm}px ${SPACE.sm}px`, ...elevation(1), ...style,
    }}>
      <p style={{ ...TYPE.overline, color: C2.slate, margin: `2px 0 ${SPACE.xs}px` }}>{t('layers.toggle.title')}</p>
      <ChipGroup label={t('layers.toggle.title')} wrap style={{ flexDirection: 'column', alignItems: 'stretch' }}>
        {LAYERS.map(l => {
          const locked = !!forced[l.id];
          const on = !!shown[l.id] || locked;
          return (
            <FilterChip key={l.id} selected={on}
              onChange={sel => { if (!locked) onChange(l.id, sel); }}
              aria-disabled={locked || undefined}
              style={{ justifyContent: 'flex-start' }}>
              {!on && pin(l.icon)}{!on && ' '}{t(l.label)}
              {locked && <span className="ra-sr-only"> {t('layers.toggle.locked')}</span>}
            </FilterChip>
          );
        })}
      </ChipGroup>
      <p style={{ ...TYPE.caption, fontWeight: 400, color: C2.slate, margin: `${SPACE.xs}px 0 0`, maxWidth: 190, display: 'flex', gap: 6, alignItems: 'flex-start' }}>
        {pin('toilet')}<span>{t('layers.toggle.squarePins')}</span>
      </p>
    </div>
  );
}

// Facility markers for the map from what's switched on. Pass `t` (useT())
// so the pins' accessible names are in the reader's language.
export function layerExtras(layers, { forced = {}, t } = {}) {
  const on = id => !!layers.shown[id] || !!forced[id];
  return layers.facilities
    .filter(f => on(f.layer))
    .map(f => ({
      id: f.id, lat: f.lat, lng: f.lng,
      icon: FACILITY_ICON[f.kind] || 'water',
      muted: f.kind === 'toilet' && !f.details?.accessible && !f.details?.adultChange,
      label: facilityAria(f, t),
    }));
}

const ARIA_EN = {
  'layers.pin.changingPlaces': 'Changing Places toilet', 'layers.pin.adultChange': 'toilet with adult change room',
  'layers.pin.accessible': 'accessible toilet', 'layers.pin.public': 'public toilet, not listed as accessible',
};
function facilityAria(f, t) {
  if (f.kind === 'toilet') {
    const d = f.details || {};
    const key = d.changingPlaces ? 'layers.pin.changingPlaces' : d.adultChange ? 'layers.pin.adultChange'
      : d.accessible ? 'layers.pin.accessible' : 'layers.pin.public';
    if (!t) return `${f.name}, ${ARIA_EN[key]}, listed on the National Public Toilet Map`;
    return t('layers.pin.toilet', { name: f.name, what: t(key) });
  }
  if (f.layer === 'arrival') {
    if (!t) return `${f.name}, ${f.kind.replace('_', ' ')}, from OpenStreetMap, not yet confirmed`;
    const what = t(`layers.kind.${f.kind}`);
    const name = arrivalName(t, f);
    return name === what ? t('layers.pin.arrivalUnnamed', { what }) : t('layers.pin.arrival', { name, what });
  }
  const kind = ['beach', 'liberty_swing', 'ferry', 'walk'].includes(f.kind) ? f.kind : 'unknown';
  if (!t) return `${f.name}, ${kind === 'unknown' ? 'access information' : kind.replace('_', ' ')}, listed by ${f.source}`;
  return t('layers.pin.other', { name: f.name, what: t(`layers.kind.${kind}`), source: f.source });
}

// Phones: one "Layers" button that opens the toggles.
export function LayerMenu({ shown, onChange, style = {} }) {
  const t = useT();
  const [open, setOpen] = React.useState(false);
  const count = LAYERS.filter(l => shown[l.id]).length;
  return (
    <div style={{ position: 'absolute', zIndex: 4, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: SPACE.xs, ...style }}>
      <Button size="sm" variant={count ? 'secondary' : 'outline'} icon="sliders" aria-expanded={open} aria-controls="ra-layer-menu"
        onClick={() => setOpen(o => !o)} style={{ borderRadius: RADIUS.pill, ...elevation(2) }}>
        {count ? t('layers.toggle.menuOn', { count }) : t('layers.toggle.menu')}
      </Button>
      {open && (
        <div id="ra-layer-menu">
          <LayerToggles shown={shown} onChange={onChange} style={{ position: 'relative' }}/>
        </div>
      )}
    </div>
  );
}
