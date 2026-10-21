# PR #57：シオン訂正版 A′〜D 再提出（2026-10-21）

実装・自己テスト：ネネ。シオンの最終head独立検収前。本番へは未反映。

## 対応

- A′：失敗後PUSHのコメント・入力欄の出典・両ガイドを「エンターライズ公式（voice 2026/10/21）」へ訂正。URLは https://www.enterrise.co.jp/voice.php?slot=mhrsb 。取り下げられたAを理由に解析・確率を変更していない。
- B：カウンターガイドの「濃厚示唆」を「示唆」へ。新BZガイドの解析未確認の説明も文言監査に合わせ、意味を保って言い換えた。
- C：指定の1018/fuku-mode/input-flow/pct-mode/bz-navブラウザ試験を、失敗→必須5択→明示的な不明選択へ追随。取消は色のUndo→失敗記録そのものの取消を実ボタンで辿る。連動するランプの追加による添字ずれを原イベント添字へ合わせた。
- 次回BZ参考％の旧版比較は、承認済みの入力・履歴再構成を全文一致対象から外す。保存6種の正規化バイト・集計・通常/収支帳用テンプレ・カードJSON・シナリオJSONの一致は維持し、候補行と7テーブルの集計行の実HTMLを空振り検出付きで厳密比較する。2,800列の別計算オラクルも維持。
- 全件実行で見つかったnew-1005-four-machinesの旧失敗/8色手動入力/履歴/取消の前提も、現在の5択・BZ枠へ追随。既存の他機種チェックは残す。天転は最新mainのPR #73でロック行が追加済みのため、同じ総合テストのサマリー期待値を左6＋右5行/Y932へ追随（天転コードは変更しない）。
- ricorico-1014の過去比較は、既承認の行内説明→下段配置により150G行の幅が縮むことを許容。行数・旧版以下の右端・横はみ出し・44px以上の操作領域を引き続き検査する。リコリコの製品コードは変更しない。
- D：preview/mhsunbreak-bz-20261020/の8ファイル・専用の旧E2E・専用CIを廃止。wording-noukou/magireco-remove-estimateは一時コピーを対象外とし、本番ファイルを引き続き走査する。
- 旧previewの実操作経路はtests/mhsunbreak-bz-transfer.e2e.cjsの13ケースで本番用ファイルへ移行済み。ランプ4・BZ枠6ケースも別途維持。旧preview用テストを実行して合格と数えることはしない。

## 影響範囲

docs/ARCHITECTURE.md §5の待ち行列とは別の、夢爽が共有したシオンの個別修正指示に対応。main 4e98820（PR #73）を取り込み、先行公開済みカウンターと天転の変更を保持。共通エンジン・設定計算・保存キー/schema/正規化・既存記録の意味は変更していない。カウンター参照クエリは20261021-review。潜水艇周期メモのPR #75は別Draftのままで、この再提出には取り込んでいない。

## 再現手順

Node 24.19.0、Chromium headless shell、ローカルHTTPと隔離プロファイルで実行。広告・計測・外部Webフォントはブラウザ試験で空レスポンスに差し替える。本番URLに記録を作成していない。Android実機の追加確認は未実施。

```sh
node --test
node test/verify.mjs
for f in tests/*.verify.mjs; do node "$f" || exit 1; done
for f in tests/*.browser.mjs; do CHROME_PATH=/path/to/chrome node "$f" || exit 1; done
NODE_PATH=/path/to/node_modules node --test tests/mhsunbreak-bz-transfer.e2e.cjs tests/mhsunbreak-failure-lamp.e2e.cjs tests/mhsunbreak-bz-rounds.e2e.cjs
git diff --check
```

`CHROME_PATH`はローカルChrome/Chromium。Playwrightはインストール済みChromiumを利用。実行結果は下へ記録する。

## 最終の自己テスト結果

