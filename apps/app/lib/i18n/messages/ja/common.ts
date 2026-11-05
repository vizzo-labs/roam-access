// ja — 'common' namespace. Machine-translated unless the key is listed in
// ./_meta.ts → reviewed. Keep the same keys and {placeholders} as en/common.ts.
import type { Translation } from '../../types';
import type en from '../en/common';

const common: Translation<typeof en> = {
  'common.back': '戻る',
  'common.close': '閉じる',
  'common.cancel': 'キャンセル',
  'common.send': '送信',
  'common.sending': '送信中…',
  'common.save': '保存',
  'common.saving': '保存中…',
  'common.done': '完了',
  'common.next': '次へ',
  'common.edit': '編集',
  'common.retry': 'もう一度試す',
  'common.loading': '読み込み中…',
  'common.optional': '（任意）',
  'common.yes': 'はい',
  'common.no': 'いいえ',
  'common.opensNewTab': '（新しいタブで開きます）',
  'common.justNow': 'たった今',
  'common.reports': { other: '{count}件の報告' },
  'common.people': { other: '{count}人' },
  'common.reviews': { other: '{count}件のレビュー' },
  'common.places': { other: '{count}か所' },
  'common.photos': { other: '{count}枚の写真' },
  'common.minWalk': '徒歩{mins}分',
  'common.offline': 'オフラインです',
  'common.checkConnection': '接続を確認して、もう一度お試しください。',
  'common.language.title': '言語',
  'common.language.hint': 'この端末に保存されます。レビューは書いた人の言語のまま表示されます。',
  'common.language.machine': 'この言語は機械翻訳です。近いうちに人が確認します。おかしな表現があれば教えてください。',
  'common.readAloud.start': '読み上げ',
  'common.readAloud.stop': '停止',
  'common.readAloud.named': '読み上げ：{what}',
  'common.readAloud.stopNamed': '読み上げを停止：{what}',
  'common.readAloud.setting': '読み上げボタン',
  'common.readAloud.settingHint': '場所の概要に「読み上げ」を表示します。自動で始まることはありません。',
  'common.readAloud.unsupported': 'このブラウザは読み上げに対応していません。',
  'common.readAloud.speed': '読み上げの速さ',
  'common.readAloud.slower': 'ゆっくり',
  'common.readAloud.normal': 'ふつう',
};

export default common;
