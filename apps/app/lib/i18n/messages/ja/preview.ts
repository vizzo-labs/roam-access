// ja — 'preview' namespace. Machine-translated unless the key is listed in
// ./_meta.ts → reviewed. Keep the same keys and {placeholders} as en/preview.ts.
import type { Translation } from '../../types';
import type en from '../en/preview';

const preview: Translation<typeof en> = {
  'preview.close': '{name}のプレビューを閉じる',
  'preview.photoAlt': '{name}の写真',
  'preview.noPhoto': 'まだ写真がありません',
  'preview.addFirst': '最初の写真を追加',
  'preview.addFirstAria': '{name}の最初の写真を追加：レビューを書く',
  'preview.factsLabel': 'あなたのニーズに関するアクセス情報',
  'preview.noInfo': 'あなたのニーズに合うかどうか、まだ誰も答えていません。',
  'preview.feature.stepfree': '段差なし',
  'preview.feature.bathroom': 'バリアフリートイレ',
  'preview.feature.seats': '座席',
  'preview.feature.quiet': '静か',
  'preview.feature.simple': '迷わず移動できる',
  'preview.feature.calm': '落ち着いている',
  'preview.feature.hearing': '聴覚サポート',
  'preview.feature.vision': 'ロービジョンに配慮',
  'preview.state.yes': 'はい',
  'preview.state.no': 'いいえ',
  'preview.state.mixed': '意見が分かれています',
  'preview.state.alt': '別の入口あり',
  'preview.state.unconfirmed': '未確認',
  'preview.seeDetailsAria': '{name}の詳細を見る',
  'preview.details': '詳細',
  'preview.answerOne': '質問に1つ答える',
  'preview.answerOneAria': '{name}について質問に1つ答える',
  'preview.notNow': '今はしない',
  'preview.answerHelps': 'タップ1回だけ。クイック回答として表示されます。',
  'preview.thanks': 'ありがとうございます。回答を保存しました。',
  'preview.moreReports': { other: '詳細ページにほかに {count} 件の報告があります' },
};
export default preview;
