// ja — 'ds' namespace. Machine-translated unless the key is listed in
// ./_meta.ts → reviewed. Keep the same keys and {placeholders} as en/ds.ts.
import type { Translation } from '../../types';
import type en from '../en/ds';

const ds: Translation<typeof en> = {
  'ds.actions': "操作",
  'ds.dismiss': "閉じる",
  'ds.removeFilter': "絞り込みを解除：{name}",
  'ds.loadingPlaces': "場所を読み込み中…",
  'ds.badge.fromReviews': { other: "{count} 件のレビューより" },
  'ds.badge.community': "コミュニティのレビュー",
  'ds.badge.osm': "OpenStreetMap · 未確認",
  'ds.badge.venue': "施設からの情報",
  'ds.badge.partnerNamed': "{name} メンバー",
  'ds.badge.partner': "パートナープログラム",
  'ds.badge.photo': "写真",
  'ds.freshness.last': "最終確認：{when}",
  'ds.freshness.never': "まだ確認されていません",
  'ds.photo.open': "写真 {n}/{total} を開く：{kind}。{alt}",
  'ds.photo.count': "写真 {n}/{total}",
  'ds.photo.close': "写真を閉じる",
  'ds.photo.prev': "前の写真",
  'ds.photo.next': "次の写真",
  'ds.photo.fromReview': "レビューより",
  'ds.photo.position': "写真 {n}/{total}：{kind}",
  'ds.photo.keysMany': "← → で移動 · Esc で閉じる",
  'ds.photo.keysOne': "Esc で閉じる",
  'ds.search.label': "場所を検索",
  'ds.search.clear': "検索をクリア",
  'ds.search.voice': "音声で検索",
  'ds.search.submit': "検索",
  'ds.sheet.closeNamed': "{title}を閉じる",
  'ds.snap.peek': "最小",
  'ds.snap.half': "画面の半分",
  'ds.snap.full': "全画面",
  'ds.snap.expand': "広げる",
  'ds.snap.collapse': "たたむ",
  'ds.snap.announce': "{label}：{size}",
  'ds.snap.handle': "{label}：{size}。押すと{action}。矢印キーで大きさを変えられます。",
};

export default ds;
