# tools/rec 共通改修 段2 実装指示書 v0.1（クレジット・途中差枚・電卓）

- 宛先：ツムギ（実装はミコトへ委任、ツムギがレビュー）
- 作成：シオン／2026-11-26（JST）
- 正本：`docs/specs/rec-common-2-spec-v01.md`（仕様書）、`docs/specs/rec-common-skeleton-v03.md`（骨格書・夢爽裁可済み）
- 進め方：tools/rec はテスト版を作らない（2026-11-26 夢爽決定）。実装・テスト → main へマージ → 夢爽の承認の一文をもらってから push → シオンの raw 照合 → 夢爽の実機確認

---

## 0. 前提と守ること

- 最新の `main` を取得（基準 `4d016d2` 以降）。別の改修（東京喰種など）が入っていたら着手前にシオンへ知らせる
- 仕様書 §0 の絶対ルールを守る。特に「電卓で終了持ちメダル・投資・再プレイ・口座を変えない」「収支・口座・振り返りノート用の計算を変えない」「今のテンキー `#kp` を変えない」
- 仕様書に書いていない UI 変更はしない。迷ったら着手前にシオンへ聞く
- **push の前に夢爽へ2点確認する**：①本番への push の承認、②本番ノートの JSON を書き出し済みで、打っている台が無いこと（今回は保存データに項目が増えるため）

---

## 1. 作業内容

### 1-1. `feature/rec-common-2`（ミコト実装）
1. 仕様書 §1（差枚マスの2段化・`#bCredit`）
2. 仕様書 §2（電卓 `openCalc`・`#calc`）
3. 仕様書 §3（`setCredit`、3つの経路、取り消しの広げ方）
4. 仕様書 §4（`midDiff`。`renderMoney`・`applyMedal` から使う）
5. 仕様書 §6（形チェック・`fixSession` の補完）
6. 新規テスト `tests/rec-common-2.verify.mjs`（仕様書 §7-1 の U1〜U22）

### 1-2. main への反映（feature のテストが全部通ってから）
1. `feature/rec-common-2` を main へ `--no-ff` でマージ
2. `node tests/rec-account-build-test-page.mjs` で `tools/rec/acct-test.html` を作り直す
3. 文書2つを追加：`docs/specs/rec-common-2-spec-v01.md`・`docs/specs/rec-common-2-instructions-v01.md`。`docs/specs/README.md` の表に2行を**挿入だけ**
4. `IDEAS.md` の「tools/rec 共通改修（…）」の行を次の1行に**置き換える**（`[ ]` のまま）：
   `- [ ] tools/rec 共通改修（機種マスター・店舗の利用順・開始時再プレイ欄の廃止・クレジット電卓）：骨格書 v0.3 裁可（11/26）。段1（再プレイ欄の廃止・店舗の利用順）・段2（クレジット・途中差枚・電卓）本番反映済み。段3（機種マスター）は未着手。正本 docs/specs/rec-common-skeleton-v03.md`

---

## 2. 検証手順（ツムギ）

1. index.html の `<script>` 部分を抜き出して `node --check`
2. 仕様書 §7-1 の新規テストと §7-2 の回帰テストを、main（マージ後）で1本ずつ実行。通過数／失敗数を報告
3. 既存テストの期待値を変えた場合は、ファイル・行・変えた理由（仕様書のどの節によるか）を全部報告
4. 差分の目視レビュー：
   - `profit()`・`acct*`・`toEnvelope`・`toChecker`・`sendToChecker`・`askNum`・`#kp` に差分が無いこと
   - `money.credit` への代入が `setCredit` の中だけであること（`grep` で確認）
   - 東京喰種の区間の差枚を出す処理（`recordSummary` の `cr` の差）に差分が無いこと
5. `acct-test.html` が本番 index.html を生成スクリプトに通した結果と一致すること
6. 390px・360px のスクリーンショット（リポジトリの外）：記録画面の2段のマス（未入力・入力済み・※あり）、電卓（エラー表示あり）

---

## 3. push・公開確認

- **夢爽の承認の一文をもらってから** main を push（§0 の2点を確認）
- 1〜2分後、`tools/rec/index.html` と `tools/rec/acct-test.html` の md5 がローカル・raw（最終コミット）・公開ページの3つで一致すること
- コミットハッシュは `git log` からコピーし、push 完了後にだけ報告する

---

## 4. commit 名義

- ミコトの実装（feature の index.html・tests）：`Mikoto <codex@slot-tools.local>`（ツムギが直接直した分は `Tsumugi <tsumugi@slot-tools.local>`）
- 文書（docs/specs 2ファイル・README・IDEAS）：`Shion <claude@slot-tools.local>`
- acct-test の作り直し・マージコミット：`Tsumugi <tsumugi@slot-tools.local>`

---

## 5. 報告に含めるもの

1. 実装・acct-test・文書・マージの各コミット（`git log` からコピー）
2. テスト結果と、期待値を変えた既存テストの一覧
3. §2-4 の確認結果
4. md5（index.html・acct-test.html それぞれ3つ）
5. 気づいた点（仕様と食い違うところ、判断に迷ったところ）
