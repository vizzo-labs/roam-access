// "Help fill the gaps" — one plain question per access feature, shared by the
// server (which picks the question) and the screen (which asks it).
import { RA2_NEEDS, type FeatureId } from '../pilot-data';

export const QUICK_QUESTIONS: Record<FeatureId, string> = {
  stepfree: 'Is there a step-free way in?',
  bathroom: 'Is there an accessible bathroom?',
  quiet: 'Is it usually quiet, not loud?',
  calm: 'Is it calm, not hectic?',
  seats: 'Are there seats and places to rest?',
  hearing: 'Is there hearing support, like a hearing loop, captions or staff who write things down?',
  vision: 'Is it good for low vision, with good lighting, large print or staff who help?',
  simple: 'Is it easy to find your way around?',
};

/** "wheelchair or mobility aid users" — who an answer to this question helps. */
export function helpsWho(feature: FeatureId): string {
  const who = RA2_NEEDS.filter(n => n.tags.includes(feature)).map(n => n.whoPlural);
  return who.length ? who.join(' and ') : 'everyone';
}
