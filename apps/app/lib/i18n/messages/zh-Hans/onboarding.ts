// zh-Hans — 'onboarding' namespace. Machine-translated unless the key is listed in
// ./_meta.ts → reviewed. Keep the same keys and {placeholders} as en/onboarding.ts.
import type { Translation } from '../../types';
import type en from '../en/onboarding';

const onboarding: Translation<typeof en> = {
  'onboarding.welcome.overline': '为残障人士而做',
  'onboarding.welcome.title': '找到真正适合你的地方',
  'onboarding.welcome.lead': '真实的无障碍信息，由有亲身经历的人检查——不是商家自己的说法。',
  'onboarding.welcome.point1': '与残障社群一起打造',
  'onboarding.welcome.point2': '所有类型的残障——不只是轮椅通行',
  'onboarding.welcome.point3': '对你免费。永远免费。',
  'onboarding.welcome.join': '加入试点',
  'onboarding.welcome.signIn': '我已经有账号',
  'onboarding.welcome.pilot': '曼利及周边地区的试点——真实的地点，由参与者评价。',
  'onboarding.howItWorks': 'Roam Access 如何运作',
  'onboarding.step': '第 {step} 步，共 {total} 步',
  'onboarding.questionMark': '？',
  'onboarding.continue': '继续 →',
  'onboarding.finish': '完成 →',
  'onboarding.needs.title': '你需要什么才能享受一个地方',
  'onboarding.needs.lead': "勾选所有适用的。你随时可以修改。",
  'onboarding.needs.privacy': "保密。只有你在下一步同意，评价才会显示你的需求（比如“轮椅使用者”）。",
  'onboarding.name.title': '我们该怎么称呼你',
  'onboarding.name.lead': '这是应用对你的称呼。评价上显示什么由你决定：我 → 我在评价上如何显示。',
  'onboarding.name.label': '你的名字',
  'onboarding.name.placeholder': '例如：小林',
  'onboarding.name.done': '设置好了。谢谢你加入试点。',
  'onboarding.verdicts.title': '你会怎样看到各个地点',
  'onboarding.verdicts.lead': '每个地点会根据你的需要给出一个答案。只有试点参与者的评价才能显示“适合你”。',
  'onboarding.verdicts.works': '需要和你相似的人说这里可以。',
  'onboarding.verdicts.check': '有需要先知道的事——或者还没有确认。',
  'onboarding.verdicts.barrier': '需要和你相似的人在这里遇到了真正的障碍。',
  'onboarding.verdicts.unknown': '还没有人根据你的需要评价过这里。',
};

export default onboarding;
