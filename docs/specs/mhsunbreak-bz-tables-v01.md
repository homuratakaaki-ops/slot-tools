# モンハンサンブレイク BZタブをアイコンテーブル1〜7方式に作り直す 実装指示書 v01

- 依頼: 夢爽（2026/10/9 決定）
- 中継・検収: ツムギ
- 実装: ミコト
- 作業ディレクトリ: `C:\Users\homur\slot-tools`
- ブランチ: `fix/mhsunbreak-bz-tables`
- commit名義: ミコト

---

## 0. 照合結果（ツムギが実施済み。再調査は不要）

原本 `https://chonborista.com/slot/enta-slot/264514/`（2026/10/9 更新）で確認した。

1. **テーブル1〜7の1個目のアイコンは指示どおり**。
   1=QUEST(青) / 2=QUEST(黄) / 3=ライゼクス / 4=セルレギオス / 5=オロミドロ亜種 /
   6=テオ・テスカトル / 7=AT。7種すべて異なるので、1個目を見ればテーブルが一つに決まる。
   （テーブル自体はBZレベル参照の抽選で決まり、1個目のアイコンはその結果の目印）
2. **旧ログの「結果」は新方式の「BZ成功」と同じ意味**。原本に「アイコンに応じたクエストへ発展」し
   「そこで成功すればAT当選となる」とある。旧実装の説明文も「クエストの結果まで見てから
   ［成功］［失敗］」であり、旧ログの `result:'win'`＝クエスト成功＝AT当選。よって §5 の移行は実施する。
3. 成功期待度（テーブル1〜6: 19.4% / 28.7% / 49.5% / 63.6% / 78.2% / 90.2%、7は成功濃厚）は
   設定1の値なので、**画面・ガイド・テンプレのどこにも出さない**（§9-104）。
4. テンプレ v03 は v02 に「■BZ配列メモ」行＋空行の2行を足しただけ（`diff` で確認）。
   よって **v04 は v02 とバイト一致になる見込み**。実装後に `cmp` で確認し、結果を報告する。

---

## 1. 変更対象ファイル（これ以外は1バイトも変更しない）

| ファイル | 変更 |
|---|---|
| `checker-data/mhsunbreak.js` | BZタブの作り直し・配列メモ削除・移行 |
| `mhsunbreak-checker.html` | `?v=` の更新のみ（§9-107） |
| `mhsunbreak-guide.html` | BZタブの説明を差し替え（§9-101） |
| `docs/specs/mhsunbreak-nana-template-v04.txt` | 新規（正本） |
| `tests/fixtures/mhsunbreak-{zero,mixed,all}-template.txt` | golden 作り直し |
| `tests/mhsunbreak-bz-groups.verify.mjs` | 仕様変更分の期待値更新 |
| `tests/mhsunbreak-template-v02.verify.mjs` | 同 |
| `tests/new-1005-four-machines.test.mjs` | 同 |
| `tests/new-1005-public.verify.mjs` | 同（golden 3件の参照のみ） |
| `tests/new-1005-four-machines.browser.mjs` | 配列メモのUXブロックをテーブル方式に差し替え |
| `IDEAS.md` | 末尾に1行追記（**全文差し替え禁止**。他チャットが同時に触る） |

**変更してはいけないもの**

- `checker-engine.js` / `checker-bayes.js` / 他機種の `checker-data/*.js` / 他機種のHTML
- `sitemap.xml` / `checkers.html` / `index.html` / `docs/ARCHITECTURE.md`
- `docs/specs/mhsunbreak-nana-template-v01〜v03.txt`（歴史的正本。残す）
- カード（`card.blocks` / `chart` / `bottom` / `detail`）の出力。BZの記録はカードに出さない方針のまま
- ガイドの `<style>`（`tonski-guide.html` とバイト一致であることをテストが固定している）

---

## 2. `checker-data/mhsunbreak.js`

### 2.1 削除する（10マス配列メモ関連）

