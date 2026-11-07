// ja — 'find' namespace. Machine-translated unless the key is listed in
// ./_meta.ts → reviewed. Keep the same keys and {placeholders} as en/find.ts.
import type { Translation } from '../../types';
import type en from '../en/find';

const find: Translation<typeof en> = {
  'find.title': "場所をさがす",
  'find.lead': "マンリー周辺の場所。あなたと同じようなニーズのある人が確かめています。",
  'find.search.label': "場所や場所の種類をさがす",
  'find.search.placeholder': "カフェ、ビーチ、Hugos…",
  'find.browse': "さがし方",
  'find.nearMe': "今いる場所の近く",
  'find.toilets': "トイレ",
  'find.prompt': "{name} に行きましたか？どうだったか教えてください。",
  'find.promptHint': "ワンタップでOK。同じようなニーズのある人の役に立ちます。",
  'find.near.title': "近くの場所",
  'find.near.list': "近くの場所",
  'find.walkingFrom': "{origin} から歩いた時間です。",
  'find.seeAll': { other: "{count} か所をすべて見る" },
  'find.row.name': "{name}、{kind}、{walk}、{verdict}",
  'find.row.beFirst': "行ったことがありますか？最初の口コミを",
  'find.results.back': "戻る",
  'find.results.backLabel': "さがす画面に戻る",
  'find.results.srFor': "{query} の検索結果。",
  'find.filters.nearest': "近い順",
  'find.filters.more': "ほかの絞り込み",
  'find.filters.moreOn': { other: "{count} 件オン" },
  'find.more.lead': "絞り込みはリストを短くするだけです。判定は変わりません。",
  'find.more.hideBarriers': "バリアのある場所を隠す",
  'find.more.show': { other: "{count} か所を表示" },
  'find.showAs': "表示",
  'find.showMore': "あと {n} 件表示（残り {rest} 件）",
  'find.empty.body': "カフェやビーチなど、場所の種類でさがしてみてください。",
  'find.empty.seeAll': "すべての場所を見る",
};

export default find;
