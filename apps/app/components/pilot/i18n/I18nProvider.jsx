'use client';
// i18n for the pilot app (#21). Wrap the app once (PilotRoot); every component
// that shows words calls useT() and passes `t` to any helper that builds text.
// (The React Compiler memoises components: a helper reading a global would go
// stale when the language changes, so `t` always travels as an argument.)

import React from 'react';
import en from '@/lib/i18n/messages/en';
import { makeT, guessLang } from '@/lib/i18n/core';
import { DEFAULT_LOCALE, LOCALE_IDS, LOCALE_STORAGE_KEY, detectLocale, localeDef } from '@/lib/i18n/locales';

// English ships with the app; other languages load when chosen.
const LOADERS = {
  'zh-Hans': () => import('@/lib/i18n/messages/zh-Hans'),
  ja: () => import('@/lib/i18n/messages/ja'),
  ko: () => import('@/lib/i18n/messages/ko'),
  es: () => import('@/lib/i18n/messages/es'),
};

const TZ = 'Australia/Sydney';

function makeFormat(intl, t) {
  const dateFmt = new Intl.DateTimeFormat(intl, { day: 'numeric', month: 'long', year: 'numeric', timeZone: TZ });
  const rtf = new Intl.RelativeTimeFormat(intl, { numeric: 'auto' });
  const list = new Intl.ListFormat(intl, { style: 'long', type: 'conjunction' });
  const toDate = d => { if (!d) return null; const x = d instanceof Date ? d : new Date(d); return Number.isNaN(+x) ? null : x; };
  return {
    /** "6 November 2026" / "2026年11月6日" */
    date: d => { const x = toDate(d); return x ? dateFmt.format(x) : ''; },
    /** Day-level: "today", "yesterday", "3 days ago", "2 weeks ago", "4 months ago", "last year". */
    timeAgo: (d, now = Date.now()) => {
      const x = toDate(d);
      if (!x) return '';
      const days = Math.floor((+now - +x) / 86400000);
      if (days <= 0) return rtf.format(0, 'day');
      if (days < 14) return rtf.format(-days, 'day');
      if (days < 60) return rtf.format(-Math.round(days / 7), 'week');
      if (days < 365) return rtf.format(-Math.round(days / 30), 'month');
      return rtf.format(-Math.max(1, Math.round(days / 365)), 'year');
    },
    /** Minute-level: "just now", "20 minutes ago", "3 hours ago", then timeAgo. */
    ago: (d, now = Date.now()) => {
      const x = toDate(d);
      if (!x) return '';
      const m = Math.round((+now - +x) / 60000);
      if (m < 2) return t('common.justNow');
      if (m < 60) return rtf.format(-m, 'minute');
      const h = Math.round(m / 60);
      if (h < 24) return rtf.format(-h, 'hour');
      const days = Math.round(h / 24);
      if (days < 14) return rtf.format(-days, 'day');
      if (days < 63) return rtf.format(-Math.round(days / 7), 'week');
      return dateFmt.format(x);
    },
    list: items => list.format(items.filter(Boolean).map(String)),
    number: n => new Intl.NumberFormat(intl).format(n),
  };
}

const Ctx = React.createContext(null);

// The chosen language lives in localStorage; React reads it as an external
// store (English on the server and during hydration, then the real choice).
const localeSubs = new Set();
let localeCache = null;
function readLocale() {
  if (localeCache) return localeCache;
  let stored = null;
  try { const v = localStorage.getItem(LOCALE_STORAGE_KEY); stored = LOCALE_IDS.includes(v) ? v : null; } catch { /* private mode */ }
  localeCache = stored || detectLocale(navigator.languages || [navigator.language]);
  return localeCache;
}
function writeLocale(id) {
  localeCache = id;
  try { localStorage.setItem(LOCALE_STORAGE_KEY, id); } catch { /* private mode */ }
  localeSubs.forEach(f => f());
}
const subscribeLocale = f => { localeSubs.add(f); return () => localeSubs.delete(f); };

export function I18nProvider({ children }) {
  const locale = React.useSyncExternalStore(subscribeLocale, readLocale, () => DEFAULT_LOCALE);
  const [dicts, setDicts] = React.useState(() => ({ [DEFAULT_LOCALE]: { dict: en, meta: null } }));
  // While a language's words download, keep showing the ones on screen.
  const [shown, setShown] = React.useState(DEFAULT_LOCALE);
  const active = dicts[locale] ? locale : (dicts[shown] ? shown : DEFAULT_LOCALE);
  React.useEffect(() => {
    if (dicts[locale] || !LOADERS[locale]) return;
    let live = true;
    LOADERS[locale]().then(m => {
      if (!live) return;
      setDicts(d => ({ ...d, [locale]: { dict: m.default, meta: m.meta } }));
      setShown(locale);
    });
    return () => { live = false; };
  }, [locale, dicts]);
  const def = localeDef(active);
  const value = React.useMemo(() => {
    const entry = dicts[active];
    const t = makeT(entry.dict, en, def.intl, active);
    return {
      locale: active, def, t, meta: entry.meta,
      machine: !!entry.meta?.machineTranslated && !entry.meta?.reviewedAll,
      fmt: makeFormat(def.intl, t),
      setLocale: id => {
        if (!LOCALE_IDS.includes(id)) return;
        setShown(active);
        writeLocale(id);
      },
    };
  }, [active, dicts, def]);

  // The page's language follows the UI, so screen readers use the right voice.
  // (The inline script in app/(app)/layout.tsx sets it before first paint.)
  React.useEffect(() => {
    if (active !== locale) return;
    document.documentElement.lang = def.html;
    document.documentElement.dir = def.dir;
    // The skip link is server-rendered (app/(app)/layout.tsx): name it in the UI language.
    const skip = document.querySelector('.ra-skip');
    if (skip) skip.textContent = value.t('app.skipLink');
  }, [def, active, locale, value]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

const FALLBACK = (() => {
  const t = makeT(en, en, 'en-AU', DEFAULT_LOCALE);
  return { locale: DEFAULT_LOCALE, def: localeDef(DEFAULT_LOCALE), t, meta: null, machine: false, fmt: makeFormat('en-AU', t), setLocale: () => {} };
})();

/** { locale, def, t, fmt, setLocale, machine } */
export function useLocale() { return React.useContext(Ctx) || FALLBACK; }
/** The translate function: t('venue.directions'), t('venue.reviews', { count }) */
export function useT() { return useLocale().t; }
/** Locale-aware dates, relative times, lists and numbers. */
export function useFormat() { return useLocale().fmt; }

/** Text people wrote (reviews, photo descriptions, replies): marked with its
 *  own language so a screen reader doesn't read English with a Japanese voice. */
export function UserText({ children, as: As = 'span', ...rest }) {
  const text = typeof children === 'string' ? children : '';
  return <As lang={guessLang(text)} {...rest}>{children}</As>;
}
