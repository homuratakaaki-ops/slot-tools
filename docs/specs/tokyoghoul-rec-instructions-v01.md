# tools/rec 東京喰種（MACHINES.tokyoghoul）第1弾 実装指示書 v0.1

- 宛先：ツムギ（実装はミコトへ委任、ツムギがレビュー）
- 作成：シオン／2026-11-26（JST）
- 正本：`docs/specs/tokyoghoul-rec-spec-v01.md`（仕様書）、`docs/specs/tokyoghoul-rec-skeleton-v03.md`（骨格書・夢爽裁可済み）
- 範囲：**テスト版 `tools/rec/tg-test.html` の公開まで**。本番 `tools/rec/index.html` は main に入れない

---

## 0. 前提と守ること

- 作業前に最新の `main` を取得する（§9-79）。基準は `8d041ce` 以降の main
- ブランチは2本：
  1. `feature/rec-tokyoghoul`（実装の本体。**main にマージしない**。push まで）
  2. `preview/rec-tokyoghoul`（テスト版と文書だけ。main へ `--no-ff` でマージする）
- 仕様書 §0 の絶対ルールを守る。特に「既存3機種と店舗連動の挙動を変えない」「共通部分に機種固有の文字列を直書きしない」「ありえない入力を保存しない」
- 仕様書に書いていない UI 変更はしない。判断に迷ったら着手前にシオンへ聞く（ツムギ経由）
- 営業中の記録に影響しないよう、本番 `index.html`・`acct-test.html` は変更しない

---

## 1. 作業内容

### 1-1. `feature/rec-tokyoghoul`（ミコト実装）
1. 仕様書 §1・§2 の `MACHINES.tokyoghoul` を `tools/rec/index.html` に追加
2. 仕様書 §3 の E1〜E12 を共通部分に追加（すべて定義に指定があるときだけ効く形）
3. 仕様書 §4 の着席処理の小修正
4. テストを新規作成：
   - `tests/rec-tokyoghoul.verify.mjs`（仕様書 §8-2 の全項目）
   - `tests/rec-tokyoghoul-regression.verify.mjs`（仕様書 §8-1。`8d041ce` との比較）
   - `tests/rec-tokyoghoul-build-test-page.mjs`（仕様書 §7。置換数を assert）
5. このブランチでは `tools/rec/acct-test.html` を作り直さない（`rec-account-test-page.test.mjs` は、このブランチでは失敗してよい。失敗が「acct-test と index の不一致」だけであることを報告に書く）

### 1-2. `preview/rec-tokyoghoul`（main から切る）
1. `feature/rec-tokyoghoul` の `tools/rec/index.html` から `node tests/rec-tokyoghoul-build-test-page.mjs` で `tools/rec/tg-test.html` を生成して追加（このブランチに入れるのは生成物だけ。スクリプトとテストは入れない）
2. `tg-test.html` の1行目の `<!DOCTYPE html>` の直後に `<!-- tg-test: built from feature/rec-tokyoghoul <コミットハッシュ7桁> -->` を1行入れる（生成スクリプトで入れる）
3. 文書3つを追加：`docs/specs/tokyoghoul-rec-skeleton-v03.md`、`docs/specs/tokyoghoul-rec-spec-v01.md`、`docs/specs/tokyoghoul-rec-instructions-v01.md`
4. `docs/specs/README.md` の表に3行を**挿入だけ**する（既存行は変えない）
5. `IDEAS.md` の「## 検討中・将来」節の末尾に1行を**挿入だけ**する：
   `- [ ] tools/rec 東京喰種専用記録（MACHINES.tokyoghoul）：骨格書 v0.3 裁可（11/26）→ 第1弾をテスト版 tools/rec/tg-test.html で確認中。正本 docs/specs/tokyoghoul-rec-spec-v01.md`
6. sitemap・トップ・ツール一覧・checkers.html には何も足さない

---

## 2. 検証手順（ツムギ）

### 2-1. `feature/rec-tokyoghoul`
1. `node --check`：index.html の `<script>` 部分を抜き出して構文確認
2. 仕様書 §8-1 の既存テスト全部と新規回帰テストを実行。結果（通過数／失敗数と失敗内容）を報告
3. 仕様書 §8-2 の新規テストを実行。10項目＋具体例8本の結果を報告
4. 差分の目視レビュー：
   - 共通部分の変更が、すべて定義の項目で分岐しているか
   - 機種固有の文字列が共通部分に入っていないか（`git diff` から "有馬"・"喰種"・"死神"・"エンディング" を検索し、定義の中だけにあること）
   - `profit()`・`acct*`・`toChecker()`・`sendToChecker()` に差分が無いこと
5. 仕様書 §8-3 のスクリーンショットを保存（Downloads など、リポジトリの外）

### 2-2. `preview/rec-tokyoghoul`
1. `tg-test.html` と「feature の index.html を生成スクリプトに通したもの」が、先頭コメント行以外で一致すること
2. `tg-test.html` に `noindex` があり、保存キーが `slot-tools-rec-tg-test` であること（`slot-tools-rec"` と `slot-tools-rec-acct-test` が残っていないこと）
3. main との差分が、§1-2 のファイルだけであること（`git diff --stat main`）
4. `rec-account-test-page.test.mjs` が通ること（本番 index と acct-test が変わっていないことの確認）

---

## 3. push・マージ（承認済み）

- `feature/rec-tokyoghoul`：**push 承認済み。main へのマージは不可**（ネネの検収と夢爽の実機確認の後、本番反映の指示書を別に出す）
- `preview/rec-tokyoghoul`：**push と main への `--no-ff` マージを承認済み**。理由：テスト版は保存先が別・noindex・導線なしで、本番の記録に影響しない（2026/10/10 夢爽方針）
- 公開確認：マージ後1〜2分待って `https://slot-tools.jp/tools/rec/tg-test.html` が開けること、`raw.githubusercontent.com/homuratakaaki-ops/slot-tools/<マージコミット>/tools/rec/tg-test.html` の md5 がローカル生成物と一致すること
- コミットハッシュは `git log` の出力からコピーし、push 完了後にだけ報告する（見込みで書かない）

---

## 4. commit 名義

- ミコトの実装（feature の index.html・tests）：`Mikoto <codex@slot-tools.local>`
- 文書（docs/specs 3ファイル・README・IDEAS）と tg-test.html の生成コミット：`Shion <claude@slot-tools.local>`
- マージコミット：`Shion <claude@slot-tools.local>`

---

## 5. 報告に入れること

1. 2つのブランチの最新コミットハッシュ（`git log` からコピー）とマージコミット
2. テスト結果（既存・回帰・新規の通過数と失敗内容）
3. 共通部分の差分の要約（E1〜E12 ごとに、触った関数名）
4. 公開確認の結果（URL が開くこと、md5 一致）
5. 仕様書と違う実装にした箇所があれば、その理由（無ければ「なし」）
