// es — 'ds' namespace. Machine-translated unless the key is listed in
// ./_meta.ts → reviewed. Keep the same keys and {placeholders} as en/ds.ts.
import type { Translation } from '../../types';
import type en from '../en/ds';

const ds: Translation<typeof en> = {
  'ds.actions': "Acciones",
  'ds.dismiss': "Cerrar",
  'ds.removeFilter': "Quitar filtro: {name}",
  'ds.loadingPlaces': "Cargando lugares…",
  'ds.badge.fromReviews': { one: "Según {count} reseña", other: "Según {count} reseñas" },
  'ds.badge.community': "Reseñas de la comunidad",
  'ds.badge.osm': "OpenStreetMap · sin confirmar",
  'ds.badge.venue': "Dice el local",
  'ds.badge.partnerNamed': "Miembro de {name}",
  'ds.badge.partner': "Programa asociado",
  'ds.badge.photo': "Foto",
  'ds.freshness.last': "Confirmado por última vez {when}",
  'ds.freshness.never': "Aún sin confirmar",
  'ds.photo.open': "Abrir foto {n} de {total}: {kind}. {alt}",
  'ds.photo.count': "foto {n} de {total}",
  'ds.photo.close': "Cerrar foto",
  'ds.photo.prev': "Foto anterior",
  'ds.photo.next': "Foto siguiente",
  'ds.photo.fromReview': "De una reseña",
  'ds.photo.position': "Foto {n} de {total}: {kind}",
  'ds.photo.keysMany': "← → para moverte · Esc para cerrar",
  'ds.photo.keysOne': "Esc para cerrar",
  'ds.search.label': "Buscar lugares",
  'ds.search.clear': "Borrar búsqueda",
  'ds.search.voice': "Buscar por voz",
  'ds.search.submit': "Buscar",
  'ds.sheet.closeNamed': "Cerrar {title}",
  'ds.snap.peek': "contraída",
  'ds.snap.half': "media pantalla",
  'ds.snap.full': "pantalla completa",
  'ds.snap.expand': "ampliar",
  'ds.snap.collapse': "contraer",
  'ds.snap.announce': "{label}: {size}",
  'ds.snap.handle': "{label}: {size}. Pulsa para {action}; las flechas cambian el tamaño.",
};

export default ds;
