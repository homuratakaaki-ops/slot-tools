# 東京喰種 第1号 段1（rec 登録側）仕様書 v0.1

- 作成：シオン／2026-11-28（JST）
- 根拠：骨格書 `docs/specs/tokyoghoul-nisshi-stats-skeleton-v02.md`（2026-11-28 1:58 夢爽が裁可）の §6 R1〜R5
- 基準：main `650e2d5`（東京喰種 第3弾 反映済み）
- 対象：`tools/rec/index.html` のみ（＋検証スクリプト）。稼働日誌（tools/nisshi）は段2で扱い、今回は触らない

> 要するに：東京喰種の記録に「前回CZの当選契機と当たったときのG数」「前回ATが駆け抜けか」「CZ当選時の規定G数」「通常時に戻ったときのG数」を残せるようにします。着席の項目は後から直せるようにし、東京喰種だけ書き出しJSONにこれらを含めます。ほかの機種の保存データと書き出しは1バイトも変えません。

---

## 0. 絶対ルール

1. 既存の `generic`・`karakuri2`・`hibireturn` ほか、東京喰種以外の定義の**挙動・保存データ・書き出しJSON・見た目を変えない**
2. 共通部分に足す処理は、**定義に印（下記のフラグ）があるときだけ**動く形にする。共通部分に東京喰種の文字列（"レミニセンス" など）を直書きしない
3. 既存の項目の名前・意味・値を変えない（足すだけ）
4. 取り消し（op 単位）・訂正・再読み込み・バックアップ往復で、足した値が壊れない・残らない（取り消した行の値は一緒に消える）
5. 未入力と0を区別する（空欄は項目を持たない。0は0として持つ）

---

## 1. 定義に足すもの（`MACHINES.tokyoghoul`）

```js
  // 着席の項目（既存3つの後ろに追加。showWhen は新しい共通機能）
  setup:[
    {key:"c3", ...既存},
    {key:"seatState", ...既存},
    {key:"lastHit", ...既存},
    {key:"prevCzTrig",label:"前回CZの当選契機",type:"select",optional:true,
      options:"hitTriggers",                       // 定義の hitTriggers をそのまま使う（言葉をそろえる）
      showWhen:{key:"lastHit",in:["czFail"]}},
    {key:"prevCzRealG",label:"前回CZ当選時 データカウンタ",type:"num",optional:true,
      showWhen:{key:"lastHit",in:["czFail"]}},
    {key:"prevCzLcdG",label:"前回CZ当選時 液晶G",type:"num",optional:true,
      showWhen:{key:"lastHit",in:["czFail"]}},
    {key:"prevCzKiteiG",label:"前回CZの規定G数",type:"num",optional:true,
      showWhen:{key:"prevCzTrig",in:["規定G数"]}},  // 連鎖：lastHit≠czFail なら prevCzTrig も無いので出ない
    {key:"prevAtResult",label:"前回ATの結果",type:"select",optional:true,
      options:["kakenuke","other"],optionLabels:{kakenuke:"駆け抜け",other:"駆け抜け以外"},
      showWhen:{key:"lastHit",in:["atEnd"]}}
  ],
  setupEditable:true,     // R3：打ち始め後も着席の項目を直せる
  recordToG:true,         // R2：通常時に戻ったときのG数を行に残す
  exportStructured:true,  // R4：書き出しJSONに setup と構造化イベントを含める
  hitKiteiG:{key:"kiteiG",label:"規定G数",trig:"規定G数",hits:["レミニセンス","大喰いの利世"]},  // R5
```

- 書き方は例。フラグ名・形はミコトが既存の書き方に合わせて調整してよい（報告に明記）。ただし**保存する項目名**（`prevCzTrig`・`prevCzRealG`・`prevCzLcdG`・`prevCzKiteiG`・`prevAtResult`・`kiteiG`・`toG`・`structVer`）は変えない
- `options:"hitTriggers"` のような参照が書きにくければ、定義の `hitTriggers` と同じ配列を置いてよい（その場合は同じ配列であることを検証で確かめる）

---

## 2. R1 着席の項目（前回状況の追加欄）

### 画面
- 着席画面の既存の項目の下に、条件に合う項目だけを出す
  - 前回の当選＝CZ失敗 → 前回CZの当選契機・データカウンタ・液晶G
  - さらに当選契機＝規定G数 → 前回CZの規定G数
  - 前回の当選＝AT終了 → 前回ATの結果
  - 有馬失敗・不明・未選択 → 追加の欄なし
- すべて任意（「任意」の小さな表示は既存の `optional` 表示に合わせる）
- 数字の欄は既存の数字欄と同じ入力（テンキー／`inputmode=numeric`）。規定G数の欄は**テンキー（askNum）で入れられること**（夢爽の要望「電卓で入力」）
- 選択の欄は既存の選択ボタン（optRow）。もう一度押すと外せる（未選択に戻せる）ようにする。既存の選択欄にこの機能がなければ、**追加した欄だけ**に付ける

