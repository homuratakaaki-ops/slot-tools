/**
 * machines.js — 機種IDから一覧用の短い呼び名を引く対応表（AGENTS.md §9-84）
 *
 * 狭い一覧で機種を見分けるための略称。**正式名の代わりではない**ので、
 * 詳細・集計・カード・共有文などスペースのある場所では正式名（記録の machineName）を使うこと。
 *
 * juggler-record.html の MACHINES が持つ `mark` とは別物。あちらは
 * 「正式名のどこを色付けするか」を示す部分文字列で、machineNameHtml() が
 * name.indexOf(mark) で切り出しに使っている。用途が違うため統合しない。
 */
export const MACHINE_SHORT = {
  my_juggler_v: "マイ",
  im_juggler_ex_6: "アイム",
  gogo_juggler_3: "ゴーゴー",
  funky_juggler_2: "ファンキー",
  happy_juggler_v3: "ハッピー",
  neo_im_juggler_ex: "ネオアイム",
  ultra_miracle_juggler: "ウルトラ",
  juggler_girls_ss: "ガールズSS",
  mr_juggler: "ミスター",
};

/** 一覧に出す短い呼び名。対応表に無い機種IDは正式名をそのまま返す（旧記録・他機種） */
export function machineShort(machineId, fallbackName) {
  return MACHINE_SHORT[machineId] || String(fallbackName || "");
}
