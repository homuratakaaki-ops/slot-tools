# モンハンサンブレイク AT間ログ（AT間メモ）実装指示書 v01

- 依頼: 夢爽（2026/10/9 決定）
- 中継・検収: ツムギ
- 実装: ミコト
- 作業ディレクトリ: `C:\Users\homur\slot-tools`
- ブランチ: `feat/mhsunbreak-at-log`（最新 main = `55fbbed` から作成済み）
- commit名義: ミコト

**目的**: AT間（AT終了〜次のAT当選）ごとに、BZ・福引・示唆を**出た順に残すメモ**。
設定推測・確率計算・1/x表示は**しない**。

---

## 0. 出典の照合結果（ツムギが実施済み。再調査は不要）

出典: 一撃様 `https://1geki.jp/slot/l_mh_sun/57/`（アイキャッチ・セリフ）、
`https://1geki.jp/slot/l_mh_sun/48/`（テーブル・レベル・シナリオ）

1. **アイキャッチ6種は指示どおり**。原文は「アイキャッチ（ステージチェンジ）は、滞在している
   BZシナリオを示唆する」。ジェイ（白）＝シナリオB以上／ルーチカ（青）＝C以上／
   フィオレーネ（黄）＝D以上／バハリ（緑）＝E以上／ガレアス（赤）＝F以上／
   チッチェ（紫）＝G以上。**出現場面は「ステージチェンジ」までしか書かれていない**ので、
   画面・ガイドでもそれ以上は書かない（AT終了画面の設定示唆とは別物として扱う）。
2. **チッチェのセリフ4種は指示どおり**（次回BZレベル HI以上示唆（弱）／（強）／HI以上濃厚／SP濃厚）。
   セリフの出現場面は原文に明記がないので書かない。
3. **シナリオH の判定は出典で裏が取れた**。
   - BZテーブル1が選ばれるのは**レベルLOWのみ**（LOW 84.0%。他レベルは「–」）。
     原文に「BZテーブル1が選ばれた場合はレベルLOW濃厚!?」
   - 1回目のブレイクゾーンがレベルLOWになるのは**シナリオHのみ**（A〜G・I は MID か HI）
   - 原文に「シナリオ『H・I』選択時は、3回目のブレイクゾーンでレベルSPが選択され
     BZテーブル7濃厚」「3回目のブレイクゾーンが天井となる」
   → **BZ番号1のBZがテーブル1なら シナリオH濃厚。その場合3回目のBZでテーブル7＝AT濃厚**。
   シナリオIも3回目はSPだが、Iは1回目がMID以上なのでテーブル1にならない。この導出を
   コードのコメントに出典URL付きで残すこと。
4. BZ番号は一撃の「ブレイクゾーン当選回数ごと」に準拠するため、既定では**福引を数えない**。

---

## 1. 変更対象ファイル（これ以外は変更しない）

| ファイル | 変更 |
|---|---|
| `checker-data/mhsunbreak.js` | AT間ログの実装・BZ説明の重複直し |
| `mhsunbreak-checker.html` | `?v=` の更新のみ（§9-107） |
| `mhsunbreak-guide.html` | AT間メモの使い方を追記・出典の追記（§9-101） |
| `tests/mhsunbreak-at-log.verify.mjs` | 新規 |
| `tests/mhsunbreak-bz-groups.verify.mjs` | 仕様変更分の期待値更新 |
| `tests/new-1005-four-machines.browser.mjs` | AT間メモの実測を追加＋パリピの `counts.cz` 追随 |
| `IDEAS.md` | 末尾に1行追記（**全文差し替え禁止**） |

**変更してはいけないもの**

- `checker-engine.js` / `checker-bayes.js`（共通ファイル）。必要になったら**止めて報告**
- 他機種の `checker-data/*.js` と HTML
- `checkers.html` / `sitemap.xml` / `index.html` / `docs/ARCHITECTURE.md`
- なな様テンプレ（`tplText` / `compactTemplate` の出力。**v04 とバイト一致のまま**）と
  収支帳用コピー、カード（`card.*` の JSON）
