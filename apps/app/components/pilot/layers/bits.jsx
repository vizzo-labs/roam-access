'use client';
// Small building blocks for the access-layer screens.

import React from 'react';
import { NPTM, CHANGING_PLACES_FINDER } from '@/lib/layers/defs';
import { C2, F2 } from '../ui/palette';
import { facilitySvg } from '../PilotMap';
import { FACILITY_ICON } from './layerUtils';

export function ExtLink({ href, children, style = {} }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: C2.teal, fontWeight: 600, ...style }}>
      {children}<span className="ra-sr-only"> (opens in a new tab)</span>
    </a>
  );
}

export function SectionHead({ children, sub }) {
  return (
    <>
      <h2 style={{ fontSize: 18, fontWeight: 700, margin: '24px 0 4px', letterSpacing: '-0.01em', fontFamily: F2, color: C2.char }}>{children}</h2>
      {sub && <p style={{ fontSize: 14.5, color: C2.slate, margin: '0 0 12px', lineHeight: 1.45, fontFamily: F2 }}>{sub}</p>}
    </>
  );
}

// A toggle chip — a real button with aria-pressed, ≥ 44px tall.
export function Chip({ on, onClick, children }) {
  return (
    <button type="button" aria-pressed={on} onClick={onClick} style={{
      minHeight: 44, padding: '0 14px', borderRadius: 999, cursor: 'pointer', fontFamily: F2,
      fontSize: 14.5, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6,
      border: `${on ? 2.5 : 1.5}px solid ${on ? C2.teal : C2.line}`,
      background: on ? C2.tealSoft : C2.paper, color: on ? C2.teal : C2.char,
    }}>
      {on && <span aria-hidden="true">✓</span>}{children}
    </button>
  );
}

// One facility in a list: square pin (same as the map), name, meta, alert.
export function FacilityRow({ app, f, meta, tags = [], alert = null }) {
  return (
    <button type="button" onClick={() => app.goto('facility', f.id)} style={{
      width: '100%', textAlign: 'left', cursor: 'pointer', fontFamily: F2, boxSizing: 'border-box',
      display: 'flex', gap: 14, alignItems: 'flex-start', padding: 16, marginBottom: 10,
      background: C2.paper, border: `1.5px solid ${C2.line}`, borderRadius: 16,
    }}>
      <span aria-hidden="true" style={{ lineHeight: 0, marginTop: 2 }} dangerouslySetInnerHTML={{ __html: facilitySvg({
        w: 26, icon: FACILITY_ICON[f.kind] || 'water',
        muted: f.kind === 'toilet' && !f.details?.accessible && !f.details?.adultChange,
      }) }}/>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: 17, fontWeight: 700, color: C2.char, letterSpacing: '-0.01em' }}>{f.name}</span>
        <span style={{ display: 'block', fontSize: 14, color: C2.slate, marginTop: 2 }}>{meta}</span>
        {tags.length > 0 && (
          <span style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
            {tags.map(t => (
              <span key={t} style={{ fontSize: 13, fontWeight: 600, color: C2.char, background: C2.stone, borderRadius: 999, padding: '4px 10px' }}>{t}</span>
            ))}
          </span>
        )}
        {alert && <span style={{ display: 'block', fontSize: 14.5, fontWeight: 700, color: C2.char, marginTop: 8 }}>⚠ {alert}</span>}
      </span>
    </button>
  );
}

export function ToiletAttribution({ facilityUrl }) {
  return (
    <p style={{ fontSize: 13.5, color: C2.slate, lineHeight: 1.55, margin: '18px 0 0', fontFamily: F2 }}>
      Toilet details from the{' '}
      <ExtLink href={NPTM.siteUrl}>{NPTM.name}</ExtLink>, {NPTM.owner},{' '}
      licensed under <ExtLink href={NPTM.licenceUrl}>{NPTM.licence}</ExtLink>.
      {facilityUrl
        ? <> Something wrong? <ExtLink href={facilityUrl}>Update it on the Toilet Map</ExtLink>.</>
        : <> More Changing Places: <ExtLink href={CHANGING_PLACES_FINDER}>Changing Places finder</ExtLink>.</>}
    </p>
  );
}

export function ListedNote({ children }) {
  return (
    <p style={{
      display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 14.5, lineHeight: 1.45, color: C2.char,
      background: C2.stone, borderRadius: 14, padding: '12px 14px', margin: '0 0 14px', fontFamily: F2,
    }}>
      <span aria-hidden="true" style={{
        width: 20, height: 20, borderRadius: 999, background: '#475569', color: C2.paper, flexShrink: 0, marginTop: 1,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800,
      }}>i</span>
      <span>{children}</span>
    </p>
  );
}