- 定数: `ICONS` / `TEMPLATE_ICONS` / `TEMPLATE_QUEST` / `ICON_KEYS` / `ICON_NAMES` / `QUEST_NAMES`
- 関数: `iconLogLines` / `cleanIcons` / `isIconLogRow` / `normalizeIconLog` / `iconChip` /
  `iconInput` / `iconHistory`、モジュール変数 `iconMemoJustSaved`
- `actions` の `bzIconAdd` / `bzIconBack` / `bzIconClear` / `bzIconDel`
- `arrayDefaults`（`iconPending` / `iconLog` の2件だけなので**キーごと削除**）
- `DEF` の `iconPending` / `iconLog`
- CSS: `.bz-icon-slots` / `.bz-icon-slot` / `.bz-icon-slot.current` / `.bz-icon-picks` /
  `.bz-icon-button` / `.bz-icon-button:disabled` / `.bz-icon-tools,.bz-icon-line` / `.bz-icon` /
  `.bz-icon-qBlue` 〜 `.bz-icon-blaze` / `.bz-icon-log-row` / `.bz-icon-log-body` /
  `.bz-memo-new` / `@keyframes bz-memo-new`、およびモンスター色のコメント
- `tplText` の配列メモ差し込み（`const memo=...` と `const body=...`。`text` をそのまま使う）
- `TEMPLATE` から `■BZ配列メモ\n` とその直前の空行（下記 §3 の v04 と一致させる）
- 旧 `questN`（v01 の合算セーブ）からの移行コード（`legacyQuest` の分岐）。
  発展先別の数値は破棄するため不要。**ただし `delete out.questN;` は残す**（古いキーを保存に残さない）

### 2.2 `QUEST` を `TABLES` に置き換える

```js
  // BZのアイコンテーブル。1個目のアイコンでテーブルが決まる（原本 2026/10/9 更新で確認）。
  // [キー, 表示名, 1個目のアイコン]
  const TABLES=[
    ['t1','テーブル1','QUEST青'],
    ['t2','テーブル2','QUEST黄'],
    ['t3','テーブル3','ライゼクス'],
    ['t4','テーブル4','セルレギオス'],
    ['t5','テーブル5','オロミドロ亜種'],
    ['t6','テーブル6','テオ・テスカトル'],
    ['t7','テーブル7','AT']
  ];
  const TABLE_NAMES=Object.fromEntries(TABLES.map(c=>[c[0],c[1]+'（'+c[2]+'スタート）']));
```

- 配列の順序は**テンプレの行順（青ｽﾀｰﾄ→黄ｽﾀｰﾄ→ﾗｲｾﾞｸｽ→ｾﾙﾚｷﾞｵｽ→ｵﾛﾐﾄﾞﾛ亜種→ﾃｵﾃｽｶﾄﾙ→AT）と同じ**。
  `tplText` の `values` は `QUEST.map(...)` を `TABLES.map(...)` に替えるだけで位置が合う。
- 状態のキー名 `bzT1` / `bzT2`（回数）/ `questN1` / `questN2`（成功）と、
  action 名 `bzQuest`・属性 `data-d` / `data-n` / `data-q` / `data-r` は**変えない**。
  意味だけが「発展先」→「テーブル」に変わる。`questN*` の意味は
  「そのグループのテーブル別のBZ成功（AT当選）数」。コメントで明記すること。
- `DEF` の `bzT1` / `bzT2` / `questN1` / `questN2` は `zero(TABLES)`。
- `bzQuestAction` は `QUEST.some(c=>c[0]===ds.q)` を `TABLES.some(...)`、
  フィードの `QUEST_NAMES[id]` を `TABLE_NAMES[id]` に替える。配列メモ保存の分岐は削除する。

### 2.3 BZタブの画面（`pageBZ`）

セクションは**2つだけ**にする。①②の手順見出しは廃止。

**セクション1: `テーブル別の結果`**