- `docs/specs/mhsunbreak-nana-template-v01〜v04.txt`
- `checker-data/paripi.js`（テストだけを現状に合わせる）

---

## 2. 保存データ

```js
  // AT間（AT終了〜次のAT当選）ごとのメモ。順番を残すだけで、確率計算には使わない。
  S.atLog = { sessions:[ { start:{known:true,prior:0}, events:[], closed:false } ] }
```

- `start`: `{known:true,prior:0〜6}`（朝一・AT後から＝`prior:0`、途中から＝`prior:n`）か `{known:false}`
- `events`: 次の5種。出た順（古い順）に push する
  - `{t:'bz',table:'t1'〜't7',r:'win'|'miss'}`
  - `{t:'fuku',r:'win'|'miss'}`
  - `{t:'eye',c:<EYEのキー>}`
  - `{t:'serif',c:'s1'〜's4'}`
  - `{t:'otherAt'}`
- `closed`: そのAT間が閉じたか
- **いちばん後ろの要素が「今のAT間」**。常に1件は開いている（`closed:false`）状態を保つ

### 2.1 定数

```js
  // ステージチェンジ時のアイキャッチ。滞在しているBZシナリオを示唆する
  // （出典: https://1geki.jp/slot/l_mh_sun/57/）。[キー,名前,色,示唆] は強さ順。
  const EYE=[
    ['jay','ジェイ','白','シナリオB以上濃厚'],
    ['luchika','ルーチカ','青','シナリオC以上濃厚'],
    ['fiorene','フィオレーネ','黄','シナリオD以上濃厚'],
    ['bahari','バハリ','緑','シナリオE以上濃厚'],
    ['galeas','ガレアス','赤','シナリオF以上濃厚'],
    ['chiche','チッチェ','紫','シナリオG以上濃厚']
  ];
  // チッチェのセリフ。次回BZレベルの示唆（出典: 同上）。
  const SERIF=[
    ['s1','次回BZレベルHI以上期待度UP(弱)'],
    ['s2','次回BZレベルHI以上期待度UP(強)'],
    ['s3','次回BZレベルHI以上濃厚'],
    ['s4','次回BZレベルSP濃厚']
  ];
  // 一撃の「ブレイクゾーン当選回数ごと」に準拠し、BZ番号は福引を数えない。
  // true にすると福引も数える（切り替えはこの定数1か所だけで済むようにする）。
  const COUNT_FUKU_AS_CZ=false;
  const AT_SESSION_MAX=50;   // AT間の保存上限。超えたら古い順に捨てる
  const AT_EVENT_MAX=200;    // 1つのAT間に入るイベントの上限（防御。超えたら追加しない）
  const AT_PRIOR_MAX=6;      // ［途中から：既にBZ n回］の n の上限
```

### 2.2 正規化（`normalizeState` に追加）

- `out.atLog` を検査して作り直す。壊れた値・未知の種類は捨てる
  - `sessions` が配列でなければ既定（開いたAT間1件）にする
  - `start` は `{known:true,prior:0〜AT_PRIOR_MAX の整数}` か `{known:false}` に正規化
  - `events` は §2 の形に合うものだけ残す（`table` は `TABLES` のキー、`c` は `EYE`/`SERIF` のキー、
    `r` は `win`/`miss`）。先頭から `AT_EVENT_MAX` 件まで（**古い方を残す**。番号が狂うため）
  - `sessions` は**後ろから** `AT_SESSION_MAX` 件まで
  - `sessions` が空なら開いたAT間1件を入れる。最後が `closed:true` なら開いたAT間を1件足す
- **`atLog` を `MERGE_KEYS` に入れない**（数値マップ用の処理なので壊れる）
- `atLog` を持たない旧セーブはそのまま読めること（既定が入る）。
  §2 の正規化は**冪等**であること（2回通して同じ結果）

---

## 3. AT間の開始・区切り

