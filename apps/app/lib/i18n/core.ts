// Tiny message formatter (#21). No library: Intl does the hard parts.
//   'venue.reviews': { one: '{count} review', other: '{count} reviews' }
//   t('venue.reviews', { count: 3 }) → "3 reviews"
//   'venue.walk': 'About {mins} min walk'   t('venue.walk', { mins: 4 })
// A missing translation falls back to English (and is listed by i18n:check).

export type Plural = { zero?: string; one?: string; two?: string; few?: string; many?: string; other: string };
export type Msg = string | Plural;
export type Dict = Record<string, Msg>;
export type Params = Record<string, string | number | null | undefined>;
export type T = ((key: string, params?: Params) => string) & { locale: string; has: (key: string) => boolean };

const pluralRules = new Map<string, Intl.PluralRules>();
const rulesFor = (intl: string) => {
  let r = pluralRules.get(intl);
  if (!r) { r = new Intl.PluralRules(intl); pluralRules.set(intl, r); }
  return r;
};

export function interpolate(s: string, params?: Params) {
  if (!params) return s;
  return s.replace(/\{(\w+)\}/g, (m, k) => (params[k] === undefined || params[k] === null ? m : String(params[k])));
}

export function makeT(dict: Dict, fallback: Dict, intl: string, locale: string): T {
  const fn = ((key: string, params?: Params) => {
    const msg = dict[key] ?? fallback[key];
    if (msg === undefined) {
      if (process.env.NODE_ENV !== 'production') console.warn(`[i18n] missing key: ${key}`);
      return key;
    }
    if (typeof msg === 'string') return interpolate(msg, params);
    const n = Number(params?.count ?? 0);
    // Explicit zero wins where a language uses it for "no reviews yet".
    const form = n === 0 && msg.zero !== undefined ? 'zero' : rulesFor(dict === fallback || dict[key] ? intl : 'en-AU').select(n);
    return interpolate((msg as Plural)[form as keyof Plural] ?? msg.other, params);
  }) as T;
  fn.locale = locale;
  fn.has = (key: string) => key in dict || key in fallback;
  return fn;
}

/** Guess the language of free text people wrote (reviews, photo descriptions,
 *  venue replies), so screen readers switch voice. Script-based: reliable for
 *  CJK and Hangul; Latin text is assumed English unless it looks Spanish. */
export function guessLang(text: string | null | undefined): string | undefined {
  if (!text) return undefined;
  if (/[가-힯ᄀ-ᇿ]/.test(text)) return 'ko';
  if (/[぀-ヿ]/.test(text)) return 'ja';
  if (/[一-鿿]/.test(text)) return 'zh-Hans';
  if (/[ñ¿¡]|\b(el|los|las|muy|para|pero|baño|accesible|entrada)\b/i.test(text)) return 'es';
  return 'en-AU';
}
