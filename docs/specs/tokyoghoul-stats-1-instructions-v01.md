# 東京喰種 第1号 段1（rec 登録側）実装指示書 v0.1

- 宛先：ツムギ（実装はミコトへ委任、ツムギがレビュー）
- 作成：シオン／2026-11-28（JST）
- 根拠：骨格書 `tokyoghoul-nisshi-stats-skeleton-v02.md`（2026-11-28 1:58 夢爽が裁可）／仕様書 `tokyoghoul-stats-1-spec-v01.md`
- 基準：main `650e2d5`（東京喰種 第3弾 反映済み）。作業開始時に main が進んでいたら最新の main から始め、報告に基準のハッシュを書く
- 反映：**featureブランチの push まで承認済み。main へのマージは push 前報告 → シオン確認 → 夢爽本人の承認の後**（保存データに項目を足す改修のため。見た目だけの第3弾とは扱いを変える）
- テスト版：作らない（tools/rec は夢爽個人用。2026-11-26 決定）

---

## 0. 守ること

- 仕様書 §0 の絶対ルールをすべて守る。特に**東京喰種以外の保存データ・書き出しJSONを1バイトも変えない**
- 共通部分の追加は、定義に印（`setupEditable`・`recordToG`・`exportStructured`・`hitKiteiG`・setup の `showWhen`）があるときだけ動く形
- 稼働日誌（tools/nisshi）・js/ 配下の共通ファイル（rec-store.js・machine-master.js など）は**触らない**
- 仕様にない整理・書き換えはしない。気づいた点は報告に書くだけ

---

## 1. 夢爽の要望と理由

- 稼働日誌で東京喰種のCZ・AT確率、CZ成功率、差枚を自動で集計したい（ネネの手集計をなくす）。将来は他機種にも広げたい
- 前回CZは**当選契機と当たったときのG数**を残したい。例：液晶550Gでレア役当選なら、500G以内の規定ゾーンでは当たらなかったと分かる。規定G数のときは数値を電卓で入れたい。前回の当選契機からモードを予想し、CZ失敗後の次を予想しやすい形を探すため
- CZは失敗したときだけでなく、**当選したときに毎回**規定G数を残したい
- 今の rec は、通常時に戻ったときのG数がログに残らないので、通常時のG数（確率の分母）を正確に出せない → `toG` を残す
- 着席の項目を打ち始め後に直す画面がない → 直せるようにする
- 書き出しJSONは文章のログだけなので、JSON経由だと集計できない → 東京喰種だけ構造化データも含める

---

## 2. 作業内容

仕様書 §1〜§7 のとおり。要点：

1. `MACHINES.tokyoghoul`：setup に5項目を追加（`prevCzTrig`・`prevCzRealG`・`prevCzLcdG`・`prevCzKiteiG`・`prevAtResult`、showWhen 付き）、フラグ4つ（`setupEditable`・`recordToG`・`exportStructured`・`hitKiteiG`）
2. 着席画面：setup の showWhen（連鎖あり）、隠れた項目は開始時に捨てる、追加した選択欄はもう一度押すと外せる、規定G数はテンキー
3. 当選シート：レミニセンス／大喰いの利世 × 契機「規定G数」のときだけ「規定G数（任意）」→ `hitStart.kiteiG`。`fieldsText` に「規定 ◯G」
4. 終了の各経路：通常時に戻る `hitEnd` に `toG:{realG,lcdG}`（`applyG` 後の値）。**通常時に戻る経路をコードから全部洗い出し、表にして報告**
5. `editInfo`：「着席の項目」の節（途中・終了後とも）。`setup.c3` だけ直り、今の `c.c3`・`startNote`・ログは変わらない
6. `toEnvelope`：`payload.structVer:1`・`payload.setup`・`payload.events`（`snap` を除く）を足す。既存の項目・`payloadVer` は変えない

---

## 3. 検証

1. 新しい検証 `tests/tokyoghoul-stats-1.verify.mjs` を作り、仕様書 §8 の S1〜S19 を自動化する（`tests/rec-tokyoghoul.verify.mjs` の harness を使う。`rec-common-3.verify.mjs` と同じ書き方）
2. S17（他機種のバイト一致）は、`650e2d5` の index.html と今回の index.html を同じ操作で動かし、`sessions` と書き出しJSONを比べる形で行う
3. S18 の旧データは、`tests/fixtures/` に**匿名の合成データ**として置く（実戦の個人データは置かない）
4. 既存の検証（rec-tokyoghoul・rec-common-1〜3・rec-account 系ほか tools/rec に関わるもの）をすべて通す。直したアサートがあれば一覧にする
5. 390px で次のスクリーンショットを撮り、Downloads に保存：着席画面（前回の当選＝CZ失敗・契機＝規定G数で全欄表示）、当選シート（規定G数の欄表示）、`editInfo` の着席の項目の節

---

## 4. push・反映

- ブランチ `feature/rec-tokyoghoul-stats-1` を切る
- テスト全通過 → featureブランチを push → **ここで止めて報告**（main へはマージしない）
- シオンの確認と夢爽本人の承認の後、ツムギが main へ `--no-ff` マージ → push
  - その時に `node tests/rec-account-build-test-page.mjs` で `acct-test.html` を作り直し、同じ push に含める
  - 公開確認：`/tools/rec/` と `/tools/rec/acct-test.html` が 200。`index.html`・`acct-test.html` の md5 が raw（push 後のコミット）・Pages・ローカルで一致
- 文書（featureブランチに含める。3ファイルは夢爽の Downloads にあるものをそのままコピーし、中身は変えない）
  - `docs/specs/tokyoghoul-nisshi-stats-skeleton-v02.md`（骨格書）
  - `docs/specs/tokyoghoul-stats-1-spec-v01.md`（仕様書）
  - `docs/specs/tokyoghoul-stats-1-instructions-v01.md`（この指示書）
  - `docs/specs/README.md` に3行を挿入
  - IDEAS.md：東京喰種 第3弾の行の直後に1行を**挿入だけ**する
    `- [ ] 東京喰種 第1号 自動集計（段1 rec 登録側：前回CZの契機・G数・規定G数、前回AT結果、CZ当選の規定G数、通常時に戻ったG数、着席項目の後修正、構造化書き出し）。段2 日誌の集計・段3 旧111件は未着手。骨格書 docs/specs/tokyoghoul-nisshi-stats-skeleton-v02.md`
    （マージ後に `[x]` へ倒すのは段3まで終わってから）

---

## 5. commit 名義

- ミコトの実装（index.html・tests・fixtures）：`Mikoto <codex@slot-tools.local>`
- 文書（docs/specs・README・IDEAS.md）：`Shion <claude@slot-tools.local>`
- マージ・acct-test.html の作り直し：`Tsumugi <tsumugi@slot-tools.local>`（ツムギがマージする場合。cde04f1 と同じ）

---

## 6. 報告（push 前に止めたとき）

1. 基準にした main のハッシュと、featureブランチのコミットハッシュ（`git log` からコピー、push 後のみ）
2. 通常時に戻る経路の一覧表（経路／`toG` を付けたか／付けない理由）
3. 定義のフラグの名前・形を仕様書の例から変えた場合はその内容
4. 当選の契機を後から直す画面があったか（あれば `kiteiG` の消し方、無ければ「無し」）
5. テスト結果（S1〜S20）と、直した既存アサートの一覧
6. S17 で比べた機種と結果
7. スクリーンショットの保存場所
8. 気づいたが直していない点（あれば）
