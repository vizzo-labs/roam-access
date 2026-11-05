// "Suggest a correction on OpenStreetMap": OSM's note form, opened at the
// place. Anyone can leave a note (no OSM account needed); OSM mappers then fix
// the base data. We never edit OSM on anyone's behalf.
export function osmNoteUrl(lat: number, lng: number) {
  const la = lat.toFixed(6), lo = lng.toFixed(6);
  return `https://www.openstreetmap.org/note/new?lat=${la}&lon=${lo}#map=19/${la}/${lo}`;
}
