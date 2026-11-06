// t() for server-rendered pages. The public pages (/v/[id] …) are in English
// (Australia) for now — there is no saved language choice without the app —
// but their strings still live in messages/ so they get translated with the
// rest and can follow a locale later.
import en from './messages/en';
import { makeT, type T } from './core';
import { DEFAULT_LOCALE } from './locales';

export function serverT(): T {
  return makeT(en, en, 'en-AU', DEFAULT_LOCALE);
}
