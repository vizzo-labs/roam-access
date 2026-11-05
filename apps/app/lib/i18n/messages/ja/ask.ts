// ja — 'ask' namespace. Machine-translated unless the key is listed in
// ./_meta.ts → reviewed. Keep the same keys and {placeholders} as en/ask.ts.
import type { Translation } from '../../types';
import type en from '../en/ask';

const ask: Translation<typeof en> = {
  'ask.title': "この場所について質問する",
  'ask.description': "回答は Roam の{name}のレビューだけが元です — インターネットや推測は使いません。",
  'ask.noReviewsYet': "まだ誰もレビューしていないので、答える材料がありません。行ったことがありますか？あなたのレビューが第一歩です。",
  'ask.label': "質問",
  'ask.placeholder': "例：正面にスロープはありますか？",
  'ask.submit': "質問する",
  'ask.reading': "レビューを読んでいます…",
  'ask.out': "今日の質問回数を使い切りました — 明日また質問できます。",
  'ask.left': { one: "今日あと{count}回質問できます", other: "今日あと{count}回質問できます" },
  'ask.error': "うまくいきませんでした — もう一度お試しください。",
  'ask.offline': "Roam Access に接続できません — 接続を確認してください。",
  'ask.limit': "今日の質問回数を使い切りました。明日また質問できます。",
  'ask.unavailable': "今は回答できません — 1分ほどしてからお試しください。",
  'ask.from': { one: "{count}件のレビューより", other: "{count}件のレビューより" },
  'ask.basedOn': "根拠になったレビュー",
  'ask.withPhoto': "写真つき",
  'ask.readAll': "すべてのレビューを読む",
  'ask.notTitle': "レビューにはまだ答えがありません",
  'ask.notAction': "行ったことがありますか？体験を共有する",
  'ask.notAnswered': "この場所のレビューにはまだそのことが書かれていないので、お答えできません — 推測もしません。",
  'ask.noReviews': "まだ誰もレビューしていないので、答える材料がありません — 推測もしません。",
};

export default ask;
