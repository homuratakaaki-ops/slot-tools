# tools/rec 共通改修 段3 実装指示書 v0.1（機種マスター）

- 宛先：ツムギ（実装はミコトへ委任、ツムギがレビュー）
- 作成：シオン／2026-11-27（JST）
- 正本：`docs/specs/rec-common-3-spec-v01.md`（仕様書）、`docs/specs/rec-common-skeleton-v03.md`（骨格書・夢爽裁可済み）
- 進め方：テスト版なし。実装・テスト → main へマージ → 夢爽の承認の一文をもらってから push → シオンの raw 照合 → 夢爽の実機確認

---

## 0. 前提と守ること

- 最新の `main` を取得（基準 `965afc7` 以降）。別の改修が入っていたら着手前にシオンへ知らせる
- 仕様書 §0 の絶対ルールを守る。特に「過去の記録の名前を自動で書き換えない」「マスターが読めなくても手入力で記録できる」「比べ方は `MachineMaster.norm`・`resolve` だけを使い、使う側で書き直さない」
- シオンが作った2ファイルは**中身を変えずに**置く（md5 を確認）：
  - `js/machine-master.js`：md5 `f1978b73abc691d92323bfe145aabff3`
  - `tests/fixtures/machine-master-names-20261127.json`：md5 `54b5e5617ce0b1b02ad063d2a78eea7e`
  - 直す必要があると思ったら、直さずにシオンへ報告
- **push の前に夢爽へ2点確認する**：①本番への push の承認、②本番の rec ノートと稼働日誌の JSON を書き出し済みで、打っている台が無いこと

---

## 1. 作業内容

### 1-1. `feature/rec-common-3`（ミコト実装）
1. 上の2ファイルを置く
2. `tools/rec/index.html`：仕様書 §1（読み込み）・§2〜§6
3. `tools/nisshi/index.html`：仕様書 §1（読み込み）・§7
4. 新規テスト `tests/rec-common-3.verify.mjs`（仕様書 §8-1 の M1〜M15）

### 1-2. main への反映（feature のテストが全部通ってから）
1. `feature/rec-common-3` を main へ `--no-ff` でマージ
2. `node tests/rec-account-build-test-page.mjs` で `tools/rec/acct-test.html` を作り直す
3. 文書2つを追加：`docs/specs/rec-common-3-spec-v01.md`・`docs/specs/rec-common-3-instructions-v01.md`。`docs/specs/README.md` の表に2行を**挿入だけ**
4. `IDEAS.md` の「tools/rec 共通改修（…）」の行を次の1行に**置き換える**：
   `- [x] tools/rec 共通改修（機種マスター・店舗の利用順・開始時再プレイ欄の廃止・クレジット電卓）：骨格書 v0.3 裁可（11/26）。段1〜段3 本番反映済み。新台は js/machine-master.js の末尾に1行足す。正本 docs/specs/rec-common-skeleton-v03.md`

---

## 2. 検証手順（ツムギ）

1. index.html（rec・稼働日誌）の `<script>` 部分を抜き出して `node --check`
2. 仕様書 §8-1 の新規テストと §8-2 の回帰テストを main（マージ後）で1本ずつ実行。通過数／失敗数を報告
3. 既存テストの期待値を変えた場合は、ファイル・行・理由を全部報告
4. 差分の目視レビュー：
   - `profit()`・`acct*`・`midDiff`・`setCredit`・`toChecker`・`sendToChecker` に差分が無いこと
   - 記録の `machine` を書き換えているのが「打ち始める」「簡易収支の保存」「正式名に直す」「元の名前に戻す」の4か所だけであること
   - 機種名の比較（`s.machine===`・`.machine===`）が `machineKey` を通す形に置き換わっていること（`grep` で確認）
   - `js/machine-master.js` と固定一覧の md5 が §0 と一致すること
5. `acct-test.html` が本番 index.html を生成スクリプトに通した結果と一致すること
6. 390px・360px のスクリーンショット（リポジトリの外）：開始画面の候補、簡易収支の候補、「未登録」の印、「正式名に直す」

---

## 3. push・公開確認

- **夢爽の承認の一文をもらってから** main を push（§0 の2点を確認）
- 1〜2分後、`tools/rec/index.html`・`tools/rec/acct-test.html`・`tools/nisshi/index.html`・`js/machine-master.js` の md5 がローカル・raw（最終コミット）・公開ページの3つで一致すること
- コミットハッシュは `git log` からコピーし、push 完了後にだけ報告する

---

## 4. commit 名義

- ミコトの実装（index.html 2つ・tests）：`Mikoto <codex@slot-tools.local>`（ツムギが直接直した分は `Tsumugi <tsumugi@slot-tools.local>`）
- シオンのファイル（`js/machine-master.js`・固定一覧）と文書（docs/specs 2ファイル・README・IDEAS）：`Shion <claude@slot-tools.local>`
- acct-test の作り直し・マージコミット：`Tsumugi <tsumugi@slot-tools.local>`

---

## 5. 報告に含めるもの

1. 各コミット（`git log` からコピー）
2. テスト結果と、期待値を変えた既存テストの一覧
3. §2-4 の確認結果
4. md5（§3 の4ファイルそれぞれ3つ）
5. 気づいた点（仕様と食い違うところ、判断に迷ったところ）
