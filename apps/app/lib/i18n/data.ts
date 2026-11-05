// Translated labels for shared product data (needs, review questions,
// categories, kinds of place, verdicts). Pass the `t` from useT().
import type { T } from './core';

type NeedField = 'label' | 'chip' | 'short' | 'who' | 'whoPlural' | 'filter';
type FeatureField = 'question' | 'yes' | 'yesShort' | 'no' | 'noShort' | 'label';

export const needText = (t: T, id: string, field: NeedField) => t(`data.need.${id}.${field}`);
export const featureText = (t: T, id: string, field: FeatureField) => t(`data.feature.${id}.${field}`);
export const tileLabel = (t: T, id: string) => t(`data.tile.${id}`);
export const verdictLabel = (t: T, kind: string) => t(`data.verdict.${kind}`);
/** "Restaurant" → "餐厅"; unknown kinds stay as stored. */
export function kindLabel(t: T, kind: string | null | undefined) {
  if (!kind) return '';
  const key = `data.kind.${kind.toLowerCase().replace(/ /g, '_')}`;
  return t.has(key) ? t(key) : kind;
}
