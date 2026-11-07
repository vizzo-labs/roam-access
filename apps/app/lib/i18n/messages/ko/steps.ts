// ko — 'steps' namespace. Machine-translated unless the key is listed in
// ./_meta.ts → reviewed. Keep the same keys and {placeholders} as en/steps.ts.
import type { Translation } from '../../types';
import type en from '../en/steps';

const steps: Translation<typeof en> = {
  'steps.back': "뒤로",
  'steps.backStep': "이전 단계로",
  'steps.backTo': "{name}(으)로 돌아가기",
  'steps.announce': "{total}단계 중 {step}단계. {title}",
  'steps.shownAs': "표시:",
  'steps.change': "변경",
  'steps.changeAria': "후기에 표시되는 방식 바꾸기",
  'steps.v.lead': "한 번만 누르면 충분해요. 나머지는 선택이에요.",
  'steps.v.leadCarer': "함께 간 분에게 어땠는지 알려 주세요. 한 번만 누르면 충분해요.",
  'steps.v.group': "어땠나요?",
  'steps.v.hint': "셋 중 하나를 골라야 보낼 수 있어요.",
  'steps.send': "보내기",
  'steps.more': { other: "조금 더 알려 주기 (질문 {count}개)" },
  'steps.q.title': { other: "간단한 질문 {count}개" },
  'steps.q.lead': "나와 같은 필요가 있는 사람들을 위한 질문이에요. 잘 모르면 건너뛰세요.",
  'steps.q.leadCarer': "함께 간 분의 필요에 대한 질문이에요. 잘 모르면 건너뛰세요.",
  'steps.q.notSure': "잘 모름",
  'steps.q.map': "지도에 위치 표시하기 (선택)",
  'steps.q.toExtras': "사진이나 메모 추가",
  'steps.x.title': "더 있나요?",
  'steps.x.lead': "모두 선택이에요. 입구나 화장실 사진이 가장 도움이 돼요.",
  'steps.x.addMore': "더 추가할까요?",
  'steps.x.sensory': "소음과 붐빔",
  'steps.ally.lead': "직접 본 것만 답해 주세요. 나머지는 건너뛰세요.",
  'steps.ally.banner': "조력자로 작성하고 있어요. 공유한 내용은 “조력자가 관찰함”으로 표시되고, 장소가 누군가에게 맞는지는 절대 바뀌지 않아요.",
  'steps.ally.more': { other: "질문 {count}개 더" },
  'steps.ally.extras': "더 있나요? (선택)",
  'steps.ally.sent': "“조력자가 관찰함”으로 표시돼요.",
  'steps.setup.skip': "지금은 건너뛰기",
  'steps.setup.saved': "필요를 저장했어요.",
  'steps.setup.group': "나의 필요",
};

export default steps;
