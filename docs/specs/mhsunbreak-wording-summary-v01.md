# mhsunbreak 小修正2件＋台帳修正 実装指示書 v01

発行: ツムギ（2026-10-04）／実装: ミコト／裁可: 夢爽
ブランチ: `fix/mhsunbreak-wording-summary`（main の `7914219` から分岐）
対象: limited公開中・実機テスト前の `mhsunbreak`

## 0. 守ってほしい歯止め

- **UI の変更を自分の判断で足さない。見た目を直したくなったら実装せずに報告すること。**
  本書に書いていない項目追加・レイアウト変更もしない（動作の修正・検証の追加は自由）
- 共通ファイル（`checker-engine.js` / `checker-bayes.js`）は**変更しない**
- `checkers.html` / `sitemap.xml` / `index.html` / `ARCHITECTURE.md` には触らない
  （limited のまま。導線は追加しない）
- **テンプレ出力は1バイトも変えない。** golden fixture
  `tests/fixtures/mhsunbreak-zero-template.txt` との一致が受け入れ条件

---

## 1【必須】`over` グループのヒント文の呼称を直す

`checker-data/mhsunbreak.js` の `GROUPS` 配列、`['over','獲得枚数表示',OVER, …]` の第4要素。

変更前:

```
AT中の獲得枚数表示が該当の数値を超えていたら記録します。246枚 OVERは設定1・3・5を否定する飛び値の示唆なので、カードの最強濃厚示唆には出しません。
```

変更後:

```
AT中の獲得枚数表示が該当の数値を超えていたら記録します。246枚 OVERは設定1・3・5を否定する飛び値の示唆なので、カードの確定演出の欄には出しません。
```

**差分は「最強濃厚示唆には」→「確定演出の欄には」の1箇所だけ。** 他の文字は変えない。

呼称は「**確定演出**」で統一する（§9-94）。「**濃厚示唆**」「**最強**」は廃止語なので、
今後この4機種のファイルに書かない。

## 2【必須】カードサマリーを10行にする

`card.bottom` の**右列の先頭行**を削除する。

```js
{x:560,items:[
  row('確定演出 計'+certCount(S)+'回',certCount(S),undefined,'#ffc94d'),   // ← この1行を削除
  ...GROUPS.map(g=>row(shown(g[1],g[2],S[g[0]]),total(g[2],S[g[0]]))),
  row('否定系 計'+deniedTotal(S)+'回',deniedTotal(S))
]}
```

理由: 上部ブロックに既に `['確定演出','計'+certCount(ctx.S)+'回']` があり重複している。
サマリーは10枠に収める。

- 削除後は **左列5行・右列5行の計10行**
- **`startY:752` / `rowGap:36` / `fontSize:23` は変えない**
  （最終行 Y = 752 + 4×36 = **896**。フッタに掛からない上限936の内側）
- `certCount` / `certTier` / `bestCert` / `deniedTotal` の各関数と、
  上部ブロック・グラフ・詳細カードは**変更しない**
- 左列先頭の `bestCert(S)` 行はそのまま残す（確定演出の1行目）

## 3【必須】IDEAS.md 1765行の文言修正

**この1行だけ**を書き換える（他の行には触らない。IDEAS.md は複数チャットが触るため、
全文差し替え・既存行の整形は禁止）。

変更前の該当箇所:

```
残件は示唆ボタン数が31で指示元の36と5つ差、詳細カードの40行上限による省略、夢爽の実機検収。
```

変更後:

```
残件は示唆ボタンは31（指示書の36は数え間違い・31が正）、詳細カードの40行上限による省略、夢爽の実機検収。
```

---

## 4 検証（項目ごとに PASS/FAIL と件数を報告）

1. `node test/verify.mjs` → 「サニティチェック: 全設定OK / 区間分割: 全設定OK」
2. `node --test` → 件数とPASS/FAIL（**16件PASS・FAIL 0** が期待値。件数が減らないこと）
3. `node tests/new-1005-four-machines.browser.mjs` → 件数と **FAIL 0**
4. **テンプレ出力がバイト不変**: `template()` の出力が
   `tests/fixtures/mhsunbreak-zero-template.txt`（1400バイト）と一致。
   あわせて修正前コミット（`7914219`）の `mhsunbreak.js` を `git show` で取り出し、
   0状態・混在・全項目埋めの3状態で出力バイト列が**完全一致**することを確認して報告
5. **全31項目を各1回記録した状態のカード**で、
   - サマリーが **10行**（左5・右5）
   - 最終行の Y が **896**（≦936）
   - `fitText` の縮小後も可視はみ出しが0、下限16pxを下回っていないこと
   を実測して数値で報告（カード画像はコミットしない）
6. **廃止語の混入チェック**: 今回の4機種のファイル
   （`checker-data/{juuou,mhsunbreak,paripi,tenten}.js` と
   `{juuou,mhsunbreak,paripi,tenten}-checker.html`）に
   「濃厚示唆」「最強」が**0件**であることを `git grep` で確認して報告
7. `git diff --check` と LF

## 5 コミット・push

- コミット1本。名義は `Mikoto <codex@slot-tools.local>`
- `fix/mhsunbreak-wording-summary` を push して **PR を作成**する
- **main へのマージはしない**（夢爽の承認後）
- 報告には §4 の1〜7の結果と、迷った点を入れる
