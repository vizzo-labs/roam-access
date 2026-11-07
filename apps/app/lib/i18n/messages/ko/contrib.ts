// ko — 'contrib' namespace. Machine-translated unless the key is listed in
// ./_meta.ts → reviewed. Keep the same keys and {placeholders} as en/contrib.ts.
import type { Translation } from '../../types';
import type en from '../en/contrib';

const contrib: Translation<typeof en> = {
  // ── Who wrote it ─────────────────────────────────────────────
  'contrib.member': 'Roam Access 회원',
  'contrib.rel.lived': '당사자',
  'contrib.rel.carer': '돌봄 제공자',
  'contrib.rel.ally': '조력자',
  'contrib.rel.selfDescribed': '본인 설명',
  'contrib.who.line': '{name} · {label}',
  'contrib.profileLink': '{name} 님의 프로필 보기',

  // ── Ally observations (no verdict) ───────────────────────────
  'contrib.observed.label': '조력자가 관찰함',
  'contrib.observed.default': '조력자로서 알게 된 점이에요.',
  'contrib.observed.note': '조력자의 관찰이에요. 판정은 절대 바뀌지 않아요.',
  'contrib.observedFacts.title': '조력자의 관찰',
  'contrib.observedFacts.lead': '조력자들이 이곳에서 알게 된 점이에요. 이분들은 이런 접근성 필요가 없어서, 이곳이 나에게 맞는지는 절대 바뀌지 않아요.',
  'contrib.fact.observed': { other: '{what} — 조력자 {count}명이 관찰함' },

  // ── A carer's review is about the person they were with ──────
  'contrib.carer.default.works': '함께 간 사람에게 잘 맞았어요.',
  'contrib.carer.default.check': '이용은 했지만, 알아 두면 좋은 우회 방법이 필요했어요.',
  'contrib.carer.default.barrier': '필요한 방식으로 장소를 이용할 수 없었어요.',

  // ── "This helped me" ─────────────────────────────────────────
  'contrib.helped.button': '도움이 됐어요',
  'contrib.helped.count': { other: '{count}명에게 도움이 됨' },
  'contrib.helped.thanked': '고마워요. 후기 작성자가 누군가에게 도움이 됐다는 걸 보게 돼요.',
  'contrib.helped.failed': '저장하지 못했어요. 다시 시도하세요.',

  // ── The review form adapts to who is writing ─────────────────
  'contrib.review.shownAs': '표시: {who}',
  'contrib.review.carer.intro': '돌봄 제공자로 쓰고 있어요. 함께 간 사람에게 어땠는지 알려 주세요.',
  'contrib.review.carer.opt.works.label': '그분에게 잘 맞았어요',
  'contrib.review.carer.opt.works.sub': '들어가고, 돌아다니고, 즐길 수 있었어요',
  'contrib.review.carer.opt.check.label': "문제가 좀 있었어요",
  'contrib.review.carer.opt.check.sub': "어떻게든 했지만 다른 사람들이 미리 알아야 해요",
  'contrib.review.carer.opt.barrier.label': '그분에게 맞지 않았어요',
  'contrib.review.carer.opt.barrier.sub': '필요한 방식으로 장소를 이용할 수 없었어요',
  'contrib.review.carer.needs.title': '누구의 필요인가요?',
  'contrib.review.carer.needs.hint': '함께 간 사람의 필요예요. 내 프로필에서 가져왔어요. 필요하면 이번 방문에 맞게 바꾸세요.',
  'contrib.review.carer.needs.group': '그분의 필요',
  'contrib.review.ally.title': '{name}에서 무엇을 알게 됐나요?',
  'contrib.review.ally.intro': '조력자로 쓰고 있어요. 알게 된 점을 나눠 주세요. “조력자가 관찰함”으로 표시되고, 이곳이 누군가에게 맞는지는 절대 바뀌지 않아요.',
  'contrib.review.ally.more': '무엇을 알게 됐나요?',
  'contrib.review.ally.moreHint': '직접 본 것만 답하세요. 확실하지 않으면 다시 눌러 답을 지울 수 있어요.',
  'contrib.review.ally.choose': '보내려면 질문에 하나 이상 답하세요.',
  'contrib.review.ally.send': '알게 된 점 보내기',

  // ── How I appear on reviews (setup, Me → profile) ────────────
  'contrib.form.name.label': '후기에 보이는 이름',
  'contrib.form.name.hint': '이름과 성의 첫 글자면 충분해요. 별명도 괜찮아요.',
  'contrib.form.name.placeholder': '예: Sam K.',
  'contrib.form.name.required': '이름을 넣거나 “익명으로 올리기”를 선택하세요.',
  'contrib.form.anon.label': '익명으로 올리기',
  'contrib.form.anon.hint': '내 후기에는 이름 대신 “Roam Access 회원”이 보이고, 공개 프로필은 없어요.',
  'contrib.form.rel.legend': '나에게 맞는 것은?',
  'contrib.form.rel.hint': '본인이 직접 설명하는 것으로, 확인하지 않아요. 읽는 사람이 누구의 경험인지 알 수 있어요.',
  'contrib.form.rel.lived': '장애나 접근성 필요가 있어요',
  'contrib.form.rel.lived.sub': '“당사자”로 표시돼요',
  'contrib.form.rel.carer': '돌봄 제공자, 가족 또는 지원 인력이에요',
  'contrib.form.rel.carer.sub': '“돌봄 제공자”로 표시돼요. 함께 간 사람을 위해 후기를 써요.',
  'contrib.form.rel.ally': '돕고 싶어요(조력자)',
  'contrib.form.rel.ally.sub': '“조력자”로 표시돼요. 알게 된 점을 나누며, 판정은 절대 바뀌지 않아요.',
  'contrib.form.rel.unsaid': '말하고 싶지 않아요',
  'contrib.form.rel.unsaid.sub': '표시되는 라벨이 없어요',
  'contrib.form.needs.label': '내 후기에 접근성 필요 보이기(예: “휠체어 사용자”)',
  'contrib.form.needs.hint': '접근성 필요는 건강 정보예요. 후기는 공개돼요. 로그인하지 않아도 웹에서 누구나 읽을 수 있어요. 이 설정은 내 모든 후기에 적용되고, 언제든 끌 수 있어요.',
  'contrib.form.preview': '내 후기에 보이는 모습',
  'contrib.form.public.named': '후기는 공개돼요. 이 내용은 내가 쓰는 모든 후기와 프로필 페이지에 보여요.',
  'contrib.form.public.anon': '후기는 공개돼요. 내 후기에는 “Roam Access 회원”이 보이고, 프로필 페이지는 없어요.',
  'contrib.form.save': '저장',
  'contrib.form.saved': '저장했어요. 이제 내 후기에 이렇게 보여요.',
  'contrib.form.failed': '저장하지 못했어요. 연결을 확인하고 다시 시도하세요.',

  'contrib.setup.title': '후기에 내가 보이는 방식',
  'contrib.setup.lead': '후기에는 쓴 사람이 보여서, 읽는 사람이 누구의 경험인지 알 수 있어요. 무엇을 보일지는 내가 정해요. ‘내 정보’에서 언제든 바꿀 수 있어요.',

  'contrib.profile.title': '후기에 내가 보이는 방식',
  'contrib.profile.back': '‘내 정보’로 돌아가기',
  'contrib.profile.lead': '사람들이 내 후기에서 볼 이름과 라벨을 고르세요.',
  'contrib.profile.legacy': '지금까지 내 후기에는 이름이 아니라 당사자 경험(예: “휠체어 사용자”)만 보여요. 여기서 저장하기 전에는 아무것도 바뀌지 않아요. 저장하면 예전 후기를 포함해 모든 후기에 내가 고른 내용이 보여요.',
  'contrib.profile.reset': '시범 운영 팀이 내가 고른 이름을 삭제해서, 내 후기에는 “Roam Access 회원”이 보여요. 이름을 다시 보이려면 새 이름을 고르세요.',

  // ── One-time prompt for accounts from before names ───────────
  'contrib.prompt.title': '이제 후기에 쓴 사람을 보일 수 있어요',
  'contrib.prompt.body': '지금까지 내 후기에는 이름이 아니라 당사자 경험만 보여요. 이름을 보이기로 선택하지 않으면 그대로 유지돼요.',
  'contrib.prompt.choose': '보이는 방식 고르기',
  'contrib.prompt.keep': '내 후기를 지금 그대로 두기',

  // ── Me ───────────────────────────────────────────────────────
  'contrib.me.appear.title': '후기에 내가 보이는 방식',
  'contrib.me.appear.edit': '후기에 내가 보이는 방식 수정',
  'contrib.me.appear.legacy': '당사자 경험만 보이고, 이름은 보이지 않아요.',
  'contrib.me.appear.choose': '고르기',
  'contrib.me.appear.chooseAria': '후기에 내가 보이는 방식 고르기',
  'contrib.me.profileLink': '내 공개 프로필',
  'contrib.me.badges.title': '내 배지',
  'contrib.me.badges.count': '{total}개 중 {earned}개 획득',
  'contrib.me.loading': '배지를 불러오는 중…',
  'contrib.me.failed': '지금은 배지를 불러올 수 없어요.',

  'contrib.badge.first': '첫 후기',
  'contrib.badge.first.desc': '첫 후기를 썼어요',
  'contrib.badge.regular': '단골',
  'contrib.badge.regular.desc': '후기 5개',
  'contrib.badge.local': '동네 전문가',
  'contrib.badge.local.desc': '후기 15개',
  'contrib.badge.champion': '챔피언',
  'contrib.badge.champion.desc': '후기 50개',
  'contrib.badge.entrance': '입구 탐색가',
  'contrib.badge.entrance.desc': '턱 없는 입구 3곳 표시',
  'contrib.badge.photographer': '사진가',
  'contrib.badge.photographer.desc': '설명이 있는 사진 10장',
  'contrib.badge.pathfinder': '길잡이',
  'contrib.badge.pathfinder.desc': '도착 단계 안내 3개 공유',
  'contrib.badge.founding': '창립 회원',
  'contrib.badge.founding.desc': '2027년 3월 1일 전에 가입',
  'contrib.badge.mapper': '매퍼',
  'contrib.badge.mapper.desc': '매핑 데이에 참여',
  'contrib.badge.earned': '획득함',
  'contrib.badge.progress': '{have}/{goal}',
  'contrib.badge.notYet': '아직',

  'contrib.newBadge.title': { other: '새 배지' },
  'contrib.newBadge.item': '{name} — {desc}',
  'contrib.newBadge.toast': '새 배지: {name}',
  'contrib.newBadge.see': '내 배지 보기',
  'contrib.newBadge.dismiss': '새 배지 알림 닫기',

  'contrib.top.title': '이번 달 최고 기여자',
  'contrib.top.lead': '지난 30일 동안 Manly 주변에서 후기를 가장 많이 쓴 사람들이에요. 이름을 보이는 사람만 나와요.',
  'contrib.top.reviews': { other: '후기 {count}개' },
  'contrib.top.empty': '이번 달은 아직 아무도 없어요. 다음 후기로 여기에 오를 수 있어요.',
  'contrib.top.you': '나',

  // ── Review filters ───────────────────────────────────────────
  'contrib.filter.lived': '당사자',
  'contrib.filter.carer': '돌봄 제공자',
  'contrib.filter.ally': '조력자',

  // ── Public profile page /u/[id] (server-rendered) ────────────
  'contrib.page.metaTitle': '{name} · Roam Access',
  'contrib.page.eyebrow': 'Roam Access 회원 프로필',
  'contrib.page.memberSince': '{date}부터 회원',
  'contrib.page.needs': '접근성 필요: {list}',
  'contrib.page.stats': '기여',
  'contrib.page.badges': '배지',
  'contrib.page.noBadges': '아직 배지가 없어요.',
  'contrib.page.reviews': '후기',
  'contrib.page.noReviews': '아직 보여 줄 후기가 없어요.',
  'contrib.page.observation': '관찰 — 판정 없음',
  'contrib.page.about': '“당사자”, “돌봄 제공자”, “조력자” 같은 라벨은 본인이 직접 설명한 것이에요. 장소가 맞는지는 후기만 말할 수 있고, 조력자의 관찰은 판정을 절대 바꾸지 않아요.',
  'contrib.page.open': 'Roam Access 열기',
  'contrib.page.place': 'Roam Access에서 {name} 열기',
};

export default contrib;