- 既存の `.bz-sub` で `1回目` / `2回目以降` を区切る（グループの定義は従来どおり）。
- 各グループに `TABLES` の7行。行名は `TABLE_NAMES[id]`（例「テーブル3（ライゼクススタート）」）。
- 行の数値表示は現状のまま `ctx.pct(成功, 回数)`（`n/d NN%`）。
  成功＝そのテーブルのBZからAT当選。
- `t1`〜`t6`: ［成功］（`data-r="win"`、`.cycle-btn.win`）と ［失敗］（`data-r="miss"`）。
- `t7`: ［＋］のみ（`data-r="win"`）。AT濃厚なので成功として数える（回数・成功とも+1）。
- 減算モードの守りは現状のまま（`ctx.mode<0 && d<=hit` のとき ［失敗］を `disabled`）。
- 説明は `.hint` を**1つだけ**置き、本文は次のとおり（engine が自動で折りたたむ）:

```
BZ開始時のアイコン1個目でテーブルが決まります。BZ開始時に、並んだアイコンの1個目を見てテーブルを選びます（1個目でテーブルが決まります）。BZとその後のクエストが終わったら、ATに当選したかで［成功］［失敗］を押してください。テーブル7はAT濃厚のため［＋］だけを置き、成功として数えます。1回目はAT終了後（朝一を含む）最初のブレイクゾーン、2回目以降はそれ以外です。訂正は減算モードで同じボタンを押します。設定差は公表されていません。記録してサンプルを集める項目です。
```

- 先頭の1文（25字）は §9-97 のための行内要約。夢爽指定の文はその後に原文のまま続ける
  （engine の `HINT_LEAD_MAX=30` を超える文は行内に残らず、先頭0字になるため）。
  **この文を削ったり言い換えたりしないこと。**

**セクション2: `テーブル別 成功率（合算）`**

- 現状の「クエスト成功率（合算）」をこの見出しに替える。中身は従来どおり**表示専用**7行
  （ボタン・`data-bump` を一切出さない）。行名は `TABLE_NAMES[id]`。
- `.hint` は現状のまま `テンプレに出る成功率です（1回目＋2回目以降）`。

### 2.4 旧データの移行（夢爽承認済み）

`normalizeState` の中で、保存済みの配列メモ（`iconLog`）を新方式の回数・成功数へ移す。

```js
  // 旧データ（10マス配列メモ）の移行。1個目のアイコンでテーブルを判定する（夢爽承認 2026/10/9）。
  // 旧ログの成功＝クエスト成功＝AT当選なので、新方式の成功と同じ意味。
  const LEGACY_FIRST_ICON={qBlue:'t1',qYellow:'t2',rai:'t3',sel:'t4',oro:'t5',teo:'t6',rush:'t7'};
```

手順（`normalizeState` 内の順序を守る）

1. `bzT1` / `bzT2` / `questN1` / `questN2` は **`TABLES` のキーだけを残す**（`DEF` にないキーは捨てる）。
   旧方式（発展先別 `blue` / `yellow` / `raizex` / `serregios` / `oromidro` / `teo` / `at`）の
   回数・成功数は意味が違うため**破棄**する。
2. `src.iconLog` の各件を古い順に見て、
   - `icons[0]` が `LEGACY_FIRST_ICON` にある → そのテーブルの回数を+1
   - `group` が `bzT1` / `bzT2` のいずれでもない件は移さない
   - 成功の加算条件: `id==='t7' || row.result==='win' || row.quest==='at'`
     （テーブル7はAT濃厚のため常に成功。旧ログの発展先がAT＝AT当選なので成功）
   - `icons[0]` が `？`（`unknown`）・`＋G`（`gold`）・`猛焔`（`blaze`）の件は
     **テーブルを判定できないので移さない**（指示は「？」のみだが、残り2つも1個目から
     テーブルが決まらないため同じ扱いにした。移行件数と併せて報告する）
3. `delete out.iconLog;` と `delete out.iconPending;` を必ず行う。
   これで次回の保存以降は旧データが残らず、**移行は二重に走らない（冪等）**。
