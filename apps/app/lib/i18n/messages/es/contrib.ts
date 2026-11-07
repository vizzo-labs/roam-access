// es — 'contrib' namespace. Machine-translated unless the key is listed in
// ./_meta.ts → reviewed. Keep the same keys and {placeholders} as en/contrib.ts.
import type { Translation } from '../../types';
import type en from '../en/contrib';

const contrib: Translation<typeof en> = {
  // ── Who wrote it ─────────────────────────────────────────────
  'contrib.member': 'Miembro de Roam Access',
  'contrib.rel.lived': 'Experiencia propia',
  'contrib.rel.carer': 'Persona cuidadora',
  'contrib.rel.ally': 'Persona aliada',
  'contrib.rel.selfDescribed': 'según la propia persona',
  'contrib.who.line': '{name} · {label}',
  'contrib.profileLink': 'Ver el perfil de {name}',

  // ── Ally observations (no verdict) ───────────────────────────
  'contrib.observed.label': 'Observado por una persona aliada',
  'contrib.observed.default': 'Lo que noté como persona aliada.',
  'contrib.observed.note': 'Observación de una persona aliada. Nunca cambia un veredicto.',
  'contrib.observedFacts.title': 'Observado por personas aliadas',
  'contrib.observedFacts.lead': 'Lo que notaron aquí las personas aliadas. No tienen estas necesidades de acceso, así que esto nunca cambia si un lugar te sirve.',
  'contrib.fact.observed': { one: '{what}: lo observó {count} persona aliada', other: '{what}: lo observaron {count} personas aliadas' },

  // ── A carer's review is about the person they were with ──────
  'contrib.carer.default.works': 'Le sirvió a la persona con la que fui.',
  'contrib.carer.default.check': 'Se las arregló, pero con soluciones que conviene conocer.',
  'contrib.carer.default.barrier': 'No pudo usar el lugar como lo necesitaba.',

  // ── "This helped me" ─────────────────────────────────────────
  'contrib.helped.button': 'Esto me ayudó',
  'contrib.helped.count': { one: 'Ayudó a {count} persona', other: 'Ayudó a {count} personas' },
  'contrib.helped.thanked': 'Gracias. Quien escribió la reseña verá que ayudó a alguien.',
  'contrib.helped.failed': 'No se pudo guardar. Inténtalo de nuevo.',

  // ── The review form adapts to who is writing ─────────────────
  'contrib.review.shownAs': 'Se muestra como: {who}',
  'contrib.review.carer.intro': 'Escribes como persona cuidadora. Cuenta cómo le fue a la persona con la que estabas.',
  'contrib.review.carer.opt.works.label': 'Le sirvió',
  'contrib.review.carer.opt.works.sub': 'Pudo entrar, moverse y disfrutarlo',
  'contrib.review.carer.opt.check.label': 'Algunas barreras',
  'contrib.review.carer.opt.check.sub': 'Se las arregló, pero con soluciones',
  'contrib.review.carer.opt.barrier.label': 'No le sirvió',
  'contrib.review.carer.opt.barrier.sub': 'No pudo usar el lugar como lo necesitaba',
  'contrib.review.carer.needs.title': '¿De quién son las necesidades?',
  'contrib.review.carer.needs.hint': 'Las necesidades de la persona con la que estabas. Vienen de tu perfil; cámbialas para esta visita si hace falta.',
  'contrib.review.carer.needs.group': 'Sus necesidades',
  'contrib.review.ally.title': '¿Qué notaste en {name}?',
  'contrib.review.ally.intro': 'Escribes como persona aliada. Cuenta lo que notaste. Se muestra como «Observado por una persona aliada» y nunca cambia si un lugar le sirve a alguien.',
  'contrib.review.ally.more': '¿Qué notaste?',
  'contrib.review.ally.moreHint': 'Responde lo que viste con tus propios ojos. Toca otra vez para borrar una respuesta si no estás seguro.',
  'contrib.review.ally.choose': 'Responde al menos una pregunta para enviar.',
  'contrib.review.ally.send': 'Enviar lo que noté',

  // ── How I appear on reviews (setup, Me → profile) ────────────
  'contrib.form.name.label': 'Nombre que se muestra en tus reseñas',
  'contrib.form.name.hint': 'Basta con tu nombre y la inicial del apellido, o un apodo.',
  'contrib.form.name.placeholder': 'p. ej., Sam K.',
  'contrib.form.name.required': 'Añade un nombre o elige «Publicar de forma anónima».',
  'contrib.form.anon.label': 'Publicar de forma anónima',
  'contrib.form.anon.hint': 'Tus reseñas muestran «Miembro de Roam Access» en lugar de un nombre, y no tienes perfil público.',
  'contrib.form.rel.legend': '¿Qué te describe mejor?',
  'contrib.form.rel.hint': 'Lo dices tú; no lo comprobamos. Sirve para que quien lee sepa de quién es la experiencia.',
  'contrib.form.rel.lived': 'Tengo una discapacidad o una necesidad de acceso',
  'contrib.form.rel.lived.sub': 'Se muestra como «Experiencia propia»',
  'contrib.form.rel.carer': 'Soy cuidador/a, familiar o asistente personal',
  'contrib.form.rel.carer.sub': 'Se muestra como «Persona cuidadora». Reseñas por la persona con la que fuiste.',
  'contrib.form.rel.ally': 'Quiero ayudar (persona aliada)',
  'contrib.form.rel.ally.sub': 'Se muestra como «Persona aliada». Compartes lo que notaste; nunca cambia un veredicto.',
  'contrib.form.rel.unsaid': 'Prefiero no decirlo',
  'contrib.form.rel.unsaid.sub': 'No se muestra ninguna etiqueta',
  'contrib.form.needs.label': 'Mostrar mis necesidades de acceso en mis reseñas (p. ej., «Usuario de silla de ruedas»)',
  'contrib.form.needs.hint': 'Las necesidades de acceso son información de salud. Las reseñas son públicas: cualquiera puede leerlas, también en la web sin iniciar sesión. Esto se aplica a todas tus reseñas y puedes desactivarlo cuando quieras.',
  'contrib.form.preview': 'Tus reseñas mostrarán',
  'contrib.form.public.named': 'Las reseñas son públicas. Esto aparece en cada reseña que escribas y en tu página de perfil.',
  'contrib.form.public.anon': 'Las reseñas son públicas. Las tuyas muestran «Miembro de Roam Access», sin página de perfil.',
  'contrib.form.save': 'Guardar',
  'contrib.form.saved': 'Guardado. Tus reseñas ya muestran esto.',
  'contrib.form.failed': 'No se pudo guardar. Revisa tu conexión e inténtalo de nuevo.',

  'contrib.setup.title': 'Cómo aparecerás en las reseñas',
  'contrib.setup.lead': 'Las reseñas muestran quién las escribió, para que quien lee sepa de quién es la experiencia. Tú eliges qué se muestra; puedes cambiarlo cuando quieras en Yo.',

  'contrib.profile.title': 'Cómo aparezco en las reseñas',
  'contrib.profile.back': 'Volver a Yo',
  'contrib.profile.lead': 'Elige el nombre y la etiqueta que la gente ve en tus reseñas.',
  'contrib.profile.legacy': 'Hasta ahora, tus reseñas solo muestran tu experiencia (como «Usuario de silla de ruedas»), nunca tu nombre. Nada cambia hasta que guardes aquí; después, todas tus reseñas, también las antiguas, mostrarán lo que elijas.',
  'contrib.profile.reset': 'El equipo de la prueba quitó el nombre que elegiste, así que tus reseñas muestran «Miembro de Roam Access». Elige un nombre nuevo para volver a mostrar uno.',

  // ── One-time prompt for accounts from before names ───────────
  'contrib.prompt.title': 'Ahora las reseñas pueden mostrar quién las escribió',
  'contrib.prompt.body': 'Hasta ahora, tus reseñas solo muestran tu experiencia, nunca tu nombre. Seguirán así a menos que elijas mostrar un nombre.',
  'contrib.prompt.choose': 'Elegir cómo aparezco',
  'contrib.prompt.keep': 'Dejar mis reseñas como están',

  // ── Me ───────────────────────────────────────────────────────
  'contrib.me.appear.title': 'Cómo aparezco en las reseñas',
  'contrib.me.appear.edit': 'Editar cómo aparezco en las reseñas',
  'contrib.me.appear.legacy': 'Solo tu experiencia, nunca tu nombre.',
  'contrib.me.appear.choose': 'Elegir',
  'contrib.me.appear.chooseAria': 'Elegir cómo aparezco en las reseñas',
  'contrib.me.profileLink': 'Mi perfil público',
  'contrib.me.badges.title': 'Mis insignias',
  'contrib.me.badges.count': '{earned} de {total} conseguidas',
  'contrib.me.loading': 'Cargando tus insignias…',
  'contrib.me.failed': 'Ahora no se pudieron cargar tus insignias.',

  'contrib.badge.first': 'Primera reseña',
  'contrib.badge.first.desc': 'Escribió una primera reseña',
  'contrib.badge.regular': 'Habitual',
  'contrib.badge.regular.desc': '5 reseñas',
  'contrib.badge.local': 'Experto local',
  'contrib.badge.local.desc': '15 reseñas',
  'contrib.badge.champion': 'Campeón',
  'contrib.badge.champion.desc': '50 reseñas',
  'contrib.badge.entrance': 'Buscador de entradas',
  'contrib.badge.entrance.desc': 'Marcó 3 entradas sin escalones',
  'contrib.badge.photographer': 'Fotógrafo',
  'contrib.badge.photographer.desc': '10 fotos con descripción',
  'contrib.badge.pathfinder': 'Guía de rutas',
  'contrib.badge.pathfinder.desc': 'Compartió 3 guías de llegada paso a paso',
  'contrib.badge.founding': 'Miembro fundador',
  'contrib.badge.founding.desc': 'Se unió antes del 1 de marzo de 2027',
  'contrib.badge.mapper': 'Cartógrafo',
  'contrib.badge.mapper.desc': 'Participó en un día de mapeo',
  'contrib.badge.earned': 'Conseguida',
  'contrib.badge.progress': '{have} de {goal}',
  'contrib.badge.notYet': 'Todavía no',

  'contrib.newBadge.title': { one: 'Nueva insignia', other: 'Nuevas insignias' },
  'contrib.newBadge.item': '{name}: {desc}',
  'contrib.newBadge.toast': 'Nueva insignia: {name}',
  'contrib.newBadge.see': 'Ver mis insignias',
  'contrib.newBadge.dismiss': 'Cerrar el aviso de nueva insignia',

  'contrib.top.title': 'Quienes más aportaron este mes',
  'contrib.top.lead': 'Más reseñas en Manly en los últimos 30 días. Solo aparecen las personas que muestran un nombre.',
  'contrib.top.reviews': { one: '{count} reseña', other: '{count} reseñas' },
  'contrib.top.empty': 'Nadie todavía este mes: tu próxima reseña podría ponerte aquí.',
  'contrib.top.you': 'Tú',

  // ── Review filters ───────────────────────────────────────────
  'contrib.filter.lived': 'Experiencia propia',
  'contrib.filter.carer': 'Personas cuidadoras',
  'contrib.filter.ally': 'Personas aliadas',

  // ── Public profile page /u/[id] (server-rendered) ────────────
  'contrib.page.metaTitle': '{name} · Roam Access',
  'contrib.page.eyebrow': 'Perfil de miembro de Roam Access',
  'contrib.page.memberSince': 'Miembro desde {date}',
  'contrib.page.needs': 'Necesidades de acceso: {list}',
  'contrib.page.stats': 'Aportes',
  'contrib.page.badges': 'Insignias',
  'contrib.page.noBadges': 'Todavía no hay insignias.',
  'contrib.page.reviews': 'Reseñas',
  'contrib.page.noReviews': 'Todavía no hay reseñas que mostrar.',
  'contrib.page.observation': 'Observación, sin veredicto',
  'contrib.page.about': 'Etiquetas como «Experiencia propia», «Persona cuidadora» y «Persona aliada» las elige cada persona. Solo las reseñas pueden decir que un lugar sirve; las observaciones de personas aliadas nunca cambian un veredicto.',
  'contrib.page.open': 'Abrir Roam Access',
  'contrib.page.place': 'Abrir {name} en Roam Access',
};

export default contrib;
