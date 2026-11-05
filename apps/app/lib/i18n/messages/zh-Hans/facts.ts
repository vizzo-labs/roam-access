// zh-Hans — 'facts' namespace. Machine-translated unless the key is listed in
// ./_meta.ts → reviewed. Keep the same keys and {placeholders} as en/facts.ts.
import type { Translation } from '../../types';
import type en from '../en/facts';

const facts: Translation<typeof en> = {
  'facts.s.reports': { one: "{what} — {count} 条反馈", other: "{what} — {count} 条反馈" },
  'facts.quick.all': { one: "（快速回答）", other: "（快速回答）" },
  'facts.quick.some': { one: "（其中 {count} 条为快速回答）", other: "（其中 {count} 条为快速回答）" },
  'facts.t.stepsMainEntrance': "正门有台阶",
  'facts.s.stepMainAltEntrance': { one: "正门有台阶，{where}有无台阶入口 — {count} 条反馈", other: "正门有台阶，{where}有无台阶入口 — {count} 条反馈" },
  'facts.t.noStepFreeAtAll': "入口有台阶，也没有其他无台阶入口",
  'facts.s.noStepFree': { one: "没有无台阶入口 — {count} 条反馈", other: "没有无台阶入口 — {count} 条反馈" },
  'facts.t.altEntrance': "{where}有无台阶入口",
  'facts.t.mixed': "关于{label}的反馈不一：{yes} 条说有，{no} 条说没有",
  'facts.s.mixed': "意见不一：{label} — 有 {yes}，没有 {no}",
  'facts.t.exp.works': { one: "{count} 位{who}说这里适合他们", other: "{count} 位{whoPlural}说这里适合他们" },
  'facts.t.exp.check': { one: "{count} 位{who}能应付，但需要变通", other: "{count} 位{whoPlural}能应付，但需要变通" },
  'facts.t.exp.barrier': { one: "{count} 位{who}说这里不适合他们", other: "{count} 位{whoPlural}说这里不适合他们" },
  'facts.s.exp.works': { one: "适合需要{need}的人 — {count} 人", other: "适合需要{need}的人 — {count} 人" },
  'facts.s.exp.check': { one: "需要{need}的人要变通 — {count} 人", other: "需要{need}的人要变通 — {count} 人" },
  'facts.s.exp.barrier': { one: "不适合需要{need}的人 — {count} 人", other: "不适合需要{need}的人 — {count} 人" },
  'facts.t.osm.stepfree.yes': "在 OpenStreetMap 上标注为可供轮椅通行——尚未经社区确认",
  'facts.t.osm.stepfree.limited': "在 OpenStreetMap 上标注为部分可供轮椅通行——尚未经社区确认",
  'facts.t.osm.stepfree.no': "在 OpenStreetMap 上标注为不可供轮椅通行——尚未经社区确认",
  'facts.t.osm.bathroom.yes': "在 OpenStreetMap 上标注为有无障碍卫生间——尚未经社区确认",
  'facts.t.osm.bathroom.limited': "在 OpenStreetMap 上标注为部分有无障碍卫生间——尚未经社区确认",
  'facts.t.osm.bathroom.no': "在 OpenStreetMap 上标注为没有无障碍卫生间——尚未经社区确认",
  'facts.t.osm.hearing.yes': "在 OpenStreetMap 上标注为有助听环路——尚未经社区确认",
  'facts.t.osm.hearing.limited': "在 OpenStreetMap 上标注为部分有助听环路——尚未经社区确认",
  'facts.t.osm.hearing.no': "在 OpenStreetMap 上标注为没有助听环路——尚未经社区确认",
  'facts.s.osm.stepfree.yes': "无台阶（未确认）",
  'facts.s.osm.stepfree.limited': "部分无台阶（未确认）",
  'facts.s.osm.stepfree.no': "有台阶（未确认）",
  'facts.s.osm.bathroom.yes': "无障碍卫生间（未确认）",
  'facts.s.osm.bathroom.limited': "部分无障碍的卫生间（未确认）",
  'facts.s.osm.bathroom.no': "没有无障碍卫生间（未确认）",
  'facts.s.osm.hearing.yes': "助听环路（未确认）",
  'facts.s.osm.hearing.limited': "部分助听环路（未确认）",
  'facts.s.osm.hearing.no': "没有助听环路（未确认）",
};

export default facts;
