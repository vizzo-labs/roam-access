// ko — 'ds' namespace. Machine-translated unless the key is listed in
// ./_meta.ts → reviewed. Keep the same keys and {placeholders} as en/ds.ts.
import type { Translation } from '../../types';
import type en from '../en/ds';

const ds: Translation<typeof en> = {
  'ds.actions': "작업",
  'ds.dismiss': "닫기",
  'ds.removeFilter': "필터 해제: {name}",
  'ds.loadingPlaces': "장소를 불러오는 중…",
  'ds.badge.fromReviews': { other: "리뷰 {count}개 기준" },
  'ds.badge.community': "커뮤니티 리뷰",
  'ds.badge.osm': "OpenStreetMap · 확인되지 않음",
  'ds.badge.venue': "장소 측 안내",
  'ds.badge.partnerNamed': "{name} 회원",
  'ds.badge.partner': "파트너 프로그램",
  'ds.badge.photo': "사진",
  'ds.freshness.last': "마지막 확인: {when}",
  'ds.freshness.never': "아직 확인되지 않음",
  'ds.photo.open': "사진 {n}/{total} 열기: {kind}. {alt}",
  'ds.photo.count': "사진 {n}/{total}",
  'ds.photo.close': "사진 닫기",
  'ds.photo.prev': "이전 사진",
  'ds.photo.next': "다음 사진",
  'ds.photo.fromReview': "리뷰에서",
  'ds.photo.position': "사진 {n}/{total}: {kind}",
  'ds.photo.keysMany': "← → 이동 · Esc 닫기",
  'ds.photo.keysOne': "Esc 닫기",
  'ds.search.label': "장소 검색",
  'ds.search.clear': "검색어 지우기",
  'ds.search.voice': "음성으로 검색",
  'ds.search.submit': "검색",
  'ds.sheet.closeNamed': "{title} 닫기",
  'ds.snap.peek': "접힘",
  'ds.snap.half': "화면 절반",
  'ds.snap.full': "전체 화면",
  'ds.snap.expand': "펼치기",
  'ds.snap.collapse': "접기",
  'ds.snap.announce': "{label}: {size}",
  'ds.snap.handle': "{label}: {size}. 누르면 {action}, 화살표 키로 크기 조절.",
};

export default ds;
