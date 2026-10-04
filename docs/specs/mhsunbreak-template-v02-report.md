# モンハン なな様テンプレ v02 実装・検証報告

ブランチ: `feat/mhsunbreak-template-v02`。比較基準: `3be5e98b48fd46abac7c110eace8118b39d0f527`。
実装: ミコト。コミット名義: `Mikoto <codex@slot-tools.local>`。
コミットSHA・push結果は納品メッセージを参照。PR作成・マージはツムギ担当。

BZタブに1回目／2回目以降の発展先を記録し、成功率の分母を両テーブルの合計から導出する。BZの記録はテンプレのみに出力し、カード定義と共通engineは変更していない。

## 変更ファイル

- `checker-data/mhsunbreak.js`: BZ state・正規化・入力ページ・56スロットのテンプレ。
- `mhsunbreak-checker.html`: 4タブ・機種JSクエリ・UI BZ v02。
- `mhsunbreak-guide.html`: BZ節追加、テンプレ出力節の追随。
- `docs/specs/mhsunbreak-nana-template-v02.txt`: 受領正本を無変更で追加。
- `docs/specs/mhsunbreak-template-v02.md`: 受領指示書を追加。
- `docs/specs/mhsunbreak-template-v02-report.md`: 本報告。
- `tests/fixtures/mhsunbreak-{zero,mixed,all}-template.txt`: v02 golden 3件。
- `tests/new-1005-four-machines.test.mjs`: モンハンのタブ・クエリ・正本・golden期待値更新。
- `tests/new-1005-four-machines.browser.mjs`: モンハンのカードタブ番号更新、実ボタン検証追加。
- `tests/new-1005-public.verify.mjs`: モンハン追加3節を分離して既存部分を比較。
- `tests/magireco-remove-estimate.verify.mjs`: 過去版の無変更対象から今回変更するモンハン2ファイルだけを分離。マギレコの検証内容は維持。
- `tests/mhsunbreak-template-v02.verify.mjs`: 正本ハッシュ・旧データ・カード全組合せ・他機種不変の専用監査。

## 指示書§9の結果

| 番号 | 結果 | 件数・証拠 |
|---|---|---|
| 1 | PASS | 正本の空欄34個を指定規則で埋めた本文と1件バイト一致。値スロット56個。diff全文は下記。 |
| 2 | PASS | zeroの「■レア役からのBZ当選率」以降1件バイト一致。golden差分は追加27行のみ。 |
| 3 | PASS | 指定3操作で通常コピーの4行のみ変化。下記実測。 |
| 4 | PASS | 成功14ボタンでテーブルと成功数を一括取消。失敗12ボタンも取消確認。別の発展先の記録を保持。 |
| 5 | PASS | 新規3グループをリセットで全0、取消で全復元。リロード保持も確認。 |
| 6 | PASS | 失敗12ボタンでn=d時disabled＋aria-disabled、n<d時有効。成功14ボタンの減算・取消も確認。 |
| 7 | PASS | 下部4タブ。全4タブでscrollイベントを明示発火し、切替復帰を確認。指スクロールの最終確認は実機。 |
| 8 | PASS | 新規キーなしの保存データで既存hits・cycle・atEndを保持、例外0。7種の読込クランプと冪等性も確認。 |
| 9 | PASS | 確定演出18項目の262,144組合せでblocks／bottom／chart／detailが基準とバイト一致。BZ値を非0にして比較。 |
| 10 | PASS | 実iframe 360×530／390×530。BZタブはみ出し各0、最小ボタン高各44px。画面画像を目視確認。 |
| 11 | PASS | 他機種のHTML・機種定義に差分0。共用テストの変更はモンハンの期待値と検証に限定。 |
| 12 | PASS | checker-engine.js／checker-bayes.js、2ファイルとも基準とバイト一致。 |
| 13 | PASS | ricorico／toaru2 × zero／mixed／all、6出力が3be5e98とバイト一致。 |
| 14 | PASS | node test/verify.mjs: サニティ6設定・区間分割6設定が全OK。 |
| 15 | PASS | node --test: 22件PASS、FAIL 0、skip 0。 |
| 16 | PASS | node tests/new-1005-four-machines.browser.mjs: 108項目PASS、FAIL 0、コンソール／未捕捉Promise例外0。 |
| 17 | PASS | node tests/new-1005-public.verify.mjs: 6報告グループ全PASS。golden 3件、他機種既存組合せ検証も維持。 |
| 18 | PASS | node tests/magireco-remove-estimate.verify.mjs: 3報告グループ全PASS。確定22種・279状態、テンプレ3件、無関係54ファイル。 |
| 19 | PASS（増加なし） | wording-noukou.browser.mjsはPASS 8／既知FAIL 6。省略は既知の6機種8行のみ、実行終了コード1。下記一覧。 |
| 20 | 原文由来の例外34件／その他PASS | git diff --checkはコード差分でPASS。正本を含むcached全体は原文の行末空白34件で終了コード非0。正本を除くcachedチェックはPASS。全変更ファイルLF。 |

