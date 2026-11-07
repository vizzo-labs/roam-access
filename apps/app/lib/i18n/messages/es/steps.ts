// es — 'steps' namespace. Machine-translated unless the key is listed in
// ./_meta.ts → reviewed. Keep the same keys and {placeholders} as en/steps.ts.
import type { Translation } from '../../types';
import type en from '../en/steps';

const steps: Translation<typeof en> = {
  'steps.back': "Atrás",
  'steps.backStep': "Un paso atrás",
  'steps.backTo': "Volver a {name}",
  'steps.announce': "Paso {step} de {total}. {title}",
  'steps.shownAs': "Se muestra como:",
  'steps.change': "Cambiar",
  'steps.changeAria': "Cambiar cómo aparezco en las reseñas",
  'steps.v.lead': "Con un toque basta. Lo demás es opcional.",
  'steps.v.leadCarer': "Cuéntanos cómo le fue a la persona que acompañabas. Con un toque basta.",
  'steps.v.group': "¿Qué tal fue?",
  'steps.v.hint': "Elige una de las tres para enviar.",
  'steps.send': "Enviar",
  'steps.more': { one: "Añadir un poco más ({count} pregunta)", other: "Añadir un poco más ({count} preguntas)" },
  'steps.q.title': { one: "Una pregunta rápida", other: "{count} preguntas rápidas" },
  'steps.q.lead': "Para personas que necesitan lo mismo que tú. Salta las que no sepas.",
  'steps.q.leadCarer': "Sobre las necesidades de la persona que acompañabas. Salta las que no sepas.",
  'steps.q.notSure': "No sé",
  'steps.q.map': "Mostrar dónde está en un mapa (opcional)",
  'steps.q.toExtras': "Añadir una foto o una nota",
  'steps.x.title': "¿Algo más?",
  'steps.x.lead': "Todo es opcional. Una foto de la puerta o del baño es lo que más ayuda.",
  'steps.x.addMore': "¿Quieres añadir más?",
  'steps.x.sensory': "Ruido y gente",
  'steps.ally.lead': "Responde solo lo que viste tú. Salta el resto.",
  'steps.ally.banner': "Escribes como aliado. Lo que compartas se muestra como “Observado por un aliado”. Nunca cambia si un lugar le sirve a alguien.",
  'steps.ally.more': { one: "Una pregunta más", other: "{count} preguntas más" },
  'steps.ally.extras': "¿Algo más? (opcional)",
  'steps.ally.sent': "Se muestra como “Observado por un aliado”.",
  'steps.setup.skip': "Saltar por ahora",
  'steps.setup.saved': "Guardamos tus necesidades.",
  'steps.setup.group': "Mis necesidades",
};

export default steps;