- **区切り**: `{t:'bz',r:'win'}`（t7の［＋］を含む）・`{t:'fuku',r:'win'}`・`{t:'otherAt'}` を
  記録したら、そのAT間を `closed:true` にし、`{known:true,prior:0}` の新しいAT間を**自動で**足す
- **その日最初のAT間だけ**、開始の状態を選べる（action `atStart`）
  - ［朝一・AT後から］→ `{known:true,prior:0}`（既定）
  - ［既にBZ n回］（n=1〜6）→ `{known:true,prior:n}`
  - ［途中から：不明］→ `{known:false}`
  - 表示条件: `sessions.length===1` かつ そのAT間に `t:'bz'` のイベントが**まだ無い**とき。
    選択済みのボタンには `.on` と `aria-pressed="true"` を付ける
  - 条件を外れたら選択ボタンは出さず、既定以外を選んでいたときだけ
    `開始：既にBZ2回` / `開始：不明` の1行を出す

---

## 4. BZ番号の数え方

```js
  const countsForNo=e=>e.t==='bz'||(COUNT_FUKU_AS_CZ&&e.t==='fuku');
  // そのイベントのBZ番号。known:false のときは null（番号なし）
  function bzNoAt(session,index){ /* start.prior + 先頭からそのイベントまでの該当件数 */ }
  // 次に記録するBZの番号
  function nextBzNo(session){ /* start.prior + 該当件数 + 1。known:false は null */ }
```

- **番号は events から都度計算し、保存しない**
- `COUNT_FUKU_AS_CZ=false` なら福引はまたいでも番号が進まない

---

## 5. 既存のテーブル別ボタンとの連携

集計（`bzT1`/`bzT2`/`questN1`/`questN2`）の仕組みは**変えない**。

- `bzQuestAction`（加算時）で、今のAT間に `{t:'bz',table:ds.q,r:ds.r}` を1件足す。
  区切りの処理は §3 のとおり（`r==='win'` なら閉じて次を開く）
- **押せるグループを絞る（加算モードのときだけ）**
  - `known` かつ `nextBzNo()===1` → 「1回目」だけ押せる。「2回目以降」のボタンは
    `disabled aria-disabled="true"`
  - `known` かつ `nextBzNo()>=2` → 「2回目以降」だけ押せる。「1回目」を無効化
  - 押せない側の `.bz-sub` に `<small class="mn">今は3回目</small>` の形で今の番号を出す
  - `known:false` のときは両方押せる（今と同じ。注記も出さない）
  - **減算モード（`ctx.mode<0`）ではこの絞り込みをしない**（別グループの訂正をふさがないため）
- `bzQuestAction` 側でも同じ条件で拒否する（`return false`）。画面の `disabled` だけに頼らない
- 福引のイベントは `czType`（CZ種別のBZ/アイルー回数）とは**連動させない**

---

## 6. 「AT間メモ」セクション（BZタブ）

**セクションの順番**: `テーブル別の結果` → **`AT間メモ`** → `テーブル別 成功率（合算）`
（よく押すテーブル別ボタンの位置を変えないため。見出しの示唆は「見に行く情報」として下に置く）

中身（上から）

1. 見出し行 `<div class="sec-h">AT間メモ<span class="sub">過去 n件</span></div>`（n＝閉じたAT間の数）
2. （最初のAT間だけ）`<div class="bz-sub">このAT間の開始</div>` ＋ 選択ボタン8個
   （朝一・AT後から／既にBZ1〜6回／途中から：不明）。44px以上
3. **今のAT間で一番強いアイキャッチ**を大きく1行。
   書式 `バハリ（緑）：シナリオE以上濃厚`。**弱いものが後から出ても変えない**（強さの最大値）。
   まだ無ければ `アイキャッチ なし`（`var(--muted)`）
4. シナリオH の行（条件を満たすときだけ）: `シナリオH濃厚：3回目のBZでAT濃厚`
   - 条件: `start.known` かつ そのAT間に **BZ番号1かつ `table==='t1'`** のBZイベントがある
   - `known:false` では出さない。過去のAT間の表示でも同じ条件で出す
