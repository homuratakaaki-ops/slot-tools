# 10/5新台4機種チェッカー v01 実装・検証報告

対象ブランチ: `feat/new-1005-four-machines`。限定公開用4機種を追加し、共通engine・掲載導線は変更していません。
**実装済み・検証に未解決あり。マージ不可。** モンハンの狭幅n/d行をFAILとして残しています。
コミット名義は `Mikoto <codex@slot-tools.local>`。SHA・push・PR番号の最終結果は実行後の会話報告を参照してください。

## 1. 追加・変更ファイル

| 区分 | ファイル |
|---|---|
| 追加HTML | juuou-checker.html / mhsunbreak-checker.html / paripi-checker.html / tenten-checker.html |
| 追加データ | checker-data/juuou.js / checker-data/mhsunbreak.js / checker-data/paripi.js / checker-data/tenten.js |
| 受領正本（内容保持・同じコミットへ追加） | docs/specs/new-1005-four-machines-instructions.md / docs/specs/mhsunbreak-nana-template-v01.txt |
| 追加検証 | tests/new-1005-four-machines.test.mjs / tests/new-1005-four-machines.browser.mjs |
| 追加報告 | docs/reports/new-1005-four-machines-v01.md |
| 追加証跡 | docs/reports/new-1005-four-machines-evidence/ 内の下記9ファイル |
| 変更 | IDEAS.md の末尾に進捗1行だけ追記（既存バイト列の一致確認済み） |

証跡: `results.json` / `mhsunbreak-zero-template.txt` / `mhsunbreak-360-input.png` / `mhsunbreak-390-input.png` / `mhsunbreak-all-card.png` / `mhsunbreak-all-detail.png` / `juuou-card.png` / `paripi-card.png` / `tenten-card.png`。

## 2. 公開後のURL

現時点の公開・HTTP 200を意味しません。mainへのマージ後のパスです。

- https://slot-tools.jp/juuou-checker.html
- https://slot-tools.jp/mhsunbreak-checker.html
- https://slot-tools.jp/paripi-checker.html
- https://slot-tools.jp/tenten-checker.html

## 3. 共通ファイルと公開範囲

`checker-engine.js` / `checker-bayes.js` は変更なし。共通側の変更は不要でした。
`checkers.html` / `sitemap.xml` / `index.html` / `docs/ARCHITECTURE.md` も変更なし。
ガイドを追加せず、ヘッダーリンクは機種選択のみ。4機種ともUI v1。
HTMLのstyleは指定のnav列数以外、雛形と完全一致。モンハンのn/d用CSSはデータ側へ既存実装から移植。

## 4. 基点と実行環境

前ターンでmainの取得に成功。今回のHEAD / origin/mainはいずれも `ec5a42bf3b12e700fce3163ef4ca721826f33418`。
今回の再fetchは `cannot open '.git/FETCH_HEAD': Permission denied` で失敗。再照会もGitHub接続エラーとなったため、現在のリモート先端は再確認できていません。
ARCHITECTURE §5に今回の4機種と一致する待ち行列はありませんが、個別実装指示を根拠に着手しました。

実レンダリング: Node v24 / ローカル静的サーバ / headless Chrome / CDP直結。
幅360・390px、高さ530pxの実iframeを使用（html/body幅の注入なし）。通常の機能検証時は高さ740px。
confirm/alert/promptとクリップボード書き込みを検証ドライバでスタブし、製品の実clickハンドラを実行。
unhandledrejection・error・CDPコンソール/ネットワークログを監視。canvasの描画文字列と実画素の両方を検証。
外部の広告・計測・Google Fontsはオフライン検証のため空レスポンスを返しています。外部フォントを実取得した表示は未確認です。

## 5. 検証結果

### 静的・回帰

| 項目 | 結果 | 根拠 |
|---|---|---|
| node test/verify.mjs | PASS | サニティチェック: 全設定OK / 区間分割: 全設定OK |
| node --test | PASS | 15件成功、失敗0（既存10＋追加5） |
| 4データJSとHTML内scriptのnode --check | PASS | 全対象構文エラーなし |
| git diff --check / ステージ対象を含めた空白監査 | FAIL（正本の指定空白14件のみ） | 通常のdiff --checkはPASS。cachedはテンプレ正本14行の末尾空白を検出。原文を一字も変えない指示を優先して維持 |
| LF | PASS | 4HTML・4JS・検証スクリプト・正本2ファイルでCRなし |
| 共通ファイル・禁止対象のdiff | PASS | 変更なし |

