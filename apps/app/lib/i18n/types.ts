import type { Msg } from './core';

// A translation of one English namespace: same keys (any may be missing — it
// falls back to English), each a string or plural forms.
type Widen<T> = T extends string ? string : T extends object ? Msg : Msg;
export type Translation<E> = { [K in keyof E]?: Widen<E[K]> };