4. 最後に n≦d をグループごとに保つ（§9-87。現状の `BZ_GROUPS` ループを `TABLES` で回す）。

移行で足した件数は、検証用スクリプト（§7-5）で数えて報告すること。

---

## 3. 正本 `docs/specs/mhsunbreak-nana-template-v04.txt`（新規）

- `docs/specs/mhsunbreak-nana-template-v03.txt` から **`■BZ配列メモ` の行と、その直前の空行**を
  削除したもの。改行は LF のみ、行末空白・異体字セレクタ（`▶︎` の U+FE0E）は1バイトも変えない。
- `cmp docs/specs/mhsunbreak-nana-template-v02.txt docs/specs/mhsunbreak-nana-template-v04.txt` が
  一致することを確認し、報告する（1881バイト）。
- `checker-data/mhsunbreak.js` の `TEMPLATE` は v04 と同じ本文にする。

---

## 4. `mhsunbreak-guide.html`（§9-101）

`<h2>BZタブ</h2>` のセクションの本文を差し替える。

- 1本目の `<p>`（下部タブの説明と1回目/2回目以降の定義）は**そのまま残す**。
- 2本目の `<p>`（初期アイコン配列（メモ）…）と3本目の `<p>`（発展先7種…）を、次の1本に置き換える。
- 4本目の `<p>`（設定差は公表されていません。記録してサンプルを集める項目です。）は残す。

```html
    <p>ブレイクゾーン開始時に並んだアイコンの1個目を見て、テーブル1〜7のどれかを選びます（1個目でテーブルが決まります）。表示名には1個目のアイコンを併記しています（テーブル1＝QUEST青、2＝QUEST黄、3＝ライゼクス、4＝セルレギオス、5＝オロミドロ亜種、6＝テオ・テスカトル、7＝AT）。ブレイクゾーンとその後のクエストが終わったら、ATに当選したかで［成功］［失敗］を押してください。テーブル7はAT濃厚のため［＋］だけを置き、成功として数えます。各行はそのグループの成功数／回数、下部の「テーブル別 成功率（合算）」は1回目＋2回目以降の合算です。訂正は減算モードで同じボタンを押します。</p>
```

- 「テンプレ出力」セクションの `<p>` は現状のままでよい（`BZテーブル1回目・2回目以降とクエスト成功率も
  テンプレに出力します。BZタブの記録はカードには載りません。` はテーブル方式でも正しい）。
- 配列メモ・10マス・絵文字除去に関する記述が**ガイド全体から消えていること**を確認する。
- 「が確定」「設定差はありません」の形は使わない（`tests/wording-noukou.verify.mjs` が固定）。
- 成功期待度の％は書かない（§9-104・設定1の値）。

---

## 5. `mhsunbreak-checker.html`（§9-107）

`<script src="checker-data/mhsunbreak.js?v=20261005-3">` を `?v=20261009` にする。他は変更しない。

---

## 6. テストの追随

**更新してよいのは「発展先7種」「配列メモ」を前提にした期待値だけ**。
共通ファイル不変・他機種不変・カード不変・バイト一致の各不変条件は維持する。

### 6-1 `tests/mhsunbreak-bz-groups.verify.mjs`

- `ids` は `config.defaults.questN1` のキー（自動で `t1`〜`t7` になる）。
  テスト内の `'blue'` を `'t3'` に替える（検証指示がテーブル3なので合わせる）。
- セクション見出しの文字列 `'② 結果を押す'` → `'テーブル別の結果'`、
  `'クエスト成功率（合算）'` → `'テーブル別 成功率（合算）'`。