- node --test：32/32合格、失敗・skip・取消0。main #73の旧テストJS削除を取り込み、通常のコマンドで完走。
- tests/*.verify.mjs：27/27スクリプト合格。
- tests/*.browser.mjs：14/14スクリプト合格（全件実行後、期待値を追随した総合試験1本も再実行して完走）。サンブレイクだけでなく天転の1,024通りの実クリック・画素チェックを含む。
- Playwright実操作E2E：23/23合格（転送13・ランプ4・BZ枠6）。既存記録ありの停止・完全重複/再送・旧累計・原文バックアップ復元・古いタブ・途中保存の保護を含む。
- 失敗後PUSH：5,200ケースで両ツールの候補・重み・福引を挟むタイミング・旧記録・減算を別計算へ照合。
- test/verify.mjs：サニティチェック全設定OK／区間分割全設定OK。
- 3ページのインラインJSと機種JSの構文、git diff --check合格。実ブラウザで待機BZと色/セリフの表示を確認。今回の試験で本番保存は操作していない。

### 全スクリプトの実行記録

| 種類 | ファイル | 結果 | 秒 |
|---|---|---|---:|
| verify | `tests/garei-1014.verify.mjs` | PASS | 0.1 |
| verify | `tests/kanokari-estimate.verify.mjs` | PASS | 0.6 |
| verify | `tests/magireco-remove-estimate.verify.mjs` | PASS | 0.3 |
| verify | `tests/mahoako.verify.mjs` | PASS | 0.3 |
| verify | `tests/mhsunbreak-1018.verify.mjs` | PASS | 0.1 |
| verify | `tests/mhsunbreak-at-log.verify.mjs` | PASS | 0.2 |
| verify | `tests/mhsunbreak-bz-groups.verify.mjs` | PASS | 0.2 |
| verify | `tests/mhsunbreak-bz-nav.verify.mjs` | PASS | 0.2 |
| verify | `tests/mhsunbreak-bz-rounds.verify.mjs` | PASS | 0.1 |
| verify | `tests/mhsunbreak-bz-step3-label.verify.mjs` | PASS | 0.1 |
| verify | `tests/mhsunbreak-ext-records.verify.mjs` | PASS | 1.4 |
| verify | `tests/mhsunbreak-failure-lamp.verify.mjs` | PASS | 1.0 |
| verify | `tests/mhsunbreak-fuku-mode.verify.mjs` | PASS | 2.0 |
| verify | `tests/mhsunbreak-input-flow.verify.mjs` | PASS | 0.1 |
| verify | `tests/mhsunbreak-next-bz-pct.verify.mjs` | PASS | 1.6 |
| verify | `tests/mhsunbreak-next-bz.verify.mjs` | PASS | 0.2 |
| verify | `tests/mhsunbreak-pct-mode.verify.mjs` | PASS | 0.2 |
| verify | `tests/mhsunbreak-scenario-pct.verify.mjs` | PASS | 1.2 |
| verify | `tests/mhsunbreak-scenario.verify.mjs` | PASS | 0.1 |
| verify | `tests/mhsunbreak-template-v02.verify.mjs` | PASS | 70.9 |
| verify | `tests/mhsunbreak-tpl-atlog.verify.mjs` | PASS | 0.2 |
| verify | `tests/new-1005-public.verify.mjs` | PASS | 4.6 |
| verify | `tests/paripi-1014.verify.mjs` | PASS | 9.0 |
| verify | `tests/paripi-nana-template.verify.mjs` | PASS | 0.7 |
| verify | `tests/paripi-st-end.verify.mjs` | PASS | 0.6 |
| verify | `tests/tenten-1021.verify.mjs` | PASS | 0.1 |
| verify | `tests/wording-noukou.verify.mjs` | PASS | 0.2 |
| browser | `tests/garei-1014.browser.mjs` | PASS | 7.9 |
| browser | `tests/kanokari-estimate.browser.mjs` | PASS | 6.6 |
| browser | `tests/magireco-remove-estimate.browser.mjs` | PASS | 6.0 |
| browser | `tests/mahoako.browser.mjs` | PASS | 10.6 |
| browser | `tests/mhsunbreak-1018.browser.mjs` | PASS | 5.6 |
| browser | `tests/mhsunbreak-bz-nav.browser.mjs` | PASS | 10.3 |
| browser | `tests/mhsunbreak-bz-step3-label.browser.mjs` | PASS | 2.9 |
| browser | `tests/mhsunbreak-fuku-mode.browser.mjs` | PASS | 3.8 |
| browser | `tests/mhsunbreak-input-flow.browser.mjs` | PASS | 2.6 |
| browser | `tests/mhsunbreak-pct-mode.browser.mjs` | PASS | 8.7 |
| browser | `tests/new-1005-four-machines.browser.mjs` | PASS | 87.4 |
| browser | `tests/ricorico-1014.browser.mjs` | PASS | 5.9 |
| browser | `tests/tenten-1021.browser.mjs` | PASS | 6.1 |
| browser | `tests/wording-noukou.browser.mjs` | PASS | 47.0 |

## 残る工程

この結果は実装者本人の自己テストであり、独立検収合格ではない。PR #57の最終headをシオンが確認して合否を記録するまでDraft・未公開を維持。20:00/20:30の既存予約は最新headのシオン合格を必須とし、旧head合格や本報告のみで公開しない。#60の記事→#57を間を空けずに公開する条件、noteの本人性・公開確認も維持する。

WISHLIST.md更新案：公開後に§2へ「サンブレイク・公式PUSH出典／必須ランプとBZ別履歴の回帰確認／旧preview廃止」を完了記録として追記する。新たな恒常ルールの追加は提案しない。
