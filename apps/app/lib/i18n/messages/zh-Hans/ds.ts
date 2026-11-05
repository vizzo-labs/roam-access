// zh-Hans — 'ds' namespace. Machine-translated unless the key is listed in
// ./_meta.ts → reviewed. Keep the same keys and {placeholders} as en/ds.ts.
import type { Translation } from '../../types';
import type en from '../en/ds';

const ds: Translation<typeof en> = {
  'ds.actions': "操作",
  'ds.dismiss': "关闭",
  'ds.removeFilter': "移除筛选：{name}",
  'ds.loadingPlaces': "正在加载地点…",
  'ds.badge.fromReviews': { other: "来自 {count} 条评价" },
  'ds.badge.community': "社区评价",
  'ds.badge.osm': "OpenStreetMap · 未经确认",
  'ds.badge.venue': "场所自述",
  'ds.badge.partnerNamed': "{name} 成员",
  'ds.badge.partner': "合作项目",
  'ds.badge.photo': "照片",
  'ds.freshness.last': "最近确认：{when}",
  'ds.freshness.never': "尚未确认",
  'ds.photo.open': "打开第 {n} 张照片（共 {total} 张）：{kind}。{alt}",
  'ds.photo.count': "第 {n} 张，共 {total} 张",
  'ds.photo.close': "关闭照片",
  'ds.photo.prev': "上一张照片",
  'ds.photo.next': "下一张照片",
  'ds.photo.fromReview': "来自一条评价",
  'ds.photo.position': "第 {n} 张照片，共 {total} 张：{kind}",
  'ds.photo.keysMany': "← → 切换 · Esc 关闭",
  'ds.photo.keysOne': "Esc 关闭",
  'ds.search.label': "搜索地点",
  'ds.search.clear': "清除搜索",
  'ds.search.voice': "语音搜索",
  'ds.search.submit': "搜索",
  'ds.sheet.closeNamed': "关闭{title}",
  'ds.snap.peek': "已收起",
  'ds.snap.half': "半屏",
  'ds.snap.full': "全屏",
  'ds.snap.expand': "展开",
  'ds.snap.collapse': "收起",
  'ds.snap.announce': "{label}：{size}",
  'ds.snap.handle': "{label}：{size}。按下可{action}；方向键可调整大小。",
};

export default ds;