- 「legacy migration …（`questN` の合算移行）」のテストは**配列メモからの移行テストに置き換える**。
  新しい内容:
  - `iconLog` 10件（1個目を `qBlue` / `qYellow` / `rai` / `sel` / `oro` / `teo` / `rush` /
    `gold` / `blaze` / `unknown` の各1件、`group` と `result` を混ぜる）を入れた旧セーブを
    `normalizeState` に通し、`t1`〜`t7` に1件ずつ入り、`gold` / `blaze` / `unknown` の3件は
    どこにも入らないこと。`t7` は `result:'miss'` でも成功として数えること。
  - 旧方式の発展先キー（`blue` 等）に値がある旧セーブを通すと、その値が**残らない**こと。
  - `iconLog` / `iconPending` / `questN` が出力に残らないこと。
  - もう一度 `normalizeState` に通して**同じ結果になること（冪等）**。
- 「template buffers add only the v03 memo heading against 006e842」は、
  **`006e842` の出力とバイト一致**（メモ見出しの差し込みなし）に替える。
  `006e842` は v02 時点なので、同じ回数・成功数を与えれば v04 の出力と一致するはず。
  一致しない場合は実装を直す側を疑うこと（期待値をゆるめない）。
- 「f48130f template bytes and card JSON remain identical」は、
  - `card` の JSON 一致は**維持**（カードは変えない）
  - テンプレは `f48130f` の出力から `■BZ配列メモ\n\n` を除いたものと一致、に替える。
    `iconLog` を積む行は削除する（状態に存在しないため）。
- 28チェッカーのヘッダー検査はそのまま。

### 6-2 `tests/mhsunbreak-template-v02.verify.mjs`

- 冒頭コメントを「v02 は歴史的正本、現在の出力は v04」に直す。
- v02 の SHA256・1881バイト・34空欄・56スロットの検査は**そのまま維持**。
- `v03` を読んでいる箇所を `v04` に替え、`bytes(v04, original)`（＝v02 とバイト一致）を検査する。
  v03 のファイル自体は残るので、`v03 === v02 + 2行` の検査も残してよい。
- 全0状態の本文が v04 のスロットを埋めたものとバイト一致、を検査する。
- `legacy(...)`（`■レア役からのBZ当選率` 以降の比較）はそのまま通るはず。通らなければ報告。
- `S.questN1.future=17` が保存される前提の検査は、**未知キーが捨てられる**前提に直す
  （§2.4-1 の仕様変更）。
- 「one old-save migration」（旧セーブで4キーが全0）は維持。

### 6-3 `tests/new-1005-four-machines.test.mjs`

- `v03` 参照を `v04` に替える。
- golden の長さ検査 `2230+Buffer.byteLength('■BZ配列メモ\n\n')` は `2230` に替える
  （実測で確認してから書くこと）。
- 「MH v03 memo maps every icon/quest …」のテストは**削除**し、代わりに
  「`iconLog` を持つ旧セーブを `normalizeState` に通してもテンプレに配列メモ行が出ない／
  `■BZ配列メモ` の文字列がファイルにもテンプレにも無い」を検査する。
- `assert.ok(!Object.hasOwn(c.actions,'bzIconCopy'))` は
  `bzIconAdd` / `bzIconBack` / `bzIconClear` / `bzIconDel` / `bzIconCopy` が**どれも無い**ことに広げる。

### 6-4 `tests/new-1005-public.verify.mjs`

- golden 3件を読んでいる箇所はそのまま（ファイルを作り直すので通る）。
- `legacyNow` の除去正規表現は `■BZテーブル1回目` 〜 `■レア役からのBZ当選率` を落とすので、
  メモ見出しの削除は吸収される。通らなければ報告。

### 6-5 `tests/new-1005-four-machines.browser.mjs`

