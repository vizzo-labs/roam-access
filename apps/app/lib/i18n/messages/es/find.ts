// es — 'find' namespace. Machine-translated unless the key is listed in
// ./_meta.ts → reviewed. Keep the same keys and {placeholders} as en/find.ts.
import type { Translation } from '../../types';
import type en from '../en/find';

const find: Translation<typeof en> = {
  'find.title': "Buscar un lugar",
  'find.lead': "Lugares en Manly, revisados por personas con necesidades como las tuyas.",
  'find.search.label': "Busca un lugar o un tipo de lugar",
  'find.search.placeholder': "Café, playa, Hugos…",
  'find.browse': "Explorar",
  'find.nearMe': "Cerca de mí ahora",
  'find.toilets': "Baños",
  'find.prompt': "¿Fuiste a {name}? Cuéntanos qué tal.",
  'find.promptHint': "Un toque. Ayuda a personas con necesidades como las tuyas.",
  'find.near.title': "Cerca de ti",
  'find.near.list': "Lugares cerca de ti",
  'find.walkingFrom': "Caminando desde {origin}.",
  'find.seeAll': { one: "Ver {count} lugar", other: "Ver los {count} lugares" },
  'find.row.name': "{name}, {kind}, {walk}, {verdict}",
  'find.row.beFirst': "¿Has estado aquí? Sé la primera persona",
  'find.results.back': "Atrás",
  'find.results.backLabel': "Volver a Buscar",
  'find.results.srFor': "Resultados de búsqueda para {query}.",
  'find.filters.nearest': "Lo más cerca primero",
  'find.filters.more': "Más filtros",
  'find.filters.moreOn': { one: "{count} activo", other: "{count} activos" },
  'find.more.lead': "Los filtros solo acortan la lista. Nunca cambian un veredicto.",
  'find.more.hideBarriers': "Ocultar lugares con barreras",
  'find.more.show': { one: "Mostrar {count} lugar", other: "Mostrar {count} lugares" },
  'find.showAs': "Ver como",
  'find.showMore': "Mostrar {n} más (quedan {rest})",
  'find.empty.body': "Prueba con un tipo de lugar, como café o playa.",
  'find.empty.seeAll': "Ver todos los lugares",
};

export default find;