### 保存（`session.setup`）
| 項目 | 値 | 空欄 |
|---|---|---|
| `prevCzTrig` | hitTriggers の文字列（例 "規定G数"） | 項目なし |
| `prevCzRealG`・`prevCzLcdG`・`prevCzKiteiG` | 0以上の整数 | 項目なし（0と区別） |
| `prevAtResult` | `"kakenuke"`／`"other"` | 項目なし |

- **隠れている項目は保存しない**：打ち始めの確定時に、showWhen を満たさない項目は値が入っていても捨てる（例：CZ失敗で前回Gを入れた後、AT終了に変えて開始 → 前回CZの4項目は保存されない）
- 打ち始めのメモ（`startNote`）への文字の追加は、既存の項目と同じ規則でよい（「前回CZの当選契機：規定G数」など）。数字の項目も、入っていれば「前回CZの規定G数：200」の形で並べる。表示文を作る既存処理が `c3`・`melon` を除外している規則はそのまま

---

## 3. R5 CZ当選時の規定G数

- 通常時の「当選」シートで、種別が `hitKiteiG.hits`（レミニセンス／大喰いの利世）のどれか、**かつ**契機＝`hitKiteiG.trig`（規定G数）のときだけ「規定G数（任意）」の欄を出す。どちらかが外れたら欄を隠し、値を空にする
- 入力はテンキー。クレジット欄（`creditInput`）と同じ数字欄の仕組みを使ってよい
- 保存：当選の行（`hitStart`）に `kiteiG`（0以上の整数）。空欄なら項目なし
- ログの表示文に「規定 200G」の形で入れる（`fieldsText` に足す。`kiteiG` を持たない行の表示は変わらない）
- 当選を後から直す既存の画面で契機を規定G数以外に直したときは `kiteiG` を消す。既存に契機を直す画面がなければ、今回は作らない（報告に書く）
- AT直撃・EPで契機＝規定G数を選んでも欄は出さない

---

## 4. R2 通常時に戻ったときのG数（`toG`）

- 定義に `recordToG` があるとき、**通常時に戻る操作**の `hitEnd` 行に `toG:{realG, lcdG}` を付ける
  - 値は、その操作で確定した「今のG数」（`applyG` の後の `c.realG`・`c.lcdG`）。入力なし・自動で0に戻す経路では `{realG:0,lcdG:0}`
  - 液晶Gを持たない定義は対象外（東京喰種は液晶Gあり）
- 対象の経路（東京喰種で起きるもの。ミコトはコードから**全部を洗い出して報告に表で書く**）
  - CZ（レミニセンス・大喰いの利世）失敗 → 通常時
  - AT終了 → 通常時（有馬権利なし・エンディングなし）
  - 有馬ジャッジメント失敗 → 通常時
  - そのほか、終了の結果 `c.mode` が `normal` になる経路
- 付けない経路：CZ成功→AT、EP終了→AT、AT終了→有馬ジャッジメント、有馬成功→死神、死神→AT（通常時に戻らない）
- 1つの操作で `hitEnd` 行が複数できる場合は、**最後に通常時へ戻った `hitEnd` 行**にだけ付ける
- 取り消し：行と一緒に消える（既存の op 単位の取り消しで自然に消えること）
- 後から「G数を直した」（`gFix`）をしても `toG` は変えない（`toG` は戻った時点の記録）

---

## 5. R3 打ち始め後に着席の項目を直す

- 定義に `setupEditable` があるとき、既存の「打ち始め・終了の情報を直す」シート（`editInfo`）に「着席の項目」の節を足す
  - 打っている途中の台・終わった台の両方
  - 表示・連動・テンキーは着席画面と同じ（showWhen も同じに効く）
  - 現在の `sess.setup` の値を初期値として出す
- 「この内容で直す」で `sess.setup` を置き換える。隠れている項目は捨てる（§2と同じ規則）
- **今のCZスルーの数（`c.c3`）は変えない**。`setup.c3`（着席時の値）だけを直す
- 打ち始めのメモ（`startNote`）の文は書き換えない（構造化された `setup` が正。文は記録当時のまま）
- ログに行は足さない（既存の `editInfo` と同じ）
- 直したら `save()`。取り消しの対象外（既存の `editInfo` と同じ）

---

## 6. R4 書き出しJSON（`toEnvelope`）

- 定義に `exportStructured` があるときだけ、`payload` に次を**足す**
  - `structVer: 1`
  - `setup`：`session.setup` の複製（無ければ `{}`）
  - `events`：`session.events` の複製。各行から `snap` を除く（`snap` が `{}` に縮められていても除く）
- 既存の `logs`・`memo`・ほかの項目は**変えない**（kado-note・ネネの手順はそのまま使える）
- `payloadVer`（rec-3／rec-4）は上げない。追加分の版は `structVer` で表す（§9-59「スキーマ変更で版数を上げる」を、追加項目に自前の版を持たせる形で満たす）
- 東京喰種以外の書き出しJSONは改修前とバイト一致

