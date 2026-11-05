import { getOpenDataPlaces, openDataMeta } from '@/lib/data/open-data';

// Public, no sign-in: every pilot venue as A11yJSON PlaceInfo, ODbL.
// Each feature is a strict PlaceInfo; ?geojson=1 adds "type": "Feature" for
// GeoJSON tools (A11yJSON's schema doesn't allow that key).
export async function GET(req: Request) {
  const url = new URL(req.url);
  const places = await getOpenDataPlaces(url.origin);
  const geojson = url.searchParams.get('geojson') === '1';
  return Response.json(
    { type: 'FeatureCollection', ...openDataMeta(places.length), features: geojson ? places.map(p => ({ type: 'Feature', ...p })) : places },
    { headers: { 'Cache-Control': 'public, max-age=300, s-maxage=600', 'Access-Control-Allow-Origin': '*' } },
  );
}
