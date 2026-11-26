# tools/rec 共通改修 段1 実装指示書 v0.1

- 宛先：ツムギ（実装はミコトへ委任、ツムギがレビュー）
- 作成：シオン／2026-11-26（JST）
- 正本：`docs/specs/rec-common-1-spec-v01.md`（仕様書）、`docs/specs/rec-common-skeleton-v03.md`（骨格書・夢爽裁可済み）
- 範囲：**テスト版 `tools/rec/common-test.html` の公開まで**。本番 `tools/rec/index.html` は main に入れない

---

## 0. 前提と守ること

- 作業前に最新の `main` を取得する（§9-79）。基準は `72cb1a2` 以降の main
- 東京喰種の改修が別に動いていたら、着手前にシオンへ知らせる（ツムギ経由）。同時に進めるときは、先に終わった方を先に main へ入れ、後の方は main を取り込み直してからテストする
- ブランチは2本：
  1. `feature/rec-common-1`（実装の本体。**main にマージしない**。push まで）
  2. `preview/rec-common-1`（テスト版と文書だけ。main へ `--no-ff` でマージする）
- 仕様書 §0 の絶対ルールを守る。特に「保存の形を変えない」「過去の台の値を変えない」「店舗設定の一覧の並びを変えない」
- 仕様書に書いていない UI 変更はしない。迷ったら着手前にシオンへ聞く
- 本番 `index.html`・`acct-test.html` は変更しない

---

## 1. 作業内容

### 1-1. `feature/rec-common-1`（ミコト実装）
1. 仕様書 §1（開始画面の「再プレイでおろした分」欄の廃止）
2. 仕様書 §2（`storeUseOrder()` と店名比較の共通関数、「店舗を選ぶ」シートと簡易収支の店ボタンの並び、`store-top`）
3. 仕様書 §4-1 の既存テスト3か所の直し（期待値はゆるめない）
4. 新規テスト：
   - `tests/rec-common-1.verify.mjs`（仕様書 §4-2 の T1〜T13）
   - `tests/rec-common-build-test-page.mjs`（仕様書 §3。置換数を assert）
5. このブランチでは `tools/rec/acct-test.html` を作り直さない

### 1-2. `preview/rec-common-1`（main から切る）
1. `feature/rec-common-1` の `tools/rec/index.html` から `node tests/rec-common-build-test-page.mjs` で `tools/rec/common-test.html` を生成して追加（生成物だけ。スクリプトとテストは入れない）
2. 文書3つを追加：`docs/specs/rec-common-skeleton-v03.md`、`docs/specs/rec-common-1-spec-v01.md`、`docs/specs/rec-common-1-instructions-v01.md`
3. `docs/specs/README.md` の表に3行を**挿入だけ**する（既存行は変えない）
4. `IDEAS.md` の**最初の**「## 検討中・将来」節（476行付近。東京喰種専用記録の行がある節。1827行付近にも同名の節があるので注意）の末尾に1行を**挿入だけ**する：
   `- [ ] tools/rec 共通改修（機種マスター・店舗の利用順・開始時再プレイ欄の廃止・クレジット電卓）：骨格書 v0.3 裁可（11/26）→ 段1をテスト版 tools/rec/common-test.html で確認中。正本 docs/specs/rec-common-skeleton-v03.md`
5. sitemap・トップ・ツール一覧には何も足さない

---

## 2. 検証手順（ツムギ）

### 2-1. `feature/rec-common-1`
1. index.html の `<script>` 部分を抜き出して `node --check`
2. 仕様書 §4-3 の既存テストと §4-2 の新規テストを実行。通過数／失敗数と失敗内容を報告（`rec-account-test-page.test.mjs` の失敗が「acct-test と index の不一致」だけであることも書く）
3. 差分の目視レビュー：
   - `profit()`・`acct*`（`acctAllowReplay` を含む）・`toEnvelope`・`MACHINES` に差分が無いこと
   - `storeListSheet` に差分が無いこと
   - 保存処理（`save`・`load`・書き出し・取り込み）に差分が無いこと
   - `stReplay0` が index.html に1か所も残っていないこと
4. 390px・360px のスクリーンショット（開始画面・「店舗を選ぶ」シート・簡易収支の店ボタン）をリポジトリの外に保存

### 2-2. `preview/rec-common-1`
1. `common-test.html` と「feature の index.html を生成スクリプトに通したもの」が一致すること
2. `common-test.html` に `noindex` があり、保存キーが `slot-tools-rec-common-test` であること（`slot-tools-rec"`・`slot-tools-rec-acct-test`・`slot-tools-rec-tg-test` が残っていないこと）
3. main との差分が §1-2 のファイルだけであること（`git diff --stat main`）
4. `rec-account-test-page.test.mjs` が通ること

---

## 3. push・マージ（承認済み）

- `feature/rec-common-1`：**push 承認済み。main へのマージは不可**（ネネの検収と夢爽の実機確認の後、本番反映の指示書を別に出す）
- `preview/rec-common-1`：**push と main への `--no-ff` マージを承認済み**（テスト版は保存先が別・noindex・導線なしで、本番の記録に影響しない）
- 公開確認：マージ後1〜2分待って `https://slot-tools.jp/tools/rec/common-test.html` が開けること、`raw.githubusercontent.com/homuratakaaki-ops/slot-tools/<マージコミット>/tools/rec/common-test.html` の md5 がローカル生成物と一致すること
- コミットハッシュは `git log` の出力からコピーし、push 完了後にだけ報告する（見込みで書かない）

---

## 4. commit 名義

- ミコトの実装（feature の index.html・tests）：`Mikoto <codex@slot-tools.local>`
- 文書（docs/specs 3ファイル・README・IDEAS）と common-test.html の生成コミット：`Shion <claude@slot-tools.local>`
- マージコミット：`Shion <claude@slot-tools.local>`

---

## 5. 報告に含めるもの

1. 2本のブランチの最終コミット（`git log` からコピー）とマージコミット
2. テスト結果（既存・新規・回帰）
3. §2-1 の3の確認結果
4. `common-test.html` の md5（ローカル・raw・公開ページ）
5. 気づいた点（仕様と食い違うところ、判断に迷ったところ）
