// Getting there — the slot API. Each later stage of "Getting there" (nearby
// accessible parking, transport stops, step-by-step arrival…) adds ONE entry
// here, in its own file, instead of editing GettingThere.jsx:
//
//   import { ParkingNearby } from './ParkingNearby';
//   export const ARRIVAL_SLOTS = [
//     { id: 'parking', Component: ParkingNearby },
//   ];
//
// GettingThere renders the entrance block first, then each slot in order:
//   <Component app={app} venue={venue} arrival={arrival}/>
// where `arrival` is:
//   entrances    every entrance for the place, best first (EntranceVM[], see
//                lib/arrival/entrances.ts) — [] while loading or if none
//   entrance     the one directions use (community-marked, has a point, not
//                reported "Changed"), or null
//   directions   directionsFor(): { href, entranceHref, addressHref, app,
//                appName, toEntrance, label, ariaLabel, … } in the person's
//                chosen maps app
//   destination  { lat, lng } where step-by-step guidance should end: the
//                entrance when there is one, else the street address
//   needs        the person's access needs (ids)
//
// A slot renders its own <section> with an <h3> (Getting there is the <h2>),
// returns null when it has nothing to say, and follows the same rules as the
// rest of the app: design-system components, t() for every string, sources
// and recency on every fact, never a verdict.
import { ArrivalNearby } from './ArrivalNearby';
import { ArrivalSteps } from './ArrivalSteps';

export const ARRIVAL_SLOTS = [
  // Getting there 2 (I2): nearest accessible parking, drop-off, stop or
  // wharf and toilet; then the community's step-by-step arrival.
  { id: 'nearby', Component: ArrivalNearby },
  { id: 'steps', Component: ArrivalSteps },
];
