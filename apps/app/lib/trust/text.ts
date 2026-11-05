// Translatable text built on the server (#21). The server keeps writing the
// English sentence (server pages, the public summary, AI prompts use it) and
// adds a descriptor so the app can show the same sentence in the reader's
// language:
//   { key: 'facts.s.reports', params: { count: 3 }, refs: { what: 'data.feature.stepfree.yesShort' } }
// `refs` are params that are themselves message keys (translated first);
// `{ key, lower: true }` lower-cases the result (English "1 wheelchair user").
// `suffix` is appended (a parenthetical such as "(quick answers)").

export type TextRef = string | { key: string; lower?: boolean; params?: Record<string, string | number> };
export type I18nText = {
  key: string;
  params?: Record<string, string | number>;
  refs?: Record<string, TextRef>;
  suffix?: I18nText;
};

type TLike = ((key: string, params?: Record<string, string | number | null | undefined>) => string) & { locale?: string };

/** Render a descriptor with the screen's t(). Returns null when there is none. */
export function textOf(t: TLike, d: I18nText | null | undefined): string | null {
  if (!d) return null;
  const params: Record<string, string | number> = { ...(d.params || {}) };
  for (const [name, ref] of Object.entries(d.refs || {})) {
    const r = typeof ref === 'string' ? { key: ref } : ref;
    let s = t(r.key, r.params);
    if (r.lower) s = s.toLocaleLowerCase(t.locale || 'en-AU');
    params[name] = s;
  }
  return t(d.key, params) + (d.suffix ? textOf(t, d.suffix) : '');
}
