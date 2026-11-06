// Public summary (/v/[id]) · "Getting there" (I1): which door to use and
// directions to it in Google Maps or Apple Maps. No login, so no photo (photos
// are private) and no names — who marked it is not shown here at all.
import { compass, directionsUrl, distanceM, entranceLast, roundM, routable, type EntranceVM } from '@/lib/arrival/entrances';
import { auDate } from '@/lib/data/summary';

const TITLE: Record<EntranceVM['kind'], string> = {
  main: 'Step-free main entrance', side: 'Step-free entrance at the side', back: 'Step-free entrance at the back',
  lift: 'Step-free way in via a lift', other: 'Step-free entrance through another door',
};
const SHORT: Record<EntranceVM['kind'], string> = { main: 'main door', side: 'side', back: 'back', lift: 'lift', other: 'another door' };
const DIR: Record<string, string> = { n: 'north', ne: 'north-east', e: 'east', se: 'south-east', s: 'south', sw: 'south-west', w: 'west', nw: 'north-west' };

type Place = { name: string; lat: number; lng: number };

export function GettingTherePublic({ venue, entrance }: { venue: Place; entrance: EntranceVM | null }) {
  const go = routable(entrance) ? entrance : null;
  const where = entrance && entrance.lat != null && entrance.lng != null
    ? (() => {
      const p = { lat: entrance.lat, lng: entrance.lng };
      const m = distanceM(venue, p);
      return m < 3 ? 'On the street address.' : `About ${roundM(m)} m ${DIR[compass(venue, p)]} of the street address.`;
    })()
    : null;
  return (
    <>
      <h2>Getting there</h2>
      <div className="pub-card">
        {entrance ? (
          <>
            <p style={{ margin: 0, fontWeight: 700 }}>{TITLE[entrance.kind]}</p>
            {where && <p className="pub-muted" style={{ margin: '4px 0 0' }}>{where}</p>}
            {entrance.note && <p style={{ margin: '8px 0 0' }}>“{entrance.note}”</p>}
            <p className="pub-muted" style={{ margin: '8px 0 0' }}>
              {entrance.source === 'community'
                ? <>Marked by someone in the Roam Access pilot on {auDate(new Date(entrance.at))}.
                  {entrance.yes > 0 && <> Still the way in for {entrance.yes} more {entrance.yes === 1 ? 'person' : 'people'} (latest {auDate(new Date(entranceLast(entrance)))}).</>}</>
                : <>From OpenStreetMap — not yet confirmed.</>}
            </p>
            {entrance.status === 'changed' && entrance.lastChanged && (
              <p style={{ margin: '8px 0 0' }}><strong>This may have changed:</strong> someone said so on {auDate(new Date(entrance.lastChanged))}. The directions below go to the street address.</p>
            )}
          </>
        ) : (
          <p style={{ margin: 0 }}>Nobody has marked the step-free entrance yet. Map apps take you to the street address.</p>
        )}
        {go && <Links title={`Directions to the step-free entrance (${SHORT[go.kind]})`} to={go} primary/>}
        <Links title="Directions to the street address" to={venue} primary={!go}/>
      </div>
    </>
  );
}

function Links({ title, to, primary }: { title: string; to: { lat: number; lng: number }; primary: boolean }) {
  return (
    <>
      <p style={{ margin: '16px 0 0', fontWeight: 700 }}>{title}:</p>
      <div className="pub-actions" style={{ marginTop: 8 }}>
        {(['google', 'apple'] as const).map((app, i) => (
          <a key={app} className={`pub-btn${primary && i === 0 ? ' primary' : ''}`} href={directionsUrl(app, to)} target="_blank" rel="noopener">
            <span className="ra-sr-only">{title} in </span>{app === 'google' ? 'Google Maps' : 'Apple Maps'}
            <span className="ra-sr-only"> (opens in a new tab)</span>
          </a>
        ))}
      </div>
    </>
  );
}
