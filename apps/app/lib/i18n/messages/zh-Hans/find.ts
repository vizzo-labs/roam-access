// zh-Hans — 'find' namespace. Machine-translated unless the key is listed in
// ./_meta.ts → reviewed. Keep the same keys and {placeholders} as en/find.ts.
import type { Translation } from '../../types';
import type en from '../en/find';

const find: Translation<typeof en> = {
  'find.title': "查找地点",
  'find.lead': "曼利周边的地点，由和你需求相似的人检查过。",
  'find.search.label': "搜索地点或地点类型",
  'find.search.placeholder': "咖啡馆、海滩、Hugos…",
  'find.browse': "浏览",
  'find.nearMe': "我附近",
  'find.toilets': "厕所",
  'find.prompt': "去过 {name} 吗？告诉我们感觉如何。",
  'find.promptHint': "点一下就好。这能帮助和你需求相似的人。",
  'find.near.title': "你附近",
  'find.near.list': "你附近的地点",
  'find.walkingFrom': "从 {origin} 步行。",
  'find.seeAll': { other: "查看全部 {count} 个地点" },
  'find.row.name': "{name}，{kind}，{walk}，{verdict}",
  'find.row.beFirst': "来过这里？做第一个评价的人",
  'find.results.back': "返回",
  'find.results.backLabel': "返回查找",
  'find.results.srFor': "{query} 的搜索结果。",
  'find.filters.nearest': "最近的优先",
  'find.filters.more': "更多筛选",
  'find.filters.moreOn': { other: "已开 {count} 项" },
  'find.more.lead': "筛选只会缩小列表，绝不会改变评定。",
  'find.more.hideBarriers': "隐藏有障碍的地点",
  'find.more.show': { other: "显示 {count} 个地点" },
  'find.showAs': "显示方式",
  'find.showMore': "再显示 {n} 个（还剩 {rest} 个）",
  'find.empty.body': "试试搜索地点类型，比如咖啡馆或海滩。",
  'find.empty.seeAll': "查看所有地点",
};

export default find;
