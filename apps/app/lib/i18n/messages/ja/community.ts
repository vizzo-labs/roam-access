// ja — 'community' namespace. Machine-translated unless the key is listed in
// ./_meta.ts → reviewed. Keep the same keys and {placeholders} as en/community.ts.
import type { Translation } from '../../types';
import type en from '../en/community';

const community: Translation<typeof en> = {
  'community.q.stepfree': '段差なしで入れますか？',
  'community.q.bathroom': 'バリアフリートイレはありますか？',
  'community.q.quiet': 'たいてい静かで、うるさくないですか？',
  'community.q.calm': '落ち着いていて、慌ただしくないですか？',
  'community.q.seats': '座る場所や休める場所はありますか？',
  'community.q.hearing': '聞こえのサポートはありますか？（ヒアリングループ、字幕、筆談してくれるスタッフなど）',
  'community.q.vision': '弱視の人にやさしいですか？（明るい照明、大きな文字、手伝ってくれるスタッフなど）',
  'community.q.simple': '中で迷わずに移動できますか？',

  'community.hint.unconfirmed.yes': 'OpenStreetMapでは「はい」となっていますが、まだ誰も確認していません。',
  'community.hint.unconfirmed.partly': 'OpenStreetMapでは「一部」となっていますが、まだ誰も確認していません。',
  'community.hint.unconfirmed.no': 'OpenStreetMapでは「いいえ」となっていますが、まだ誰も確認していません。',
  'community.hint.none': 'まだ誰も答えていません。',
  'community.hint.mixed': '今のところ意見が分かれています：はい {yes}、いいえ {no}。',
  'community.hint.one': 'まだ1人しか答えていません。',
  'community.helps': '{who}の役に立ちます。',
  'community.helpsEveryone': 'みんなの役に立ちます。',

  'community.prompt.overline': '情報の空白をうめる',
  'community.prompt.title': { other: '近くの{count}か所で、ひとことの回答が必要です' },
  'community.prompt.sub': '「はい」か「いいえ」をタップするだけ。行ったことがある場所だけ答えてください。',

  'community.gaps.overline': '情報の空白をうめる',
  'community.gaps.loading': '近くの場所を探しています…',
  'community.gaps.error': '質問を読み込めませんでした',
  'community.gaps.nothing': '今、近くで回答が必要な場所はありません',
  'community.gaps.done': '完了しました。ありがとうございます',
  'community.gaps.allForNow': '今はこれで全部です',
  'community.gaps.intro': '行ったことがある場所だけ答えてください。回答は「ひとこと回答」としてその場所に表示され、あなたと同じニーズのある人の役に立ちます。',
  'community.gaps.event': 'あなたの回答は{event}にカウントされます。',
  'community.gaps.leaderboard': 'ランキングを見る',
  'community.gaps.questionOf': '質問 {n}/{total}',
  'community.gaps.placeLine': '{kind} · {walk} · {area}',
  'community.gaps.skip': 'わからない — スキップする',
  'community.gaps.seeFirst': '先に{name}を見る',
  'community.gaps.saved': '保存しました：{name}は「{answer}」。ありがとうございます。',
  'community.gaps.answerYes': 'はい',
  'community.gaps.answerNo': 'いいえ',
  'community.gaps.live': { other: 'あなたの回答{count}件が公開されました' },
  'community.gaps.noneNear': '歩いて25分以内の場所には、あなたのニーズについての回答がすでにあるか、あなたが回答済みです。最近どこかへ行きましたか？ 詳しいレビューはさらに役に立ちます。',
  'community.gaps.more': 'もう少し答える',
  'community.gaps.backHome': 'ホームに戻る',
};

export default community;
