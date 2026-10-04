# モンハン 初当り入力の変更＋一覧ページの見出し 実装指示書 v01

発行: ツムギ（2026-10-04）／実装: ミコト／裁可: 夢爽
ブランチ: `fix/mhsunbreak-hitgames`（main の `74f8e03` から分岐）

## 0. 守ってほしい歯止め

- **UI の変更を自分の判断で足さない。見た目を直したくなったら実装せずに報告すること。**
  本書に書いていない項目追加・レイアウト変更もしない（動作の修正・検証の追加は自由）
- **共通ファイル（`checker-engine.js` / `checker-bayes.js`）は変更しない。**
  変更が必要と判断したら**止めて報告**する（夢爽指示）
- **他機種へ横展開しない。** 変えるのは `mhsunbreak` だけ
- **なな様テンプレの本文はバイト不変**（§9-95）。変わってよいのはツール側ヘッダーの1行だけ
- 表記は §9-103（個別の示唆は「濃厚」／分類名は「確定演出」）

---

## 1【必須】mhsunbreak：通常ゲーム数欄を廃止し、AT当選ゲーム数の入力にする

### 1-1 背景（コメントに残すこと）

エンタライズ機種で連動アプリが無く、メニュー画面は総ゲーム数しか出ないため、
通常時のゲーム数を取る手段が無い（§9-70）。代わりに**AT当選ごとのハマりゲーム数**を
1件ずつ記録し、その合計と件数から初当り確率を出す。

### 1-2 state

```js
hits: []   // AT当選ゲーム数の配列。追加順に持つ（表示で新しい順に並べ替える）
```

- **上限は置かない**（夢爽裁定）。`arrayDefaults` の `max` は使わない
- `normalizeState` で `out.hits` を**正の整数だけの配列**に正規化する
  （`Array.isArray` でなければ `[]`、各要素は `Math.max(0,parseInt(v,10)||0)`、0以下は捨てる）
- **旧 `games` と旧 `counts.at` は計算・表示に一切使わない**（夢爽裁定）。
  キーは state に残す（消さない）。旧データを読んでもエラーにならないこと
- `counts` は DEF から消さない（`{at:0}` のまま残す）。参照しないだけ

### 1-3 導出（出典を1つにする・§9-84）

```js
function hitList(S){return Array.isArray(S.hits)?S.hits:[];}
function hitCount(S){return hitList(S).length;}                                  // AT初当り回数
function hitSum(S){return hitList(S).reduce((a,b)=>a+(Number(b)||0),0);}         // 通常ゲーム数の合計
function syncGames(S){if(S)S.games=hitSum(S);return S?S.games:0;}
```

- **1/x ＝ 合計 ÷ 件数**。既存の `rate(g,c)` に `g=hitSum(S)` / `c=hitCount(S)` を渡せば同じ値になる
- 件数0のときは 1/x を**どこにも出さない**
- `pages` の先頭で `syncGames(ctx.S)` を呼ぶ（engine がカードのメタ行で `S.games` を直接読むため）
- **計算（回数・合計・1/x）は常に全件**を対象にする。表示の折りたたみは計算に影響させない

### 1-4 入力UI（入力タブの先頭・従来の「通常ゲーム数」セクションを置き換える）

セクション見出しは `AT当選ゲーム数`。

1. **入力行**: 数値入力欄1つ ＋ `追加` ボタン
   - 入力欄は **`id="hitIn"` の素の `<input type="number" inputmode="numeric" placeholder="0">`**。
     **`data-number-key` を付けないこと。** 付けると `change` のたびに `renderAll()` が走り、
     入力欄→ボタンへのタップで要素が作り直されてクリックが落ちる
   - `追加` ボタンは `data-action="addHit"` `data-label="AT当選ゲーム数を追加"`
2. **一覧**: 入力した当選ゲーム数を**新しい順**に表示。各行に `削除` ボタン
   - **直近10件を常に表示**し、11件目以降は `<details>` に畳む
     （サマリーは `ほか n件を見る`）。**データは落とさない。表示だけの工夫**
   - `<details>` は再描画のたびに閉じる（engine の開閉保持は `.hint` 用のため）。これは許容する
   - 削除ボタンは `data-action="delHit"` `data-i="<配列の実インデックス>"`。
     **表示は逆順なので、`data-i` には必ず配列の実インデックスを入れる**
3. **AT初当りの表示専用行**（タップ不可・`data-c` を持たせない。`ricorico.js` の `bellSumRow()` が見本）
   - 行名 `AT初当り`、値は `hitCount(S)`、右端に「自動」タグ
   - サブラベルは**従来どおり** `設1:1/349.9⇔設6:1/242.3` ＋ `rateSuffix(hitSum(S),hitCount(S))`
   - **既存の `counts.at` の `crow`（＋ボタン）は廃止**する