---

## 7. 共通部分に足す機能（印がある定義だけ）

| 機能 | 使う場所 | 印がない定義での挙動 |
|---|---|---|
| setup の `showWhen`（連鎖あり）と、隠れた項目の破棄 | 着席画面・`editInfo` | `showWhen` を持つ項目がないので今までどおり |
| setup の選択欄を外す（もう一度押す） | 追加した欄 | 既存の欄の挙動は変えない |
| setup の数字欄のテンキー | 追加した欄 | 既存の欄は変えない |
| `hitKiteiG` | 当選シート | 欄は出ない |
| `recordToG` | 終了の各経路 | `toG` は付かない |
| `setupEditable` | `editInfo` | 節は出ない |
| `exportStructured` | `toEnvelope` | 何も足さない |

---

## 8. 検収項目

すべて検証スクリプト（headless Chrome、既存の `tests/rec-tokyoghoul.verify.mjs` の harness を使う）で自動化する。数値は架空。

| # | 操作 | 期待 |
|---|---|---|
| S1 | 東京喰種で着席、前回の当選＝CZ失敗、契機＝レア役、データ350、液晶450で開始 | `setup` に `prevCzTrig:"レア役"`・`prevCzRealG:350`・`prevCzLcdG:450`。`prevCzKiteiG` なし |
| S2 | 契機＝規定G数、規定200、データ210、液晶230 | 4項目が保存。規定G数の欄はテンキーで入る |
| S3 | S2 の入力後、前回の当選を AT終了 に変えて開始 | 前回CZの4項目は保存されない。`prevAtResult` の欄が出ている |
| S4 | 前回の当選＝AT終了、駆け抜け | `prevAtResult:"kakenuke"`。もう一度押して外すと項目なし |
| S5 | データ0・液晶空欄 | `prevCzRealG:0`、`prevCzLcdG` は項目なし |
| S6 | 規定G数で利世当選・規定100 | `hitStart` に `kiteiG:100`、ログ文に「規定 100G」 |
| S7 | 規定G数でレミ当選・規定G数空欄 | 記録でき、`kiteiG` なし |
| S8 | レア役で当選／AT直撃で規定G数 | 規定G数の欄は出ない。`kiteiG` なし |
| S9 | レミ当選 → 失敗（今のG数は初期値0／0のまま） | 失敗の `hitEnd` に `toG:{realG:0,lcdG:0}` |
| S10 | AT終了 → 通常時（今のG数 実13／液晶13 と入力） | AT終了の `hitEnd` に `toG:{realG:13,lcdG:13}` |
| S11 | AT終了 → 有馬ジャッジメント → 失敗（初期値 実6／液晶0） | AT終了の行に `toG` なし、有馬失敗の行に `toG:{realG:6,lcdG:0}` |
| S12 | CZ成功→AT、EP→AT、有馬成功→死神→AT | いずれの `hitEnd` にも `toG` なし |
| S13 | S9 の操作を取り消す | `toG` を持つ行が残らない。状態は操作前と一致 |
| S14 | 打っている途中で「打ち始め・終了の情報を直す」→ 前回の当選を不明→CZ失敗、契機・G数を入力 | `sess.setup` が更新。今のCZスルー（`c.c3`）・`startNote`・ログの行数は変わらない |
| S15 | 終わった台で S14 と同じ操作 | 同じく `setup` だけが更新 |
| S16 | 東京喰種の台を書き出し | `payload.structVer===1`、`payload.setup` と `payload.events` あり、`events` に `snap` なし。`logs`・`memo`・`payloadVer` は改修前と同じ |
| S17 | 汎用・からくりサーカス2・ハイビリターン30・ヴァルヴレイヴ2 で着席→数操作→終了→書き出し | 保存データ（`sessions`）と書き出しJSONが改修前（650e2d5）と**バイト一致**。着席画面・当選シート・`editInfo` の見た目も同じ |
| S18 | 改修前に保存した東京喰種の記録（`setup` に新項目なし・`toG` なし）を読み込み、ノート・`editInfo`・書き出し | エラーなし。`editInfo` の新しい欄は空。書き出しの `setup` は旧項目だけ |
| S19 | 360／390px で着席画面（全欄表示時）・当選シート（規定G数表示時）・`editInfo` | 横はみ出しなし、ボタン44px以上 |
| S20 | 既存の検証（rec-tokyoghoul・rec-common-1〜3・rec-account 系）を全部 | すべて通過 |

---

## 9. やらないこと

- 稼働日誌（tools/nisshi）の変更、集計の表示（段2）
- 旧111件の取り込み（段3）
- CZ失敗後などのG数の初期値の変更（第3弾で反映済み）
- 当選の行の契機を後から直す画面の新設（無ければ報告のみ）
- 東京喰種以外の機種への新しい項目の追加
