// es — 'ask' namespace. Machine-translated unless the key is listed in
// ./_meta.ts → reviewed. Keep the same keys and {placeholders} as en/ask.ts.
import type { Translation } from '../../types';
import type en from '../en/ask';

const ask: Translation<typeof en> = {
  'ask.title': "Pregunta sobre este lugar",
  'ask.description': "Las respuestas salen solo de las reseñas de {name} en Roam — nunca de internet, nunca de una suposición.",
  'ask.noReviewsYet': "Nadie ha reseñado este lugar todavía, así que no hay nada con qué responder. ¿Has estado? Tu reseña es el primer paso.",
  'ask.label': "Tu pregunta",
  'ask.placeholder': "p. ej. ¿Hay una rampa en la entrada?",
  'ask.submit': "Preguntar",
  'ask.reading': "Leyendo las reseñas…",
  'ask.out': "Has usado las preguntas de hoy — puedes volver a preguntar mañana.",
  'ask.left': { one: "Te queda {count} pregunta hoy", other: "Te quedan {count} preguntas hoy" },
  'ask.error': "Algo salió mal — inténtalo de nuevo.",
  'ask.offline': "No se pudo conectar con Roam Access — revisa tu conexión.",
  'ask.limit': "Has usado las preguntas de hoy. Puedes volver a preguntar mañana.",
  'ask.unavailable': "Ahora mismo no hay respuestas — inténtalo dentro de un minuto.",
  'ask.from': { one: "Según {count} reseña", other: "Según {count} reseñas" },
  'ask.basedOn': "Reseñas en las que se basa",
  'ask.withPhoto': "Con foto",
  'ask.readAll': "Leer todas las reseñas",
  'ask.notTitle': "Las reseñas aún no responden a esto",
  'ask.notAction': "¿Has estado? Comparte tu experiencia",
  'ask.notAnswered': "Ninguna reseña de este lugar menciona eso todavía, así que no podemos responder — y no vamos a adivinar.",
  'ask.noReviews': "Nadie ha reseñado este lugar todavía, así que no hay nada con qué responder — y no vamos a adivinar.",
};

export default ask;