5. 今のAT間のイベントを**古い順に1行ずつ**。各行に［削除］（`data-action="atDel" data-index="i"`）
   - `bz`: `BZ1回目 テーブル3（ライゼクス）失敗`（番号なしのときは `BZ テーブル3（ライゼクス）失敗`）
   - `fuku`: `福引 失敗`
   - `eye`: `アイキャッチ ジェイ（白）シナリオB以上濃厚`
   - `serif`: `セリフ 次回BZレベルHI以上濃厚`
   - `otherAt`: `BZ以外でAT当選`
   - 0件なら `まだありません`
6. 過去のAT間は**折りたたみ**（`<details class="hit-more"><summary>過去のAT間（n件）</summary>`）。
   新しい順に、1ブロックずつ `1つ前のAT間` … の見出し＋（既定以外のときだけ開始の1行）＋
   一番強いアイキャッチ＋シナリオHの行＋イベント行（**［削除］は付けない**）
7. 記録ボタン
   - `<div class="bz-sub">アイキャッチ（ステージチェンジ）</div>` → 6ボタン（強さ順）。
     1ボタンに `名前（色）` と示唆を2行で入れる（`data-action="atEvent" data-t="eye" data-c="jay"`）
   - `<div class="bz-sub">チッチェのセリフ</div>` → 4ボタン（`data-t="serif" data-c="s1"`）
   - `<div class="bz-sub">そのほか</div>` → `アイルー福引` の［成功］［失敗］
     （`data-t="fuku" data-r="win|miss"`）と ［BZ以外でAT］（`data-t="otherAt"`）
   - **減算モードでは 7 のボタンを `disabled` にし、1行で理由を出す**
     （`減算モードはテーブル別の回数だけを戻します。AT間メモは行の［削除］か「↩ 取消」で直します`）
8. 説明（`.hint` 1つ）。§9-97 のため**先頭に30字以内の要約1文**を置く

```
AT間ごとに、出た順でメモを残します。AT終了から次のAT当選までを1つのAT間として、BZ・アイルー福引・アイキャッチ・チッチェのセリフを押した順に並べます。BZ番号はブレイクゾーンの当選回数で数え、アイルー福引は数えません。アイキャッチはステージチェンジで出て、滞在しているBZシナリオを示唆します（AT終了画面の設定示唆とは別の記録です）。BZ成功・福引成功・［BZ以外でAT］を押すと、そのAT間を閉じて次のAT間を始めます。行の［削除］はメモの行だけを消します（テーブル別の回数は減算モードで直します）。設定推測には使いません。出典は一撃様です。
```

### 6.1 CSS（`pageBZ` の `<style>` に足す。既存の値は変えない）

```css
    .at-top{font-size:17px;font-weight:800;line-height:1.3;margin:2px 0 6px}
    .at-top.none{font-size:13px;font-weight:700;color:var(--muted)}
    .at-sc{font-size:13px;font-weight:800;color:var(--gold);margin:0 0 6px}
    .at-row{font-size:13px}
    .at-row .lbl{flex:1;min-width:0}
    .at-row .nm{overflow-wrap:anywhere}
    .at-pick{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:8px}
    .at-pick.start{grid-template-columns:repeat(2,minmax(0,1fr))}
    .at-btn{min-height:48px;padding:6px 8px;border:1px solid var(--line);border-radius:10px;background:var(--panel);color:var(--txt);font:inherit;text-align:left}
    .at-btn b{display:block;font-size:14px;font-weight:800}
    .at-btn small{display:block;font-size:11px;color:var(--muted);line-height:1.3}
    .at-btn.on{border-color:var(--pink-dim);background:rgba(255,61,143,.14);color:var(--pink)}
    .at-btn:disabled{opacity:.4}
    .at-past{margin-top:8px}
    .at-past-h{font-size:11px;font-weight:800;color:var(--muted);margin:8px 0 4px}
```

- 色は使わない（キャラの色は**文字で**「（緑）」と書く）。ゲーム画像は使わない
- 360px で横に溢れないこと。タップ要素は44px以上（アイキャッチ・セリフは48px）

