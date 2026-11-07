// zh-Hans — 'contrib' namespace. Machine-translated unless the key is listed in
// ./_meta.ts → reviewed. Keep the same keys and {placeholders} as en/contrib.ts.
import type { Translation } from '../../types';
import type en from '../en/contrib';

const contrib: Translation<typeof en> = {
  // ── Who wrote it ─────────────────────────────────────────────
  'contrib.member': 'Roam Access 成员',
  'contrib.rel.lived': '亲身经历',
  'contrib.rel.carer': '照护者',
  'contrib.rel.ally': '支持者',
  'contrib.rel.selfDescribed': '自述',
  'contrib.who.line': '{name} · {label}',
  'contrib.profileLink': '查看{name}的个人主页',

  // ── Ally observations (no verdict) ───────────────────────────
  'contrib.observed.label': '支持者的观察',
  'contrib.observed.default': '我作为支持者注意到的情况。',
  'contrib.observed.note': '这是支持者的观察，永远不会改变评定结果。',
  'contrib.observedFacts.title': '支持者的观察',
  'contrib.observedFacts.lead': '支持者在这里注意到的情况。他们自己没有这些无障碍需求，所以这永远不会改变一个地方是否适合你。',
  'contrib.fact.observed': { other: '{what}——{count} 位支持者观察到' },

  // ── A carer's review is about the person they were with ──────
  'contrib.carer.default.works': '对我陪同的人来说很合适。',
  'contrib.carer.default.check': '对方能应付，但需要一些变通办法，值得了解。',
  'contrib.carer.default.barrier': '对方没能按需要使用这个场所。',

  // ── "This helped me" ─────────────────────────────────────────
  'contrib.helped.button': '这对我有帮助',
  'contrib.helped.count': { other: '帮助了 {count} 人' },
  'contrib.helped.thanked': '谢谢！评价者会看到这帮到了别人。',
  'contrib.helped.failed': '没能保存，请再试一次。',

  // ── The review form adapts to who is writing ─────────────────
  'contrib.review.shownAs': '显示为：{who}',
  'contrib.review.carer.intro': '你正以照护者身份撰写。请告诉大家你陪同的人这次体验如何。',
  'contrib.review.carer.opt.works.label': '对他们很合适',
  'contrib.review.carer.opt.works.sub': '他们能进去、四处走动，也玩得开心',
  'contrib.review.carer.opt.check.label': '有一些障碍',
  'contrib.review.carer.opt.check.sub': '他们能应付，但需要变通办法',
  'contrib.review.carer.opt.barrier.label': '对他们不合适',
  'contrib.review.carer.opt.barrier.sub': '他们没能按需要使用这个场所',
  'contrib.review.carer.needs.title': '是谁的需求？',
  'contrib.review.carer.needs.hint': '你陪同的人的需求。这些来自你的个人资料——如有需要，可以只为这次到访修改。',
  'contrib.review.carer.needs.group': '他们的需求',
  'contrib.review.ally.title': '你在{name}注意到了什么？',
  'contrib.review.ally.intro': '你正以支持者身份撰写。请分享你注意到的情况。它会显示为“支持者的观察”，永远不会改变一个地方是否适合某个人。',
  'contrib.review.ally.more': '你注意到了什么？',
  'contrib.review.ally.moreHint': '只回答你亲眼看到的。如果不确定，再点一次即可清除答案。',
  'contrib.review.ally.choose': '至少回答一个问题才能发送。',
  'contrib.review.ally.send': '发送我注意到的情况',

  // ── How I appear on reviews (setup, Me → profile) ────────────
  'contrib.form.name.label': '评价上显示的名字',
  'contrib.form.name.hint': '名字加姓氏首字母就可以——用昵称也行。',
  'contrib.form.name.placeholder': '例如 Sam K.',
  'contrib.form.name.required': '请填写名字，或选择“匿名发布”。',
  'contrib.form.anon.label': '匿名发布',
  'contrib.form.anon.hint': '你的评价会显示“Roam Access 成员”而不是名字，你也不会有公开主页。',
  'contrib.form.rel.legend': '哪一项最符合你？',
  'contrib.form.rel.hint': '由你自己说明——我们不会核实。这能让读者知道他们读的是谁的经历。',
  'contrib.form.rel.lived': '我有残障或无障碍需求',
  'contrib.form.rel.lived.sub': '显示为“亲身经历”',
  'contrib.form.rel.carer': '我是照护者、家人或支持工作者',
  'contrib.form.rel.carer.sub': '显示为“照护者”。你为你陪同的人写评价。',
  'contrib.form.rel.ally': '我想帮忙（支持者）',
  'contrib.form.rel.ally.sub': '显示为“支持者”。你分享注意到的情况——它永远不会改变评定结果。',
  'contrib.form.rel.unsaid': '不想说',
  'contrib.form.rel.unsaid.sub': '不显示任何标签',
  'contrib.form.needs.label': '在我的评价上显示我的无障碍需求（例如“轮椅使用者”）',
  'contrib.form.needs.hint': '无障碍需求属于健康信息。评价是公开的：任何人都能看到，包括不登录也能在网页上看到。这适用于你的所有评价，你可以随时关闭。',
  'contrib.form.preview': '你的评价将显示',
  'contrib.form.public.named': '评价是公开的。这会显示在你写的每条评价和你的个人主页上。',
  'contrib.form.public.anon': '评价是公开的。你的评价显示“Roam Access 成员”，没有个人主页。',
  'contrib.form.save': '保存',
  'contrib.form.saved': '已保存。你的评价现在会这样显示。',
  'contrib.form.failed': '没能保存。请检查网络连接后再试。',

  'contrib.setup.title': '你在评价上如何显示',
  'contrib.setup.lead': '评价会显示是谁写的，让读者知道这是谁的经历。显示什么由你决定——随时可以在“我”里修改。',

  'contrib.profile.title': '我在评价上如何显示',
  'contrib.profile.back': '返回“我”',
  'contrib.profile.lead': '选择大家在你的评价上看到的名字和标签。',
  'contrib.profile.legacy': '到目前为止，你的评价只显示你的亲身经历（例如“轮椅使用者”），从不显示你的名字。在这里保存之前什么都不会变——保存后，你的所有评价（包括以前的）都会显示你的选择。',
  'contrib.profile.reset': '试点团队移除了你选的名字，所以你的评价显示“Roam Access 成员”。选一个新名字就能再次显示。',

  // ── One-time prompt for accounts from before names ───────────
  'contrib.prompt.title': '评价现在可以显示是谁写的',
  'contrib.prompt.body': '到目前为止，你的评价只显示你的亲身经历，从不显示你的名字。除非你选择显示名字，否则会一直保持这样。',
  'contrib.prompt.choose': '选择我如何显示',
  'contrib.prompt.keep': '保持我的评价不变',

  // ── Me ───────────────────────────────────────────────────────
  'contrib.me.appear.title': '我在评价上如何显示',
  'contrib.me.appear.edit': '修改我在评价上如何显示',
  'contrib.me.appear.legacy': '只显示你的亲身经历，从不显示名字。',
  'contrib.me.appear.choose': '选择',
  'contrib.me.appear.chooseAria': '选择我在评价上如何显示',
  'contrib.me.profileLink': '我的公开主页',
  'contrib.me.badges.title': '我的徽章',
  'contrib.me.badges.count': '已获得 {earned}/{total}',
  'contrib.me.loading': '正在加载你的徽章…',
  'contrib.me.failed': '现在无法加载你的徽章。',

  'contrib.badge.first': '第一条评价',
  'contrib.badge.first.desc': '写了第一条评价',
  'contrib.badge.regular': '常客',
  'contrib.badge.regular.desc': '5 条评价',
  'contrib.badge.local': '本地达人',
  'contrib.badge.local.desc': '15 条评价',
  'contrib.badge.champion': '冠军',
  'contrib.badge.champion.desc': '50 条评价',
  'contrib.badge.entrance': '入口发现者',
  'contrib.badge.entrance.desc': '标记了 3 个无台阶入口',
  'contrib.badge.photographer': '摄影师',
  'contrib.badge.photographer.desc': '10 张带描述的照片',
  'contrib.badge.pathfinder': '探路者',
  'contrib.badge.pathfinder.desc': '分享了 3 组到达步骤',
  'contrib.badge.founding': '创始成员',
  'contrib.badge.founding.desc': '2027 年 3 月 1 日前加入',
  'contrib.badge.mapper': '地图绘制者',
  'contrib.badge.mapper.desc': '参加了一次地图绘制日',
  'contrib.badge.earned': '已获得',
  'contrib.badge.progress': '{have}/{goal}',
  'contrib.badge.notYet': '尚未获得',

  'contrib.newBadge.title': { other: '新徽章' },
  'contrib.newBadge.item': '{name}——{desc}',
  'contrib.newBadge.toast': '新徽章：{name}',
  'contrib.newBadge.see': '查看我的徽章',
  'contrib.newBadge.dismiss': '关闭新徽章消息',

  'contrib.top.title': '本月贡献最多的人',
  'contrib.top.lead': '过去 30 天在 Manly 一带写评价最多的人。只列出显示名字的人。',
  'contrib.top.reviews': { other: '{count} 条评价' },
  'contrib.top.empty': '本月还没有人上榜——你的下一条评价就可能让你出现在这里。',
  'contrib.top.you': '你',

  // ── Review filters ───────────────────────────────────────────
  'contrib.filter.lived': '亲身经历',
  'contrib.filter.carer': '照护者',
  'contrib.filter.ally': '支持者',

  // ── Public profile page /u/[id] (server-rendered) ────────────
  'contrib.page.metaTitle': '{name} · Roam Access',
  'contrib.page.eyebrow': 'Roam Access 成员主页',
  'contrib.page.memberSince': '{date}加入',
  'contrib.page.needs': '无障碍需求：{list}',
  'contrib.page.stats': '贡献',
  'contrib.page.badges': '徽章',
  'contrib.page.noBadges': '还没有徽章。',
  'contrib.page.reviews': '评价',
  'contrib.page.noReviews': '还没有可显示的评价。',
  'contrib.page.observation': '观察——不含评定结果',
  'contrib.page.about': '“亲身经历”“照护者”“支持者”等标签由本人自述。只有评价才能说明一个地方是否合适；支持者的观察永远不会改变评定结果。',
  'contrib.page.open': '打开 Roam Access',
  'contrib.page.place': '在 Roam Access 中打开{name}',
};

export default contrib;
