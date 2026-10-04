# 10/5新台4機種 公開準備・検証結果

検証日: 2026-10-04 / 実装: ミコト / 比較元: `579c8af6162959cd679f4ecc66975f18001a01e3`

正本: `docs/specs/new-1005-public-v01.md`。mainへのマージは行わず、夢爽の実機テスト後にツムギが判断する。

## 指示書 §5 の結果

| No. | 結果 | 件数・確認内容 |
|---|---|---|
| 1 | PASS | 一覧先頭4機種を指定順で登録。使い方リンク4件 |
| 2 | PASS | 4機種×2幅、実リンククリックでchecker→guide→checkerの8往復 |
| 3 | PASS | checker4＋guide4を追加。70→78件。PowerShell XMLパーサーで妥当性確認 |
| 4 | PASS | NEWは8行。先頭4行を追加し、9/25の4行を削除 |
| 5 | PASS | 23→27機種を2箇所。履歴の21機種と他の記述は不変 |
| 6 | PASS | ガイド4本×実ビューポート360/390pxの8条件。横はみ出し0 |
| 7 | PASS | titleの機種名・canonical・og:urlを4本で照合 |
| 8 | PASS | 指定の禁止語0件。利用者向け統計用語も0件 |
| 9 | PASS | 獣王で開始0/現在1000/SC1→1/1000.0。両欄空欄では実測1/xなし（入力・カード・詳細・テンプレ） |
| 10 | PASS | 開始1500/現在1234で警告。入力・カード・詳細・テンプレの実測1/xなし |
| 11 | PASS | 旧games1234/sc4→現在1234/開始0/分母1234/sc4。再保存・再読込でも1234/sc4を維持 |
| 12 | PASS | 獣王360/390px×2タブの4条件。はみ出し0、ボタン高さ44px以上 |
| 13 | PASS | とんスキの確定演出15項目の有無、全32,768組合せでカード1行目が比較元とバイト一致 |
| 14 | PASS | 同32,768組合せでテンプレ・詳細カードの出力データが比較元とバイト一致。実カード/詳細の画素検証も実施 |
| 15 | PASS | ricorico/toaru2/mhsunbreakのzero/mixed/all、計9状態でテンプレが比較元とバイト一致 |
| 16 | PASS | `node test/verify.mjs`：サニティ6設定、区間分割6設定ともOK |
| 17 | PASS | `node --test`：17件PASS、FAIL 0、skip 0 |
| 18 | PASS | `node tests/new-1005-four-machines.browser.mjs`：65件PASS、FAIL 0、未捕捉例外0 |
| 19 | PASS（既知FAIL維持） | `node tests/wording-noukou.browser.mjs`：全14判定中8 PASS/6 FAIL。既知の省略6機種8行のみで増加0。コマンド終了コードは1 |
| 20 | PASS | `git diff --check`、ステージ差分チェック、変更ファイルのLF確認 |

§19の省略: かのかり2行、モンハンサンブレイク2行、モグモグ・マギレコ・見える子・タコスロ各1行。依頼外のUI修正は行っていない。

ブラウザ検証はローカルHTTP＋Chrome headlessの実iframeで実施。広告・アクセス解析・Google Fontsの外部要求は空応答としており、フォントは代替フォントでの測定。実機の最終確認は夢爽が行う。

## 保存と入力

- 保存キーは `juuou-checker-v1` を維持。
- `gamesMyslo` が保存データに無い場合だけ旧 `games` を移行。新キーが明示的に0の場合は旧値を復活させない。
- 開始1000/現在1234/SC4でも分母234、1/58.5を確認。
- 通常ゲーム数の出典は `denom(S)` に集約。`S.games` は描画前に同期する派生値。共通engineの保存→描画順は変更していない。
- ラベルはマイスロ表記に合わせ「通常ゲーム数」。ユニメモ側の「通常プレイ数」は採用していない。

## 変更ファイル

- ガイド新設: `juuou-guide.html`, `mhsunbreak-guide.html`, `paripi-guide.html`, `tenten-guide.html`
- 導線・参照: `checkers.html`, `index.html`, `sitemap.xml`, `docs/ARCHITECTURE.md`
- checker: `juuou-checker.html`, `mhsunbreak-checker.html`, `paripi-checker.html`, `tenten-checker.html`, `tonski-checker.html`
- 機種データ: `checker-data/juuou.js`, `checker-data/tonski.js`
- 表記修正: `aobuta-guide.html`（指定段落のみ）
- テスト: `tests/new-1005-four-machines.test.mjs`, `tests/new-1005-four-machines.browser.mjs`, `tests/wording-noukou.browser.mjs`, `tests/new-1005-public.verify.mjs`
- golden新設: `tests/fixtures/mhsunbreak-mixed-template.txt`, `tests/fixtures/mhsunbreak-all-template.txt`
- 改行保証: `.gitattributes`（MH goldenのTXTだけLFを指定）
- 正本・報告: `docs/specs/new-1005-public-v01.md`, 本ファイル

共通JS2本、mhsunbreak/paripi/tentenの機種データ、既存zero goldenは比較元とバイト一致。IDEAS.md・WISHLIST.mdは変更していない。

## 追加した検証

- 既存17件を維持し、獣王の旧形式移行・明示0・再読込の冪等性・差分分母・逆転を既存テスト内に追加。
- MH goldenはzero 1400 bytes（既存不変）、mixed 1403 bytes、all 1412 bytes。mixed/allは指示書どおりの状態構築で現行出力から生成し、比較元とも一致。
- 限定公開時のリンクなし・獣王単欄・とんスキ重複サブラベルの旧期待値を今回の仕様に更新。
- 明示実行するリリース比較スクリプトは `node tests/new-1005-public.verify.mjs`。`RELEASE_BASE` で比較元を指定可能。通常のgolden単体テストはGit履歴に依存しない。

## 運用上の判断・引き継ぎ

- sitemapは `2026-10-05`、NEWは `10/5`。マージ日がずれる場合は、マージ直前に両方を合わせること。
- ガイドのstyleはtonski-guideと完全一致。指定外の解析・推奨・期待値は追加していない。
- テンプレクレジットは、現行リコリコガイドの「鈴白なな様（@nana_szsr）のテンプレに準拠」に合わせた。とある2ガイドには旧い許諾確認中の記載が残るため、その文言は転用していない。
- UI版数は2026-10-04のツムギ裁定により画面へ追加しない。AGENTS作業規約4の画面版数は記録系ツールの慣習で、チェッカーには適用しない。既存のヘッダー表記を維持し、§9-86どおり変更した獣王・とんスキの機種JSだけ参照クエリを `20261004-2` に更新。
- 同裁定によりミコトの作業はコミットまで。push・PR作成はツムギが担当し、mainへのマージは行わない。指示書・本検証記録・goldenのLF固定をコミットに含める。
- GitHub Pagesの変更反映確認は、夢爽の実機OK後にマージ・公開した段階で実施する。featureブランチ段階で公開済みとは扱わない。
- WISHLIST更新案: §8に「10/5新台4機種のガイド・公開導線、獣王マイスロ形式移行」を、マージと実機検収が済んだ時点で完了として記載する。
