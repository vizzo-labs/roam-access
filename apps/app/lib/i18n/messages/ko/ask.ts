// ko — 'ask' namespace. Machine-translated unless the key is listed in
// ./_meta.ts → reviewed. Keep the same keys and {placeholders} as en/ask.ts.
import type { Translation } from '../../types';
import type en from '../en/ask';

const ask: Translation<typeof en> = {
  'ask.title': "이 장소에 대해 묻기",
  'ask.description': "답변은 Roam에 있는 {name} 후기에서만 나와요 — 인터넷이나 추측은 쓰지 않아요.",
  'ask.noReviewsYet': "아직 아무도 후기를 남기지 않아서 답할 근거가 없어요. 가 보셨나요? 내 후기가 첫걸음이에요.",
  'ask.label': "질문",
  'ask.placeholder': "예: 정문에 경사로가 있나요?",
  'ask.submit': "묻기",
  'ask.reading': "후기를 읽는 중…",
  'ask.out': "오늘 질문을 모두 썼어요 — 내일 다시 물어볼 수 있어요.",
  'ask.left': { one: "오늘 질문 {count}개 남음", other: "오늘 질문 {count}개 남음" },
  'ask.error': "문제가 생겼어요 — 다시 시도해 주세요.",
  'ask.offline': "Roam Access에 연결할 수 없어요 — 연결을 확인해 주세요.",
  'ask.limit': "오늘 질문을 모두 썼어요. 내일 다시 물어볼 수 있어요.",
  'ask.unavailable': "지금은 답변할 수 없어요 — 1분 후에 다시 시도해 주세요.",
  'ask.from': { one: "후기 {count}개에서", other: "후기 {count}개에서" },
  'ask.basedOn': "근거가 된 후기",
  'ask.withPhoto': "사진 있음",
  'ask.readAll': "후기 모두 보기",
  'ask.notTitle': "후기에 아직 답이 없어요",
  'ask.notAction': "가 보셨나요? 경험 공유하기",
  'ask.notAnswered': "이 장소 후기에는 아직 그 내용이 없어서 답할 수 없어요 — 추측하지도 않아요.",
  'ask.noReviews': "아직 아무도 후기를 남기지 않아서 답할 근거가 없어요 — 추측하지도 않아요.",
};

export default ask;