---

## 7. 取消・減算・リセット

- `bzQuest` / `atStart` / `atEvent` / `atDel` はすべて engine の `customAction` 経由なので、
  `取消` は**その操作が変えたキー全部**（`bzT1`・`questN1`・`atLog`）を1回で戻す。
  **共通ファイルは変更しない。** 戻らない場合は実装を止めて報告する
- 減算モード: テーブル別の［成功］［失敗］は**回数だけ**戻す（AT間メモのイベントは消さない。
  メモの訂正は行の［削除］か「↩ 取消」）。§6-7 のボタンは `disabled`
- リセット: engine が `S=clone(DEF)` するので `atLog` も既定（開いたAT間1件・イベント0）に戻る。
  「↩ 取消」で戻せること

---

## 8. ついでに直すもの

### 8-1 BZ説明の重複

今の `.hint` の先頭が「BZ開始時のアイコン1個目でテーブルが決まります。BZ開始時に、並んだアイコンの
1個目を見てテーブルを選びます（1個目でテーブルが決まります）。」と2回続いている。次の1文に直す。

```
BZ開始時のアイコン1個目でテーブルが決まります。並んだアイコンの1個目を見てテーブルを選び、BZとその後のクエストが終わったら、ATに当選したかで［成功］［失敗］を押してください。テーブル7はAT濃厚のため［＋］だけを置き、成功として数えます。1回目はAT終了後（朝一を含む）最初のブレイクゾーン、2回目以降はそれ以外です。訂正は減算モードで同じボタンを押します。設定差は公表されていません。記録してサンプルを集める項目です。
```

先頭1文は25字なので §9-97 の行内要約として残る。**畳んだときに行内が0字にならないことを実測で確認**。

### 8-2 `tests/new-1005-four-machines.browser.mjs` のパリピ追随（テストだけ直す）

`counts.cz` のボタンは 10/6 の CZ種別化で無くなった（現状は `czType.sanka` / `eiko` / `sekihei` の
3行と、`.sumrow` の `CZ 計n回 1/x`）。本体は触らず、テストを現状に合わせる。

- `bump('counts.'+countKey)` → パリピは `bump('czType.sanka')`
- 状態の検査 → パリピは `(await state()).czType.sanka===1`
- 1/x の検査に使う要素と文字列を機種ごとに持つ
  - `juuou` / `tenten`: `[data-c="counts.sc"]` / `[data-c="counts.at"]`＋`現在 1/1000.0`（今のまま）
  - `mhsunbreak`: `.sumrow`＋`現在 1/1000.0`（今のまま）
  - `paripi`: `.sumrow`＋`計1回 1/1000.0`（`現在` は付かない）
- 0G のとき 1/x が出ないことの検査（`includes('現在')===false`）はパリピでも成り立つのでそのまま
- この修正で `node tests/new-1005-four-machines.browser.mjs` が**パリピを含めて全件PASS**すること

### 8-3 ガイド（§9-101）

`<h2>BZタブ</h2>` のセクションに「AT間メモ」の段落を足す。入れる内容:

- AT間（AT終了〜次のAT当選）ごとに、BZ・福引・アイキャッチ・セリフを出た順に残すメモであること
- 設定推測や確率計算には使わないこと
- 開始の選び方（朝一・AT後から／既にBZn回／不明）と、不明のときは番号を出さないこと
- BZ番号はブレイクゾーンの当選回数で数え、アイルー福引は数えないこと
- アイキャッチ6種（ジェイ（白）＝シナリオB以上濃厚 … チッチェ（紫）＝G以上濃厚）は
  ステージチェンジで出て**滞在しているBZシナリオ**を示唆する。AT終了画面の設定示唆とは別の記録
- チッチェのセリフ4種は次回BZレベルの示唆
- 1回目のBZがテーブル1なら「シナリオH濃厚：3回目のBZでAT濃厚」と出ること
- 行の［削除］と「↩ 取消」の使い分け、過去のAT間は折りたたみで見られること
- カード・テンプレには出ないこと