4. **説明**（`.hint` に1文。engine が §9-97 で畳むので `<details>` を手で組まない）

   > AT当選時に、データカウンターの当選ゲーム数（通常時のハマりゲーム数）を入力します。途中から打ち始めた場合も、表示どおりの数値を入れてください。

5. **総ゲーム数の欄は置かない**

### 1-5 カスタムアクション（§9-72：減算モード時の挙動を明記する）

```js
actions:{
  // 入力欄は data-number-key を持たないので、DOM から直接読む。
  // 0・空・非数値は追加しない（false を返すと engine は履歴に積まない）。
  addHit:(ctx)=>{
    const el=document.getElementById('hitIn');
    const v=Math.max(0,parseInt(el&&el.value,10)||0);
    if(!v)return false;
    ctx.S.hits=hitList(ctx.S).concat(v);
    if(el)el.value='';
    return `AT当選 ${v}G を追加`;
  },
  delHit:(ctx,ds)=>{
    const i=parseInt(ds.i,10);
    const list=hitList(ctx.S);
    if(!(i>=0&&i<list.length))return false;
    const v=list[i];
    ctx.S.hits=list.slice(0,i).concat(list.slice(i+1));
    return `AT当選 ${v}G を削除`;
  }
}
```

- **減算モードでも挙動は変えない**（カウンタではないため）。§9-72 に従いヒントへ
  「訂正は一覧の『削除』で行います」と1文入れる
- 取消は engine の `customAction` が `changedKeys` で面倒を見る（§9-96）。
  **追加→取消で消える／削除→取消で戻る**ことを検証で示すこと

### 1-6 カード・テンプレ

- ヘッダー（テンプレ1〜2行目）: `通常 ${hitSum}G / AT${countRate(hitSum,hitCount)}`
  - **nG は当選ゲーム数の合計**
- **なな様テンプレの本文（「モンハンライズサンブレイク」以降）は1バイトも変えない**
- カードの `blocks` / `bottom` / `detail` で `S.games` を直接読んでいる箇所は
  `hitSum(S)` / `hitCount(S)` を通すよう直す
- **当選ゲーム数の一覧そのものはカード・テンプレに出さない**（指示に無いため足さない）

### 1-7 golden の扱い

- `tests/fixtures/mhsunbreak-zero-template.txt`（**0状態**）は、変更前後とも
  `通常 0G / AT0回` なので**内容が変わらないはず**。変わったら止めて報告
- `mhsunbreak-mixed-template.txt` / `mhsunbreak-all-template.txt` は、テストの状態構築が
  数値キーを埋める作りで `hits`（配列）を埋めないため、**ヘッダー行が変わる**。
  この2本は**再生成**してよい。ただし次を必ず確認すること:
  - **本文（`モンハンライズサンブレイク` 〜 `🍁 n回・🌈 n回`）が再生成前と1バイトも変わらない**
  - 変わったのはヘッダーの1行だけであること（diff を報告に貼る）
- 既存テスト `MH template preserves original bytes except the 14 blank values and wrapper` は
  正本 `docs/specs/mhsunbreak-nana-template-v01.txt` から期待値を組み立てているので、
  **本文の不変性はこちらで担保される**。このテストは消さない

### 1-8 既存テストの追随

`data-number-key` や `#gIn` を前提にしている箇所が mhsunbreak で動かなくなる。
**期待値を追随させ、チェック内容は弱めない。**

- `tests/new-1005-four-machines.test.mjs` の `rates use normal games only…`:
  mhsunbreak は `ctx.S.games` ではなく `ctx.S.hits` を使う形に直す
  （例: 合計1000・件数2 で `1/500.0` が出る、`hits:[]` なら出ない）
- `tests/new-1005-four-machines.browser.mjs` の `games()` ヘルパーと
  `#gIn` の有無を見ている箇所: mhsunbreak は `#hitIn` ＋ `追加` の経路に分岐させる
- `tests/wording-noukou.browser.mjs` / `tests/new-1005-public.verify.mjs` も、
  落ちる場合は同様に追随させる

---

## 2【必須】`mhsunbreak-guide.html` の書き直し（§9-101）

- 「連動アプリ」「通常ゲーム数」の記述を**削除**し、§1-4 の入力方法に書き直す
- 書く内容:
  - エンタライズ機種で連動アプリが無く、メニューは総ゲーム数しか出ないため、
    **AT当選ごとのハマりゲーム数を1件ずつ記録する**方式にしていること
  - データカウンターの当選ゲーム数をそのまま入れること。途中から打ち始めた場合も表示どおりでよいこと
  - 初当り回数は入力した件数、1/x は合計÷件数で出ること
  - 訂正は一覧の「削除」で行うこと
- 他の節（示唆・テンプレ出力・出典）は**触らない**

---

## 3【必須】`checkers.html` の見出しと説明文