§20の空白は値スロットそのものであり、正本の1バイト不変指定を優先して保持した。設定や正本を書き換えて警告を隠していない。
正本は1881バイト。作業開始時・作業後・Git indexのSHA256はすべて `235abdc9ac7fc00f589995afd8fa2619fbd7bfb68eb6720100250885238119d2`。v01正本も保持。

## 全0本文比較のdiff全文

比較対象は§8-2の規則どおり、BZ空欄を0回・クエスト空欄を0/0・AT終了画面空欄を0回で埋めた正本と、出力のヘッダー／フッターを除いた本文。原文の空欄と値入力後の文字列を直接同一とは扱っていない。

```diff
```

出力0バイト、差分なし。

## zero goldenの作り直しdiff全文

`git diff --cached --unified=0 -- tests/fixtures/mhsunbreak-zero-template.txt`

```diff
diff --git a/tests/fixtures/mhsunbreak-zero-template.txt b/tests/fixtures/mhsunbreak-zero-template.txt
index d70b215..1e37342 100644
--- a/tests/fixtures/mhsunbreak-zero-template.txt
+++ b/tests/fixtures/mhsunbreak-zero-template.txt
@@ -6,0 +7,27 @@ _______
+■BZテーブル1回目
+青ｽﾀｰﾄ        ▶︎ 0回
+黄ｽﾀｰﾄ        ▶︎ 0回
+ﾗｲｾﾞｸｽ        ▶︎ 0回
+ｾﾙﾚｷﾞｵｽ      ▶︎ 0回
+ｵﾛﾐﾄﾞﾛ亜種▶︎ 0回
+ﾃｵﾃｽｶﾄﾙ      ▶︎ 0回
+AT               ▶︎ 0回
+
+■BZテーブル2回目以降
+青ｽﾀｰﾄ        ▶︎ 0回
+黄ｽﾀｰﾄ        ▶︎ 0回
+ﾗｲｾﾞｸｽ        ▶︎ 0回
+ｾﾙﾚｷﾞｵｽ      ▶︎ 0回
+ｵﾛﾐﾄﾞﾛ亜種▶︎ 0回
+ﾃｵﾃｽｶﾄﾙ      ▶︎ 0回
+AT               ▶︎ 0回
+
+■クエスト成功率
+青ｽﾀｰﾄ        ▶︎ 0/0
+黄ｽﾀｰﾄ        ▶︎ 0/0
+ﾗｲｾﾞｸｽ        ▶︎ 0/0
+ｾﾙﾚｷﾞｵｽ      ▶︎ 0/0
+ｵﾛﾐﾄﾞﾛ亜種▶︎ 0/0
+ﾃｵﾃｽｶﾄﾙ      ▶︎ 0/0
+AT               ▶︎ 0/0
+
```

既存部分の比較diffも出力0バイト。3 goldenはいずれも2230バイト、既存部分の出力は維持。

## 指定3操作の実測

行番号はヘッダーを含む通常コピーの1始まり。

| 行 | セクション・項目 | 操作前 | 操作後 |
|---|---|---|---|
| 8 | BZテーブル1回目・青ｽﾀｰﾄ | 0回 | 2回 |
| 23 | BZテーブル2回目以降・AT | 0回 | 1回 |
| 26 | クエスト成功率・青ｽﾀｰﾄ | 0/0 | 1/2 |
| 32 | クエスト成功率・AT | 0/0 | 1/1 |

この4行以外は通常コピー全体でバイト不変。

## 既知の省略と検証環境

省略は、kanokari 2行、mhsunbreak 2行、mogumogu 1行、magireco 1行、mieruko 1行、takoslot 1行。合計6機種8行で増加なし。カード変更禁止に従い修正していない。
ブラウザ検証はChrome、広告・解析タグ・Google Fonts取得を空応答にしたオフライン条件。フォントは代替フォントでの寸法測定。外部Webフォント適用後の実機寸法は未検証。

証跡:
- ブラウザ: `C:/Users/homur/AppData/Local/Temp/slot-1005-results-j0B4RJ/results.json`
- 360px画像: 同フォルダ `mhsunbreak-bz-v02-360.png`
- 390px画像: 同フォルダ `mhsunbreak-bz-v02-390.png`
- 表記: `C:/Users/homur/AppData/Local/Temp/slot-wording-results-8L7wlG/results.json`

## 判断した点・引継ぎ

- state定義に従い成功率は1回目・2回目以降の合算。両セクションに同じ合算値を表示し、記録先だけを分けた。ガイドに合算であることを明記。
- UIバージョンは作業規約4に従い `UI BZ v02`。共通JSの参照クエリは据え置き、変更した機種JSだけを `20261004-3` に更新。
- 古い公開監査がv01本文・3タブ・モンハン不変を固定していたため、モンハン部分だけ追随。実装をテストの旧期待値に合わせて戻すことはしていない。
- WISHLIST.md更新案: §8に「モンハンなな様テンプレv02／BZタブ／合算分母／カード不変・正本保護」の完了記録を追加。今回の許可範囲外なので台帳は未変更。
- featureブランチのpushまでが今回の範囲。公開Pagesへの変更反映確認は、ツムギのマージ・デプロイ後に行う。
