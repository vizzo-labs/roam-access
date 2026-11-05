// ko — 'common' namespace. Machine-translated unless the key is listed in
// ./_meta.ts → reviewed. Keep the same keys and {placeholders} as en/common.ts.
import type { Translation } from '../../types';
import type en from '../en/common';

const common: Translation<typeof en> = {
  'common.back': '뒤로',
  'common.close': '닫기',
  'common.cancel': '취소',
  'common.send': '보내기',
  'common.sending': '보내는 중…',
  'common.save': '저장',
  'common.saving': '저장하는 중…',
  'common.done': '완료',
  'common.next': '다음',
  'common.edit': '수정',
  'common.retry': '다시 시도',
  'common.loading': '불러오는 중…',
  'common.optional': '(선택)',
  'common.yes': '예',
  'common.no': '아니요',
  'common.opensNewTab': '(새 탭에서 열림)',
  'common.justNow': '방금',
  'common.reports': { other: '제보 {count}건' },
  'common.people': { other: '{count}명' },
  'common.reviews': { other: '후기 {count}개' },
  'common.places': { other: '장소 {count}곳' },
  'common.photos': { other: '사진 {count}장' },
  'common.minWalk': '걸어서 {mins}분',
  'common.offline': '오프라인 상태입니다',
  'common.checkConnection': '연결을 확인하고 다시 시도해 주세요.',
  'common.language.title': '언어',
  'common.language.hint': '이 기기에 저장됩니다. 후기는 작성한 사람의 언어 그대로 보입니다.',
  'common.language.machine': '이 언어는 기계 번역입니다. 곧 사람이 검토할 예정입니다. 어색한 부분이 있으면 알려 주세요.',
  'common.readAloud.start': '소리 내어 읽기',
  'common.readAloud.stop': '멈추기',
  'common.readAloud.named': '소리 내어 읽기: {what}',
  'common.readAloud.stopNamed': '읽기 멈추기: {what}',
  'common.readAloud.setting': '소리 내어 읽기 버튼',
  'common.readAloud.settingHint': '장소 요약에 ‘소리 내어 읽기’를 보여 줍니다. 저절로 시작되지 않습니다.',
  'common.readAloud.unsupported': '이 브라우저는 소리 내어 읽기를 지원하지 않습니다.',
  'common.readAloud.speed': '읽는 속도',
  'common.readAloud.slower': '느리게',
  'common.readAloud.normal': '보통',
};

export default common;
