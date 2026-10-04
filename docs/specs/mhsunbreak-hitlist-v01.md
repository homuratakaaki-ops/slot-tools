# モンハン 当選ゲーム数一覧の表示件数＋版数表示の撤去 実装指示書 v01

発行: ツムギ（2026-10-04）／実装: ミコト／裁可: 夢爽
ブランチ: `fix/mhsunbreak-hitlist`（main の `66d27c3` から分岐）

## 0. 守ってほしい歯止め

- **UI の変更を自分の判断で足さない。見た目を直したくなったら実装せずに報告すること。**
- **共通ファイル（`checker-engine.js` / `checker-bayes.js`）は変更しない**
- **他機種は触らない**（§2 の確認を除く）
- なな様テンプレの出力は**バイト不変**

---

## 1【必須】AT当選ゲーム数の一覧を直近3件表示にする

`checker-data/mhsunbreak.js` の `hitSection()`。現在は直近10件＋折りたたみになっている。

```js
// 変更前
<div class="cgrid">${rows.slice(0,10).join('')}</div>
${rows.length>10?`<details class="hit-more"><summary>ほか ${rows.length-10}件を見る</summary><div class="cgrid">${rows.slice(10).join('')}</div></details>`:''}

// 変更後
<div class="cgrid">${rows.slice(0,3).join('')}</div>
${rows.length>3?`<details class="hit-more"><summary>すべて表示（残り${rows.length-3}件）</summary><div class="cgrid">${rows.slice(3).join('')}</div></details>`:''}
```

- **表示は直近3件（新しい順）**。4件目以降を `<details>` に入れ、開くと全件見られる
- 折りたたみの見出しは **`すべて表示（残りn件）`**
- **3件以下のときは `<details>` を出さない**
- **計算（件数・合計・1/x）は従来どおり常に全件。上限なし**（`hitCount` / `hitSum` は触らない）
- **削除は実インデックスのまま。** 現行の `hitList(S).map((v,i)=>…).reverse()` は
  `map` が `reverse` より先に走るので `data-i` は配列の実インデックスになっている。
  **この順序を変えないこと**（折りたたみ内の行も正しい行が消える）

これ以外は変えない。入力欄・AT初当りの表示専用行・ヒントはそのまま。

## 2【必須】ヘッダーの版数表示を撤去する

`mhsunbreak-checker.html` の `<small>` が、直前のコミット `527041c` で版数付きになっている。

```html
- <small>SETTING CHECKER ・ slot-tools.jp ・ UI 20261004-2</small>
+ <small>SETTING CHECKER ・ slot-tools.jp</small>
```

**PR #7 と同じ扱い**（既存チェッカーは UI バージョン文字列を持たない。
AGENTS.md 作業規約4 は記録系ツールの慣習で、チェッカーには適用されていない）。
`?v=` の更新は §9-86 どおりなので**そのまま残す**。

### 他機種への混入（ツムギ調査済み・再調査不要）

全28チェッカーを確認した結果、**版数表示があるのは `mhsunbreak-checker.html` の1件だけ**。
他機種への混入はない。

参考（**今回の対象外・触らない**）: 区切り記号が全角ダッシュの機種が9本ある
（`enen2` / `kabaneri2` / `karakuri2` / `otome5` / `sao2` / `taktop` / `toaru2` / `yajikita` / `yoshimune`）。

- `SETTING CHECKER — slot-tools.jp` … 9本
- `SETTING CHECKER ・ slot-tools.jp` … 18本（mhsunbreak 修正後は19本）

版数表示とは別件の既存の表記ゆれなので、**今回は直さない**。報告に残すだけでよい。

---

## 3 検証（項目ごとに PASS/FAIL と件数を報告）

1. **0件**: 一覧も `<details>` も出ない。1/x なし
2. **3件**（例 300 / 600 / 900）: 3行とも表示され、**`<details>` が出ない**。
   合計1800G・3回・1/600.0
3. **4件**（＋1200）: 直近3件が表示され、**`すべて表示（残り1件）`** が出る。
   開くと4件目が見える。合計3000G・4回・1/750.0
4. **15件**: 直近3件＋`すべて表示（残り12件）`。開くと12件すべて見える。
   **件数15・合計・1/x が全件で計算されている**
5. **折りたたみ内の行を削除すると、正しい行が消える**。
   （例: 15件のうち折りたたみ内の特定の値を消し、その値だけが消えて合計・1/x が再計算されること）
6. **取消で戻る**（削除→取消で同じ値が同じ位置に戻る）
7. **表示の並びが新しい順**であること
8. `mhsunbreak-checker.html` に `UI 2026` が**0件**、`<small>SETTING CHECKER ・ slot-tools.jp</small>` であること
9. **他機種の checker HTML が1バイトも変わっていない**（`git diff --stat` で示す）
10. **テンプレ**: golden 3本（zero / mixed / all）と**バイト一致**
11. **なな様テンプレ3機種**の出力が `66d27c3` とバイト一致
12. `checker-engine.js` / `checker-bayes.js` が**無変更**
13. **360px / 390px の実ビューポートで表示崩れなし**（折りたたみの開閉両方・はみ出し0・ボタン44px以上）
14. `node test/verify.mjs` → 全設定OK
15. `node --test` → 件数とPASS/FAIL（**22件** が期待値。減らさない）
16. `node tests/new-1005-four-machines.browser.mjs` → 件数と FAIL 0。
    **一覧の件数を見ているアサーションがあれば 10→3 に追随させる。チェック内容は弱めない**
17. `node tests/new-1005-public.verify.mjs` → 全PASS
18. `node tests/wording-noukou.browser.mjs` → 既存の省略6機種8行以外にFAILが増えていない
19. `git diff --check` と LF

## 4 コミット・push

- コミット1本でよい。名義は `Mikoto <codex@slot-tools.local>`
- `fix/mhsunbreak-hitlist` を push して **PR を作成する**
- push が環境で拒否される場合は**コミットまでで止めて報告**（ツムギが push する）
- **main へのマージはしない**（夢爽の承認後）

## 5 報告に含めるもの

1. 変更ファイル一覧
2. §3 の1〜19の結果
3. 0件／3件／4件／15件の実測（表示行数・折りたたみの有無・合計・1/x）
4. 迷った点
