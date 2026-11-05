// es — 'facts' namespace. Machine-translated unless the key is listed in
// ./_meta.ts → reviewed. Keep the same keys and {placeholders} as en/facts.ts.
import type { Translation } from '../../types';
import type en from '../en/facts';

const facts: Translation<typeof en> = {
  'facts.s.reports': { one: "{what} — {count} reporte", other: "{what} — {count} reportes" },
  'facts.quick.all': { one: " (respuesta rápida)", other: " (respuestas rápidas)" },
  'facts.quick.some': { one: " ({count} por respuesta rápida)", other: " ({count} por respuesta rápida)" },
  'facts.t.stepsMainEntrance': "Hay escalones en la entrada principal",
  'facts.s.stepMainAltEntrance': { one: "Escalón en la entrada principal, entrada sin escalones {where} — {count} reporte", other: "Escalón en la entrada principal, entrada sin escalones {where} — {count} reportes" },
  'facts.t.noStepFreeAtAll': "Hay escalones en la entrada y no hay otra entrada sin escalones",
  'facts.s.noStepFree': { one: "Sin entrada sin escalones — {count} reporte", other: "Sin entrada sin escalones — {count} reportes" },
  'facts.t.altEntrance': "Entrada sin escalones {where}",
  'facts.t.mixed': "Opiniones divididas sobre {label}: {yes} sí, {no} no",
  'facts.s.mixed': "Dividido: {label} — {yes} sí, {no} no",
  'facts.t.exp.works': { one: "{count} {who} dijo que le funcionó", other: "{count} {whoPlural} dijeron que les funcionó" },
  'facts.t.exp.check': { one: "{count} {who} se las arregló, pero con soluciones alternativas", other: "{count} {whoPlural} se las arreglaron, pero con soluciones alternativas" },
  'facts.t.exp.barrier': { one: "{count} {who} dijo que no le funcionó", other: "{count} {whoPlural} dijeron que no les funcionó" },
  'facts.s.exp.works': { one: "Funcionó para {need} — {count} persona", other: "Funcionó para {need} — {count} personas" },
  'facts.s.exp.check': { one: "Hicieron falta alternativas para {need} — {count} persona", other: "Hicieron falta alternativas para {need} — {count} personas" },
  'facts.s.exp.barrier': { one: "No funcionó para {need} — {count} persona", other: "No funcionó para {need} — {count} personas" },
  'facts.t.osm.stepfree.yes': "Figura en OpenStreetMap como accesible en silla de ruedas — la comunidad aún no lo ha confirmado",
  'facts.t.osm.stepfree.limited': "Figura en OpenStreetMap como parcialmente accesible en silla de ruedas — la comunidad aún no lo ha confirmado",
  'facts.t.osm.stepfree.no': "Figura en OpenStreetMap como no accesible en silla de ruedas — la comunidad aún no lo ha confirmado",
  'facts.t.osm.bathroom.yes': "Figura en OpenStreetMap como con baño accesible — la comunidad aún no lo ha confirmado",
  'facts.t.osm.bathroom.limited': "Figura en OpenStreetMap como con baño parcialmente accesible — la comunidad aún no lo ha confirmado",
  'facts.t.osm.bathroom.no': "Figura en OpenStreetMap como sin baño accesible — la comunidad aún no lo ha confirmado",
  'facts.t.osm.hearing.yes': "Figura en OpenStreetMap como con bucle magnético — la comunidad aún no lo ha confirmado",
  'facts.t.osm.hearing.limited': "Figura en OpenStreetMap como con bucle magnético parcial — la comunidad aún no lo ha confirmado",
  'facts.t.osm.hearing.no': "Figura en OpenStreetMap como sin bucle magnético — la comunidad aún no lo ha confirmado",
  'facts.s.osm.stepfree.yes': "Sin escalones (sin confirmar)",
  'facts.s.osm.stepfree.limited': "Parcialmente sin escalones (sin confirmar)",
  'facts.s.osm.stepfree.no': "Con escalones (sin confirmar)",
  'facts.s.osm.bathroom.yes': "Baño accesible (sin confirmar)",
  'facts.s.osm.bathroom.limited': "Baño parcialmente accesible (sin confirmar)",
  'facts.s.osm.bathroom.no': "Sin baño accesible (sin confirmar)",
  'facts.s.osm.hearing.yes': "Bucle magnético (sin confirmar)",
  'facts.s.osm.hearing.limited': "Bucle magnético parcial (sin confirmar)",
  'facts.s.osm.hearing.no': "Sin bucle magnético (sin confirmar)",
};

export default facts;
