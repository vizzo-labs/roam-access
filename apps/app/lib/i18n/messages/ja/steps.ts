// ja — 'steps' namespace. Machine-translated unless the key is listed in
// ./_meta.ts → reviewed. Keep the same keys and {placeholders} as en/steps.ts.
import type { Translation } from '../../types';
import type en from '../en/steps';

const steps: Translation<typeof en> = {
  'steps.back': "戻る",
  'steps.backStep': "1つ前に戻る",
  'steps.backTo': "{name} に戻る",
  'steps.announce': "ステップ {step} / {total}。{title}",
  'steps.shownAs': "表示名：",
  'steps.change': "変更",
  'steps.changeAria': "口コミでの表示を変更",
  'steps.v.lead': "ワンタップで十分です。ほかは任意です。",
  'steps.v.leadCarer': "一緒にいた人にとってどうだったか教えてください。ワンタップで十分です。",
  'steps.v.group': "どうでしたか？",
  'steps.v.hint': "3つから1つ選ぶと送れます。",
  'steps.send': "送る",
  'steps.more': { other: "もう少し答える（質問 {count} つ）" },
  'steps.q.title': { other: "かんたんな質問 {count} つ" },
  'steps.q.lead': "同じニーズのある人のための質問です。わからないものは飛ばしてください。",
  'steps.q.leadCarer': "一緒にいた人のニーズについての質問です。わからないものは飛ばしてください。",
  'steps.q.notSure': "わからない",
  'steps.q.map': "地図で場所を示す（任意）",
  'steps.q.toExtras': "写真やメモを追加",
  'steps.x.title': "ほかにありますか？",
  'steps.x.lead': "すべて任意です。入り口やトイレの写真がいちばん役に立ちます。",
  'steps.x.addMore': "もっと追加しますか？",
  'steps.x.sensory': "音と混雑",
  'steps.ally.lead': "自分で見たことだけ答えてください。ほかは飛ばしてください。",
  'steps.ally.banner': "サポーターとして書いています。共有した内容は「サポーターの観察」と表示され、その場所が誰かに合うかどうかは変わりません。",
  'steps.ally.more': { other: "あと {count} つの質問" },
  'steps.ally.extras': "ほかにありますか？（任意）",
  'steps.ally.sent': "「サポーターの観察」と表示されます。",
  'steps.setup.skip': "今はスキップ",
  'steps.setup.saved': "ニーズを保存しました。",
  'steps.setup.group': "私のニーズ",
};

export default steps;
