// zh-Hans — 'community' namespace. Machine-translated unless the key is listed in
// ./_meta.ts → reviewed. Keep the same keys and {placeholders} as en/community.ts.
import type { Translation } from '../../types';
import type en from '../en/community';

const community: Translation<typeof en> = {
  'community.q.stepfree': '有无台阶的入口吗？',
  'community.q.bathroom': '有无障碍洗手间吗？',
  'community.q.quiet': '通常安静，不吵吗？',
  'community.q.calm': '氛围平静，不忙乱吗？',
  'community.q.seats': '有座位和休息的地方吗？',
  'community.q.hearing': '有听力辅助吗？比如助听环路、字幕，或会用书写沟通的员工？',
  'community.q.vision': '对低视力的人友好吗？比如照明好、有大字或员工会帮忙？',
  'community.q.simple': '容易找到路吗？',

  'community.hint.unconfirmed.yes': 'OpenStreetMap 上写着“是”，但还没有人确认。',
  'community.hint.unconfirmed.partly': 'OpenStreetMap 上写着“部分”，但还没有人确认。',
  'community.hint.unconfirmed.no': 'OpenStreetMap 上写着“否”，但还没有人确认。',
  'community.hint.none': '还没有人回答过这个问题。',
  'community.hint.mixed': '目前大家说法不一：{yes} 人说是，{no} 人说否。',
  'community.hint.one': '目前只有一个人回答过。',
  'community.helps': '能帮助{who}。',
  'community.helpsEveryone': '能帮助所有人。',

  'community.prompt.overline': '帮忙补全信息',
  'community.prompt.title': { other: '你附近有 {count} 个地方需要一个快速回答' },
  'community.prompt.sub': '是或否——每题点一下。只在你去过时回答。',

  'community.gaps.overline': '帮忙补全信息',
  'community.gaps.loading': '正在查找你附近的地方…',
  'community.gaps.error': '无法加载问题',
  'community.gaps.nothing': '你附近目前没有需要回答的问题',
  'community.gaps.done': '完成了——谢谢你',
  'community.gaps.allForNow': '暂时就这些',
  'community.gaps.intro': '只在你去过时回答。每个回答都会以“快速回答”显示在该地点，帮助和你有相同需求的人。',
  'community.gaps.event': '你的回答会计入 {event}。',
  'community.gaps.leaderboard': '查看排行榜',
  'community.gaps.questionOf': '第 {n} 题，共 {total} 题',
  'community.gaps.placeLine': '{kind} · {walk} · {area}',
  'community.gaps.skip': '不确定——跳过这题',
  'community.gaps.seeFirst': '先看看{name}',
  'community.gaps.saved': '已保存：{name}，{answer}。谢谢你。',
  'community.gaps.answerYes': '是',
  'community.gaps.answerNo': '否',
  'community.gaps.live': { other: '你的 {count} 个回答已经发布' },
  'community.gaps.noneNear': '步行 25 分钟内的每个地方都已有针对你需求的回答，或你已经回答过了。最近去过什么地方吗？写一条完整评价会更有帮助。',
  'community.gaps.more': '再回答几题',
  'community.gaps.backHome': '返回首页',
};

export default community;
