# tools/rec 共通改修 段1 本番反映 指示書 v0.1

- 宛先：ツムギ
- 作成：シオン／2026-11-26（JST）
- 前提：シオンの raw 照合 合格（main 039eceb）、ネネの検収 合格（T1〜T12、高0・中0・低0）、**夢爽の AQUOS 実機確認 OK**（T13）
- **夢爽の実機確認 OK が出るまで、この指示書は実行しない**
- 反映のタイミング：tools/rec は夢爽だけが使うツールなので、夜を待たず即反映でよい（2026-11-26 夢爽決定）

---

## 0. 反映前に夢爽がすること
- 本番 https://slot-tools.jp/tools/rec/ のノート →「保存」で、JSON を書き出しておく（念のため）
- 打っている最中の台があれば、反映の前に終わらせるか、反映後にページを読み込み直す

---

## 1. 作業内容（main 上で）

1. 最新の main を取得する（基準は `039eceb` 以降）。東京喰種など別の改修が main に入っていたら、手順2の前にシオンへ知らせる
2. `feature/rec-common-1`（`4e27443`）を main へ `--no-ff` でマージする
3. `node tests/rec-account-build-test-page.mjs` で `tools/rec/acct-test.html` を作り直す
4. `tools/rec/common-test.html` を削除する（`tests/rec-common-build-test-page.mjs` は段2以降で使うので残す）
5. `IDEAS.md` の「tools/rec 共通改修（…）」の行（491行付近）を、次の1行に**置き換える**（`[ ]` のまま。段2・段3が残るため）：
   `- [ ] tools/rec 共通改修（機種マスター・店舗の利用順・開始時再プレイ欄の廃止・クレジット電卓）：骨格書 v0.3 裁可（11/26）。段1（再プレイ欄の廃止・店舗の利用順）本番反映済み。段2（クレジット電卓）・段3（機種マスター）は未着手。正本 docs/specs/rec-common-skeleton-v03.md`
6. この指示書を `docs/specs/rec-common-1-release-instructions-v01.md` として追加し、`docs/specs/README.md` の表に1行を**挿入だけ**する

---

## 2. 検証手順

1. main で rec 系の全テストを1本ずつ実行し、結果を報告：
   `rec-common-1`・`rec-account`・`rec-account-test-page`（**ここで通ること**）・`rec-stock-replay`・`rec-log-order`・`rec-log-order-past`・`rec-cycle-label`・`rec-hibireturn-state-label`・`rec-tokyoghoul`・`rec-tokyoghoul-regression`・`rec-idb-sessions.e2e`
2. `tools/rec/index.html` が `4e27443` の `tools/rec/index.html` と一致すること
3. `tools/rec/acct-test.html` が、本番 index.html を `rec-account-build-test-page.mjs` に通した結果と一致すること
4. `tools/rec/common-test.html` が main に無いこと
5. `git diff --stat 039eceb main` が、index.html・acct-test.html・common-test.html（削除）・tests 4ファイル（4e27443 の分）・IDEAS.md・docs/specs 2ファイルだけであること

---

## 3. push・公開確認（承認済み）

- main への push 承認済み
- マージ後1〜2分待って、次の md5 が3つずつ一致することを確認：
  - `tools/rec/index.html`：ローカル／`raw.githubusercontent.com/homuratakaaki-ops/slot-tools/<最終コミット>/tools/rec/index.html`／https://slot-tools.jp/tools/rec/
  - `tools/rec/acct-test.html`：同様
- https://slot-tools.jp/tools/rec/common-test.html が 404 になること
- コミットハッシュは `git log` の出力からコピーし、push 完了後にだけ報告する

---

## 4. commit 名義

- マージコミット・acct-test の作り直し・common-test の削除・IDEAS・docs：`Shion <claude@slot-tools.local>`
- （`4e27443` は Mikoto 名義のまま取り込まれる）

---

## 5. 報告に含めるもの

1. マージコミットと最終コミット（`git log` からコピー）
2. §2 のテスト結果と一致確認
3. §3 の md5（index.html・acct-test.html それぞれ3つ）と common-test.html の 404
