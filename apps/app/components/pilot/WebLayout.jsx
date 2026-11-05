'use client';
// The pilot as a web app (≥ 960px): header with navigation, the app's screens
// in a side panel, and a live map of the pilot area beside them — the panel
// and the map stay in sync (pin → venue in the panel; venue → pin selected).

import { PilotMap, MapLegend } from './PilotMap';
import { V2Logo } from './legacy';

export const PIN = {
  colors: { works: '#1E5F8B', check: '#854D0E', barrier: '#9C2D0E', unknown: '#475569' },
  icons: { works: '✓', check: '!', barrier: '✗', unknown: '?' },
  labels: { works: 'Works for you', check: 'Check first', barrier: 'Has barriers', unknown: 'No info yet' },
};

const NAV = [
  { id: 'home', label: 'Explore', views: ['home', 'voice', 'results', 'map', 'venue', 'reviews', 'review', 'thanks'] },
  { id: 'saved', label: 'Saved', views: ['saved'] },
  { id: 'me', label: 'Me', views: ['me', 'setup', 'setup-name'] },
];

function Header({ children }) {
  return (
    <header className="web-head">
      {children}
    </header>
  );
}

export function WebLayout({ app, mapResults, mapFit = true, selectedId, children }) {
  const active = NAV.find(n => n.views.includes(app.view))?.id;
  const initial = (app.user?.name || 'You').charAt(0).toUpperCase();
  const kinds = [...new Set(mapResults.map(r => r.verdict.kind))];
  return (
    <div className="web-app">
      <Header>
        <button className="web-brand" onClick={() => app.goto('home')} aria-label="Roam Access — Explore">
          <V2Logo size={30}/>
        </button>
        <span className="web-tag">Pilot · Manly &amp; surrounds</span>
        {app.user?.done && (
          <nav className="web-nav" aria-label="Primary">
            {NAV.map(n => (
              <button key={n.id} onClick={() => app.goto(n.id)} aria-current={active === n.id ? 'page' : undefined}>{n.label}</button>
            ))}
          </nav>
        )}
        <div className="web-actions">
          {app.installable && app.canPromptInstall && (
            <button className="web-btn outline" onClick={app.install}>Install app</button>
          )}
          <button className="web-btn outline" onClick={app.openA11y}>Accessibility</button>
          <button className="web-avatar" onClick={() => app.goto('me')} aria-label="Your profile">{initial}</button>
        </div>
      </Header>
      <div className="web-body">
        <div className="web-panel">{children}</div>
        <section className="web-map" aria-label="Map of places in the pilot area">
          <PilotMap results={mapResults} selectedId={selectedId} onSelect={id => app.goto('venue', id)}
            origin={app.origin} colors={PIN.colors} icons={PIN.icons} labels={PIN.labels} topPad={70} bottomPad={40} fit={mapFit}
            onLocate={app.locateFromMap} onLocateError={app.locateError} autoLocate={app.origin.mine}/>
          <MapLegend kinds={kinds} colors={PIN.colors} icons={PIN.icons} labels={PIN.labels} style={{ top: 16, left: 16 }}/>
        </section>
      </div>
    </div>
  );
}

// Signed out on a big screen: the welcome screen in the panel, the pilot
// area on the map, and a plain statement of what this is.
export function WebWelcome({ origin, signIn, children }) {
  return (
    <div className="web-app">
      <Header>
        <span className="web-brand" aria-hidden="true"><V2Logo size={30}/></span>
        <span className="web-tag">Pilot · Manly &amp; surrounds</span>
        <div className="web-actions">
          <button className="web-btn outline" onClick={signIn}>Sign in</button>
        </div>
      </Header>
      <div className="web-body">
        <div className="web-panel">{children}</div>
        <section className="web-map" aria-label="Map of the pilot area: Manly and surrounds">
          <PilotMap results={[]} selectedId={null} onSelect={() => {}} origin={origin}
            colors={PIN.colors} icons={PIN.icons} labels={PIN.labels}/>
          <div className="web-hero">
            <strong>Real places. Real access.</strong>
            Cafes, beaches, ocean pools and more around Manly — rated by people with lived
            experience of disability, for every kind of need.
          </div>
        </section>
      </div>
    </div>
  );
}
