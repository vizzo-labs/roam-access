// ko — 'facts' namespace. Machine-translated unless the key is listed in
// ./_meta.ts → reviewed. Keep the same keys and {placeholders} as en/facts.ts.
import type { Translation } from '../../types';
import type en from '../en/facts';

const facts: Translation<typeof en> = {
  'facts.s.reports': { one: "{what} — 제보 {count}건", other: "{what} — 제보 {count}건" },
  'facts.quick.all': { one: " (빠른 답변)", other: " (빠른 답변)" },
  'facts.quick.some': { one: " (그중 {count}건은 빠른 답변)", other: " (그중 {count}건은 빠른 답변)" },
  'facts.t.stepsMainEntrance': "정문에 계단이 있어요",
  'facts.s.stepMainAltEntrance': { one: "정문에 계단 있음, {where} 계단 없는 입구 — 제보 {count}건", other: "정문에 계단 있음, {where} 계단 없는 입구 — 제보 {count}건" },
  'facts.t.noStepFreeAtAll': "입구에 계단이 있고, 계단 없는 다른 입구도 없어요",
  'facts.s.noStepFree': { one: "계단 없는 입구 없음 — 제보 {count}건", other: "계단 없는 입구 없음 — 제보 {count}건" },
  'facts.t.altEntrance': "{where} 계단 없는 입구가 있어요",
  'facts.t.mixed': "{label}에 대한 제보가 엇갈려요: 예 {yes}건, 아니요 {no}건",
  'facts.s.mixed': "엇갈림: {label} — 예 {yes}, 아니요 {no}",
  'facts.t.exp.works': { one: "{who} {count}명이 이용하기 좋았다고 했어요", other: "{whoPlural} {count}명이 이용하기 좋았다고 했어요" },
  'facts.t.exp.check': { one: "{who} {count}명이 방법을 찾아 이용했어요", other: "{whoPlural} {count}명이 방법을 찾아 이용했어요" },
  'facts.t.exp.barrier': { one: "{who} {count}명이 이용할 수 없었다고 했어요", other: "{whoPlural} {count}명이 이용할 수 없었다고 했어요" },
  'facts.s.exp.works': { one: "{need}: 이용 가능 — {count}명", other: "{need}: 이용 가능 — {count}명" },
  'facts.s.exp.check': { one: "{need}: 우회 방법 필요 — {count}명", other: "{need}: 우회 방법 필요 — {count}명" },
  'facts.s.exp.barrier': { one: "{need}: 이용 불가 — {count}명", other: "{need}: 이용 불가 — {count}명" },
  'facts.t.osm.stepfree.yes': "OpenStreetMap에 ‘휠체어 이용 가능’(으)로 등록됨 — 아직 커뮤니티가 확인하지 않았어요",
  'facts.t.osm.stepfree.limited': "OpenStreetMap에 ‘휠체어 일부 이용 가능’(으)로 등록됨 — 아직 커뮤니티가 확인하지 않았어요",
  'facts.t.osm.stepfree.no': "OpenStreetMap에 ‘휠체어 이용 불가’(으)로 등록됨 — 아직 커뮤니티가 확인하지 않았어요",
  'facts.t.osm.bathroom.yes': "OpenStreetMap에 ‘장애인 화장실 있음’(으)로 등록됨 — 아직 커뮤니티가 확인하지 않았어요",
  'facts.t.osm.bathroom.limited': "OpenStreetMap에 ‘장애인 화장실 일부 있음’(으)로 등록됨 — 아직 커뮤니티가 확인하지 않았어요",
  'facts.t.osm.bathroom.no': "OpenStreetMap에 ‘장애인 화장실 없음’(으)로 등록됨 — 아직 커뮤니티가 확인하지 않았어요",
  'facts.t.osm.hearing.yes': "OpenStreetMap에 ‘청각 보조 루프 있음’(으)로 등록됨 — 아직 커뮤니티가 확인하지 않았어요",
  'facts.t.osm.hearing.limited': "OpenStreetMap에 ‘청각 보조 루프 일부 있음’(으)로 등록됨 — 아직 커뮤니티가 확인하지 않았어요",
  'facts.t.osm.hearing.no': "OpenStreetMap에 ‘청각 보조 루프 없음’(으)로 등록됨 — 아직 커뮤니티가 확인하지 않았어요",
  'facts.s.osm.stepfree.yes': "계단 없음(미확인)",
  'facts.s.osm.stepfree.limited': "일부 계단 없음(미확인)",
  'facts.s.osm.stepfree.no': "계단 있음(미확인)",
  'facts.s.osm.bathroom.yes': "장애인 화장실(미확인)",
  'facts.s.osm.bathroom.limited': "일부 이용 가능한 화장실(미확인)",
  'facts.s.osm.bathroom.no': "장애인 화장실 없음(미확인)",
  'facts.s.osm.hearing.yes': "청각 보조 루프(미확인)",
  'facts.s.osm.hearing.limited': "청각 보조 루프 일부(미확인)",
  'facts.s.osm.hearing.no': "청각 보조 루프 없음(미확인)",
};

export default facts;
