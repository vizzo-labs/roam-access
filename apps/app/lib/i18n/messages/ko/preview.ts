// ko — 'preview' namespace. Machine-translated unless the key is listed in
// ./_meta.ts → reviewed. Keep the same keys and {placeholders} as en/preview.ts.
import type { Translation } from '../../types';
import type en from '../en/preview';

const preview: Translation<typeof en> = {
  'preview.close': '{name} 미리보기 닫기',
  'preview.photoAlt': '{name} 사진',
  'preview.noPhoto': '아직 사진이 없어요',
  'preview.addFirst': '첫 사진 추가',
  'preview.addFirstAria': '{name}의 첫 사진 추가: 리뷰 쓰기',
  'preview.factsLabel': '내 필요에 맞는 접근성 정보',
  'preview.noInfo': '내 필요에 맞는지 아직 아무도 알려 주지 않았어요.',
  'preview.feature.stepfree': '계단 없음',
  'preview.feature.bathroom': '장애인 화장실',
  'preview.feature.seats': '좌석',
  'preview.feature.quiet': '조용함',
  'preview.feature.simple': '길 찾기 쉬움',
  'preview.feature.calm': '차분함',
  'preview.feature.hearing': '청각 지원',
  'preview.feature.vision': '저시력 친화',
  'preview.state.yes': '예',
  'preview.state.no': '아니요',
  'preview.state.mixed': '의견이 엇갈림',
  'preview.state.alt': '다른 출입구 있음',
  'preview.state.unconfirmed': '확인 안 됨',
  'preview.seeDetailsAria': '{name} 자세히 보기',
  'preview.details': '자세히',
  'preview.answerOne': '질문 1개에 답하기',
  'preview.answerOneAria': '{name}에 대한 질문 1개에 답하기',
  'preview.notNow': '나중에',
  'preview.answerHelps': '한 번만 누르세요. 빠른 답변으로 표시돼요.',
  'preview.thanks': '고마워요. 답변이 저장됐어요.',
  'preview.moreReports': { other: '자세히 페이지에 신고 {count}건이 더 있어요' },
};
export default preview;
