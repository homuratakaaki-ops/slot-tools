# yutime-record 仕様 v2.0 実装メモ

- 対象ページ: `yutime-record.html`
- localStorage key: `yutime-record:v1`
- schemaVersion: `2`
- 初期対応機種: P大海物語5スペシャル(遊タイムあり)

## 実装範囲

- 台番マスタ、実戦記録、期待値判定、設定、JSONインポート/エクスポート。
- 釘写真保存は将来版。IndexedDB 必須のため現行では未実装。
- 持ち玉・交換率の分離は将来版。現行は `yenPerBall` 等価前提の設定値として扱う。

## v2 変更点

- 記録フォームに `endSpin` と `payoutBalls` を追加。未入力保存は確認ダイアログで途中保存として扱う。
- 旧ログは読み込み時に `endSpin:null`、`payoutBalls:null` を補完する。
- 判定結果が打てる、または微妙のときに「この台を打つ」から記録タブへ開始回転数・台番を引き継ぐ。
- 判定入力に前日最終回転数を追加し、入力時は `前日最終回転数 + 当日現在回転数` を実効回転数として期待値を計算する。
- 台番選択時は累計加重平均 `Σ(normalSpin) / Σ(usedBalls) * 250` を回転率の既定値にする。直近3回平均は参考表示のみ。

## 容量予算

- 2026-08-01 実測: 旧ログ1件 `94 chars`、新ログ1件 `158 chars`、増分 `+64 chars/record`。
- 実測対象ログ:
  - 旧: `date, balls, spins, startSpin, note, yutimeSuspect`
  - 新: `date, usedBalls, normalSpin, balls, spins, startSpin, endSpin, payoutBalls, note, yutimeSuspect`
  - 互換のため当面 `balls/spins` と `usedBalls/normalSpin` を併記する。

## QAメモ

仕様書の一次式に従うと、開始700回転・14回/千円の期待値は約2,773円になる。提示表の約2,845円とは±1%を超えるため、テストでは一次式結果を固定し、差異をコメントとして残す。

## タスクC 公開整備

- 旧 `yutime-record.html` は案内ページ化し、実戦利用は `yutime-v3.html` へ誘導する。
- 旧ツールのlocalStorageキー `yutime-record:v1` は削除しない。案内ページ化は表示停止のみで、ブラウザ内に残る旧記録の消去は行わない。
- 旧ロジック用テストは撤去し、案内ページとして見出しとv3リンクが存在することを確認する最小テストへ置き換える。
