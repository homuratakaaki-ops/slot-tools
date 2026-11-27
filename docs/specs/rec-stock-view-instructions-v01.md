# tools/rec 貯メダルの表示を店ごとに「払い出せる枚数」にする 指示書 v0.1

- 宛先：ツムギ（実装はミコトへ委任してよい。ツムギがレビュー）
- 作成：シオン／2026-11-27（JST）
- 夢爽の要望（12:05）と了承（15:00）：店の表示機でいつも見えるのは「払出可能貯メダル」（例 7,750枚＝50枚単位）。rec の「貯 7,770枚」（総数）と照合するのに計算が要るので、店ごとに払い出せる枚数で表示できるようにする
- 照合したコード：main `87f0527` の `tools/rec/index.html`
- 進め方：テスト版なし。実装・テスト → main へマージ → 夢爽の承認の一文をもらってから push → シオンの raw 照合 → 夢爽の実機確認

---

## 0. 守ること

1. 貯メダル残高の計算（`acctBalanceA` など）・保存・マイナスの警告・上限の確認・口座の記録は**総数のまま**。変えるのは表示だけ
2. 店舗を選ばない台（旧方式の「貯メダル残高（おろす前）」）の表示は変えない
3. 設定しない店は今までどおり総数表示（既定は総数）
4. 最新の main を取得（基準 `87f0527` 以降）。別の改修が入っていたら着手前にシオンへ知らせる
5. push の前に夢爽へ確認：①本番への push の承認、②本番の rec ノートの JSON を書き出し済みで、打っている台が無いこと

---

## 1. 仕様

### 1-1 店舗の条件に設定を1つ足す
- 項目：`cond.stockView`。値は `"payable"`（払い出せる枚数）か、無し（総数）。`"total"` は保存しない（無しと同じ）
- 画面：店舗設定の条件の編集（`acctConditionFields`）の「1日の再プレイ上限」の下に
  - 見出し「貯メダルの表示」
  - 2択ボタン［総数］［払い出せる枚数］（今の上限の2択と同じ見た目）
  - 説明（hint）：「払い出せる枚数＝総数を再プレイ1回の枚数で切り捨てた枚数（店の表示機の『払出可能貯メダル』に合わせるとき）」
- `acctConditionFields` の戻り値に `stockView` を足し、保存する側で `"payable"` のときだけ `cond.stockView` に入れる（`"total"` を選んだら項目を消す）
- 形チェック・補完（店舗の読み込み、990行付近の cond の補完）：`stockView` は「無し／`"payable"`」なら可。それ以外の値は消す（補完のみ。店舗自体は不正にしない）

### 1-2 表示の計算（関数を1つにまとめる）
```
stockViewOf(a)  : 今の店舗設定（S.stores の a.storeId・a.cond.id の条件）を見て "payable" か "total"。見つからなければ a.cond.stockView、それも無ければ "total"
payableOf(a,bal): Math.floor(bal / replayUnitOf(a)) * replayUnitOf(a)   ※bal が null・負なら変換しない
stockText(a,bal): stockViewOf(a)==="payable" ? payableOf(a,bal) : bal
```
- 台を打ち始めた後で設定を変えても、すぐ表示に効くように、表示は**今の店舗設定**を見る（台に写した cond ではなく）

### 1-3 表示する場所
| 場所 | 総数の店（今と同じ） | 払い出せる枚数の店 |
|---|---|---|
| 記録画面の「再」マスの下段（1554行付近） | 貯 7,770枚 | 貯 7,750枚 |
| `acctSummary`（再プレイのシート・口座のシート・開始画面の店舗情報） | 貯メダル残 7,770枚 | 貯メダル残 7,750枚（総数 7,770） |
- 残高が「未登録」・マイナスのときは今と同じ表示（変換しない。マイナスの赤字もそのまま）

### 1-4 入力欄の名前
- 「残高を合わせる」（1189行付近）と再プレイのシートの残高入力（1156行付近）の `askNum` の見出しを「貯メダル残高（総数）」に変える（払い出せる枚数を入れてしまう取り違えを防ぐ）。入れる値の意味は今と同じ総数

---

## 2. テスト `tests/rec-stock-view.verify.mjs`

| # | 確認 | 合格条件 |
|---|---|---|
| V1 | 設定なしの店（再プレイ1回50）で残高 7,770 | 「貯 7,770枚」、口座「貯メダル残 7,770枚」（今と同じ） |
| V2 | 同じ店を［払い出せる枚数］に変える | 打っている台のまま「貯 7,750枚」、口座「貯メダル残 7,750枚（総数 7,770）」 |
| V3 | V2 で再プレイ1回 | 残高 7,720（総数）、表示「貯 7,700枚」 |
| V4 | 再プレイ1回が46枚の店で総数 100 | 払い出せる枚数 92 |
| V5 | 残高 未登録・マイナス | 今と同じ表示 |
| V6 | ［総数］に戻す | 保存した店舗の条件に `stockView` が無い |
| V7 | 「残高を合わせる」 | 見出しが「貯メダル残高（総数）」。7,770 を入れると残高 7,770 |
| V8 | 店舗を選ばない台の貯メダル表示 | 改修前と同じ |
| V9 | JSON 書き出し→取り込み | `stockView` が往復する。`stockView:"abc"` の店舗は取り込めて項目だけ消える |
| V10 | 上限・マイナス警告 | 総数で判定（改修前と同じ） |
| V11 | 360px・390px | 条件の編集画面がはみ出さない |

回帰：rec 系の全テスト（`rec-common-1`・`rec-common-2`・`rec-common-3`・`rec-account`・`rec-account-test-page`・`rec-stock-replay`・`rec-log-order`・`rec-log-order-past`・`rec-cycle-label`・`rec-hibireturn-state-label`・`rec-tokyoghoul`・`rec-tokyoghoul-regression`・`rec-idb-sessions.e2e`）。見出しの変更で期待値が変わる既存テストは、どの行をなぜ変えたかを報告

---

## 3. main への反映
1. 作業ブランチ `feature/rec-stock-view` → main へ `--no-ff` でマージ
2. `node tests/rec-account-build-test-page.mjs` で `tools/rec/acct-test.html` を作り直す
3. この指示書を `docs/specs/rec-stock-view-instructions-v01.md` として追加し、`docs/specs/README.md` の表に1行を**挿入だけ**
4. 差分の目視レビュー：`acctBalanceA`・`acctAllowReplay`・`profit()`・`midDiff`・`setCredit`・`MachineMaster` まわりに差分が無いこと

## 4. push・公開確認
- **夢爽の承認の一文をもらってから** push（§0-5）
- 1〜2分後、`tools/rec/index.html`・`tools/rec/acct-test.html` の md5 がローカル・raw（最終コミット）・公開ページの3つで一致すること
- コミットハッシュは `git log` からコピーし、push 完了後にだけ報告する

## 5. commit 名義
- ミコトの実装：`Mikoto <codex@slot-tools.local>`（ツムギが直接直した分は `Tsumugi <tsumugi@slot-tools.local>`）
- 指示書・README：`Shion <claude@slot-tools.local>`
- acct-test の作り直し・マージ：`Tsumugi <tsumugi@slot-tools.local>`

## 6. 報告に含めるもの
1. 各コミット（`git log` からコピー）
2. テスト結果と、期待値を変えた既存テスト
3. §3-4 の確認結果
4. md5（index.html・acct-test.html それぞれ3つ）
5. 気づいた点
