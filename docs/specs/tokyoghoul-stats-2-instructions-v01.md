# 東京喰種 第1号 段2（稼働日誌の集計）実装指示書 v0.1

- 宛先：ツムギ（実装はミコトへ委任、ツムギがレビュー）
- 作成：シオン／2026-11-28（JST）
- 根拠：骨格書 `docs/specs/tokyoghoul-nisshi-stats-skeleton-v02.md`（夢爽裁可）／仕様書 `tokyoghoul-stats-2-spec-v01.md`
- 基準：main `01dcb42`（段1 反映済み）。作業開始時に main が進んでいたら最新から始め、報告に基準のハッシュを書く
- 反映：**featureブランチの push まで承認済み。main へのマージは push 前報告 → シオン確認 → 夢爽本人の承認の後**
- テスト版：作らない（段1・rec 共通改修と同じ扱い。日誌の保存が増えるのは、夢爽が訂正したときの `statsFix` だけ）

---

## 0. 守ること

- 仕様書 §0 の絶対ルールをすべて守る。特に**既存の分析の数字・見た目を変えない**、**集計値を保存しない**、**IndexedDB の版を上げない**
- tools/rec・js/rec-store.js・js/machine-master.js は**触らない**（machine-master は読むだけ）
- 仕様にない整理・書き換えはしない。気づいた点は報告に書くだけ
- 検証のデータは匿名の合成データだけ。夢爽の実戦データをリポジトリに置かない

---

## 1. 夢爽の要望と理由

- 稼働日誌で東京喰種の CZ・AT 確率、CZ 成功率、差枚を自動で出したい（ネネの手集計をなくす）。将来は他機種にも広げたい → 集計は共通部品＋機種ごとの定義に分け、今回は東京喰種だけ有効にする
- 前回の当選契機からモードを予想し、CZ失敗後の次を予想しやすい形を探したい → 「CZごとの表」「失敗の次」を出す（予想そのものは表示しない）
- 段1で rec に足した値（前回CZの契機・G数・規定G数、前回AT結果、CZ当選の規定G数、通常時に戻ったG数）を、ここで使う

---

## 2. 作業内容

仕様書 §1〜§8 のとおり。要点：

1. 新規 `js/play-stats.js`：`defFor`・`extract`・`aggregate`・`czRows`・`effectiveSetup` と `defs.tokyoghoul`、有効一覧 `['tokyoghoul']`。DOM なし、Node からも読める
2. `tools/nisshi/index.html`
   - `play-stats.js` を読む（`?v=20261128`）
   - `envelopePlay`：`payload.structVer>=1` のときだけ構造化データを使う。旧JSONの取り込み結果は変えない
   - `PROTECTED` に `statsFix` を追加。`mergeManual` で引き継ぐ
   - 分析：機種＝「L東京喰種」のとき「東京喰種の集計」の節（絞り込み・台単位の表・CZごとの表・失敗の次・注記）
   - 台の詳細：「この台の集計」と「前回状況を補足・訂正」シート、「rec の値に戻す」
3. ミコトがコードで確かめて報告すること
   - rec の東京喰種で、`hitStart.hit==='AT'` に付く契機の全種類（CZ成功→AT・EP→AT・死神→AT・AT直撃）と、§2 の分類で全部拾えるか
   - CZ成功・失敗の `hitEnd.result` の実際の値
   - 簡易収支と紐づいた台・手でまとめた台で、rec の `raw`（events・setup・machineId）がどこに残るか。集計で取りこぼしが出る形があれば、直さずに報告

---

## 3. 検証

1. 新しい検証を2つ作る
   - `tests/play-stats.test.mjs`（Node、ブラウザなし）：仕様書 §9 の P1〜P19
   - `tests/tokyoghoul-stats-2.verify.mjs`（headless Chrome、既存の harness を使う）：B1〜B9
2. B7（既存の分析が変わらない）は、`01dcb42` の日誌と今回の日誌に同じデータを入れ、分析画面の数字（合計・機種別・店別・狙い方・月別）を比べる
3. 既存の検証（rec-common-3・rec-account・rec-tokyoghoul・tokyoghoul-stats-1 ほか日誌・rec に関わるもの）をすべて通す。直したアサートがあれば一覧にする
4. 390px のスクリーンショットを Downloads の新しいフォルダに保存：分析の「東京喰種の集計」節（上から下まで）、台の詳細の「この台の集計」、訂正シート
5. 検証の Chrome の場所が `C:/Program Files/...` 固定になっている件は、今回は触らない（保留）

---

## 4. push・反映

- ブランチ `feature/nisshi-tokyoghoul-stats-2` を切る
- テスト全通過 → featureブランチを push → **ここで止めて報告**
- シオンの確認と夢爽本人の承認の後、ツムギが main へ `--no-ff` マージ → push
  - 公開確認：`/tools/nisshi/` と `/js/play-stats.js` が 200。`tools/nisshi/index.html`・`js/play-stats.js` の md5 が raw（push 後のコミット）・Pages・ローカルで一致
  - acct-test.html は tools/rec を触らないので作り直し不要（作り直して差分が出たら報告）
- 文書（featureブランチに含める。夢爽の Downloads か Documents にあるものをそのままコピーし、中身は変えない。md5 で原本と一致を確かめる）
  - `docs/specs/tokyoghoul-stats-2-spec-v01.md`
  - `docs/specs/tokyoghoul-stats-2-instructions-v01.md`
  - `docs/specs/README.md` に2行を挿入
  - IDEAS.md：段1の行（`- [ ] 東京喰種 第1号 自動集計…`）の文末の「段2 日誌の集計・段3 旧111件は未着手」を「段2 日誌の集計は 2026-11-28 に指示書 docs/specs/tokyoghoul-stats-2-instructions-v01.md、段3 旧111件は未着手」に**置き換えるだけ**（ほかの行は触らない）

---

## 5. commit 名義

- ミコトの実装（js/play-stats.js・tools/nisshi/index.html・tests・fixtures）：`Mikoto <codex@slot-tools.local>`
- 文書（docs/specs・README・IDEAS.md）：`Shion <claude@slot-tools.local>`
- マージ：`Tsumugi <tsumugi@slot-tools.local>`

---

## 6. 報告（push 前に止めたとき）

1. 基準にした main のハッシュと、featureブランチのコミットハッシュ（`git log` からコピー、push 後のみ）
2. §2-3 の3つの調査結果（ATの契機の全種類と分類、CZの result の値、紐づき・まとめた台での rec の raw の残り方）
3. 公開する関数の名前・形を仕様書の例から変えた場合はその内容
4. テスト結果（P1〜P19・B1〜B10）と、直した既存アサートの一覧
5. B7 で比べた画面と結果
6. スクリーンショットの保存場所
7. 気づいたが直していない点（あれば）
