'use client';
// The pilot as a web app (≥ 960px): header with navigation, the app's screens
// in a side panel, and a live map of the pilot area beside them — the panel
// and the map stay in sync (pin → venue in the panel; venue → pin selected).

import { PilotMap, MapLegend } from './PilotMap';
import { V2Logo } from './ui/Logo';
import { LayerToggles, layerExtras } from './layers/LayerToggles';
import { metres } from './layers/layerUtils';
import { useT } from './i18n';
import { MapPlacePreview } from './explore/MapPlacePreview';
import { UpdatesCount, UpdatesCountSr } from './owners/UpdatesCount';
import React from 'react';

export const PIN = {
  colors: { works: '#1E5F8B', check: '#854D0E', barrier: '#9C2D0E', unknown: '#475569' },
  icons: { works: '✓', check: '!', barrier: '✗', unknown: '?' },
};
// Verdict words for pins and the legend, in the app's language.
export const pinLabels = t => ({
  works: t('data.verdict.works'), check: t('data.verdict.check'),
  barrier: t('data.verdict.barrier'), unknown: t('data.verdict.unknown'),
});

const NAV = [
  { id: 'home', label: 'app.nav.explore', views: ['home', 'voice', 'results', 'map', 'venue', 'reviews', 'review', 'thanks', 'gaps'] },
  { id: 'saved', label: 'app.nav.saved', views: ['saved'] },
  { id: 'me', label: 'app.nav.me', views: ['me', 'setup', 'setup-name', 'card'] },
];

function Header({ children }) {
  return (
    <header className="web-head">
      {children}
    </header>
  );
}

export function WebLayout({ app, mapResults, mapFit = true, selectedId, hoverId = null, children }) {
  const t = useT();
  const labels = pinLabels(t);
  const active = NAV.find(n => n.views.includes(app.view))?.id;
  const initial = (app.user?.name || 'You').charAt(0).toUpperCase();
  const kinds = [...new Set(mapResults.map(r => r.verdict.kind))];
  // Access layers (F3): the toilets / beach lists always show their layer.
  const L = app.layers;
  const facility = app.view === 'facility' ? L.facilityById(app.selectedId) : null;
  const forced = {
    toilets: app.view === 'toilets' || facility?.layer === 'toilets',
    beach: app.view === 'beach' || facility?.layer === 'beach',
    arrival: facility?.layer === 'arrival',
  };
  const extras = layerExtras(L, { forced, t }).sort((a, b) => metres(app.origin, a) - metres(app.origin, b));
  const fitExtras = app.view === 'toilets' ? 12 : app.view === 'beach' ? true : false;

  // Place preview card (pin → card on the map; "See details" → the panel).
  // Closes when the panel navigates or its place leaves the map.
  const mapApi = React.useRef(null);
  const [previewId, setPreviewId] = React.useState(null);
  const preview = previewId ? mapResults.find(r => r.id === previewId) || null : null;
  const navKey = `${app.view}|${app.selectedId}`;
  const [shownNav, setShownNav] = React.useState(navKey);
  if (shownNav !== navKey) { setShownNav(navKey); if (previewId) setPreviewId(null); }
  if (previewId && !preview) setPreviewId(null);
  const closePreview = React.useCallback((returnFocus) => {
    const pin = returnFocus ? mapApi.current?.pinEl(previewId) : null;
    setPreviewId(null);
    if (pin) requestAnimationFrame(() => pin.focus());
  }, [previewId]);
  const onMapKey = (e) => { if (e.key === 'Escape' && previewId) closePreview(true); };
  return (
    <div className="web-app">
      <Header>
        <button className="web-brand" onClick={() => app.goto('home')} aria-label={t('app.web.brand')}>
          <V2Logo size={30}/>
        </button>
        <span className="web-tag">{t('app.web.tag')}</span>
        {app.user?.done && (
          <nav className="web-nav" aria-label={t('app.nav.primary')}>
            {NAV.map(n => (
              <button key={n.id} onClick={() => app.goto(n.id)} aria-current={active === n.id ? 'page' : undefined}>
                {t(n.label)}{n.id === 'saved' && <><UpdatesCount sr={false} count={app.unseenUpdates} style={{ marginLeft: 6 }}/><UpdatesCountSr count={app.unseenUpdates}/></>}
              </button>
            ))}
          </nav>
        )}
        <div className="web-actions">
          {app.installable && app.canPromptInstall && (
            <button className="web-btn outline" onClick={app.install}>{t('app.web.install')}</button>
          )}
          <button className="web-btn outline" onClick={app.openA11y}>{t('app.web.accessibility')}</button>
          <button className="web-avatar" onClick={() => app.goto('me')} aria-label={t('app.web.profile')}>{initial}</button>
        </div>
      </Header>
      <div className="web-body">
        <div className="web-panel">{children}</div>
        <section className="web-map" aria-label={t('app.web.mapLabel')} onKeyDown={onMapKey}>
          <PilotMap results={mapResults} selectedId={previewId || selectedId} hoverId={hoverId} onSelect={setPreviewId}
            apiRef={mapApi} onMapClick={() => previewId && closePreview(true)}
            origin={app.origin} colors={PIN.colors} icons={PIN.icons} labels={labels} topPad={70} bottomPad={40} fit={mapFit && !fitExtras}
            onLocate={app.locateFromMap} onLocateError={app.locateError} autoLocate={app.origin.mine}
            extras={extras} selectedExtraId={facility?.id || null} onSelectExtra={id => app.goto('facility', id)}
            fitExtras={fitExtras} alertIds={L.alertIds}/>
          <MapLegend compact kinds={kinds} colors={PIN.colors} icons={PIN.icons} labels={labels} style={{ top: 16, left: 16 }}/>
          <LayerToggles shown={L.shown} forced={forced} onChange={L.setShown} style={{ top: 76, right: 16 }}/>
          {preview && <MapPlacePreview key={preview.id} app={app} place={preview} mapApi={mapApi} onClose={closePreview}/>}
        </section>
      </div>
    </div>
  );
}

// Signed out on a big screen: the welcome screen in the panel, the pilot
// area on the map, and a plain statement of what this is.
export function WebWelcome({ origin, signIn, children }) {
  const t = useT();
  return (
    <div className="web-app">
      <Header>
        <span className="web-brand" aria-hidden="true"><V2Logo size={30}/></span>
        <span className="web-tag">{t('app.web.tag')}</span>
        <div className="web-actions">
          <button className="web-btn outline" onClick={signIn}>{t('app.web.signIn')}</button>
        </div>
      </Header>
      <div className="web-body">
        <div className="web-panel">{children}</div>
        <section className="web-map" aria-label={t('app.web.areaMapLabel')}>
          <PilotMap results={[]} selectedId={null} onSelect={() => {}} origin={origin}
            colors={PIN.colors} icons={PIN.icons} labels={pinLabels(t)}/>
          <div className="web-hero">
            <strong>{t('app.web.heroTitle')}</strong>
            {t('app.web.heroBody')}
          </div>
        </section>
      </div>
    </div>
  );
}
