// ko — 'find' namespace. Machine-translated unless the key is listed in
// ./_meta.ts → reviewed. Keep the same keys and {placeholders} as en/find.ts.
import type { Translation } from '../../types';
import type en from '../en/find';

const find: Translation<typeof en> = {
  'find.title': "장소 찾기",
  'find.lead': "맨리 주변 장소예요. 나와 비슷한 필요가 있는 사람들이 확인했어요.",
  'find.search.label': "장소나 장소 종류 검색",
  'find.search.placeholder': "카페, 해변, Hugos…",
  'find.browse': "둘러보기",
  'find.nearMe': "지금 내 근처",
  'find.toilets': "화장실",
  'find.prompt': "{name}에 가 보셨나요? 어땠는지 알려 주세요.",
  'find.promptHint': "한 번만 누르면 돼요. 나와 비슷한 필요가 있는 사람들에게 도움이 돼요.",
  'find.near.title': "내 근처",
  'find.near.list': "내 근처 장소",
  'find.walkingFrom': "{origin}에서 걸어서 걸리는 시간이에요.",
  'find.seeAll': { other: "장소 {count}곳 모두 보기" },
  'find.row.name': "{name}, {kind}, {walk}, {verdict}",
  'find.row.beFirst': "가 보셨나요? 첫 후기를 남겨 주세요",
  'find.results.back': "뒤로",
  'find.results.backLabel': "찾기로 돌아가기",
  'find.results.srFor': "{query} 검색 결과.",
  'find.filters.nearest': "가까운 순",
  'find.filters.more': "필터 더 보기",
  'find.filters.moreOn': { other: "{count}개 켜짐" },
  'find.more.lead': "필터는 목록을 줄이기만 해요. 판정은 절대 바뀌지 않아요.",
  'find.more.hideBarriers': "장벽이 있는 장소 숨기기",
  'find.more.show': { other: "장소 {count}곳 보기" },
  'find.showAs': "보기 방식",
  'find.showMore': "{n}개 더 보기 ({rest}개 남음)",
  'find.empty.body': "카페나 해변처럼 장소 종류로 찾아보세요.",
  'find.empty.seeAll': "모든 장소 보기",
};

export default find;
