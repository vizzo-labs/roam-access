// ja — 'facts' namespace. Machine-translated unless the key is listed in
// ./_meta.ts → reviewed. Keep the same keys and {placeholders} as en/facts.ts.
import type { Translation } from '../../types';
import type en from '../en/facts';

const facts: Translation<typeof en> = {
  'facts.s.reports': { one: "{what} — {count}件の報告", other: "{what} — {count}件の報告" },
  'facts.quick.all': { one: "（クイック回答）", other: "（クイック回答）" },
  'facts.quick.some': { one: "（うち{count}件はクイック回答）", other: "（うち{count}件はクイック回答）" },
  'facts.t.stepsMainEntrance': "正面入口に段差があります",
  'facts.s.stepMainAltEntrance': { one: "正面入口に段差あり、{where}段差なしで入れます — {count}件の報告", other: "正面入口に段差あり、{where}段差なしで入れます — {count}件の報告" },
  'facts.t.noStepFreeAtAll': "入口に段差があり、ほかに段差なしで入れる場所もありません",
  'facts.s.noStepFree': { one: "段差なしの入口なし — {count}件の報告", other: "段差なしの入口なし — {count}件の報告" },
  'facts.t.altEntrance': "{where}段差なしの入口があります",
  'facts.t.mixed': "{label}について意見が分かれています：はい {yes}件、いいえ {no}件",
  'facts.s.mixed': "意見が分かれる：{label} — はい {yes}、いいえ {no}",
  'facts.t.exp.works': { one: "{who} {count}人が「利用できた」と回答", other: "{whoPlural} {count}人が「利用できた」と回答" },
  'facts.t.exp.check': { one: "{who} {count}人が「工夫すれば利用できた」と回答", other: "{whoPlural} {count}人が「工夫すれば利用できた」と回答" },
  'facts.t.exp.barrier': { one: "{who} {count}人が「利用できなかった」と回答", other: "{whoPlural} {count}人が「利用できなかった」と回答" },
  'facts.s.exp.works': { one: "{need}：利用できた — {count}人", other: "{need}：利用できた — {count}人" },
  'facts.s.exp.check': { one: "{need}：工夫が必要 — {count}人", other: "{need}：工夫が必要 — {count}人" },
  'facts.s.exp.barrier': { one: "{need}：利用できなかった — {count}人", other: "{need}：利用できなかった — {count}人" },
  'facts.t.osm.stepfree.yes': "OpenStreetMap では「車いすで利用可能」と登録 — コミュニティによる確認はまだです",
  'facts.t.osm.stepfree.limited': "OpenStreetMap では「一部車いすで利用可能」と登録 — コミュニティによる確認はまだです",
  'facts.t.osm.stepfree.no': "OpenStreetMap では「車いすで利用不可」と登録 — コミュニティによる確認はまだです",
  'facts.t.osm.bathroom.yes': "OpenStreetMap では「バリアフリートイレあり」と登録 — コミュニティによる確認はまだです",
  'facts.t.osm.bathroom.limited': "OpenStreetMap では「バリアフリートイレ一部あり」と登録 — コミュニティによる確認はまだです",
  'facts.t.osm.bathroom.no': "OpenStreetMap では「バリアフリートイレなし」と登録 — コミュニティによる確認はまだです",
  'facts.t.osm.hearing.yes': "OpenStreetMap では「ヒアリングループあり」と登録 — コミュニティによる確認はまだです",
  'facts.t.osm.hearing.limited': "OpenStreetMap では「ヒアリングループ一部あり」と登録 — コミュニティによる確認はまだです",
  'facts.t.osm.hearing.no': "OpenStreetMap では「ヒアリングループなし」と登録 — コミュニティによる確認はまだです",
  'facts.s.osm.stepfree.yes': "段差なし（未確認）",
  'facts.s.osm.stepfree.limited': "一部段差なし（未確認）",
  'facts.s.osm.stepfree.no': "段差あり（未確認）",
  'facts.s.osm.bathroom.yes': "バリアフリートイレ（未確認）",
  'facts.s.osm.bathroom.limited': "一部バリアフリーのトイレ（未確認）",
  'facts.s.osm.bathroom.no': "バリアフリートイレなし（未確認）",
  'facts.s.osm.hearing.yes': "ヒアリングループ（未確認）",
  'facts.s.osm.hearing.limited': "一部ヒアリングループ（未確認）",
  'facts.s.osm.hearing.no': "ヒアリングループなし（未確認）",
};

export default facts;
