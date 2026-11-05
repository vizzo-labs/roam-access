// zh-Hans — 'preview' namespace. Machine-translated unless the key is listed in
// ./_meta.ts → reviewed. Keep the same keys and {placeholders} as en/preview.ts.
import type { Translation } from '../../types';
import type en from '../en/preview';

const preview: Translation<typeof en> = {
  'preview.close': '关闭 {name} 的预览',
  'preview.photoAlt': '{name} 的照片',
  'preview.noPhoto': '还没有照片',
  'preview.addFirst': '添加第一张',
  'preview.addFirstAria': '添加 {name} 的第一张照片：写一条评价',
  'preview.factsLabel': '与你的需求相关的无障碍信息',
  'preview.noInfo': '还没有人说过这里是否适合你的需求。',
  'preview.feature.stepfree': '无台阶',
  'preview.feature.bathroom': '无障碍卫生间',
  'preview.feature.seats': '座位',
  'preview.feature.quiet': '安静',
  'preview.feature.simple': '容易找路',
  'preview.feature.calm': '平静',
  'preview.feature.hearing': '听力支持',
  'preview.feature.vision': '适合低视力',
  'preview.state.yes': '是',
  'preview.state.no': '否',
  'preview.state.mixed': '说法不一',
  'preview.state.alt': '有其他入口',
  'preview.state.unconfirmed': '未确认',
  'preview.seeDetailsAria': '查看 {name} 的详情',
  'preview.details': '详情',
  'preview.answerOne': '回答 1 个问题',
  'preview.answerOneAria': '回答 1 个关于 {name} 的问题',
  'preview.notNow': '以后再说',
  'preview.answerHelps': '点一下就好。它会显示为快速回答。',
  'preview.thanks': '谢谢。你的回答已保存。',
  'preview.moreReports': { other: '详情页上还有 {count} 条报告' },
};
export default preview;
