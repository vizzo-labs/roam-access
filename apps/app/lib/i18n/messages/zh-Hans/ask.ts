// zh-Hans — 'ask' namespace. Machine-translated unless the key is listed in
// ./_meta.ts → reviewed. Keep the same keys and {placeholders} as en/ask.ts.
import type { Translation } from '../../types';
import type en from '../en/ask';

const ask: Translation<typeof en> = {
  'ask.title': "询问这个场所",
  'ask.description': "答案只来自 Roam 上关于{name}的评价 — 不来自网络，也不靠猜测。",
  'ask.noReviewsYet': "还没有人评价过这里，所以没有可以回答的依据。来过吗？你的评价就是第一步。",
  'ask.label': "你的问题",
  'ask.placeholder': "例如：正门有坡道吗？",
  'ask.submit': "提问",
  'ask.reading': "正在阅读评价…",
  'ask.out': "今天的提问次数已用完 — 明天可以再问。",
  'ask.left': { one: "今天还可以问 {count} 个问题", other: "今天还可以问 {count} 个问题" },
  'ask.error': "出了点问题 — 请再试一次。",
  'ask.offline': "无法连接 Roam Access — 请检查网络。",
  'ask.limit': "今天的提问次数已用完。明天可以再问。",
  'ask.unavailable': "暂时无法回答 — 请过一分钟再试。",
  'ask.from': { one: "来自 {count} 条评价", other: "来自 {count} 条评价" },
  'ask.basedOn': "依据的评价",
  'ask.withPhoto': "附照片",
  'ask.readAll': "查看全部评价",
  'ask.notTitle': "评价中还没有答案",
  'ask.notAction': "来过吗？分享你的体验",
  'ask.notAnswered': "这个场所的评价中还没有人提到这一点，所以我们无法回答 — 也不会猜测。",
  'ask.noReviews': "还没有人评价过这里，所以没有可以回答的依据 — 我们也不会猜测。",
};

export default ask;
