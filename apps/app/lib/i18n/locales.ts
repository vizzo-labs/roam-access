// The languages the app ships in (#21). English (Australia) is the source;
// the others are machine-translated first and marked so a person can review
// them (see messages/<locale>/_meta.ts and `npm run i18n:check`).

export type LocaleId = 'en-AU' | 'zh-Hans' | 'ja' | 'ko' | 'es';

export type LocaleDef = {
  id: LocaleId;
  native: string;     // the language's own name, shown in the picker
  english: string;    // for people who can't read the native name yet
  html: string;       // the lang attribute (BCP 47)
  speech: string;     // Web Speech voice language
  dir: 'ltr' | 'rtl';
  intl: string;       // Intl.* locale (dates, numbers, plurals, lists)
};

export const LOCALES: LocaleDef[] = [
  { id: 'en-AU',   native: 'English',  english: 'English',              html: 'en-AU',   speech: 'en-AU', dir: 'ltr', intl: 'en-AU' },
  { id: 'zh-Hans', native: '简体中文',   english: 'Chinese (Simplified)', html: 'zh-Hans', speech: 'zh-CN', dir: 'ltr', intl: 'zh-Hans-CN' },
  { id: 'ja',      native: '日本語',     english: 'Japanese',             html: 'ja',      speech: 'ja-JP', dir: 'ltr', intl: 'ja-JP' },
  { id: 'ko',      native: '한국어',     english: 'Korean',               html: 'ko',      speech: 'ko-KR', dir: 'ltr', intl: 'ko-KR' },
  { id: 'es',      native: 'Español',  english: 'Spanish',              html: 'es',      speech: 'es-ES', dir: 'ltr', intl: 'es-ES' },
];
export const DEFAULT_LOCALE: LocaleId = 'en-AU';
export const LOCALE_IDS = LOCALES.map(l => l.id);
export const localeDef = (id: string) => LOCALES.find(l => l.id === id) ?? LOCALES[0];
export const LOCALE_STORAGE_KEY = 'ra-locale';

/** Best match for the browser's languages (first visit only). */
export function detectLocale(langs: readonly string[] = []): LocaleId {
  for (const raw of langs) {
    const l = raw.toLowerCase();
    if (l.startsWith('zh')) {
      // Traditional-script locales aren't shipped: stay in English rather than
      // show the wrong script.
      if (/^zh-(hant|tw|hk|mo)/.test(l)) continue;
      return 'zh-Hans';
    }
    if (l.startsWith('ja')) return 'ja';
    if (l.startsWith('ko')) return 'ko';
    if (l.startsWith('es')) return 'es';
    if (l.startsWith('en')) return 'en-AU';
  }
  return DEFAULT_LOCALE;
}
