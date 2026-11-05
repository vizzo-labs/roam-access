'use client';
// Small building blocks for the access-layer screens, on the design system.

import React from 'react';
import { NPTM, CHANGING_PLACES_FINDER } from '@/lib/layers/defs';
import { C2 } from '../ui/palette';
import { facilitySvg } from '../PilotMap';
import { Badge, Banner, Chip, ListRow, SectionHeader, SPACE, TYPE } from '../ds';
import { useT } from '../i18n';
import { FACILITY_ICON } from './layerUtils';

// An inline text link that opens a new tab and says so. `lang` when the link
// text is a proper name or source title in English.
export function ExtLink({ href, children, lang }) {
  const t = useT();
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: C2.teal, fontWeight: 600 }}>
      <span lang={lang}>{children}</span><span className="ra-sr-only"> {t('common.opensNewTab')}</span>
    </a>
  );
}

// Render a translated sentence with {placeholders} filled by React nodes
// (links). `parts` maps placeholder names to nodes.
export function withParts(text, parts) {
  return text.split(/(\{\w+\})/g).map((seg, i) => {
    const m = /^\{(\w+)\}$/.exec(seg);
    return m && parts[m[1]] !== undefined ? <React.Fragment key={i}>{parts[m[1]]}</React.Fragment> : seg;
  });
}

export function SectionHead({ children, sub, id }) {
  return <SectionHeader id={id} title={children} description={sub} style={{ marginTop: SPACE.xl }}/>;
}

// The square facility pin, same as on the map (decorative).
export function FacilityPin({ f, size = 26 }) {
  return (
    <span aria-hidden="true" style={{ lineHeight: 0 }} dangerouslySetInnerHTML={{ __html: facilitySvg({
      w: size, icon: FACILITY_ICON[f.kind] || 'water',
      muted: f.kind === 'toilet' && !f.details?.accessible && !f.details?.adultChange,
    }) }}/>
  );
}

// One facility in a List: pin, name, distance, tags, today's problem.
// `tagsLang` marks tags that come from the source in English.
export function FacilityRow({ app, f, subtitle, tags = [], alert = null, tagsLang }) {
  const meta = (tags.length || alert) ? (
    <span style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {alert && <Badge tone="warn" size="sm">{alert}</Badge>}
      {tags.map(x => <Chip key={x} style={{ minHeight: 28, padding: '3px 10px', fontSize: 13, whiteSpace: 'normal', flexShrink: 1 }}><span lang={tagsLang}>{x}</span></Chip>)}
    </span>
  ) : null;
  return (
    <ListRow title={f.name} subtitle={subtitle} meta={meta} leading={<FacilityPin f={f}/>}
      onClick={() => app.goto('facility', f.id)} padX={SPACE.md}/>
  );
}

export function ToiletAttribution({ facilityUrl }) {
  const t = useT();
  return (
    <p style={{ ...TYPE.footnote, color: C2.slate, lineHeight: 1.55, margin: `${SPACE.lg}px 0 0` }}>
      {withParts(t('layers.attr.toilets'), {
        map: <ExtLink href={NPTM.siteUrl} lang="en-AU">{NPTM.name}</ExtLink>,
        owner: <span lang="en-AU">{NPTM.owner}</span>,
        licence: <ExtLink href={NPTM.licenceUrl} lang="en-AU">{NPTM.licence}</ExtLink>,
      })}{' '}
      {facilityUrl
        ? withParts(t('layers.attr.wrong'), { link: <ExtLink href={facilityUrl}>{t('layers.attr.update')}</ExtLink> })
        : withParts(t('layers.attr.more'), { link: <ExtLink href={CHANGING_PLACES_FINDER}>{t('layers.attr.finder')}</ExtLink> })}
    </p>
  );
}

// "Listed by … — not yet confirmed by the community."
export function ListedNote({ children, style }) {
  return <Banner tone="neutral" style={{ marginBottom: SPACE.md, ...style }}>{children}</Banner>;
}
