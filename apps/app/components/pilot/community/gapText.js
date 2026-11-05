// "Help fill the gaps" text in the reader's language (#21). The server picks
// the question; these build its words from the task's feature and status.
// Pass `t` and `fmt` from useT() / useFormat().
import { RA2_NEEDS } from '@/lib/pilot-data';

export const gapQuestion = (t, task) => t(`community.q.${task.feature}`);

export function gapHint(t, task) {
  if (task.status === 'unconfirmed' && task.osm) return t(`community.hint.unconfirmed.${task.osm}`);
  if (task.status === 'mixed') return t('community.hint.mixed', { yes: task.yes ?? 0, no: task.no ?? 0 });
  if (task.status === 'one') return t('community.hint.one');
  return t('community.hint.none');
}

/** "Helps wheelchair or mobility aid users." */
export function gapHelps(t, fmt, feature) {
  const who = RA2_NEEDS.filter(n => n.tags.includes(feature)).map(n => t(`data.need.${n.id}.whoPlural`));
  return who.length ? t('community.helps', { who: fmt.list(who) }) : t('community.helpsEveryone');
}
