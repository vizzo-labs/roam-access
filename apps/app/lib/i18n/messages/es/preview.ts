// es — 'preview' namespace. Machine-translated unless the key is listed in
// ./_meta.ts → reviewed. Keep the same keys and {placeholders} as en/preview.ts.
import type { Translation } from '../../types';
import type en from '../en/preview';

const preview: Translation<typeof en> = {
  'preview.close': 'Cerrar la vista previa de {name}',
  'preview.photoAlt': 'Foto de {name}',
  'preview.noPhoto': 'Todavía no hay fotos',
  'preview.addFirst': 'Añade la primera',
  'preview.addFirstAria': 'Añade la primera foto de {name}: escribe una reseña',
  'preview.factsLabel': 'Datos de accesibilidad para tus necesidades',
  'preview.noInfo': 'Nadie ha dicho todavía cómo funciona este lugar para tus necesidades.',
  'preview.feature.stepfree': 'Sin escalones',
  'preview.feature.bathroom': 'Baño accesible',
  'preview.feature.seats': 'Asientos',
  'preview.feature.quiet': 'Tranquilo',
  'preview.feature.simple': 'Fácil de orientarse',
  'preview.feature.calm': 'Calmado',
  'preview.feature.hearing': 'Apoyo auditivo',
  'preview.feature.vision': 'Apto para baja visión',
  'preview.state.yes': 'Sí',
  'preview.state.no': 'No',
  'preview.state.mixed': 'Opiniones mixtas',
  'preview.state.alt': 'Hay otra entrada',
  'preview.state.unconfirmed': 'Sin confirmar',
  'preview.seeDetailsAria': 'Ver detalles de {name}',
  'preview.details': 'Detalles',
  'preview.answerOne': 'Responde 1 pregunta',
  'preview.answerOneAria': 'Responde 1 pregunta sobre {name}',
  'preview.notNow': 'Ahora no',
  'preview.answerHelps': 'Un toque. Se muestra como respuesta rápida.',
  'preview.thanks': 'Gracias. Tu respuesta se ha guardado.',
  'preview.moreReports': { one: '{count} aviso más en la página de detalles', other: '{count} avisos más en la página de detalles' },
};
export default preview;