- 「v03: production icon/result/copy/delete/undo handlers and exact memo bytes」以下の
  配列メモUXブロック（`bzIconAdd` / `bzIconDel` / `bzIconClear` / `.bz-memo-new` /
  `memoBody` / `expectedMemo` を使う一連）を**削除**し、テーブル方式の実測に差し替える:
  - BZタブの `.sec-h` が `['テーブル別の結果','テーブル別 成功率（合算）']` の2つ
  - `.quest-row` が 21行（1回目7＋2回目以降7＋合算7）、`.quest-row button` が 26個
    （t1〜t6 が2個×2グループ＝24、t7 が1個×2グループ＝2。合算欄は0個）→ **実測して確認**
  - `[data-action="bzQuest"][data-d="bzT1"][data-q="t3"][data-r="win"]` を押すと
    `bzT1.t3` と `questN1.t3` が+1、`[data-r="miss"]` では `bzT1.t3` だけ+1
  - `t7` の ［＋］で回数・成功とも+1（失敗ボタンが存在しない）
  - 取消1回で1タップ分（回数・成功の両方）が戻る
  - リロード後も保存が残る
  - 360px / 390px で崩れがないこと（`measure(...)` の既存の仕組みを使う）、
    ボタンの高さが44px以上
  - 既存の「MH template v02: actual BZ buttons and persisted state」のブロックは
    `questIds` を `t1`〜`t7` に替えて維持する
- 証跡画像・テキストの出力先は `CHECKER_ARTIFACTS` の既定（リポジトリ外）から変えない。
  **リポジトリ内に `artifacts/` を作らないこと。**

### 6-6 `tests/fixtures/mhsunbreak-{zero,mixed,all}-template.txt`

- `tests/new-1005-four-machines.test.mjs` / `tests/new-1005-public.verify.mjs` の
  状態の作り方に合わせて作り直す。結果として**旧ファイルから `■BZ配列メモ` 行と空行が
  消えただけになる見込み**。差分が他にも出た場合は、原因を説明したうえで報告する。

---

## 7. 検証（すべて実行して結果を報告する）

1. `node --check` 相当の構文確認（`checker-data/mhsunbreak.js` は `node --check` で直接可）
2. `node tests/mhsunbreak-bz-groups.verify.mjs`
3. `node tests/mhsunbreak-template-v02.verify.mjs`
4. `node tests/new-1005-four-machines.test.mjs`
5. `node tests/new-1005-public.verify.mjs`
6. `node tests/no-regex-lookbehind.test.mjs`（§9-106。`(?<=` `(?<!` を使わないこと）
7. `node tests/wording-noukou.verify.mjs`
8. `node tests/magireco-remove-estimate.verify.mjs`
9. `node test/verify.mjs`（「サニティチェック: 全設定OK / 区間分割: 全設定OK」）
10. `node tests/new-1005-four-machines.browser.mjs`（headless Chrome。360/390px の実測を含む）
11. `cmp docs/specs/mhsunbreak-nana-template-v02.txt docs/specs/mhsunbreak-nana-template-v04.txt`
12. `git diff --check`（行末・空白）

### 7-5 指示された個別の確認

- テーブル3の1回目に ［成功］1回・［失敗］1回 →
  1回目の行が `1/2 50%`、テンプレ `■BZテーブル1回目` の `ﾗｲｾﾞｸｽ` が `2回`、
  `■クエスト成功率` の `ﾗｲｾﾞｸｽ` が `1/2`
- テーブル7の ［＋］→ `AT` の行が回数・成功とも+1（テンプレの `AT` 行も `1回` / `1/1`）
- 全0状態のテンプレ本文が v04 とバイト一致
- 取消・データリセット・減算モードで必ず n≦d
- 旧データ（`iconLog` あり）を読み込んで移行が正しいこと。**移行件数を報告する**
  （1個目ごとの内訳と、移さなかった件数・理由）
- 360px / 390px で崩れなし、タップ要素は44px以上
- テストは全件PASS。**各テストのPASS件数を報告する**

---

## 8. 守ること

- 指示書の範囲外のUI変更（配置・文言・色・サイズ）は**実装前にツムギへ確認する**。
  動作の修正・検証の追加は自由。
- 受け取った文言は原文のまま使う。整形・言い換え・コメント削除をしない。
- 共通ファイル（`checker-engine.js`）は変更しない。必要になったら止めて報告する。
- push・PR作成はツムギが夢爽の承認を得てから行う。ミコトは commit まで。
- 検証の証跡をリポジトリにコミットしない（`artifacts/` を作らない）。
