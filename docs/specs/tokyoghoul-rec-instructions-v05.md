# tools/rec 東京喰種 第3弾（ボタンの並び・CZ失敗後のG数）実装指示書 v0.5

- 宛先：ツムギ（実装はミコトへ委任、ツムギがレビュー）
- 作成：シオン／2026-11-27（JST）
- 根拠：夢爽の要望（2026-11-27 11:55、実戦で使って）
- 基準：main `87f0527`（共通改修 段3まで反映済み。この後に main が進んでいたら最新の main を基準にする）
- 反映：本番へ即反映してよい（tools/rec は夢爽個人用。2026-11-26 夢爽決定）

---

## 0. 守ること

- 第1弾指示書（`tokyoghoul-rec-instructions-v01.md`）§0 のルールはそのまま有効
- 今回変えるのは `MACHINES.tokyoghoul` の定義だけ。**共通部分（関数・CSS）は触らない**
- 並行して進んでいる tools/rec 共通改修の変更を巻き戻さない（作業前に最新の main を取得）

---

## 1. 夢爽の要望と理由

1. 通常時のボタンの並びを、ほかの機種（汎用：1段目「液晶上乗せ・レア役・当選」、2段目「前兆・…・メモ」）と同じ位置関係にする。機種ごとに押す場所が変わると、押すたびに頭を切り替える必要があり負担になるため
   - 1段目：**🍉加算・レア役・当選**
   - 2段目：**前兆・示唆・メモ**
2. CZ失敗後（レミニセンス・大喰いの利世）は、液晶G・データカウンタ（実G）ともに **0／0** から始まる
3. 有馬ジャッジメント失敗後だけ、実G6／液晶G0 のずれが出る（今の初期値のまま）
4. それ以外（AT終了など）は 0／0 から（今のまま）

---

## 2. 定義の変更（`MACHINES.tokyoghoul`）

1. `grids.normal` を次に置き換える
   ```js
   normal:[["lcdAdd","rare","hit"],["zenchou","extra:0","memo"]],
   ```
2. `lcdAdd.label` を `"スイカ加算"` から `"🍉加算"` に変える（夢爽の指定表記。ボタン・シートの見出し・ログの本文「🍉加算 +100」がこの表記になる。保存値 `add` は数値のまま）
3. `レミニセンス` と `大喰いの利世` の `fixedEndG` と `fixedEndGHint` を**削除**する（CZ失敗シートのG数の初期値は、既存の通常処理で 実0／液晶0 になる）
4. `有馬ジャッジメント` の `fixedEndG:[{real:6,lcd:0}]` と `fixedEndGHint` は**そのまま**

---

## 3. 検証

1. 既存テスト・回帰テスト・`rec-tokyoghoul` をすべて通す（回帰は既存3機種の結果が変わらないこと）
2. `rec-tokyoghoul.verify.mjs` の該当アサートを今回の仕様に合わせて直し、次を確認する（直したアサートは報告に列挙する）：
   - 通常時のグリッドが「🍉加算・レア役・当選／前兆・示唆・メモ」の順
   - 🍉加算のボタンに `tone-green` が付き、シートに「+10」「+100」「+600（MAX）」が出る。ログ本文が「🍉加算 +100」の形
   - レミニセンス失敗・大喰いの利世失敗のシートで、G数の初期値が 実0／液晶0、案内文は既存の通常の文言
   - 有馬ジャッジメント失敗のシートで、G数の初期値が 実6／液晶0、案内文は「ジャッジメント後は実6／液晶0が基本です。…」
   - CZ失敗でスルーが+1されること（変わらないこと）
3. 390px で通常時の画面のスクリーンショットを1枚撮り、Downloads に保存

---

## 4. push・反映（承認済み）

- ブランチ `feature/rec-tokyoghoul-layout` → テスト全通過 → main へ `--no-ff` マージ → push
- `node tests/rec-account-build-test-page.mjs` で `acct-test.html` を作り直して同じ push に含める
- この指示書を `docs/specs/tokyoghoul-rec-instructions-v05.md` として同じ push に含め、`docs/specs/README.md` に1行挿入
- IDEAS.md：第2弾の行の直後に1行を**挿入だけ**する
  `- [x] tools/rec 東京喰種 第3弾：通常時の並びを汎用と同じ位置関係に（🍉加算・レア役・当選／前兆・示唆・メモ）、CZ失敗後のG数初期値を0／0に（11/27）。指示書 docs/specs/tokyoghoul-rec-instructions-v05.md`
- 公開確認：`/tools/rec/` と `/tools/rec/acct-test.html` が 200。`index.html`・`acct-test.html` の md5 が raw（push 後のコミット）・Pages・ローカルで一致

## 5. commit 名義

- ミコトの実装（index.html・tests）：`Mikoto <codex@slot-tools.local>`
- 文書・acct-test.html の作り直し・IDEAS.md・README・マージ：`Shion <claude@slot-tools.local>`

## 6. 報告

1. コミットハッシュ（`git log` からコピー、push 後のみ）
2. テスト結果と、直したアサートの一覧
3. `index.html`・`acct-test.html` の md5 と公開確認の結果
4. スクリーンショットの保存場所
