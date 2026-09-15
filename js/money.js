/**
 * money.js — 収支計算の唯一の出典（AGENTS.md §9-84）
 *
 * 実戦記録ツール（juggler-record.html）の画面表示・保存と、
 * マイログ（mylog.html）の一覧表示・集計・編集は、すべてこのファイルの関数から値を取る。
 * **ここ以外の場所で差枚・円収支を計算しないこと。**
 * 同じ式を画面ごとに書き足したことが、2026/9/15 に報告された次の2件の原因だった。
 *
 *   1. 投資があっても持ち枚数0で終えた記録が「収支なし」になった
 *      → 収支の成立判定に投資額(yen)が入っていなかった
 *   2. 非等価（貸出枚数 ≠ 交換枚数）で円収支が0になった
 *      → 「差枚 × 交換単価」で計算していたため、貸出と交換の単価差が消えていた
 *
 * 円収支は「持ち × 交換単価 − 投資円」で出す。差枚（枚）の式は従来どおり変更しない。
 */

const DEFAULT_RATE = 50; // 1,000円で借りられる枚数（等価貸し）
const DEFAULT_MAI = 50;  // 1,000円分にするのに必要な枚数（等価交換）

function n0(v) {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
}

function positiveOr(v, fallback) {
  const x = Number(v);
  return Number.isFinite(x) && x > 0 ? x : fallback;
}

/**
 * 収支を計算する。
 *
 * @param {object} input
 * @param {number} input.yen        投資額（円）
 * @param {number} input.hold       終了時の持ちメダル（枚）
 * @param {number} input.startHold  開始時の持ちメダル（枚）
 * @param {number} input.rate       貸出枚数（1,000円で借りられる枚数）
 * @param {number} input.mai        交換枚数（1,000円分にするのに必要な枚数）
 * @returns {{hasMoney:boolean, yen:number, hold:number, startHold:number,
 *            rate:number, mai:number, investMedals:number,
 *            diff:(number|null), cash:(number|null), isEquiv:boolean}}
 */
export function computeMoney(input) {
  const src = input || {};
  const yen = n0(src.yen);
  const hold = n0(src.hold);
  const startHold = n0(src.startHold);
  const rate = positiveOr(src.rate, DEFAULT_RATE);
  const mai = positiveOr(src.mai, DEFAULT_MAI);

  // 投資しているだけで収支は成立する。0枚で終えた（＝全部飲まれた）ことと
  // 「まだ何も入力していない」ことを区別するための判定。
  const hasMoney = yen > 0 || hold > 0 || startHold > 0;

  const investMedals = Math.round((yen / 1000) * rate);
  const diff = hasMoney ? hold - startHold - investMedals : null;
  // 円は「手元に残った枚数を交換単価で現金化した額」から「使った現金」を引く。
  // 差枚に交換単価を掛けるやり方だと、貸出と交換の単価差（非等価）が消える。
  const cash = hasMoney ? Math.round(((hold - startHold) * 1000) / mai) - yen : null;

  return { hasMoney, yen, hold, startHold, rate, mai, investMedals, diff, cash, isEquiv: rate === mai };
}

/**
 * マイログの1記録から収支を計算する。
 *
 * 表示・集計は保存済みの diff / cash を読まず、保存されている入力値から毎回計算する。
 * こうしておくと、式を直した時点で過去の記録の表示と集計も一緒に正しくなる。
 *
 * 入力値（rate / exchangeMai）を持たない古い記録だけは計算できないため、
 * 保存済みの diff / cash をそのまま使う（legacy:true で見分けられる）。
 *
 * @param {object} record マイログの記録
 * @returns {object} computeMoney の戻り値に legacy:boolean を足したもの
 */
export function moneyFromRecord(record) {
  const m = (record && record.money) || null;
  const hasRates = !!m && positiveOr(m.rate, 0) > 0 && positiveOr(m.exchangeMai, 0) > 0;
  if (!hasRates) {
    const savedDiff = m && m.diff != null && Number.isFinite(Number(m.diff)) ? Number(m.diff) : null;
    const savedCash = m && m.cash != null && Number.isFinite(Number(m.cash)) ? Number(m.cash) : null;
    // 片方だけ欠けた記録は収支なしに倒す（読む側が null 判定を1回で済ませられるように）
    const ok = savedDiff != null && savedCash != null;
    const diff = ok ? savedDiff : null;
    const cash = ok ? savedCash : null;
    return {
      legacy: true,
      hasMoney: diff != null,
      yen: n0(m && m.yen),
      hold: n0(m && m.hold),
      startHold: n0(m && m.startHold),
      rate: positiveOr(m && m.rate, DEFAULT_RATE),
      mai: positiveOr(m && m.exchangeMai, DEFAULT_MAI),
      investMedals: n0(m && m.investMedals),
      diff,
      cash,
      isEquiv: positiveOr(m && m.rate, DEFAULT_RATE) === positiveOr(m && m.exchangeMai, DEFAULT_MAI),
    };
  }
  return {
    legacy: false,
    ...computeMoney({ yen: m.yen, hold: m.hold, startHold: m.startHold, rate: m.rate, mai: m.exchangeMai }),
  };
}

/** 保存済みの入力値だけでは収支を計算できない古い記録か。件数の把握に使う。 */
export function isLegacyMoneyRecord(record) {
  return moneyFromRecord(record).legacy;
}