追加5検証: n/d読込補正と未知データ保持 / 分母とゼロ境界 / oneL・rank・同rankの順序 / HTML・CSS・参照クエリ契約 / テンプレ正本バイト一致。

### 4機種共通の実描画

| 指示書§4.2の項目 | 獣王 | モンハン | パリピ | 転生王女 |
|---|---|---|---|---|
| 入力→通常カード生成・画素 | PASS | PASS | PASS | PASS |
| 詳細カード生成・画素 | PASS | PASS（後述の全項目時省略あり） | PASS | PASS |
| 通常コピー / 収支帳用コピー | PASS | PASS | PASS | PASS |
| 通常G空欄時の実測1/x非表示（画面・両カード・テンプレ） | PASS | PASS | PASS | PASS |
| 通常G入力後の実測1/x表示 | PASS | PASS | PASS | PASS |
| リセット2度押し→取消 | PASS | PASS | PASS | PASS |
| タブ別スクロール保持・明示イベント | PASS | PASS | PASS | PASS |
| 360px / 390pxの表示崩れなし | PASS | **FAIL**（n/d行名の折返し） | PASS | PASS |
| ボタン44px以上 / 可視はみ出し0 | PASS | PASS | PASS | PASS |
| コンソールエラー / 未捕捉Promise例外0 | PASS | PASS | PASS | PASS |

全ページ・全幅で最小ボタン高さ44px、可視はみ出し0px。共通ジャンプナビ内の横スクロールで隠れる子ボタンは、ページ外への可視はみ出しとして数えていません。
ブラウザ結果JSONはPASS 50件、狭幅n/d行名の可読性FAIL 2件。ドライバはFAILを残して終了コード1を返します。

### 機種固有

| 項目 | 結果 |
|---|---|
| 獣王の禁止文字列がHTML・JS・実DOM・カード・テンプレにない | PASS |
| モンハン示唆31ボタンの表記・サブラベルが表と完全一致 | PASS |
| 各31項目を単独記録しoneL対象のみ最強候補 | PASS |
| 246枚OVERは最強対象外、確定総数・rank2グラフには含む | PASS |
| 否定2種の別枠集計 | PASS |
| 全0テンプレと正本の差分 | PASS（全文を下記に掲載） |
| 各項目+1で指定箇所だけ変化 | PASS（終了画面は合計行のある項目だけ2箇所、トロフィー・枚数は出力非対象で0箇所） |
| BZ5組・周期5・CZ2の値の位置 | PASS（差分箇所数に加えて出力全文一致） |
| 収支帳用の矢印・丸数字・絵文字変換 | PASS |
| 下部タブ3つ | PASS |
| n/d減算でハズレ無効化・n≦d・取消 | PASS（5組すべて） |
| CZ種別の分母が入力と詳細カードで一致 | PASS（1/3=33%、2/3=67%） |
| なな様アイコン既定 | PASS（実描画画像） |

## 6. 未解決と判断内容

### モンハンn/d行（UI変更は未実施）

| 実幅 | 最小ボタン高さ | 可視はみ出し | 行名欄幅 | 5行の行名高さ |
|---|---|---|---|---|
| 360px | 44px | 0px | 25px | 120 / 120 / 144 / 120 / 120px |
| 390px | 44px | 0px | 55px | 48 / 48 / 48 / 48 / 48px |

指定移植元の `.num min-width:38px`・`.pct min-width:92px` と2ボタンが幅を占め、行名が1〜3文字程度で折り返されます。
[360px証跡](new-1005-four-machines-evidence/mhsunbreak-360-input.png) / [390px証跡](new-1005-four-machines-evidence/mhsunbreak-390-input.png)。
修正案は、n/d欄に分子が含まれることを踏まえて単独分子表示の要否と数値欄の幅を再指定し、行名幅を確保すること。
指示書の「UI変更を自分の判断で足さない」に従い、未修正です。修正版指示が必要です。

### 詳細カードの収容量

全項目を各1回記録すると、既存engineの優先表示・省略により「ほか12項目」となります。
[詳細カード証跡](new-1005-four-machines-evidence/mhsunbreak-all-detail.png)。生成動作自体はPASSですが、全項目を1枚で確認する用途は満たせません。
共通engine変更禁止の範囲内では改修していません。全件掲載を受け入れ条件にする場合は、共通側の別指示が必要です。

