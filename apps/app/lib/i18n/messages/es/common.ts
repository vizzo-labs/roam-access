// es — 'common' namespace. Machine-translated unless the key is listed in
// ./_meta.ts → reviewed. Keep the same keys and {placeholders} as en/common.ts.
import type { Translation } from '../../types';
import type en from '../en/common';

const common: Translation<typeof en> = {
  'common.back': 'Volver',
  'common.close': 'Cerrar',
  'common.cancel': 'Cancelar',
  'common.send': 'Enviar',
  'common.sending': 'Enviando…',
  'common.save': 'Guardar',
  'common.saving': 'Guardando…',
  'common.done': 'Listo',
  'common.next': 'Siguiente',
  'common.edit': 'Editar',
  'common.retry': 'Intentar de nuevo',
  'common.loading': 'Cargando…',
  'common.optional': '(opcional)',
  'common.yes': 'Sí',
  'common.no': 'No',
  'common.opensNewTab': '(se abre en una pestaña nueva)',
  'common.justNow': 'ahora mismo',
  'common.reports': { one: '{count} aviso', other: '{count} avisos' },
  'common.people': { one: '{count} persona', other: '{count} personas' },
  'common.reviews': { one: '{count} reseña', other: '{count} reseñas' },
  'common.places': { one: '{count} lugar', other: '{count} lugares' },
  'common.photos': { one: '{count} foto', other: '{count} fotos' },
  'common.minWalk': '{mins} min a pie',
  'common.offline': 'No tienes conexión',
  'common.checkConnection': 'Revisa tu conexión e inténtalo de nuevo.',
  'common.language.title': 'Idioma',
  'common.language.hint': 'Se guarda en este dispositivo. Las reseñas se muestran en el idioma en que se escribieron.',
  'common.language.machine': 'Este idioma se tradujo con una máquina. Pronto lo revisará una persona. Avísanos si algo no se entiende bien.',
  'common.readAloud.start': 'Leer en voz alta',
  'common.readAloud.stop': 'Parar',
  'common.readAloud.named': 'Leer en voz alta: {what}',
  'common.readAloud.stopNamed': 'Dejar de leer: {what}',
  'common.readAloud.setting': 'Botones de lectura en voz alta',
  'common.readAloud.settingHint': 'Muestra «Leer en voz alta» en los resúmenes de los lugares. Nunca empieza solo.',
  'common.readAloud.unsupported': 'Este navegador no puede leer en voz alta.',
  'common.readAloud.speed': 'Velocidad de lectura',
  'common.readAloud.slower': 'Más lenta',
  'common.readAloud.normal': 'Normal',
};

export default common;
