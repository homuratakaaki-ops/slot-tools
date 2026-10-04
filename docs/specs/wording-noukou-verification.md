# 示唆表記「濃厚」統一 検証記録

検証日: 2026-10-04 / 実装・検証: ミコト

比較元: `3c3f807cd9c29030e0a0e73cc4f6538654730831`。機種データを `git show` で読み出して比較した。
正本: `wording-noukou-v01.md`（§6のmagireco訂正を含む）。

## §8の結果

| 番号 | 結果 | 根拠・件数 |
|---|---|---|
| 1 | PASS | 指定の利用者向けファイル範囲で個別の「設定…確定演出」は0件。文言置換は152件。 |
| 2 | 分類保持PASS / 記載総数FAIL | 実測は301→146件。減少155件=文言152件+必須のtierText正規表現3箇所。353→201という数値には一致しない。対象14ファイルを承認済みの置換だけで再構成して全文比較し、分類名を含むその他の文言・処理が変わっていないことを確認。 |
| 3 | PASS | 11機種・全137確定演出パターンを1件ずつ単独で記録。1行目の段位と選定項目は一致。tonskiの語句置換とmagirecoの項目名短縮だけを許容。 |
| 4 | PASS | ricorico 68状態、toaru2 50状態、mhsunbreak 52状態、計170状態でtemplateのUTF-8バイト一致。mhsunbreakのゼロ状態はgoldenとも一致。 |
| 5 | PASS | 11機種・計504状態でテンプレ・サマリー・詳細カードを比較。変化はtonski・mieruko・magirecoのみ。各出力全文を期待値と比較。他8機種は完全一致。 |
| 6 | PASS | magirecoの詳細カード・テンプレは「全て降順」。実ボタンでstory.descAllを記録し、カード1行目「確定演出 全て降順(5以上) ×1」と詳細カードを描画して確認。PNG・画素・描画文字も確認。 |
| 7 | FAIL | 対象11機種を全項目記録した保存データから再読込し、実カードタブから描画。最終行Yは全機種936以下。一方6機種8行に省略あり。同条件の3c3f807で全8行の文字・位置・寸法が一致し、今回の変更での新規発生は0。指示に従いレイアウトは変更していない。Google Fontsの通信が拒否され、本番フォントでの寸法は未確認。 |
| 8 | PASS | `node test/verify.mjs`: サニティ6設定・区間分割6設定とも全設定OK。 |
| 9 | PASS | `node --test`: 17件PASS、FAIL 0、skip 0。 |
| 10 | PASS | `node tests/new-1005-four-machines.browser.mjs`: 54件PASS、FAIL 0。旧内部指示書は保存し、テストのサブラベル期待値だけ承認済みの置換を適用。 |
| 11 | PASS | `git diff --check` および変更・追加ファイルのLF確認。 |

全137パターンには、集計されても1行目には選ばれない項目も含む。ゼロ・全件・各数値キー単独の比較で、保存データのdefaultsも完全一致。

## 機種ごとの件数と実描画値

「置換」はソース内の指示対象出現回数。「比較」は単独の確定演出パターン数。「出力状態」はゼロ・全件・各数値キー単独の合計。
描画値はフォールバックフォントによる実測。幅はサマリー内の描画済み最長行のmeasureText値。

| 機種データ（checker-data/） | 置換 | 比較 | 出力状態 | 最終Y | 最長行幅px | 省略行 |
|---|---:|---:|---:|---:|---:|---:|
| kanokari.js | 26 | 22 | 51 | 932 | 446.75 | 2 |
| mhsunbreak.js | 18 | 18 | 52 | 896 | 468.38 | 2 |
| tonski.js | 15 | 15 | 29 | 936 | 480.21 | 0 |
| jashinchan.js | 15 | 15 | 50 | 936 | 442.21 | 0 |
| mogumogu.js | 11 | 9 | 22 | 936 | 445.48 | 1 |
| ricorico.js | 10 | 10 | 68 | 932 | 445.48 | 0 |
| magireco.js | 7 | 22 | 81 | 932 | 442.64 | 1 |
| garei_zero_re.js | 7 | 16 | 46 | 936 | 480.36 | 0 |
| mieruko.js | 5 | 5 | 23 | 892 | 443.54 | 1 |
| aobuta.js | 4 | 4 | 63 | 936 | 406.29 | 0 |
| takoslot.js | 1 | 1 | 19 | 936 | 472.47 | 1 |
| 合計 | 119 | 137 | 504 | 最大936 | — | 8 |

ガイド: `kanokari-guide.html` 22件、`mogumogu-guide.html` 9件、`magireco-guide.html` 2件。機種データと合わせて152件。

省略された既存行はkanokariの終了画面・RB紹介、mhsunbreakのAT終了画面・エンディング中スタンプ、mogumoguの画面、magirecoのエピソード、mierukoの終了画面、takoslotの小役。

## 変更ファイル一覧

- 上表の機種データ11本
- `kanokari-guide.html`
- `mogumogu-guide.html`
- `magireco-guide.html`
- `AGENTS.md`: §9-54、§9-62を更新、§9-102、§9-103を追加。次の番号は§9-104。
- `docs/specs/wording-noukou-v01.md`: 提供された訂正版を同梱。本文の追加編集なし。
- `tests/wording-noukou.verify.mjs`: 修正前データとの全文・全単独パターン・テンプレバイト比較。
- `tests/wording-noukou.browser.mjs`: 全件記録の実描画、最終行・省略・画素・未捕捉Promise例外、magireco実操作検証。
- `tests/new-1005-four-machines.browser.mjs`: 新表記に期待値を追随。
- `docs/specs/wording-noukou-verification.md`: 本記録。

共通JS・指定対象外HTML・内部文書2本・保存キーは変更なし。UIバージョン表示の新設や参照クエリの変更も行っていない（本依頼の追加UI禁止と指定範囲を優先）。

## 再実行

```powershell
node tests/wording-noukou.verify.mjs
node tests/wording-noukou.browser.mjs
$env:WORDING_BASELINE='1'
node tests/wording-noukou.browser.mjs
Remove-Item Env:WORDING_BASELINE
# 外部フォントへ接続可能な環境で、本番フォントを必須にする:
$env:WORDING_REAL_FONTS='1'
node tests/wording-noukou.browser.mjs
Remove-Item Env:WORDING_REAL_FONTS
```

ブラウザ検証は一時フォルダへresults.json、通常/詳細カードPNG、テンプレテキストを出力する。
今回の通常測定は `slot-wording-results-vgfhXd`、比較元は `slot-wording-results-hbrUIA`、既存テストは `slot-1005-results-pZbiXs`（Windows一時フォルダ）。
Google Fontsを含め外部通信を空応答にする既定モードと、フォント読込を必須にするモードを区別する。省略を検出した場合は終了コード1を返す。

## 残件・WISHLIST更新案

- §8-2の総数は指示書の数値と実測が異なる。分類名保持は全文比較で確認済み。
- WISHLIST §9のカードサマリー関連項目へ、全件記録時の既存省略6機種8行と本番フォントでの再検証を別課題として起票する案。今回の作業ではWISHLISTおよびレイアウトは変更しない。