「出典と注意事項」に1行足す（既存の行は消さない）:

```html
    <p>アイキャッチ・チッチェのセリフ・BZシナリオの出典：<a href="https://1geki.jp/slot/l_mh_sun/57/" target="_blank" rel="noopener">一撃様</a>（<a href="https://1geki.jp/slot/l_mh_sun/48/" target="_blank" rel="noopener">テーブル・レベル・シナリオ</a>）。</p>
```

- 「確定」は使わず「濃厚」で書く（§9-103）。「設定差はありません」の形も使わない（§9-104）
- ガイドの `<style>` は変えない（`tonski-guide.html` とのバイト一致をテストが固定）

### 8-4 `?v=`（§9-107）

`checker-data/mhsunbreak.js?v=20261009` → `?v=20261009-2`

---

## 9. テスト

### 9-1 新規 `tests/mhsunbreak-at-log.verify.mjs`

`node:vm` で `checker-data/mhsunbreak.js` を読み、`config.actions` を直接呼んで検証する
（既存 `tests/mhsunbreak-bz-groups.verify.mjs` の `ctx` / `html` の作り方に倣う）。
最後に `console.log('PASS mhsunbreak AT log: N checks')` の形で件数を出す。

検証する内容（§10 の a〜h に対応）

1. 既定の `atLog` が「開いたAT間1件・`{known:true,prior:0}`・イベント0」
2. `prior:0` で `bzQuest`（t1・miss）→ `bzT1.t1` と `atLog` に1件、BZ番号1、シナリオHの行が出る
3. 福引 miss → `bzQuest`（t2）で番号が **1** のまま（`COUNT_FUKU_AS_CZ=false`）。
   ソース文字列の `COUNT_FUKU_AS_CZ=false` を `true` に差し替えて vm に読ませた場合は **2** になる
4. アイキャッチ ジェイ→バハリ→ジェイ で見出しが `バハリ（緑）：シナリオE以上濃厚` のまま
5. BZ成功／福引成功／`otherAt` のそれぞれで、今のAT間が閉じ、新しいAT間が
   `{known:true,prior:0}` で始まる
6. `atStart` unknown → 両グループのボタンが `disabled` でない・イベント行に番号が出ない・
   シナリオHの行が出ない
7. `atStart` mid n=2 → 次のBZは「2回目以降」だけ押せる（「1回目」が `disabled`、
   `.bz-sub` に `今は3回目`）。`bzQuest` を 1回目グループで呼ぶと `false` が返る
8. `atStart` は BZイベントが1件入ると選択ボタンが消える（それまでは変更可）
9. `atDel` で今のAT間の行が1件消える／範囲外の index は `false`
10. `atLog` の無い旧セーブ・壊れた `atLog`（未知の種類・配列でない・上限超え）を
    `normalizeState` に通して既定に収まり、**2回通して同じ結果**になる
11. 全0状態のテンプレが `docs/specs/mhsunbreak-nana-template-v04.txt`（空欄埋め）と**バイト一致**。
    `atLog` にイベントを入れてもテンプレ・`compactTemplate` の出力が変わらない
12. `card.blocks` / `chart` / `bottom` / `detail` の JSON が `atLog` の有無で変わらない

### 9-2 `tests/mhsunbreak-bz-groups.verify.mjs` の追随

- `tap()` は状態を直接書き換えるのでイベントが増えない。**グループの絞り込みが効いて
  ボタンが `disabled` になる**ため、既存テストはそのままでは意味が変わる。
  §10-g を壊さない形で、既存の検証は `start` を `{known:false}` にしてから行う
  （両グループが押せる・今までと同じ条件）。そのうえで §9-1 の 7 を別テストとして持つ
- 「one success changes exactly two state paths」は `atLog` も変わるので、
  **実測した差分パスをそのまま**期待値にする（勝手にゆるめない。報告に実測値を書く）
- 006e842 / f48130f とのテンプレ・カード比較は**維持**

### 9-3 `tests/new-1005-four-machines.browser.mjs` の追随

