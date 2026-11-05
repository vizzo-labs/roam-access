// zh-Hans — 'common' namespace. Machine-translated unless the key is listed in
// ./_meta.ts → reviewed. Keep the same keys and {placeholders} as en/common.ts.
import type { Translation } from '../../types';
import type en from '../en/common';

const common: Translation<typeof en> = {
  'common.back': '返回',
  'common.close': '关闭',
  'common.cancel': '取消',
  'common.send': '发送',
  'common.sending': '正在发送…',
  'common.save': '保存',
  'common.saving': '正在保存…',
  'common.done': '完成',
  'common.next': '下一步',
  'common.edit': '编辑',
  'common.retry': '重试',
  'common.loading': '正在加载…',
  'common.optional': '（可选）',
  'common.yes': '是',
  'common.no': '否',
  'common.opensNewTab': '（在新标签页中打开）',
  'common.justNow': '刚刚',
  'common.reports': { other: '{count} 条反馈' },
  'common.people': { other: '{count} 人' },
  'common.reviews': { other: '{count} 条评价' },
  'common.places': { other: '{count} 个地点' },
  'common.photos': { other: '{count} 张照片' },
  'common.minWalk': '步行 {mins} 分钟',
  'common.offline': '你已离线',
  'common.checkConnection': '请检查网络连接，然后再试一次。',
  'common.language.title': '语言',
  'common.language.hint': '保存在此设备上。评价保持作者所用的语言。',
  'common.language.machine': '这个语言版本由机器翻译。我们很快会请人检查——如果有读起来不对的地方，请告诉我们。',
  'common.readAloud.start': '朗读',
  'common.readAloud.stop': '停止',
  'common.readAloud.named': '朗读：{what}',
  'common.readAloud.stopNamed': '停止朗读：{what}',
  'common.readAloud.setting': '朗读按钮',
  'common.readAloud.settingHint': '在地点摘要上显示“朗读”。它不会自己开始。',
  'common.readAloud.unsupported': '这个浏览器无法朗读。',
  'common.readAloud.speed': '朗读速度',
  'common.readAloud.slower': '慢一些',
  'common.readAloud.normal': '正常',
};

export default common;
