# 東京喰種 第1号 段3（旧111件の手集計を取り込む）実装指示書 v0.1

- 宛先：ツムギ（実装はミコトへ委任、ツムギがレビュー）
- 作成：シオン／2026-11-28（JST）
- 根拠：仕様書 `tokyoghoul-stats-3-spec-v01.md`
- 基準：main `ec7ebbe`。作業開始時に main が進んでいたら最新から始め、報告に基準のハッシュを書く
- 反映：**featureブランチの push まで承認済み。main へのマージは push 前報告 → シオン確認 → 夢爽本人の承認の後**
- テスト版：作らない

---

## 0. 守ること

- 仕様書 §0 の絶対ルールをすべて守る。特に**円の収支に入れない**、**夢爽の実データをリポジトリに置かない**、**元のログ・注記を保存しない**
- tools/rec は触らない。`js/play-stats.js` は `importConfirmed` を足すだけ（既存の関数の中身は変えない）
- 仕様にない機能は足さない。気づいた点は報告に書くだけ

---

## 1. 夢爽の要望と理由

- 11/27までの東京喰種111件は、ネネが1台ずつ数えた値（手集計）を使い、それより後の台は自動で数える（骨格書 Q1・Q4）
- 111件の多くは汎用の記録ツールで記録した台で、自動では数えられない。手集計を取り込むと、今の集計とつながる
- 有馬ジャッジメントは、ネネが111件すべての台に入れ直し、合計が成功4・失敗7（推定1）になることをシオンが確認済み

---

## 2. 作業内容

仕様書 §2〜§4 のとおり。要点：

1. `js/play-stats.js` に `importConfirmed(json)`（DOM なし・Node から呼べる）。戻り値 `{rows, totals, errors}`
2. 日誌の設定に「東京喰種の手集計を読み込む」：ファイル選択 → プレビュー（台数・期間・合計・summary との一致）→ 読み込む（`meta.statsConfirmed.tokyoghoul` を丸ごと置き換え）／読み込み済みの表示と「取り消す」
3. 集計の表示の補足：「経路の記録なし ◯回」、手集計の台の小さな注記（詳細・履歴）、台の詳細の注記

---

## 3. 検証

1. `tests/play-stats.test.mjs` に T1〜T4 を足す。合成ファイルは `tests/fixtures/tokyoghoul-confirmed-synthetic.json`（実ファイルと同じ形・匿名・5〜6件）
2. 新しい検証 `tests/tokyoghoul-stats-3.verify.mjs`（headless Chrome、既存の harness）：T5〜T13
3. 既存の検証をすべて通す（T14）。直したアサートがあれば一覧にする
4. スクリーンショットを Downloads の新しいフォルダに保存（390px）：設定の節（読み込み前・プレビュー・読み込み済み）、概要（合成の確定値を読み込んだ状態）、詳細（経路の記録なし・注記）、履歴（注記）

---

## 4. push・反映

- ブランチ `feature/nisshi-tokyoghoul-stats-3` を切る
- テスト全通過 → featureブランチを push → **ここで止めて報告**
- シオンの確認と夢爽本人の承認の後、ツムギが main へ `--no-ff` マージ → push
  - 公開確認：`/tools/nisshi/` と `/js/play-stats.js` が 200。両ファイルの md5 が raw（push 後のコミット）・Pages・ローカルで一致
  - 日誌の `play-stats.js` の読み込みの `?v=` を新しい値に変える（古い版が残らないように）
  - 夢爽への案内：反映後は日誌を `?v=` 付きで開き直し、設定から `tokyo_ghoul_111sessions_20261128_arima.json` を読み込む
- 文書（featureブランチに含める。夢爽の Downloads か Documents にあるものをそのままコピーし、md5 で原本と一致を確かめる）
  - `docs/specs/tokyoghoul-stats-3-spec-v01.md`
  - `docs/specs/tokyoghoul-stats-3-instructions-v01.md`
  - `docs/specs/README.md` に2行を挿入
  - IDEAS.md：東京喰種 第1号の行（`- [ ] 東京喰種 第1号 自動集計…`）の文末の「段3 旧111件は未着手」を「段3 旧111件は 2026-11-28 に指示書 docs/specs/tokyoghoul-stats-3-instructions-v01.md」に**置き換えるだけ**。`[x]` にするのはマージ後、夢爽が実ファイルを読み込んで確認してから

---

## 5. commit 名義

- ミコトの実装（js/play-stats.js・tools/nisshi/index.html・tests・fixtures）：`Mikoto <codex@slot-tools.local>`
- 文書（docs/specs・README・IDEAS.md）：`Shion <claude@slot-tools.local>`
- マージ：`Tsumugi <tsumugi@slot-tools.local>`

---

## 6. 報告（push 前に止めたとき）

1. 基準にした main のハッシュと、featureブランチのコミットハッシュ（`git log` からコピー、push 後のみ）
2. `importConfirmed` の形（引数・戻り値）と、仕様書から変えた点
3. テスト結果（T1〜T14）と、直した既存アサートの一覧
4. 既存の分析（円・月別・機種別・店別）が読み込み前後で同じだったこと
5. スクリーンショットの保存場所
6. 気づいたが直していない点（あれば）
