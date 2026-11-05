'use client';
// /ds — every design-system component in every state, with the app's own
// accessibility settings (high contrast, reduced motion, text size) as live
// switches, and a contrast table computed from the live palette.
// Sample places here are fictional on purpose: a demo must never show a real
// venue as "Works for you".

import React from 'react';
import { C2, F2, M2, RA2SetContrast } from '../ui/palette';
import { V2Logo } from '../ui/Logo';
import { V2Switch } from '../ui/Switch';
import { V2Verdict } from '../ui/Verdict';
import {
  TYPE, SPACE, RADIUS, TARGET, DURATION, TONES, tone, elevation, contrastRatio, GUTTER,
  Icon, ICON_NAMES, Button, IconButton, Card, Chip, FilterChip, RemovableChip, ChipGroup,
  Badge, SourceBadge, Freshness, List, ListRow, SectionHeader,
  Skeleton, SkeletonList, SkeletonCard, EmptyState, Banner, ActionRow,
  SegmentedControl, Tabs, TabPanel, Sheet, SnapSheet, PhotoGrid, PhotoViewer, ScreenHeader, SearchField,
} from './index';

const SAMPLE = [
  { id: 'a', name: 'Sample Café', kind: 'Cafe · 3 min walk', verdict: 'works', note: 'Step-free entry · Quiet mornings' },
  { id: 'b', name: 'Harbour Kiosk (sample)', kind: 'Takeaway · 5 min walk', verdict: 'check', note: 'Step-free (unconfirmed)' },
  { id: 'c', name: 'Example Gallery', kind: 'Gallery · 8 min walk', verdict: 'barrier', note: 'Two steps at the door' },
  { id: 'd', name: 'Demo Beach Pool', kind: 'Pool · 12 min walk', verdict: 'unknown', note: 'No reviews yet' },
];
const SAMPLE_PHOTOS = [
  { id: 'p1', src: '/icons/icon-512.png', thumb: '/icons/icon-192.png', kindLabel: 'Entrance', alt: 'Sample: wide level doorway with an automatic door', who: 'Wheelchair or mobility aid user', when: '2 days ago' },
  { id: 'p2', src: '/icons/maskable-512.png', thumb: '/icons/maskable-192.png', kindLabel: 'Toilet', alt: 'Sample: accessible toilet with grab rails on both sides', who: 'Person with chronic illness', when: '1 week ago' },
];
const daysAgo = n => new Date(Date.now() - n * 86400000);

function Section({ id, title, children, note }) {
  return (
    <section aria-labelledby={`ds-${id}`} style={{ scrollMarginTop: 80, padding: `${SPACE.xxl}px 0`, borderTop: `1px solid ${C2.hair}` }}>
      <h2 id={`ds-${id}`} style={{ ...TYPE.title2, margin: '0 0 6px' }}>{title}</h2>
      {note && <p style={{ ...TYPE.callout, color: C2.slate, margin: '0 0 20px', maxWidth: 760 }}>{note}</p>}
      {children}
    </section>
  );
}
function Row({ children, gap = 12, align = 'center', style }) {
  return <div style={{ display: 'flex', flexWrap: 'wrap', gap, alignItems: align, marginBottom: 16, ...style }}>{children}</div>;
}
function Label({ children }) {
  return <p style={{ ...TYPE.overline, color: C2.slate, margin: '18px 0 8px' }}>{children}</p>;
}
function Phone({ children, height = 640, label }) {
  return (
    <div role="group" aria-label={label} style={{
      width: 390, maxWidth: '100%', height, position: 'relative', overflow: 'hidden',
      border: `1.5px solid ${C2.line}`, borderRadius: 28, background: C2.paper,
    }}>{children}</div>
  );
}
function FauxMap() {
  return (
    <div aria-hidden="true" style={{
      position: 'absolute', inset: 0,
      background: `repeating-linear-gradient(35deg, #E4E1D9 0 2px, transparent 2px 46px), repeating-linear-gradient(-55deg, #E4E1D9 0 2px, transparent 2px 60px), #EFECE4`,
    }}>
      <div style={{ position: 'absolute', right: -40, top: 80, width: 220, height: 380, borderRadius: '50%', background: '#C9D3D6' }}/>
      {[[70, 120, C2.blue], [150, 200, C2.amber], [220, 90, C2.red], [120, 300, '#475569']].map(([x, y, c], i) => (
        <span key={i} style={{ position: 'absolute', left: x, top: y, width: 26, height: 26, borderRadius: '50% 50% 50% 0', transform: 'rotate(-45deg)', background: c, border: `2px solid ${C2.paper}` }}/>
      ))}
    </div>
  );
}

