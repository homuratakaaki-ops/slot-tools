# 11/18 参照表追加・検収引継ぎ

## 状態

初回 `73e9279` はシオンが条件付き合格と判定。原典の全54値、320/360pxの画面と保存互換、カードPNGは初回版で確認済み。今回の再検収版は指摘のテスト2件とGGO表示の「ボーナス」表記のみを反映。#90は未取込、push・PR作成・マージ・公開なし。

- 基準main: `20ead2ae5f3bcd6348d654ebf8573953c9c5ce27`
- 対象の正確なSHA・treeとハッシュ: 再検収用ZIPの案内参照。
- 仕様と原典rowspanの照合: `docs/specs/reference-20261118.md`

## 変更ファイル

- `checker-data/ggo.js`, `checker-data/seiya12.js`: 設定別参照表・分母条件・確認日。既存入力・正規化・集計・テンプレ・カードのコード不変。
- `ggo-checker.html`, `seiya12-checker.html`: 当該機種JSの?vのみ。
- `ggo-guide.html`, `seiya12-guide.html`: 同値の表と条件、今回の表の確認日。
- `tests/reference-20261118.test.mjs`: 基準コミットとの参照以外完全一致、旧保存・未知型、全設定値とガイドの一致。
- `tests/reference-20261118.browser.mjs`: 実ビューポート320/360px・実ボタン・保存/取消・カード・参照表・ガイド。旧保存の初回書込でアイコン値のみ補われることを明示し、ガイドは表示した見出し部分の空白を画像から検出する。現環境では起動不可。
- `tests/seiya12.verify.mjs`: JS参照版番号の期待値追随。
- `tests/addl-1106.verify.mjs`: 11/6公開の完全一致は固定コミットで保持。現行の参照外不変は新テストで保証。
- `tools/reference-20261118-preview.py`: 別保存キー、noindex,nofollow、導線なしのローカル検収用ファイル生成。上書き禁止。
- 本仕様書・本検収票。

## テスト結果

|チェック|結果|
|---|---|
|`node --test` 最終|35/35 PASS、失敗・skip・取消0|
|`node test/verify.mjs`|全設定サニティ・区間分割OK|
|`node tests/seiya12.verify.mjs`|22/22 PASS|
|`node tests/ggovivy-suggest.verify.mjs`|46/46 PASS|
|`node tests/addl-1106.verify.mjs`|11/11 PASS|
|`node tests/addl-1106b.verify.mjs`|13/13 PASS|
|新規参照回帰|通常テストに含む3/3 PASS|
|機種JS・新ブラウザテストの構文、`git diff --check`|PASS|
|ローカル検収版生成|成功。別保存キー・noindexを静的確認|
|320/360px実描画・実ブラウザ保存往復|未完了（起動失敗）|
|修正版シオン再検収、実機確認、公開先HTTP確認|未実施／今回公開なし|

初回の星矢verifyは2件失敗した。1件は「メーカー公式値ではありません」の否定文にも既存の禁止語検査が反応したため、表記を「第三者解析」に統一して解消。もう1件は?v期待値の追随漏れを修正し解消。addl-1106の初回は旧公開時点とのバイト一致で停止し、歴史検証と現行参照外不変検証を分離して解消。失敗を無視してPASSにはしていない。

ブラウザ未完了の原因: `/usr/bin/chromium` が `socket() failed: Operation not permitted (1)` で終了。CDPのDevToolsActivePortが作られずテスト0件。代替のクラウドブラウザは `file://` URLをポリシー拒否（許可プロトコルはhttp/https）。この拒否操作を再試行していない。ソケットが利用できる検収環境で下記を実施する必要がある。自動承認レビューによる実装拒否は発生していない。

## シオン検収手順

作業前に最新mainを取得してください。#90の文言変更と競合する場合は両方を維持し、以下を再実行すること。

```sh
node --test
node test/verify.mjs
node tests/seiya12.verify.mjs
node tests/ggovivy-suggest.verify.mjs
node tests/addl-1106.verify.mjs
node tests/addl-1106b.verify.mjs
CHROME_PATH=/usr/bin/chromium node tests/reference-20261118.browser.mjs
```

別キー版の生成と非ゼロ本番保存データ分離確認:

```sh
python tools/reference-20261118-preview.py /tmp/slot-reference-review
REFERENCE_PREVIEW_ROOT=/tmp/slot-reference-review CHROME_PATH=/usr/bin/chromium node tests/reference-20261118.browser.mjs
```

- [x] 第三者原典の全設定値、星矢のrowspanを直接確認。詳細は仕様書。
- [x] GGO: 報酬獲得時のみ、失敗ジャッジ除外。入力追加なし。
- [x] 星矢: 加護の抽選契機、示唆回数との相違、維持中の重複、不明状態、AT直撃の一輝除外を説明。
- [x] 旧キー・未知キーの文字列/小数/負数/null/配列/オブジェクト/真偽値を保持。VMで基準版と比較。
- [x] 初当り、GFランプ、テンプレ、カード構造と出力不変をVMで確認。
- [ ] Chromiumで上記2系統を完走。320/360pxの参照表全体・ガイド・入力と示唆・カードに欠け／横はみ出しがない。
- [ ] 実ボタンから加算→取消→再読込。未知キー値と型が一致する。
- [ ] 別キー版の操作で非ゼロ本番保存文字列が1バイトも変化しない。
- [ ] summary/detail PNGとコピー結果を目視照合。例外・unhandledrejectionなし。
- [ ] シオンの独立検収とユーザーの実機確認。
- [ ] 公開承認後のみ§9-108に従う。NEW欄2行はマージ日に合わせて追加し、#90と?vを再調整する。

全verify/browserの総当たりは未実施。必要範囲の既存試験と通常テスト・集約チェックを実行した。
