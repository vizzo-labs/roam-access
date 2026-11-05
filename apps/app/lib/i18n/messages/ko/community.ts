// ko — 'community' namespace. Machine-translated unless the key is listed in
// ./_meta.ts → reviewed. Keep the same keys and {placeholders} as en/community.ts.
import type { Translation } from '../../types';
import type en from '../en/community';

const community: Translation<typeof en> = {
  'community.q.stepfree': '계단 없이 들어갈 수 있나요?',
  'community.q.bathroom': '장애인 화장실이 있나요?',
  'community.q.quiet': '보통 조용하고 시끄럽지 않나요?',
  'community.q.calm': '차분하고 정신없지 않나요?',
  'community.q.seats': '앉거나 쉴 곳이 있나요?',
  'community.q.hearing': '청각 지원이 있나요? (보청 루프, 자막, 필담해 주는 직원 등)',
  'community.q.vision': '저시력인에게 좋은가요? (밝은 조명, 큰 글씨, 도와주는 직원 등)',
  'community.q.simple': '길을 찾기 쉬운가요?',

  'community.hint.unconfirmed.yes': 'OpenStreetMap에는 “예”라고 되어 있지만 아직 아무도 확인하지 않았어요.',
  'community.hint.unconfirmed.partly': 'OpenStreetMap에는 “일부”라고 되어 있지만 아직 아무도 확인하지 않았어요.',
  'community.hint.unconfirmed.no': 'OpenStreetMap에는 “아니요”라고 되어 있지만 아직 아무도 확인하지 않았어요.',
  'community.hint.none': '아직 아무도 답하지 않았어요.',
  'community.hint.mixed': '지금까지 의견이 엇갈려요: 예 {yes}, 아니요 {no}.',
  'community.hint.one': '지금까지 한 명만 답했어요.',
  'community.helps': '{who}에게 도움이 돼요.',
  'community.helpsEveryone': '모두에게 도움이 돼요.',

  'community.prompt.overline': '빈 정보 채우기',
  'community.prompt.title': { other: '근처 {count}곳에 짧은 답이 하나씩 필요해요' },
  'community.prompt.sub': '예 또는 아니요 — 한 번씩만 누르면 돼요. 가 본 곳만 답해 주세요.',

  'community.gaps.overline': '빈 정보 채우기',
  'community.gaps.loading': '근처 장소를 찾고 있어요…',
  'community.gaps.error': '질문을 불러오지 못했어요',
  'community.gaps.nothing': '지금은 근처에 답이 필요한 곳이 없어요',
  'community.gaps.done': '다 했어요 — 고마워요',
  'community.gaps.allForNow': '지금은 여기까지예요',
  'community.gaps.intro': '가 본 곳만 답해 주세요. 답은 그 장소에 “짧은 답”으로 표시되고, 나와 같은 필요가 있는 사람들에게 도움이 돼요.',
  'community.gaps.event': '내 답은 {event}에 반영돼요.',
  'community.gaps.leaderboard': '순위 보기',
  'community.gaps.questionOf': '질문 {n}/{total}',
  'community.gaps.placeLine': '{kind} · {walk} · {area}',
  'community.gaps.skip': '잘 모르겠어요 — 건너뛰기',
  'community.gaps.seeFirst': '{name} 먼저 보기',
  'community.gaps.saved': '저장했어요: {name}, {answer}. 고마워요.',
  'community.gaps.answerYes': '예',
  'community.gaps.answerNo': '아니요',
  'community.gaps.live': { other: '내 답 {count}개가 공개되었어요' },
  'community.gaps.noneNear': '걸어서 25분 안의 모든 장소에 내 필요에 대한 답이 이미 있거나, 내가 이미 답했어요. 최근에 어디 다녀왔나요? 전체 리뷰는 더 큰 도움이 돼요.',
  'community.gaps.more': '몇 개 더 답하기',
  'community.gaps.backHome': '홈으로 돌아가기',
};

export default community;
