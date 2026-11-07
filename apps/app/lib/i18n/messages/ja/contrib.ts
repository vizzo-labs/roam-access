// ja — 'contrib' namespace. Machine-translated unless the key is listed in
// ./_meta.ts → reviewed. Keep the same keys and {placeholders} as en/contrib.ts.
import type { Translation } from '../../types';
import type en from '../en/contrib';

const contrib: Translation<typeof en> = {
  // ── Who wrote it ─────────────────────────────────────────────
  'contrib.member': 'Roam Access メンバー',
  'contrib.rel.lived': '当事者',
  'contrib.rel.carer': '介助者',
  'contrib.rel.ally': 'サポーター',
  'contrib.rel.selfDescribed': '自己申告',
  'contrib.who.line': '{name} · {label}',
  'contrib.profileLink': '{name}さんのプロフィールを見る',

  // ── Ally observations (no verdict) ───────────────────────────
  'contrib.observed.label': 'サポーターの観察',
  'contrib.observed.default': 'サポーターとして気づいたことです。',
  'contrib.observed.note': 'サポーターの観察です。判定は変わりません。',
  'contrib.observedFacts.title': 'サポーターの観察',
  'contrib.observedFacts.lead': 'サポーターがここで気づいたことです。本人にはこのアクセスのニーズがないため、場所があなたに合うかどうかは変わりません。',
  'contrib.fact.observed': { other: '{what} — サポーター{count}人が観察' },

  // ── A carer's review is about the person they were with ──────
  'contrib.carer.default.works': '一緒に行った人に合っていました。',
  'contrib.carer.default.check': 'なんとか利用できましたが、知っておくとよい工夫が必要でした。',
  'contrib.carer.default.barrier': '必要なかたちで施設を利用できませんでした。',

  // ── "This helped me" ─────────────────────────────────────────
  'contrib.helped.button': '役に立った',
  'contrib.helped.count': { other: '{count}人の役に立ちました' },
  'contrib.helped.thanked': 'ありがとうございます。誰かの役に立ったことがレビューを書いた人に伝わります。',
  'contrib.helped.failed': '保存できませんでした。もう一度お試しください。',

  // ── The review form adapts to who is writing ─────────────────
  'contrib.review.shownAs': '表示：{who}',
  'contrib.review.carer.intro': '介助者として書いています。一緒に行った人にとってどうだったかを教えてください。',
  'contrib.review.carer.opt.works.label': 'その人に合っていた',
  'contrib.review.carer.opt.works.sub': '入れて、中を移動できて、楽しめた',
  'contrib.review.carer.opt.check.label': "いくつか問題があった",
  'contrib.review.carer.opt.check.sub': "なんとかなったけれど、ほかの人は先に知っておくべき",
  'contrib.review.carer.opt.barrier.label': 'その人には合わなかった',
  'contrib.review.carer.opt.barrier.sub': '必要なかたちで施設を利用できなかった',
  'contrib.review.carer.needs.title': '誰のニーズですか？',
  'contrib.review.carer.needs.hint': '一緒に行った人のニーズです。プロフィールから入っています。必要なら今回の訪問だけ変更してください。',
  'contrib.review.carer.needs.group': 'その人のニーズ',
  'contrib.review.ally.title': '{name}で何に気づきましたか？',
  'contrib.review.ally.intro': 'サポーターとして書いています。気づいたことを共有してください。「サポーターの観察」として表示され、場所が誰かに合うかどうかは変わりません。',
  'contrib.review.ally.more': '何に気づきましたか？',
  'contrib.review.ally.moreHint': '自分の目で見たことだけ答えてください。自信がなければ、もう一度タップすると回答を消せます。',
  'contrib.review.ally.choose': '送信するには、少なくとも1つの質問に答えてください。',
  'contrib.review.ally.send': '気づいたことを送る',

  // ── How I appear on reviews (setup, Me → profile) ────────────
  'contrib.form.name.label': 'レビューに表示する名前',
  'contrib.form.name.hint': '名前と名字の頭文字だけで大丈夫です。ニックネームでもかまいません。',
  'contrib.form.name.placeholder': '例：Sam K.',
  'contrib.form.name.required': '名前を入れるか、「匿名で投稿」を選んでください。',
  'contrib.form.anon.label': '匿名で投稿',
  'contrib.form.anon.hint': 'レビューには名前の代わりに「Roam Access メンバー」と表示され、公開プロフィールはありません。',
  'contrib.form.rel.legend': 'あてはまるものはどれですか？',
  'contrib.form.rel.hint': '自己申告です。確認はしません。誰の経験を読んでいるのかが読む人に伝わります。',
  'contrib.form.rel.lived': '障害やアクセスのニーズがある',
  'contrib.form.rel.lived.sub': '「当事者」と表示されます',
  'contrib.form.rel.carer': '介助者・家族・支援者である',
  'contrib.form.rel.carer.sub': '「介助者」と表示されます。一緒に行った人のためにレビューします。',
  'contrib.form.rel.ally': '手伝いたい（サポーター）',
  'contrib.form.rel.ally.sub': '「サポーター」と表示されます。気づいたことを共有します。判定は変わりません。',
  'contrib.form.rel.unsaid': '答えたくない',
  'contrib.form.rel.unsaid.sub': 'ラベルは表示されません',
  'contrib.form.needs.label': 'レビューにアクセスのニーズを表示する（例：「車いす利用者」）',
  'contrib.form.needs.hint': 'アクセスのニーズは健康に関する情報です。レビューは公開されます。サインインしなくてもウェブで誰でも読めます。この設定はすべてのレビューに適用され、いつでもオフにできます。',
  'contrib.form.preview': 'レビューの表示',
  'contrib.form.public.named': 'レビューは公開されます。これは書いたすべてのレビューとプロフィールページに表示されます。',
  'contrib.form.public.anon': 'レビューは公開されます。あなたのレビューには「Roam Access メンバー」と表示され、プロフィールページはありません。',
  'contrib.form.save': '保存',
  'contrib.form.saved': '保存しました。レビューにこのように表示されます。',
  'contrib.form.failed': '保存できませんでした。接続を確認して、もう一度お試しください。',

  'contrib.setup.title': 'レビューでの表示',
  'contrib.setup.lead': 'レビューには書いた人が表示されるので、誰の経験なのかが読む人に伝わります。何を表示するかはあなたが決められます。「マイページ」でいつでも変更できます。',

  'contrib.profile.title': 'レビューでの表示',
  'contrib.profile.back': '「マイページ」に戻る',
  'contrib.profile.lead': 'レビューに表示される名前とラベルを選んでください。',
  'contrib.profile.legacy': 'これまでのレビューには、名前ではなく当事者としての経験（「車いす利用者」など）だけが表示されています。ここで保存するまで何も変わりません。保存すると、過去のものも含めてすべてのレビューに選んだ内容が表示されます。',
  'contrib.profile.reset': 'パイロットチームが選んだ名前を削除したため、レビューには「Roam Access メンバー」と表示されています。もう一度名前を表示するには、新しい名前を選んでください。',

  // ── One-time prompt for accounts from before names ───────────
  'contrib.prompt.title': 'レビューに書いた人を表示できるようになりました',
  'contrib.prompt.body': 'これまでのレビューには、名前ではなく当事者としての経験だけが表示されています。名前を表示することを選ばない限り、このままです。',
  'contrib.prompt.choose': '表示のしかたを選ぶ',
  'contrib.prompt.keep': 'レビューは今のままにする',

  // ── Me ───────────────────────────────────────────────────────
  'contrib.me.appear.title': 'レビューでの表示',
  'contrib.me.appear.edit': 'レビューでの表示を編集する',
  'contrib.me.appear.legacy': '当事者としての経験だけ。名前は表示されません。',
  'contrib.me.appear.choose': '選ぶ',
  'contrib.me.appear.chooseAria': 'レビューでの表示を選ぶ',
  'contrib.me.profileLink': '公開プロフィール',
  'contrib.me.badges.title': 'バッジ',
  'contrib.me.badges.count': '{total}個中{earned}個獲得',
  'contrib.me.loading': 'バッジを読み込んでいます…',
  'contrib.me.failed': '今はバッジを読み込めません。',

  'contrib.badge.first': 'はじめてのレビュー',
  'contrib.badge.first.desc': 'はじめてレビューを書いた',
  'contrib.badge.regular': '常連',
  'contrib.badge.regular.desc': 'レビュー5件',
  'contrib.badge.local': '地元の達人',
  'contrib.badge.local.desc': 'レビュー15件',
  'contrib.badge.champion': 'チャンピオン',
  'contrib.badge.champion.desc': 'レビュー50件',
  'contrib.badge.entrance': '入口ファインダー',
  'contrib.badge.entrance.desc': '段差のない入口を3つ登録した',
  'contrib.badge.photographer': 'フォトグラファー',
  'contrib.badge.photographer.desc': '説明つきの写真10枚',
  'contrib.badge.pathfinder': 'パスファインダー',
  'contrib.badge.pathfinder.desc': '到着までの手順を3つ共有した',
  'contrib.badge.founding': '創設メンバー',
  'contrib.badge.founding.desc': '2027年3月1日より前に参加',
  'contrib.badge.mapper': 'マッパー',
  'contrib.badge.mapper.desc': 'マッピングデーに参加した',
  'contrib.badge.earned': '獲得済み',
  'contrib.badge.progress': '{have}/{goal}',
  'contrib.badge.notYet': 'まだ',

  'contrib.newBadge.title': { other: '新しいバッジ' },
  'contrib.newBadge.item': '{name} — {desc}',
  'contrib.newBadge.toast': '新しいバッジ：{name}',
  'contrib.newBadge.see': 'バッジを見る',
  'contrib.newBadge.dismiss': '新しいバッジのお知らせを閉じる',

  'contrib.top.title': '今月のトップ投稿者',
  'contrib.top.lead': '過去30日間に Manly 周辺でいちばん多くレビューした人です。名前を表示している人だけが載ります。',
  'contrib.top.reviews': { other: 'レビュー{count}件' },
  'contrib.top.empty': '今月はまだ誰もいません。次のレビューであなたが載るかもしれません。',
  'contrib.top.you': 'あなた',

  // ── Review filters ───────────────────────────────────────────
  'contrib.filter.lived': '当事者',
  'contrib.filter.carer': '介助者',
  'contrib.filter.ally': 'サポーター',

  // ── Public profile page /u/[id] (server-rendered) ────────────
  'contrib.page.metaTitle': '{name} · Roam Access',
  'contrib.page.eyebrow': 'Roam Access メンバーのプロフィール',
  'contrib.page.memberSince': '{date}から参加',
  'contrib.page.needs': 'アクセスのニーズ：{list}',
  'contrib.page.stats': '貢献',
  'contrib.page.badges': 'バッジ',
  'contrib.page.noBadges': 'まだバッジはありません。',
  'contrib.page.reviews': 'レビュー',
  'contrib.page.noReviews': '表示できるレビューはまだありません。',
  'contrib.page.observation': '観察 — 判定なし',
  'contrib.page.about': '「当事者」「介助者」「サポーター」などのラベルは自己申告です。場所が合うかどうかを示せるのはレビューだけです。サポーターの観察で判定が変わることはありません。',
  'contrib.page.open': 'Roam Access を開く',
  'contrib.page.place': 'Roam Access で{name}を開く',
};

export default contrib;
