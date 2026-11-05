// ja — 'onboarding' namespace. Machine-translated unless the key is listed in
// ./_meta.ts → reviewed. Keep the same keys and {placeholders} as en/onboarding.ts.
import type { Translation } from '../../types';
import type en from '../en/onboarding';

const onboarding: Translation<typeof en> = {
  'onboarding.welcome.overline': '障害のある人のために',
  'onboarding.welcome.title': '本当にあなたに合う場所を見つけよう',
  'onboarding.welcome.lead': '実際の当事者が確かめた、本当のアクセシビリティ情報。お店の自己申告ではありません。',
  'onboarding.welcome.point1': '障害のある人たちと一緒に作っています',
  'onboarding.welcome.point2': 'あらゆる障害に対応。車いすだけではありません',
  'onboarding.welcome.point3': 'あなたは無料。ずっと無料です。',
  'onboarding.welcome.join': 'パイロットに参加する',
  'onboarding.welcome.signIn': 'アカウントを持っています',
  'onboarding.welcome.pilot': 'マンリーとその周辺でのパイロット。参加者が実在の場所をレビューしています。',
  'onboarding.howItWorks': 'Roam Access のしくみ',
  'onboarding.step': 'ステップ {step}/{total}',
  'onboarding.questionMark': '？',
  'onboarding.continue': '次へ →',
  'onboarding.finish': '完了 →',
  'onboarding.needs.title': '場所を楽しむために、何が必要ですか',
  'onboarding.needs.lead': 'いくつ選んでもかまいません。合う順に場所を並べます。いつでも変更でき、飛ばすこともできます。',
  'onboarding.needs.privacy': '結果をあなたに合わせるために安全に保存します。レビューには名前ではなく、当事者としての経験（例：「車いす利用者」）だけが表示されます。「マイページ」からいつでもすべて削除できます。',
  'onboarding.name.title': '何とお呼びしましょうか',
  'onboarding.name.lead': 'まったく任意です。好きな名前でかまいません。レビューに名前は表示されず、当事者としての経験だけが表示されます。',
  'onboarding.name.label': 'お名前',
  'onboarding.name.placeholder': '例：ナオミ',
  'onboarding.name.done': '準備ができました。パイロットへの参加ありがとうございます。',
  'onboarding.verdicts.title': '場所の見え方',
  'onboarding.verdicts.lead': 'どの場所にも、あなたのニーズに合わせた答えがひとつ出ます。「あなたに合う」と言えるのは、パイロット参加者のレビューだけです。',
  'onboarding.verdicts.works': 'あなたと似たニーズの人が「大丈夫だった」と言っています。',
  'onboarding.verdicts.check': '事前に知っておくことがある、またはまだ確認されていません。',
  'onboarding.verdicts.barrier': 'あなたと似たニーズの人が、実際にバリアにぶつかりました。',
  'onboarding.verdicts.unknown': 'あなたのニーズでレビューした人はまだいません。',
};

export default onboarding;
