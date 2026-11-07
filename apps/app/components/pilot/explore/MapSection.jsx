'use client';

import React from 'react';
import { PilotMap } from '../PilotMap';
import { PIN, pinLabels } from '../WebLayout';
import { C2 } from '../ui/palette';
import { Button, GUTTER, RADIUS, SPACE, TYPE } from '../ds';
import { useT } from '../i18n';
import { PlacePreviewCard } from './PlacePreviewCard';
import { MapKeySheet } from './MapKeySheet';
import { invalidateGaps } from '../community/gapsStore';

const HEIGHT = 300;

// The map on phones: a VIEW of the list on Find, never the only way and never
// a whole screen. It shows the pins of the places in the list on screen (≤ 12,
// so ≤ 14 tab stops in the map), 48px category pins with the verdict mark,
// nudged apart where they'd overlap — no clusters. "Key" opens a dialog
// instead of a legend over the map; "Skip the map" (shown on focus) jumps to
// the list. A pin opens the place's card UNDER the map; Escape or its Close
// returns focus to the pin.
//   <MapSection app={app} places={rows} listHeadingId="map-list-h"/>
function MapSection({ app, places, listHeadingId }) {
  const t = useT();
  const [selId, setSelId] = React.useState(null);
  const [keyOpen, setKeyOpen] = React.useState(false);
  const mapApi = React.useRef(null);
  const cardRef = React.useRef(null);
  const sel = places.find(p => p.id === selId) || null;
  if (selId && !sel) setSelId(null); // its page moved on

  function select(id) {
    setSelId(id);
    requestAnimationFrame(() => cardRef.current?.focus());
  }
  function close() {
    const pin = mapApi.current?.pinEl(selId);
    setSelId(null);
    if (pin) requestAnimationFrame(() => pin.focus());
  }
  function skip(e) {
    e.preventDefault();
    document.getElementById(listHeadingId)?.focus();
  }

  return (
    <section aria-labelledby="map-h" style={{ padding: `0 ${GUTTER}px` }}>
      <h2 id="map-h" className="ra-sr-only">{t('find.map.title', { count: places.length })}</h2>
      <a href={`#${listHeadingId}`} onClick={skip} className="ra-skip-local">{t('find.map.skip')}</a>
      <div role="group" aria-label={t('find.map.region')} style={{
        position: 'relative', height: HEIGHT, borderRadius: RADIUS.lg, overflow: 'hidden', isolation: 'isolate',
        border: `1.5px solid ${C2.line}`,
      }}>
        <PilotMap results={places} selectedId={selId} onSelect={select} origin={app.origin}
          pinSize={48} spread attribution={false} apiRef={mapApi} onMapClick={() => sel && close()}
          colors={PIN.colors} icons={PIN.icons} labels={pinLabels(t)} topPad={72} bottomPad={24}
          onLocate={app.locateFromMap} onLocateError={app.locateError} autoLocate={app.origin.mine}
          locateStyle={{ right: 10, bottom: 10 }} alertIds={app.layers.alertIds}/>
        <Button size="sm" variant="outline" aria-haspopup="dialog" onClick={() => setKeyOpen(true)}
          style={{ position: 'absolute', left: 10, bottom: 10, zIndex: 6, minHeight: 48, boxShadow: '0 4px 14px rgba(26,26,26,0.14)' }}>
          {t('find.map.key')}
        </Button>
      </div>
      <p style={{ ...TYPE.caption, fontWeight: 400, color: C2.slate, margin: '6px 2px 0' }}>
        {t('find.map.credit')} <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" style={{ color: C2.slate }}>
          {t('find.map.creditOsm')}<span className="ra-sr-only"> {t('common.opensNewTab')}</span>
        </a>
      </p>

      {sel && (
        <div style={{ marginTop: SPACE.sm, padding: SPACE.sm, borderRadius: RADIUS.lg, border: `2px solid ${C2.teal}`, background: C2.paper }}>
          <PlacePreviewCard ref={cardRef} variant="sheet" place={sel} needs={app.user?.needs || []}
            saved={app.world.saved.includes(sel.id)} onToggleSave={() => app.toggleSave(sel.id)}
            onClose={close} onDetails={() => app.goto('venue', sel.id)} onAddPhoto={() => app.goto('review', sel.id)}
            onAnswer={async (feature, answer) => {
              const ok = await app.answerQuick({ venueId: sel.id, feature, answer });
              if (ok) invalidateGaps();
              return ok;
            }}
            reports={app.layers.reportsFor('venue', sel.id)}
            onKeyDown={e => { if (e.key === 'Escape') { e.stopPropagation(); close(); } }}/>
        </div>
      )}
      <MapKeySheet open={keyOpen} onClose={() => setKeyOpen(false)}/>
    </section>
  );
}

export { MapSection };
