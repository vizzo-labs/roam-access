// es — 'community' namespace. Machine-translated unless the key is listed in
// ./_meta.ts → reviewed. Keep the same keys and {placeholders} as en/community.ts.
import type { Translation } from '../../types';
import type en from '../en/community';

const community: Translation<typeof en> = {
  'community.q.stepfree': '¿Hay una entrada sin escalones?',
  'community.q.bathroom': '¿Hay un baño accesible?',
  'community.q.quiet': '¿Suele ser tranquilo, sin mucho ruido?',
  'community.q.calm': '¿Es un lugar calmado, sin agobio?',
  'community.q.seats': '¿Hay asientos y sitios para descansar?',
  'community.q.hearing': '¿Hay apoyo auditivo, como bucle magnético, subtítulos o personal que escribe las cosas?',
  'community.q.vision': '¿Es adecuado para baja visión, con buena luz, letra grande o personal que ayuda?',
  'community.q.simple': '¿Es fácil orientarse?',

  'community.hint.unconfirmed.yes': 'OpenStreetMap dice “sí”, pero nadie lo ha confirmado todavía.',
  'community.hint.unconfirmed.partly': 'OpenStreetMap dice “en parte”, pero nadie lo ha confirmado todavía.',
  'community.hint.unconfirmed.no': 'OpenStreetMap dice “no”, pero nadie lo ha confirmado todavía.',
  'community.hint.none': 'Nadie ha respondido todavía.',
  'community.hint.mixed': 'Por ahora hay opiniones distintas: {yes} sí, {no} no.',
  'community.hint.one': 'Solo ha respondido una persona por ahora.',
  'community.helps': 'Ayuda a {who}.',
  'community.helpsEveryone': 'Ayuda a todo el mundo.',

  'community.prompt.overline': 'Ayuda a completar',
  'community.prompt.title': { one: '{count} lugar cerca de ti necesita una respuesta rápida', other: '{count} lugares cerca de ti necesitan una respuesta rápida' },
  'community.prompt.sub': 'Sí o no: un toque cada una. Solo si has estado allí.',

  'community.gaps.overline': 'Ayuda a completar',
  'community.gaps.loading': 'Buscando lugares cerca de ti…',
  'community.gaps.error': 'No se pudieron cargar las preguntas',
  'community.gaps.nothing': 'Ahora mismo no hay nada que responder cerca de ti',
  'community.gaps.done': 'Listo, ¡gracias!',
  'community.gaps.allForNow': 'Eso es todo por ahora',
  'community.gaps.intro': 'Responde solo si has estado allí. Cada respuesta aparece en el lugar como “respuesta rápida” y ayuda a personas con tus mismas necesidades.',
  'community.gaps.event': 'Tus respuestas cuentan para {event}.',
  'community.gaps.leaderboard': 'Ver la clasificación',
  'community.gaps.questionOf': 'Pregunta {n} de {total}',
  'community.gaps.placeLine': '{kind} · {walk} · {area}',
  'community.gaps.skip': 'No estoy seguro: saltar esta',
  'community.gaps.seeFirst': 'Ver {name} primero',
  'community.gaps.saved': 'Guardado: {answer} para {name}. Gracias.',
  'community.gaps.answerYes': 'sí',
  'community.gaps.answerNo': 'no',
  'community.gaps.live': { one: 'Tu respuesta ya está publicada', other: 'Tus {count} respuestas ya están publicadas' },
  'community.gaps.noneNear': 'Todos los lugares a menos de 25 minutos a pie ya tienen respuestas para tus necesidades, o ya las respondiste. ¿Has ido a algún sitio hace poco? Una reseña completa ayuda todavía más.',
  'community.gaps.more': 'Responder unas cuantas más',
  'community.gaps.backHome': 'Volver al inicio',
};

export default community;