| 箇所 | 現在 | 変更後 |
|---|---|---|
| 6行目 `<title>` | `設定判別ツール｜機種を選ぶ｜スロット稼働ノート` | `設定判別カウンター｜機種を選ぶ｜スロット稼働ノート` |
| 11行目 `og:title` | 同上 | 同上 |
| 53行目 `<h1>` | `設定判別ツール` | `設定判別カウンター` |
| 58行目 `<p class="lead">` | `使うツールを選んでください。入力内容は端末の localStorage に保存され、機種ごとに保存キーを分けています。` | **段落ごと削除** |

- **54行目の `<p>設定推測ツールと機種別カウンターを、目的に合わせて選ぶための一覧です。</p>` は残す**
- `description` / `og:description` に `設定判別ツール` があれば同じ語に直す
- **91行目の `<p class="note">今後、機種別の設定判別ツールやカウンターを…` は触らない**
  （一覧へのリンク文言ではなく、今後の追加方針の説明文のため）

### 他ページからのリンク文言

ツムギが全ファイルを調べた結果、**`checkers.html` へのリンクで「設定判別ツール」と
書いているのは1箇所だけ**。

```
index.html:150
- <p>設定差や示唆を数えたい → <a href="checkers.html">設定判別ツール一覧</a>から機種を選ぶ</p>
+ <p>設定差や示唆を数えたい → <a href="checkers.html">設定判別カウンター一覧</a>から機種を選ぶ</p>
```

他の `checkers.html` へのリンクは「← 機種選択」28件・「機種選択ページへ →」1件・
「← 設定判別カウンター一覧」1件で、**いずれも対象外**。

**`settei-estimator.html` の「設定判別ツール（ジャグラー）」は別ページ自身の名前**なので触らない。
ジャグラーの掲載もこの時点では変えない（夢爽指示）。

---

## 4 検証（項目ごとに PASS/FAIL と件数を報告）

1. **当選ゲーム数を3件（例 300 / 600 / 900）入れると、件数3・合計1800G・1/600.0 が出る**
   （画面・カード・テンプレのすべてで）
2. **1件削除すると再計算される**（例 600 を消して 件数2・合計1200G・1/600.0）
3. **空（0件）のとき 1/x がどこにも出ない**
4. **追加→取消で消える／削除→取消で戻る**（§9-96）
5. **一覧が新しい順**。11件以上入れると直近10件が出て、残りが折りたたみで見られる。
   **件数・合計・1/x は折りたたみに関係なく全件で計算される**
6. `追加` に 0・空・非数値を入れても何も起きない（履歴にも積まれない）
7. **テンプレ**: 0状態の出力が `tests/fixtures/mhsunbreak-zero-template.txt` と**バイト一致**
8. **テンプレ本文の不変**: mixed / all の golden を再生成したうえで、
   **本文が再生成前と1バイトも変わらない**こと。差分はヘッダー1行だけ（diff を報告に貼る）
9. **旧データを読んでもエラーなし**: `{"games":3000,"counts":{"at":9},"atEnd":{"jay":1}}` を
   localStorage に入れて開き、エラー0・`atEnd.jay=1` が残り・**AT初当りは0回**・1/x なし
10. **360px / 390px の実ビューポートで表示崩れなし**（はみ出し0・ボタン44px以上）
11. `checkers.html` の h1・title・og:title が `設定判別カウンター`、`.lead` の段落が無い、
    54行目の段落は残っている
12. `index.html:150` のリンク文言が `設定判別カウンター一覧`
13. **他機種への影響なし**: mhsunbreak 以外の機種データが**1バイトも変わっていない**こと
    （`git diff --stat` で示す）。なな様テンプレ3機種の出力が `74f8e03` とバイト一致
14. `checker-engine.js` / `checker-bayes.js` が**無変更**
15. `node test/verify.mjs` → 全設定OK
16. `node --test` → 件数とPASS/FAIL（**22件** が期待値。減らさない）
17. `node tests/new-1005-four-machines.browser.mjs` → 件数と FAIL 0
18. `node tests/new-1005-public.verify.mjs` → 全PASS
19. `node tests/wording-noukou.browser.mjs` → 既存の省略6機種8行以外にFAILが増えていない
20. `git diff --check` と LF

## 5 コミット・push

- コミットは機能単位で分けてよい。名義は `Mikoto <codex@slot-tools.local>`
- `fix/mhsunbreak-hitgames` を push して **PR を作成する**
- push が環境で拒否される場合は**コミットまでで止めて報告**（ツムギが push する）
- **main へのマージはしない**（夢爽の承認後）

## 6 報告に含めるもの

1. 変更ファイル一覧
2. §4 の1〜20の結果
3. mixed / all golden の再生成 diff（本文不変の確認）
4. 旧データ（`counts.at`）を捨てた挙動の実測
5. 迷った点・指示書で決まっていなかった点
