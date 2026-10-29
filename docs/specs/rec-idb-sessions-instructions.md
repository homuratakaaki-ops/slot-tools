# 指示書：tools/rec 終わった実戦を IndexedDB へ移す（テスト版の作成まで）

宛先：ツムギ（Claude Code）→ 実装はミコト（Codex）に委任　発行：シオン　2026-10-29
仕様の正本：`docs/specs/rec-idb-sessions-spec.md`（この指示書と同じブランチに入れる）

## 今回の範囲
- **第1便（今回）**：テスト版を作り、公開して止める。本番の `tools/rec`・`tools/nisshi` は変更しない
- 第2便（あとで別指示）：ネネ検収と夢爽の実機確認のあと、本番へ反映し、テスト版を削除する（night-merge・0時）

## 作業内容
1. ブランチ `feature/rec-idb-sessions` を作る
2. 新規 `js/rec-store.js` を仕様 §3.3 のとおり作る（classic script・`window.RecStore`・DB名とキーは引数で受ける）
3. テスト版を作る（§9-108-1）
   - `tools/rec-test/index.html`：`tools/rec/index.html` の複製に仕様 §3〜§4 を入れたもの。保存キーは `slot-tools-rec-test`、IndexedDB 名は `slot-tools-rec-test`、退避キーは `slot-tools-rec-test-broken`
   - `tools/nisshi-test/index.html`：`tools/nisshi/index.html` の複製に仕様 §6 を入れたもの。日誌の DB 名は `slot-tools-nisshi-test`、rec の読み込み先は `slot-tools-rec-test`
   - 2ページとも noindex・導線なし・サイトマップ未登録。画面上部に「テスト版」と表示する。Google タグ・AdSense タグは外す
   - テスト版の差分は「保存先の切り替え」と「テスト版の表示」だけにし、第2便で本番に同じ変更を入れられるようにする
4. 合成テストデータの生成スクリプトと、受け入れ条件（仕様 §8 の1〜10）の自動テストを `tests/rec-idb-sessions.*` に置く。夢爽の実データは入れない
5. 仕様書と、この指示書を `docs/specs/` に入れる

## 検証手順
1. 仕様 §8 の受け入れ条件1〜10を、Playwright（Chromium・390px）で全部通す。結果は項目ごとに合否と数値（件数・文字数）で報告する
2. 本番の `tools/rec/index.html`・`tools/nisshi/index.html` に差分がないことを `git diff --stat main` で示す
3. `node --check`・`git diff --check`・既存の `node test/verify.mjs` が通ること
4. 公開後、テスト版2ページが200で返ることを確認し、各ファイルの md5 を報告する（シオンが raw と照合する）

## 反映
- 第1便は新規ページの追加のみで、本番の保存データに触れないため、日中に main へ反映してよい
- push・マージは、夢爽本人の承認の一言をもらってから行う
- マージは `--no-ff`

## commit 名義
- 実装（js・テスト版・テスト）：Mikoto <codex@slot-tools.local>
- 仕様書・指示書：Shion <claude@slot-tools.local>
- マージコミット：Shion <claude@slot-tools.local>

## 報告
- コミットハッシュは `git log` からコピーし、push 完了後にのみ報告する
- 仕様どおりにできなかった点、仕様の矛盾・不足に気づいた点は、実装で勝手に埋めずに報告する

## 第1便のあと（今回はやらない）
- ネネ検収：保存互換（移行前後の書き出し一致）・途中で閉じたときの復旧・日誌の取り込み一致・操作
- 夢爽の実機確認：テスト版 rec に自分のバックアップ JSON を取り込み、台を1台記録して終了 → ノート・日誌で確認
- 第2便：本番へ同じ変更・テスト版削除・rec 上部の告知・night-merge