### 指示書の解釈・差分申告

- 示唆は **12＋5＋5＋9＝31**。指示元36との差は5。列挙どおり実装し、補完追加はしていません。
- テンプレは裁定どおり終了画面14行・スタンプ9箇所を維持。
- 空欄時の1/x非表示は実測値について検証。指定された解析確率（設1:1/…等）は表示を維持。
- モンハンのテンプレ原文は数値だけ変更。実測1/xは原文外のヘッダーAT回数へcountRateで付記。
- 原文最終行に改行がない点は保持し、本文とフッターの間は例示どおり空行を追加。
- 同rank時のorderは指示書のグループ順・表の行順で固定。
- 段位表記はtierTextでサブラベルから取得。原文テンプレ側への追記は行わず、なな様の原文保持を優先。
- 画面UI版数の規約に従い、既存ヘッダーsmallへUI v1を付記。
- テンプレ正本14行の末尾空白は意図した原文です。削除するとバイト保持の指定に反します。
- push後のraw GitHub確認はpush成功時に実施。Pages反映はmain未マージのため本PR段階では対象外で、マージ後に確認が必要。

WISHLIST更新案（未反映）: §8に本4機種のlimited追加を検収後に記録。§5に「n/d行の狭幅での行名幅」と「詳細カードの最大収容項目数」の確認事項を起票。

## 7. モンハン全0テンプレ diff 全文

行末半角空白を `␠` で可視化しています。比較対象の実ファイルはそのまま保持しています。

```diff
diff --git a/docs/specs/mhsunbreak-nana-template-v01.txt b/docs/reports/new-1005-four-machines-evidence/mhsunbreak-zero-template.txt
index de402b1..d70b215 100644
--- a/docs/specs/mhsunbreak-nana-template-v01.txt
+++ b/docs/reports/new-1005-four-machines-evidence/mhsunbreak-zero-template.txt
@@ -1,3 +1,7 @@
+設定判別メモ｜スマスロ モンスターハンターライズ：サンブレイク
+通常 0G / AT0回
+_______
+
 モンハンライズサンブレイク
␠
 ■レア役からのBZ当選率
@@ -18,30 +22,34 @@
 ↪︎BZ突入時に告知される
␠
 ■AT終了画面
-女(偶数)▶︎␠
-ﾛﾝﾃﾞｨｰﾈ ▶︎␠
-ﾙｰﾁｶ       ▶︎␠
+女(偶数)▶︎ 0回
+ﾛﾝﾃﾞｨｰﾈ ▶︎ 0回
+ﾙｰﾁｶ       ▶︎ 0回
␠
-男(奇数)▶︎␠
-ｼﾞｪｲ       ▶︎␠
-ｱﾙﾛｰ       ▶︎␠
-ｶﾞﾚｱｽ     ▶︎␠
+男(奇数)▶︎ 0回
+ｼﾞｪｲ       ▶︎ 0回
+ｱﾙﾛｰ       ▶︎ 0回
+ｶﾞﾚｱｽ     ▶︎ 0回
␠
-高設定弱▶︎␠
+高設定弱▶︎ 0回
 ↪︎ﾌｨｵﾚｰﾈ&ｱｲﾙｰ
-高設定強▶︎␠
+高設定強▶︎ 0回
 ↪︎ﾁｯﾁｪ&ｱｲﾙｰ&ｶﾞﾙｸ
-2否定　▶︎␠
+2否定　▶︎ 0回
 ↪︎ﾌｨｵﾚｰﾈ&ﾛﾝﾃﾞｨｰﾈ
-3否定　▶︎␠
+3否定　▶︎ 0回
 ↪︎男3人
-2以上　▶︎␠
+2以上　▶︎ 0回
 ↪︎ﾋﾉｴ&ﾐﾉﾄ
-5以上　▶︎␠
-6確　　▶︎␠
+5以上　▶︎ 0回
+6確　　▶︎ 0回
␠
 ■エンディング中スタンプ
 🔵奇  0回・🟡 偶 0回
 🟢弱  0回・🔴 強 0回
 銅 0回・銀 0回・金 0回
-🍁 0回・🌈 0回
\ No newline at end of file
+🍁 0回・🌈 0回
+
+by slot-tools.jp
+ﾃﾝﾌﾟﾚ:鈴白なな様 @nana_szsr
+解析出典:ちょんぼりすた様
\ No newline at end of file
```