- §8-2 のパリピ修正
- 既存の「MH v02 all 26 buttons …」は、先に ［途中から：不明］を押して
  `known:false` にしてから回す（絞り込みで押せなくなるため）。他の検証内容は変えない
- AT間メモの実測を追加
  - BZタブの `.sec-h` が `['テーブル別の結果','AT間メモ','テーブル別 成功率（合算）']`
  - `prior:0` のまま t1 ［失敗］→ イベント行が `BZ1回目 テーブル1（QUEST青）失敗`、
    シナリオHの行が出る、「2回目以降」が `disabled`、`.bz-sub` に `今は2回目`
  - アイキャッチ3回（ジェイ→バハリ→ジェイ）で見出しが バハリ のまま
  - 福引［成功］で次のAT間が始まり、過去のAT間が折りたたみに1件入る
  - ［削除］で行が消える／「↩ 取消」でイベントと回数が一緒に戻る
  - リセット→`atLog` が既定に戻る→「↩ 取消」で戻る
  - リロードしても `atLog` が残る
  - 360px / 390px で `measure(...)`（横はみ出し0・ボタン44px以上）
- 証跡の出力先は `CHECKER_ARTIFACTS` の既定（リポジトリ外）のまま。
  **リポジトリ内に `artifacts/` を作らない**

---

## 10. 検証（すべて実行して結果を報告する）

実行するもの

1. `node --check checker-data/mhsunbreak.js`
2. `node tests/mhsunbreak-at-log.verify.mjs`
3. `node tests/mhsunbreak-bz-groups.verify.mjs`
4. `node tests/mhsunbreak-template-v02.verify.mjs`
5. `node tests/new-1005-four-machines.test.mjs`
6. `node tests/new-1005-public.verify.mjs`
7. `node tests/no-regex-lookbehind.test.mjs`
8. `node tests/wording-noukou.verify.mjs`
9. `node tests/magireco-remove-estimate.verify.mjs`
10. `node test/verify.mjs`
11. `node tests/new-1005-four-machines.browser.mjs`（**パリピを含めて全件PASS**）
12. `git diff --check`（正本ファイルの行末空白以外に指摘が出ないこと）

夢爽の指定した確認（a〜j）

- a. 開始 `prior:0` → BZテーブル1［失敗］→ 「1回目」に計上・シナリオHの行が出る
- b. 福引［失敗］→ BZテーブル2 → **BZ1回目**扱い。`COUNT_FUKU_AS_CZ=true` の単体テストでは2回目
- c. ジェイ→バハリ→ジェイ → 見出しは `バハリ（緑）：シナリオE以上濃厚` のまま
- d. BZ成功・福引成功・［BZ以外でAT］で次のAT間（`known`・`prior:0`）が始まる
- e. ［途中から：不明］→ 両グループ押せる・番号なし・シナリオHの行なし
- f. ［途中から：既にBZ2回］→ 次のBZは「2回目以降」だけ押せる
- g. 取消でイベントと回数が一緒に戻る／リセットで空になる／`atLog` の無い旧データが読める
- h. 全0テンプレが v04 とバイト一致
- i. 360/390px で横はみ出し0・ボタン高44px以上
- j. node テスト全本とブラウザ検証が全件PASS。**各テストのPASS件数を報告する**

---

## 11. 守ること

- 指示書の範囲外のUI変更（配置・文言・色・サイズ）は**実装前にツムギへ確認する**。
  動作の修正・検証の追加は自由
- 受け取った文言は原文のまま使う。整形・言い換え・コメント削除をしない
- 後読み正規表現（`(?<=` `(?<!`）を使わない（§9-106）
- 「確定」ではなく「濃厚」（§9-103）。「設定差はありません」の形を使わない（§9-104）
- 解析値を推測で埋めない。§0 に書いた出典の範囲を超えることを画面・ガイドに書かない
- 共通ファイルが必要になったら**止めて報告**
- commit しない（レビュー後にツムギが指示する）。検証の証跡をリポジトリに残さない
