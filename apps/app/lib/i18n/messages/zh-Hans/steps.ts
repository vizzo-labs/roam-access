// zh-Hans — 'steps' namespace. Machine-translated unless the key is listed in
// ./_meta.ts → reviewed. Keep the same keys and {placeholders} as en/steps.ts.
import type { Translation } from '../../types';
import type en from '../en/steps';

const steps: Translation<typeof en> = {
  'steps.back': "返回",
  'steps.backStep': "返回上一步",
  'steps.backTo': "返回 {name}",
  'steps.announce': "第 {step} 步，共 {total} 步。{title}",
  'steps.shownAs': "显示为：",
  'steps.change': "更改",
  'steps.changeAria': "更改我在评价中的显示方式",
  'steps.v.lead': "点一下就够了。其余都是可选的。",
  'steps.v.leadCarer': "告诉我们和你一起的人感觉如何。点一下就够了。",
  'steps.v.group': "感觉如何？",
  'steps.v.hint': "选择三个中的一个即可发送。",
  'steps.send': "发送",
  'steps.more': { other: "再多说一点（{count} 个问题）" },
  'steps.q.title': { other: "{count} 个小问题" },
  'steps.q.lead': "为和你需求相同的人准备。不确定的可以跳过。",
  'steps.q.leadCarer': "关于和你一起的人的需求。不确定的可以跳过。",
  'steps.q.notSure': "不确定",
  'steps.q.map': "在地图上标出位置（可选）",
  'steps.q.toExtras': "添加照片或备注",
  'steps.x.title': "还有别的吗？",
  'steps.x.lead': "全部可选。门口或厕所的照片最有帮助。",
  'steps.x.addMore': "想再补充吗？",
  'steps.x.sensory': "噪音和人群",
  'steps.ally.lead': "只回答你亲眼看到的。其余可以跳过。",
  'steps.ally.banner': "你以支持者身份填写。你分享的内容会显示为“支持者观察”，绝不会改变一个地点是否适合某人。",
  'steps.ally.more': { other: "还有 {count} 个问题" },
  'steps.ally.extras': "还有别的吗？（可选）",
  'steps.ally.sent': "显示为“支持者观察”。",
  'steps.setup.skip': "暂时跳过",
  'steps.setup.saved': "你的需求已保存。",
  'steps.setup.group': "我的需求",
};

export default steps;
