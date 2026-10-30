# 指示書：rec IndexedDB 移行 第2便（本番反映・テスト版の片付け）

宛先：ツムギ（Claude Code）　発行：シオン　2026-10-30
前提：テスト版 main `9e90c8a` はネネ再検収合格（高0・中0・低0）、夢爽の Android 実機確認合格（10/30 2:00。移行後 slot-tools-rec-test 24,391文字、日誌テスト版への取り込み・開き直し後の保持を確認）
夢爽の裁定（10/30）：今回の方式で本番に反映する。反映は **10/31（土）0:00 の night-merge**。告知は rec 上部のお知らせ帯（仕様 §9 のシオン推奨案）

本番 `tools/rec`・`tools/nisshi` はテスト版の複製元（9380605 の親）から変更なし（シオン確認済み）。

## PR-1：お知らせ帯（日中にすぐ反映。保存データに影響しない見た目だけの変更＝§9-108-3b）
1. ブランチ `feature/rec-idb-notice`
2. `tools/rec/index.html` のヘッダー直下に、閉じるボタンなしの細い帯を1つ足す
   - 文言：「10/31（土）0時に保存方式を更新します。念のため、ノートの「保存」で書き出しをしておいてください。」
   - 既存の `.warn` 系の色は使わない（警告ではないため）。落ち着いた色で1〜2行、390pxではみ出さない
   - 保存処理・キーには一切触れない
3. 検証：390px のスクリーンショット、`git diff --stat` が tools/rec/index.html だけ、既存テストが通る
4. 夢爽の承認後に `--no-ff` でマージ・push・公開確認

## PR-2：本番反映（night-merge ラベル付き PR。マージは 10/31 0:00 の自動処理に任せる）
1. ブランチ `feature/rec-idb-release`（PR-1 マージ後の main から）
2. `tools/rec/index.html`：テスト版の変更を本番へ移す
   - 作り方：`tools/rec-test/index.html` を元に、保存キー `slot-tools-rec`、IndexedDB 名 `slot-tools-rec`、退避キー `slot-tools-rec-broken` にし、「テスト版」表示を外し、PR-1 のお知らせ帯も外す
   - 確認：できたファイルと PR-1 前の本番との差分が、テスト版と複製元の差分と同じ範囲（保存まわり・rec-store 読み込み）だけであること。差分の要約を報告する
3. `tools/nisshi/index.html`：同様に移す（日誌の DB 名 `slot-tools-nisshi`、rec の読み込み先 `slot-tools-rec`、「テスト版」表示を外す）
4. `js/rec-store.js` は変更なし。両ページの読み込みの `?v=` は `20261031` にする（§9-107）
5. テスト版の削除（§9-108-2）：`tools/rec-test/`・`tools/nisshi-test/` を削除する
6. テスト `tests/rec-idb-sessions.*` の対象を本番ページ（tools/rec・tools/nisshi、本番のキー名）に切り替え、全項目を再実行する（§8 の1〜10・例1〜7・追加ケース・ネネの遅延書き込みの再現・破損時の退避キー・起動時の世代）
7. 仕様書の状態を「本番反映済み（10/31 0:00 予定）」に、§9 を夢爽の裁定で埋める（Shion 名義）
8. NEW 欄：rec は限定公開（導線なし）のため追記しない
9. PR を作り、`night-merge` ラベルを付ける。draft にしない。マージは手動で行わない

## 検証手順（PR-2）
- 上記6のテストが全部 PASS
- `node --check`・`git diff --check`・`node test/verify.mjs`
- 後読みの正規表現なし（§9-106）
- 本番ページから `slot-tools-rec-test`・`nisshi-test` という文字列が消えていること
- PR-2 の差分ファイル一覧を報告する

## 反映後（10/31 朝）の確認
- ツムギ：0:00 のマージ完了と、本番 `tools/rec`・`tools/nisshi`・`js/rec-store.js` の md5 が PR の内容と一致することを報告。テスト版の URL が 404 になっていること
- 夢爽：①古い rec のタブを全部閉じる ②Chrome で `slot-tools.jp/tools/rec/` を開く（ここで引っ越しが行われる）③ノートの件数がいつもどおりか ④保存容量チェックで `slot-tools-rec` が数万文字程度に減っているか

## push・マージ
- PR-1：夢爽本人の承認の一言の後にマージ・push
- PR-2：夢爽本人の承認の一言の後に push と PR 作成・ラベル付けまで。マージは night-merge

## commit 名義
- 本番への移植・テスト版削除・テスト切り替え：書いた担当（Tsumugi または Mikoto）
- 仕様書・指示書・PR-1 のマージ：Shion <claude@slot-tools.local>

## 報告
- コミットハッシュは push 後に `git log` からコピー。PR 番号と URL も報告
