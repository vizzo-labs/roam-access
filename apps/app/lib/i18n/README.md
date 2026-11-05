# Languages (i18n) and read aloud — #21

The pilot app ships in **English (Australia)**, **简体中文**, **日本語**, **한국어** and **Español**.
No i18n library: `lib/i18n/core.ts` (≈60 lines) plus `Intl` for plurals, dates, relative
times and lists.

```
lib/i18n/
  locales.ts            the languages: lang attribute, speech voice, Intl locale; detectLocale()
  core.ts               makeT() (lookup, {placeholders}, plural forms) · guessLang()
  messages/en/<ns>.ts   English source strings, one file per namespace (keys '<ns>.*')
  messages/<locale>/    the same namespaces translated + _meta.ts (what a person has reviewed)
components/pilot/i18n/
  I18nProvider          wraps the app (PilotRoot); useT() · useFormat() · useLocale() · <UserText>
  LanguagePicker        the switch in Accessibility settings and on Me (saved on this device)
  ReadAloud             "Read aloud" button (Web Speech API) + ReadAloudSettings
scripts/i18n-check.ts   npm run i18n:check  (add --missing to list untranslated keys)
```

## Writing UI text

```jsx
import { useT, useFormat } from '../i18n';

function Thing({ venue }) {
  const t = useT();                 // every component that shows words calls useT()
  const fmt = useFormat();          // fmt.date(d) · fmt.timeAgo(d) · fmt.ago(d) · fmt.list([...])
  return <p>{t('venue.walk', { mins: venue.mins })} · {t('common.reviews', { count: venue.verified })}</p>;
}
```

- **Every string a person can see or hear** goes through `t()`: text, `aria-label`, `title`,
  `alt`, placeholders, toasts, `document.title`, live-region messages.
- **Helpers that build text take `t` as an argument** (`countsLine(counts, t)`). Never read a
  global: the React Compiler memoises components on their inputs, so a hidden global would
  go stale when the language changes.
- Keys are `<namespace>.<thing>`, stable and descriptive (`venue.readAll`), not the English text.
  Add the English string to `messages/en/<namespace>.ts`.
- Plurals: `{ one: '{count} review', other: '{count} reviews' }` and pass `{ count }`.
  Chinese, Japanese and Korean only use `other`. Never build plurals with `n === 1 ? … : …`.
- Never glue sentences from pieces (`'Worked for ' + label`): word order differs between
  languages. Use one string with placeholders (`'Worked for {need}'`).
- Dates: `fmt.date()` ("6 November 2026" / "2026年11月6日"), relative: `fmt.timeAgo()` (days)
  or `fmt.ago()` (minutes). Lists: `fmt.list()`.
- Data from the server that is *text people wrote* (review notes, photo descriptions, venue
  replies, AI answers quoting them) is not translated. Wrap it in `<UserText>` so it carries
  its own `lang` and screen readers switch voice.
- Proper nouns stay as they are: place names, suburbs, street addresses, "Roam Access",
  OpenStreetMap.
- Server-built sentences (facts in `lib/venues.ts`) carry an `i18n: { key, params }`
  descriptor next to the English text; screens render `t(f.i18n.key, f.i18n.params)`.

## Translating

- Keep keys and `{placeholders}` identical to English; `npm run i18n:check` fails otherwise.
- Plain language: short sentences, everyday words, first person where English uses it
  ("I use a wheelchair"). Disability terms: use the respectful, current term in that
  language (people-first or identity-first as the community prefers).
- Every non-English string starts as **machine-translated**. When a fluent person has
  reviewed a key, add it to `messages/<locale>/_meta.ts → reviewed` (or set `reviewedAll`).
  Until then the language picker says the language was translated by machine.
- Long languages (Spanish runs ~30% longer than English; German would be longer still):
  check 390×844 and 150% text size. Buttons and chips wrap rather than truncate.

## Language attributes

- `<html lang>` follows the chosen language (set before first paint by the inline script in
  `app/(app)/layout.tsx`, then by the provider).
- Language names in the picker carry their own `lang`.
- `<UserText>` marks people's own words with `guessLang()` (script-based: CJK and Hangul
  are reliable; Latin text is treated as English unless it looks Spanish).

## Read aloud

`<ReadAloud text={() => summary} what={t('venue.readWhat', { name })}/>` reads with a voice for
the text's language (`zh-CN`, `ja-JP`, `ko-KR`, `es-ES`, `en-AU`; falls back to the nearest
installed voice). It never starts by itself (iOS Safari only speaks from a tap anyway), long
text is split into sentences (Chrome stops after ~15 s), it stops when you leave the screen,
and Accessibility settings can turn the buttons off or slow the voice. The speaking pulse is
off when motion is reduced.