export function DsPreview() {
  const [, force] = React.useReducer(x => x + 1, 0);
  const [contrast, setContrast] = React.useState(false);
  const [motion, setMotion] = React.useState(false);
  const [scale, setScale] = React.useState('1');

  React.useEffect(() => {
    RA2SetContrast(contrast);
    document.documentElement.dataset.raContrast = contrast ? 'high' : '';
    force();
  }, [contrast]);
  React.useEffect(() => { document.documentElement.dataset.raMotion = motion ? 'reduce' : ''; }, [motion]);
  React.useEffect(() => () => { RA2SetContrast(false); delete document.documentElement.dataset.raContrast; delete document.documentElement.dataset.raMotion; }, []);

  // Demo state
  const [chips, setChips] = React.useState({ works: true, food: false, quiet: false, toilet: false });
  const [removed, setRemoved] = React.useState([]);
  const [saved, setSaved] = React.useState(false);
  const [selected, setSelected] = React.useState('a');
  const [mode, setMode] = React.useState('list');
  const [tab, setTab] = React.useState('reviews');
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [snap, setSnap] = React.useState('half');
  const [loading, setLoading] = React.useState(true);
  const [banner, setBanner] = React.useState(true);
  const [photoAt, setPhotoAt] = React.useState(null);
  const closePhoto = React.useCallback(() => setPhotoAt(null), []);
  const [toggled, setToggled] = React.useState(false);
  const [searchText, setSearchText] = React.useState('');

  const pairs = [
    ['Body text', C2.char, C2.paper], ['Secondary text', C2.slate, C2.paper], ['Secondary on stone', C2.slate, C2.stone],
    ['Teal on paper', C2.teal, C2.paper], ['Paper on teal', C2.paper, C2.teal], ['Paper on rust', C2.paper, C2.rust],
    ...TONES.map(t => [`${t} tone`, tone(t).fg, tone(t).bg]),
    ['Boundary: line on paper', C2.line, C2.paper, 3], ['Boundary: line on stone', C2.line, C2.stone, 3],
  ];

  return (
    <div style={{ minHeight: '100vh', background: C2.paper, color: C2.char, fontFamily: F2 }}>
      <a className="ra-skip" href="#ds-main">Skip to components</a>
      <header className="ds-preview-head" style={{
        zIndex: 50, background: C2.paper, borderBottom: `1px solid ${C2.hair}`,
        padding: `${SPACE.sm}px ${GUTTER}px`, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: SPACE.md,
      }}>
        <V2Logo size={24}/>
        <span style={{ fontFamily: M2, fontSize: 12, letterSpacing: '.14em', textTransform: 'uppercase', color: C2.slate }}>Design system</span>
        <div style={{ marginLeft: 'auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: SPACE.lg }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, fontSize: 15 }}>
            <V2Switch checked={contrast} onChange={() => setContrast(c => !c)} label="Higher contrast"/> Higher contrast
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, fontSize: 15 }}>
            <V2Switch checked={motion} onChange={() => setMotion(m => !m)} label="Reduce motion"/> Reduce motion
          </label>
          <SegmentedControl label="Text size" value={scale} onChange={setScale}
            options={[{ value: '1', label: '100%' }, { value: '1.25', label: '125%' }, { value: '1.5', label: '150%' }, { value: '2', label: '200%' }]}/>
        </div>
      </header>

      <main id="ds-main" tabIndex={-1} style={{ zoom: Number(scale), maxWidth: 1080, margin: '0 auto', padding: `${SPACE.xl}px ${GUTTER}px 120px` }}>
        <h1 style={{ ...TYPE.display, margin: '0 0 8px' }}>Roam Access design system<span style={{ color: C2.rust }}>.</span></h1>
        <p style={{ ...TYPE.body, color: C2.slate, maxWidth: 720, margin: '0 0 8px' }}>
          Components live in <code>apps/app/components/pilot/ds/</code>. Every colour reads the live <code>C2</code> palette, so
          the switches above show exactly what testers see. Docs: <code>AGENTS.md</code> → “UI components”.
        </p>

        <Section id="contrast" title="Contrast (live)" note="Computed from the current palette. Text needs 4.5:1, boundaries of controls 3:1 (WCAG 2.2 AA). Flip “Higher contrast” to see the high-contrast values.">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 10 }}>
            {pairs.map(([name, fg, bg, min = 4.5]) => {
              const r = contrastRatio(fg, bg);
              const ok = r >= min;
              return (
                <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10, border: `1px solid ${C2.hair}`, borderRadius: RADIUS.md }}>
                  <span aria-hidden="true" style={{ width: 44, height: 44, borderRadius: RADIUS.sm, background: bg, color: fg, border: `1px solid ${C2.hair}`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>Aa</span>
                  <span style={{ flex: 1, fontSize: 14 }}>
                    <span style={{ display: 'block', fontWeight: 600 }}>{name}</span>
                    <span style={{ fontFamily: M2, fontSize: 13, color: C2.slate }}>{fg} / {bg}</span>
                  </span>
                  <Badge tone={ok ? 'success' : 'danger'} size="sm">{r.toFixed(2)}{ok ? '' : ' fail'}</Badge>
                </div>
              );
            })}
          </div>
        </Section>

        <Section id="tokens" title="Tokens" note="Type scale (nothing under 13px; inputs 16px), 4-based spacing, radii, elevation (becomes a 2px border in high contrast), motion durations (0 when motion is reduced), target sizes.">
          <Label>Type</Label>
          {Object.entries(TYPE).filter(([k]) => k !== 'input').map(([k, t]) => (
            <div key={k} style={{ display: 'flex', alignItems: 'baseline', gap: 16, padding: '6px 0' }}>
              <span style={{ fontFamily: M2, fontSize: 13, color: C2.slate, width: 90, flexShrink: 0 }}>{k} {t.fontSize}</span>
              <span style={{ ...t, color: C2.char }}>Find places that work for you</span>
            </div>
          ))}
          <Label>Spacing</Label>
          <Row align="flex-end">
            {Object.entries(SPACE).map(([k, v]) => (
              <span key={k} style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 4, fontFamily: M2, fontSize: 13, color: C2.slate }}>
                <span aria-hidden="true" style={{ width: v, height: v, background: C2.teal, borderRadius: 2 }}/>{k} {v}
              </span>
            ))}
          </Row>
          <Label>Radii · elevation</Label>
          <Row gap={16}>
            {Object.entries(RADIUS).map(([k, v]) => (
              <span key={k} style={{ width: 84, height: 64, borderRadius: Math.min(v, 32), border: `1.5px solid ${C2.line}`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: M2, fontSize: 13 }}>{k}</span>
            ))}
            {[0, 1, 2, 3].map(l => (
              <span key={l} style={{ width: 110, height: 64, borderRadius: RADIUS.lg, background: C2.paper, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: M2, fontSize: 13, border: l ? 0 : `1px solid ${C2.hair}`, ...elevation(l) }}>elevation {l}</span>
            ))}
          </Row>
          <p style={{ ...TYPE.footnote, color: C2.slate, margin: 0 }}>
            Motion: fast {DURATION.fast}ms · base {DURATION.base}ms · slow {DURATION.slow}ms. Targets: min {TARGET.min} · std {TARGET.std} · lg {TARGET.lg} · xl {TARGET.xl}px.
          </p>
          <Label>Icons (always decorative — the control names the action)</Label>
          <Row gap={14}>
            {ICON_NAMES.map(n => (
              <span key={n} style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 4, width: 72, fontSize: 13, color: C2.slate }}>
                <span style={{ color: C2.char }}><Icon name={n} size={24}/></span>{n}
              </span>
            ))}
          </Row>
        </Section>

        <Section id="button" title="Button" note="A link when it navigates (href), a button when it acts. External links say “opens in a new tab” to screen readers. Sizes: sm 44 · md 52 · lg 60px.">
          {['primary', 'secondary', 'outline', 'ghost', 'plain', 'danger', 'rust'].map(v => (
            <Row key={v}>
              <span style={{ fontFamily: M2, fontSize: 13, width: 90, color: C2.slate }}>{v}</span>
              <Button variant={v} size="sm">Small</Button>
              <Button variant={v} icon="directions">Directions</Button>
              <Button variant={v} size="lg" iconRight="forward">Continue</Button>
              <Button variant={v} disabled>Disabled</Button>
            </Row>
          ))}
          <Row>
            <Button variant="outline" href="https://www.openstreetmap.org" external icon="external">OpenStreetMap (link)</Button>
            <div style={{ width: 320 }}><Button full size="lg">Full width</Button></div>
          </Row>
        </Section>

        <Section id="iconbutton" title="IconButton" note="Icon-only controls always have a label naming the thing (“Save Sample Café”). `pressed` makes a toggle (aria-pressed); the fill reinforces it.">
          {['outline', 'filled', 'tonal', 'ghost', 'floating'].map(v => (
            <Row key={v}>
              <span style={{ fontFamily: M2, fontSize: 13, width: 90, color: C2.slate }}>{v}</span>
              <IconButton variant={v} size="sm" icon="back" label="Back"/>
              <IconButton variant={v} icon="search" label="Search"/>
              <IconButton variant={v} size="lg" icon="locate" label="Show my location"/>
              <IconButton variant={v} shape="square" icon="sliders" label="Filters"/>
              <IconButton variant={v} icon="close" label="Close (disabled)" disabled/>
            </Row>
          ))}
          <Row>
            <IconButton icon="bookmark" pressed={saved} onClick={() => setSaved(s => !s)} label="Save Sample Café"/>
            <span style={{ fontSize: 15 }}>Toggle: {saved ? 'saved' : 'not saved'}</span>
            <span style={{ background: C2.teal, padding: 10, borderRadius: RADIUS.md }} data-ra-oncolor="">
              <IconButton variant="onColor" icon="close" label="Close on teal"/>
            </span>
          </Row>
        </Section>

        <Section id="card" title="Card" note="Static by default; onClick/href makes the whole card ONE control (spans inside). Operable cards get a ≥ 3:1 border. `selected` adds a 2px teal ring.">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
            {['outline', 'filled', 'tint', 'raised', 'brand'].map(v => (
              <Card key={v} variant={v}>
                <p style={{ ...TYPE.overline, margin: '0 0 6px', color: v === 'brand' ? C2.paper : C2.slate }}>{v}</p>
                <p style={{ ...TYPE.headline, margin: 0 }}>Static card</p>
                <p style={{ ...TYPE.footnote, margin: '4px 0 0', color: v === 'brand' ? C2.paper : C2.slate }}>Content and its own buttons can go here.</p>
              </Card>
            ))}
            <Card onClick={() => setToggled(t => !t)} selected={toggled} aria-pressed={toggled}>
              <span style={{ ...TYPE.headline, display: 'block' }}>Interactive card</span>
              <span style={{ ...TYPE.footnote, display: 'block', color: C2.slate, marginTop: 4 }}>Click to toggle selected ({toggled ? 'on' : 'off'})</span>
            </Card>
            <Card variant="raised" padding={SPACE.md} media={
              <svg role="img" aria-label="Sample photo: a level entrance with an automatic door" viewBox="0 0 320 140" width="100%" height="140" style={{ display: 'block', background: '#D9E4E4' }}>
                <rect x="120" y="30" width="80" height="110" fill="#9DB7B7"/><rect x="0" y="128" width="320" height="12" fill="#B9C6C6"/>
              </svg>
            }>
              <SourceBadge source="photo" count={3}/>
              <p style={{ ...TYPE.headline, margin: '8px 0 0' }}>Card with media</p>
            </Card>
          </div>
        </Section>

        <Section id="chips" title="Chips" note="FilterChip is a toggle (aria-pressed) — selected shows a check mark, not just colour. Rows scroll sideways (thin visible scrollbar) or wrap.">
          <ChipGroup label="Filter places">
            <FilterChip selected={chips.works} onChange={v => setChips(c => ({ ...c, works: v }))} icon="success" count={12}>Works for me</FilterChip>
            <FilterChip selected={chips.food} onChange={v => setChips(c => ({ ...c, food: v }))}>Food &amp; drink</FilterChip>
            <FilterChip selected={chips.quiet} onChange={v => setChips(c => ({ ...c, quiet: v }))}>Quiet</FilterChip>
            <FilterChip selected={chips.toilet} onChange={v => setChips(c => ({ ...c, toilet: v }))}>Accessible toilet</FilterChip>
            <FilterChip disabled>Open now (soon)</FilterChip>
            <FilterChip>Parks &amp; beaches</FilterChip><FilterChip>Arts &amp; culture</FilterChip><FilterChip>Places to stay</FilterChip>
          </ChipGroup>
          <Label>Applied filters (removable)</Label>
          <ChipGroup label="Applied filters" wrap>
            {['Cafés', 'Step-free', 'Quiet'].filter(x => !removed.includes(x)).map(x => (
              <RemovableChip key={x} onRemove={() => setRemoved(r => [...r, x])}>{x}</RemovableChip>
            ))}
            {removed.length > 0 && <Button variant="plain" size="sm" onClick={() => setRemoved([])}>Reset</Button>}
          </ChipGroup>
          <Label>Static chips (needs, tags)</Label>
          <ChipGroup label="Static chips" wrap>
            <Chip>Wheelchair access</Chip><Chip tone="teal" icon="check">Calm spaces</Chip>
            <Chip outline>Seats and rest spots</Chip><Chip tone="info">Hearing loop</Chip>
          </ChipGroup>
        </Section>

        <Section id="badge" title="Badge · SourceBadge · Freshness" note="SourceBadge says where a fact comes from — presentation only, never a verdict. OpenStreetMap is always “unconfirmed”. Dates read 6 November 2026.">
          <Row>{TONES.map(t => <Badge key={t} tone={t}>{t}</Badge>)}<Badge tone="success" size="sm">small</Badge></Row>
          <Row>
            <SourceBadge source="community" count={3} date={daysAgo(12)}/>
            <SourceBadge source="community" count={1}/>
            <SourceBadge source="osm"/>
            <SourceBadge source="venue"/>
            <SourceBadge source="partner" name="Companion Card"/>
            <SourceBadge source="photo" count={2}/>
          </Row>
          <Row>
            <Freshness date={daysAgo(0)}/><Freshness date={daysAgo(20)}/><Freshness date={daysAgo(400)} tone="warn"/><Freshness/>
          </Row>
          <Label>Verdict (existing ui/Verdict — unchanged)</Label>
          <Row>{['works', 'check', 'barrier', 'unknown'].map(k => <V2Verdict key={k} kind={k}/>)}</Row>
        </Section>

        <Section id="list" title="List · ListRow" note="A real list. Whole row = one target (≥ 56px). `selected` (map sync) = tint + 4px teal bar. `after` puts a separate control beside the row.">
          <div style={{ maxWidth: 480, border: `1.5px solid ${C2.hair}`, borderRadius: RADIUS.lg, overflow: 'hidden' }}>
            <List label="Sample places">
              {SAMPLE.map(p => (
                <ListRow key={p.id} title={p.name} subtitle={p.kind} meta={p.note}
                  trailing={<V2Verdict kind={p.verdict}/>} chevron={false}
                  selected={selected === p.id} aria-current={selected === p.id ? 'true' : undefined}
                  onClick={() => setSelected(p.id)}/>
              ))}
            </List>
          </div>
          <Label>Inset group · settings rows · with a control beside</Label>
          <div style={{ maxWidth: 480 }}>
            <List inset label="Settings">
              <ListRow leading={<Icon name="a11y" size={22}/>} title="Accessibility settings" subtitle="Text size · contrast · motion" onClick={() => {}} padX={16}/>
              <ListRow leading={<Icon name="globe" size={22}/>} title="Privacy policy" href="https://roamaccess.com.au/privacy.html" external padX={16}/>
              <ListRow title="Sample Café" subtitle="Saved 3 days ago" onClick={() => {}} padX={16} chevron={false}
                after={<IconButton icon="bookmark" pressed label="Remove Sample Café from saved" size="sm"/>}/>
              <ListRow title="Static row" subtitle="Not operable" dense padX={16}/>
            </List>
          </div>
        </Section>

        <Section id="section" title="SectionHeader" note="A real heading (h2 by default) + optional description + ONE action with a full name.">
          <div style={{ maxWidth: 480 }}>
            <SectionHeader title="Community reviews" description="From people with access needs like yours"
              action={{ label: 'See all', ariaLabel: 'See all 12 community reviews', onClick: () => {} }}/>
            <SectionHeader overline="Before you go" title="Check first" size="sm" level={3}/>
          </div>
        </Section>

        <Section id="skeleton" title="Skeleton" note="Holds the layout while loading. One “Loading…” status is announced; shapes are hidden from screen readers; the shimmer stops with reduced motion.">
          <Row><Button size="sm" variant="ghost" onClick={() => setLoading(l => !l)}>{loading ? 'Show loaded content' : 'Show loading state'}</Button></Row>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
            <div style={{ border: `1.5px solid ${C2.hair}`, borderRadius: RADIUS.lg, overflow: 'hidden' }}>
              {loading ? <SkeletonList count={3} label="Loading sample places…"/> : (
                <List label="Sample places (loaded)">
                  {SAMPLE.slice(0, 3).map(p => <ListRow key={p.id} title={p.name} subtitle={p.kind} trailing={<V2Verdict kind={p.verdict}/>} chevron={false}/>)}
                </List>
              )}
            </div>
            <div>{loading ? <SkeletonCard media/> : <Card variant="raised"><p style={{ ...TYPE.headline, margin: 0 }}>Loaded card</p></Card>}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }} aria-hidden="true">
              <Skeleton width="70%" height={28}/><Skeleton width="40%"/><Skeleton height={90} radius={RADIUS.lg}/>
            </div>
          </div>
        </Section>

        <Section id="empty" title="EmptyState" note="Nothing to show + ONE next step. Never a dead end.">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
            <Card><EmptyState icon="search" title="No places match all your filters" body="Try removing “Quiet” — 8 more places would show." action={{ label: 'Remove “Quiet”', onClick: () => {} }} secondary={{ label: 'Clear all filters', onClick: () => {} }}/></Card>
            <Card><EmptyState icon="bookmark" title="Nothing saved yet" body="Save places that work for you and find them here, even offline." action={{ label: 'Explore places', icon: 'search', onClick: () => {} }}/></Card>
            <Card><EmptyState compact icon="users" title="No reviews yet" body="Been here? Your review is the first data point." action={{ label: 'Share your experience', onClick: () => {} }}/></Card>
          </div>
        </Section>

        <Section id="banner" title="Banner" note="Inline messages: icon + words. live='polite' when it appears after an action; 'assertive' only for blocking errors; false for static notes.">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 560 }}>
            <Banner tone="info" title="Walking times are from Manly Wharf">Use your location for times from where you are.</Banner>
            <Banner tone="success" title="Review sent">Thanks — it now counts towards this place’s verdict.</Banner>
            <Banner tone="warn" title="Not yet confirmed">This comes from OpenStreetMap. Check before you go.</Banner>
            <Banner tone="danger" title="Couldn’t send your review" action={{ label: 'Try again', onClick: () => {} }}>Check your connection — nothing was lost.</Banner>
            <Banner tone="offline" title="You’re offline">Saved places still show; reviews will load when you’re back.</Banner>
            {banner && <Banner tone="teal" title="New: filter by what works for you" onDismiss={() => setBanner(false)} dismissLabel="Dismiss tip">Tap “Works for me” above the list.</Banner>}
          </div>
        </Section>

        <Section id="photos" title="PhotoGrid · PhotoViewer" note="Review photos. Each thumbnail is one button named with its position, kind and description. The viewer is a modal dialog: focus in, trapped and restored; Esc closes; ← → move; the description is shown as text too.">
          <PhotoGrid photos={SAMPLE_PHOTOS} onOpen={setPhotoAt}/>
          <PhotoViewer photos={SAMPLE_PHOTOS} index={photoAt} onIndex={setPhotoAt} onClose={closePhoto}/>
          <Row><SourceBadge source="photo">With photo</SourceBadge></Row>
        </Section>

        <Section id="actionrow" title="ActionRow" note="Venue quick actions in a fixed order. Leave out what doesn’t apply (no phone → no Call); don’t disable.">
          <div style={{ maxWidth: 440 }}>
            <ActionRow label="Actions for Sample Café" actions={[
              { id: 'dir', label: 'Directions', icon: 'directions', primary: true, href: 'https://www.google.com/maps', external: true, ariaLabel: 'Directions to Sample Café (opens Google Maps)' },
              { id: 'call', label: 'Call', icon: 'phone', href: 'tel:+61200000000', ariaLabel: 'Call Sample Café' },
              { id: 'web', label: 'Website', icon: 'globe', href: 'https://example.com', external: true, ariaLabel: 'Sample Café website (opens in a new tab)' },
              { id: 'save', label: saved ? 'Saved' : 'Save', icon: 'bookmark', pressed: saved, onClick: () => setSaved(s => !s), ariaLabel: 'Save Sample Café' },
              { id: 'share', label: 'Share', icon: 'share', onClick: () => {}, ariaLabel: 'Share Sample Café' },
            ]}/>
          </div>
        </Section>

        <Section id="tabs" title="SegmentedControl · Tabs" note="SegmentedControl = pick one mode (radiogroup, arrow keys). Tabs = switch panels on one screen (tablist, arrow keys, Home/End).">
          <Row><SegmentedControl label="Show results as" value={mode} onChange={setMode} options={[{ value: 'list', label: 'List', icon: 'list' }, { value: 'map', label: 'Map', icon: 'map' }]}/></Row>
          <div style={{ maxWidth: 360, marginBottom: 20 }}>
            <SegmentedControl full label="Sort by" value={mode === 'map' ? 'near' : 'match'} onChange={v => setMode(v === 'near' ? 'map' : 'list')} options={[{ value: 'match', label: 'Best match' }, { value: 'near', label: 'Nearest' }]}/>
          </div>
          <div style={{ maxWidth: 480 }}>
            <Tabs idBase="ds-venue" label="Venue sections" value={tab} onChange={setTab}
              tabs={[{ id: 'reviews', label: 'Reviews', count: 4 }, { id: 'photos', label: 'Photos', count: 2 }, { id: 'details', label: 'Details' }]}/>
            {['reviews', 'photos', 'details'].map(id => (
              <TabPanel key={id} idBase="ds-venue" id={id} active={tab === id} style={{ padding: '16px 0' }}>
                <p style={{ ...TYPE.body, margin: 0 }}>The {id} panel.</p>
              </TabPanel>
            ))}
          </div>
        </Section>

        <Section id="header" title="ScreenHeader · SearchField" note="ScreenHeader: Back always top-left (48px, “Back to …”), optional actions top-right, then the screen’s one h1. SearchField: a real search form — Back, Clear, mic, and a Search button once the text changed; Enter submits; the whole pill shows focus.">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
            <Card padding={0}>
              <ScreenHeader title="Sample Café" dot back={{ label: 'Back to results', onClick: () => {} }}
                actions={<IconButton icon="share" label="Share Sample Café"/>}
                subtitle="Cafe · 3 min walk" style={{ paddingBottom: 16 }}/>
            </Card>
            <Card padding={0}>
              <ScreenHeader compact title="Sample Café reviews" back={{ label: 'Back to Sample Café', onClick: () => {} }}
                subtitle="4 reviews from the pilot" style={{ paddingBottom: 16 }}/>
            </Card>
          </div>
          <div style={{ maxWidth: 420, marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <SearchField id="ds-search-1" value={searchText} onChange={setSearchText} onSubmit={() => {}} onVoice={() => {}}
              placeholder="Try “quiet cafe with step-free entry”"/>
            <SearchField id="ds-search-2" value="Food & drink" onChange={() => {}} dirty={false} onVoice={() => {}} floating
              back={{ label: 'Back to home', onClick: () => {} }}/>
          </div>
        </Section>

        <Section id="sheet" title="Sheet (modal) · SnapSheet (persistent)" note="Sheet: focus trapped, Escape / close button / scrim / drag-down close it, focus returns. Bottom sheet on phones, dialog from 960px. SnapSheet: peek · half · full over a map; the handle is a button (click, Enter, Arrow keys) and the new size is announced.">
          <Row><Button icon="sliders" onClick={() => setSheetOpen(true)}>Open filters sheet</Button></Row>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'flex-start' }}>
            <Phone label="SnapSheet example (phone frame)">
              <FauxMap/>
              <div style={{ position: 'absolute', top: 12, left: 12, right: 12, display: 'flex', gap: 8, zIndex: 5 }}>
                <div style={{ flex: 1, minHeight: 48, borderRadius: RADIUS.pill, background: C2.paper, border: `1.5px solid ${C2.line}`, display: 'flex', alignItems: 'center', gap: 10, padding: '0 16px', ...elevation(2), fontSize: 16, color: C2.slate }}>
                  <Icon name="search" size={20}/> Search places
                </div>
                <IconButton variant="floating" icon="locate" label="Show my location"/>
              </div>
              <SnapSheet label="Places" snap={snap} onSnapChange={setSnap}
                header={<p style={{ ...TYPE.headline, margin: 0 }}>4 sample places <span style={{ fontWeight: 400, color: C2.slate }}>· 1 works for you</span></p>}>
                <List label="Sample places in the sheet">
                  {[...SAMPLE, ...SAMPLE.map(p => ({ ...p, id: p.id + '2' }))].map(p => (
                    <ListRow key={p.id} title={p.name} subtitle={p.kind} trailing={<V2Verdict kind={p.verdict}/>} chevron={false} onClick={() => {}}/>
                  ))}
                </List>
              </SnapSheet>
            </Phone>
            <div style={{ maxWidth: 360 }}>
              <p style={{ ...TYPE.callout, margin: '0 0 12px' }}>Current size: <strong>{snap}</strong></p>
              <Row>
                {['peek', 'half', 'full'].map(s => <Button key={s} size="sm" variant={snap === s ? 'primary' : 'ghost'} onClick={() => setSnap(s)}>{s}</Button>)}
              </Row>
            </div>
          </div>
          <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Filters" description="Show places that fit."
            footer={<Button full size="lg" onClick={() => setSheetOpen(false)}>Show 12 places</Button>}>
            <SectionHeader title="Category" size="sm" level={3}/>
            <ChipGroup label="Category" wrap>
              <FilterChip selected>Food &amp; drink</FilterChip><FilterChip>Parks &amp; beaches</FilterChip><FilterChip>Arts &amp; culture</FilterChip><FilterChip>Places to stay</FilterChip>
            </ChipGroup>
            <SectionHeader title="Verdict" size="sm" level={3} style={{ marginTop: 20 }}/>
            <ChipGroup label="Verdict" wrap>
              <FilterChip selected icon="success">Works for me</FilterChip><FilterChip>Check first</FilterChip><FilterChip>Include barriers</FilterChip>
            </ChipGroup>
          </Sheet>
        </Section>
      </main>
    </div>
  );
}
