# パリピ孔明 ST終了画面の追加＋正式公開 実装指示書 v01

発行: ツムギ（2026-10-05）／実装: ミコト／裁可: 夢爽
ブランチ: `feat/paripi-st-end`（main の `c914173` から分岐。ブランチは作成済み）
対象: `paripi`（limited公開中 → 正式公開）

**push・PR作成まで承認済み。マージは夢爽の承認後。**

## 0. 守ってほしい歯止め

- **UI の変更を自分の判断で足さない。見た目を直したくなったら実装せずに報告すること。**
  本書に書いていない項目追加・レイアウト変更もしない（動作の修正・検証の追加は自由）
- 共通ファイル（`checker-engine.js` / `checker-bayes.js`）は**変更しない**
- **入力タブは変更しない。** 通常ゲーム数は連動アプリで確認できる前提のまま、既存の入力欄と
  1/x 表示を維持する。初当りセクションも触らない
- **ガイドに解析外のことを書かない。** 本書と出典ページに載っている範囲だけで書く。
  挙動の推測・期待値・狙い目は書かない（ARCHITECTURE §2「やらないこと」3）
- 表記は §9-103（**個別の示唆は「濃厚」／分類名は「確定演出」**）と §9-94（「設定推測」。
  ベイズ・事後確率などの統計用語を使わない）に従う
- §9-104（**解析に記載のない設定差を「設定差なし」と書かない**）に従う
- 改行は LF。`git diff --check` が無警告であること
- ゲーム画像・実機画像は使わない（出典ページへのリンクのみ）

---

## 1. 出典の照合結果（済・再調査は不要）

出典: https://chonborista.com/slot/yamasa-slot/263531/ の「設定判別 > ST終了画面」
（アンカー `#ST`。2026-10-05 に原本HTMLで照合済み）

原本の記載は全12種。本書の示唆内容は原本と1文字単位で一致している。

| 原本の画像番号 | 原本の画面名 | 原本の示唆内容 |
|---|---|---|
| 画像① | デフォルト① | （デフォルト） |
| 画像② | デフォルト② | （デフォルト） |
| 画像③ | デフォルト③ | （デフォルト） |
| 画像④ | — | 偶数設定期待度UP・弱 |
| 画像⑤ | — | 偶数設定期待度UP・強 |
| 画像⑥ | — | 高設定期待度UP・弱 |
| 画像⑦ | — | 高設定期待度UP・強 |
| 画像⑧ | — | 設定2以上濃厚 |
| 画像⑨ | — | 設定3以上濃厚 |
| 画像⑩ | — | 設定4以上濃厚 |
| 画像⑪ | — | 設定5以上濃厚 |
| 画像⑫ | — | 設定6濃厚 |

原本に画面の名前（絵柄の説明）は無い。画像①②③のボタン表記（看板／青背景／黄背景）は
**夢爽の指定**であり、解析由来ではない。残り9種のボタン表記は示唆内容そのものを使う。

出現率・振り分けの数値は原本に無い。**内蔵しない**（§9-104 の対象）。

---

## 2. `checker-data/paripi.js`：ST終了画面の追加

### 2-1 定義

既存の `COUNTS` の下に追加する。要素は
`[キー, ボタン表記, サブラベル, rank, カード用コード, グループ]`。
**rank は §9-62 の数値。ラベル文字列から強さを推測する実装にしてはならない。**

```js
  const ST_END=[
    ['kanban','看板','デフォルト・ちょんぼりすた画像①',0,'看','def'],
    ['blue','青背景','デフォルト・ちょんぼりすた画像②',0,'青','def'],
    ['yellow','黄背景','デフォルト・ちょんぼりすた画像③',0,'黄','def'],
    ['even1','偶数設定期待度UP・弱','ちょんぼりすた画像④',0,'偶弱','up'],
    ['even2','偶数設定期待度UP・強','ちょんぼりすた画像⑤',0,'偶強','up'],
    ['high1','高設定期待度UP・弱','ちょんぼりすた画像⑥',0,'高弱','up'],
    ['high2','高設定期待度UP・強','ちょんぼりすた画像⑦',0,'高強','up'],
    ['s2','設定2以上濃厚','ちょんぼりすた画像⑧',2,'2','cert'],
    ['s3','設定3以上濃厚','ちょんぼりすた画像⑨',3,'3','cert'],
    ['s4','設定4以上濃厚','ちょんぼりすた画像⑩',4,'4','cert'],
    ['s5','設定5以上濃厚','ちょんぼりすた画像⑪',5,'5','cert'],
    ['s6','設定6濃厚','ちょんぼりすた画像⑫',6,'6','cert']
  ];
  const ST_HINT='ST終了時の画面を記録します。画面の見分け方はガイドからちょんぼりすたの画像で確認できます。';
```

補助関数（`tenten.js` と同じ考え方で置く）:

```js
  const stGroup=g=>ST_END.filter(c=>c[5]===g);
  function stTotal(S){return ST_END.reduce((a,c)=>a+n(S.stEnd,c[0]),0);}
  function certItems(S){return ST_END.filter(c=>c[3]>0).map((c,i)=>({label:c[1],rank:c[3],value:n(S.stEnd,c[0]),order:i}));}
  function certCount(S){return certItems(S).reduce((a,c)=>a+c.value,0);}
  function certTier(S,rank){return certItems(S).filter(c=>c.rank===rank).reduce((a,c)=>a+c.value,0);}
  function bestCert(S){
    const hit=certItems(S).filter(c=>c.value>0).sort((a,b)=>(b.rank-a.rank)||(a.order-b.order))[0];
    return hit?`確定 ${hit.label} ×${hit.value}`:'確定演出 なし';
  }
  function codes(arr,state){return arr.map(c=>[c[4],n(state,c[0])]);}
  function shown(prefix,items){
    const out=items.filter(item=>item[1]>0).map(item=>`${item[0]}×${item[1]}`);
    return `${prefix} ${out.length?out.join('・'):'—'}`;
  }
```

ボタン表記に「設定2以上濃厚」等の示唆内容がそのまま入るため、
**`rankText()` 相当の括弧付き補記は付けない**（「設定6濃厚(6濃厚)」のような二重表記になる）。

### 2-2 state

- `DEF` に `stEnd:Object.fromEntries(ST_END.map(c=>[c[0],0]))` を追加
- `mergeKeys` を `['counts','stEnd']` にする
- `normalizeState` で `stEnd` も `counts` と同じく既定値マージ＋負値を0に丸める。
  旧データ（`stEnd` を持たない保存データ）がそのまま読めること、冪等であることを確認する

### 2-3 示唆タブ（新設・2番目のタブ）

`pages` を `[入力, 示唆, カード]` の3ページにする。

```js
  function pageShisa(ctx){const S=ctx.S;return `<section class="sec">
    <div class="sec-h">ST終了画面<span class="sub">計${stTotal(S)}回</span></div>
    <div class="cgrid">${ST_END.map(c=>ctx.crow('stEnd.'+c[0],c[1],c[2],c[3]>0,v=>ctx.pct(v,stTotal(S)))).join('')}</div>
    <div class="hint">${ST_HINT}</div>
  </section>`;}
```

- ST終了画面は ST が終わるたびに必ずどれか1つが選ばれる排他セクションなので、
  **§9-90 により各行にセクション合計を分母とした割合を表示する**（`ctx.pct` を渡す）
- `hot` は `c[3]>0`（濃厚系5種のみサブラベルを強調色にする）
- 説明は**セクションに1つだけ**。行ごとに繰り返さない

### 2-4 カード

**変更するのは `bottom`（サマリー）と `detail` だけ。`blocks` と `chart` は現状のまま。**

`bottom` を2カラムにする。§9-102 に従い **左5行・右3行の計8行**。
`startY:752` / `rowGap:36` → 最終行 `752+4*36=896`（936以下）。

```js
      bottom:ctx=>{const S=ctx.S;return {title:'サマリー',startY:752,rowGap:36,fontSize:23,columns:[
        {x:70,items:[
          row(bestCert(S),certCount(S),undefined,'#ffc94d'),
          ...COUNTS.map(c=>row(c[1]+' '+countRate(S.games,n(S.counts,c[0])),n(S.counts,c[0]))),
          row('通常回転 '+(S.games||0)+'G',S.games||0),
          row('ST終了画面 計'+stTotal(S)+'回',stTotal(S))
        ]},
        {x:560,items:[
          row(shown('画面',codes(stGroup('def'),S.stEnd)),stGroup('def').reduce((a,c)=>a+n(S.stEnd,c[0]),0)),
          row(shown('期待度',codes(stGroup('up'),S.stEnd)),stGroup('up').reduce((a,c)=>a+n(S.stEnd,c[0]),0)),
          row(shown('濃厚',codes(stGroup('cert'),S.stEnd)),certCount(S))
        ]}
      ]};}
```

**カード1行目は `bestCert()`。濃厚系5種（rank 2/3/4/5/6）だけが対象で、
偶数設定期待度UP・高設定期待度UP・デフォルトは上下関係を持たないため選定対象外。**
これは rank が 0 かどうかだけで決まる（§9-62）。

`detail` に ST終了画面 の節を足す（既存の `initialDetail` の後ろ）:

```js
      detail:ctx=>[initialDetail(ctx.S),
        {title:'ST終了画面',items:ST_END.map(c=>({label:c[1],value:n(ctx.S.stEnd,c[0]),hot:c[3]>0})),percent:true,denominator:stTotal(ctx.S)}
      ],
```

### 2-5 テンプレ

既存の `tplText` の `■初当り` の後ろに節を足す。記録が0の行は出さない。

```
■ST終了画面
看板▶3回(43%)
設定4以上濃厚▶1回(14%)
```

実装（`tplText` 内）:

```js
    const st=stTotal(S);
    const stLines=ST_END.filter(c=>n(S.stEnd,c[0])>0)
      .map(c=>`${c[1]}▶${n(S.stEnd,c[0])}回(${Math.round(100*n(S.stEnd,c[0])/st)}%)`).join('\n');
```

`■ST終了画面` の節は `st>0` のときだけ出す（0回のときは節ごと出さない）。
ヘッダー行（2行目）は既存のまま変更しない。
`nanaCollab:false` なので原文固定のテンプレ制約は無い。

---

## 3. `paripi-checker.html`：正式公開

既存ファイルに対する変更は次の4点のみ。`<style>` の他の1文字も変えない。

1. `<meta name="robots" content="noindex">` の行を**削除**
2. ヘッダーの `hd-links` に 使い方リンクを戻す。
   `<a class="hd-link" href="checkers.html">← 機種選択</a>` の直後に
   `<a class="hd-link" href="paripi-guide.html">使い方</a>` を追加
3. `nav` に示唆タブを追加（入力／示唆／カードの3つ）。
   `<nav id="nav"><button data-p="0" class="on">入力</button><button data-p="1">示唆</button><button data-p="2">カード</button></nav>`
   あわせて `<style>` 内の `nav{...grid-template-columns:repeat(2,1fr);border-top...}` を
   **`repeat(3,1fr)` に変える**。これにより `<style>` は `mogumogu-checker.html` の
   `<style>` と完全一致する（`tenten-checker.html` と同じ状態）
4. JSを変えたので参照クエリを更新: `checker-data/paripi.js?v=20261004` → `?v=20261005`。
   `checker-engine.js?v=20260924` は**変えない**（engine は未変更）

`*-checker.html` にUIバージョン文字列は出さない（AGENTS 作業規約4・§9-86）。

---

## 4. `paripi-guide.html`：新設

`tonski-guide.html` を雛形にする。`<style>` は**1文字も変えずにコピー**し、
`<head>` のメタ・`<header>`・`<main>` の中身だけ機種に合わせて書く。
gtag と adsbygoogle のブロックも雛形どおり残す。
`← TOP` と `ツールを使う →` の2リンク、末尾の `.cta` と `<footer>` も雛形どおり。

- `<title>`: `スマスロパリピ孔明 設定判別カウンターの使い方｜スロット稼働ノート`
- `<h1>`: `スマスロパリピ孔明 設定判別カウンターの使い方`
  （`<title>` は `<h1>` で始まること）
- canonical / og:url: `https://slot-tools.jp/paripi-guide.html`
- og:type: `article`
- `ツールを使う →` は `href="paripi-checker.html" style="margin-left:8px;"`

### 節の構成

**記録対象**

> 入力／示唆／カードの3タブで記録・出力します。記録対象はCZ初当り、ボーナス初当り、
> ST終了画面12種です。

**通常ゲーム数の入れ方**（§9-100）

> 連動アプリで確認した通常時のゲーム数を入れます。メニューの総ゲーム数はAT中の消化分を含むため使いません。
>
> 通常ゲーム数が空欄のあいだは1/xを表示せず、回数だけを記録します。

**初当り** — CZとボーナス初当りの表（出典の数値）

| 設定 | CZ | ボーナス初当り |
|---|---|---|
| 設定1 | 1/213.6 | 1/309.9 |
| 設定2 | 1/207.3 | 1/299.6 |
| 設定3 | 1/199.2 | 1/280.0 |
| 設定4 | 1/188.8 | 1/262.0 |
| 設定5 | 1/179.4 | 1/243.9 |
| 設定6 | 1/171.7 | 1/228.8 |

**示唆タブ（ST終了画面）**

> STが終わるたびに、出た画面を記録します。記録した12種の合計を分母に、各画面の割合を表示します。

12行の表（列は「ボタン表記」「示唆」「出典の画像」）。
画像番号は原本の丸数字をそのまま使う。
出典ページの該当箇所へのリンクを置く:
`<a href="https://chonborista.com/slot/yamasa-slot/263531/#ST" target="_blank" rel="noopener">ちょんぼりすた パチスロ解析様のST終了画面</a>`

| ボタン表記 | 示唆 | 出典の画像 |
|---|---|---|
| 看板 | デフォルト | 画像① |
| 青背景 | デフォルト | 画像② |
| 黄背景 | デフォルト | 画像③ |
| 偶数設定期待度UP・弱 | 偶数設定期待度UP・弱 | 画像④ |
| 偶数設定期待度UP・強 | 偶数設定期待度UP・強 | 画像⑤ |
| 高設定期待度UP・弱 | 高設定期待度UP・弱 | 画像⑥ |
| 高設定期待度UP・強 | 高設定期待度UP・強 | 画像⑦ |
| 設定2以上濃厚 | 設定2以上濃厚 | 画像⑧ |
| 設定3以上濃厚 | 設定3以上濃厚 | 画像⑨ |
| 設定4以上濃厚 | 設定4以上濃厚 | 画像⑩ |
| 設定5以上濃厚 | 設定5以上濃厚 | 画像⑪ |
| 設定6濃厚 | 設定6濃厚 | 画像⑫ |

さらに §9-104 に従って1文入れる:

> 出典に画面の名前の記載がないため、看板・青背景・黄背景の表記はこのツール独自のものです。
> 各画面の出現率の設定差は公表されていません。

**カードとテンプレ**

> ST終了画面のうち、設定2以上濃厚から設定6濃厚までの5種が確定演出です。
> カード1行目は、記録した中で保証設定が最も高いものを表示します。
>
> 偶数設定期待度UP・弱／強と高設定期待度UP・弱／強は上下関係を持たないため、
> カード1行目の選定対象外です。デフォルトの3種も対象外です。
> 詳細カードには12種それぞれの記録と割合を表示します。
> テンプレは初当りとST終了画面の節で出力します。

**扱っていない項目**

> 小役確率は全設定共通です。
>
> CZ当選率・CZ別の成功率・ステージチェンジ・兵法書・上位STの振り分けは、
> 設定差が公表されていないため扱っていません。
>
> 朝一リセット時はボーナス間天井が428Gに短縮されますが、設定の判別には使えないため
> 記録項目に入れていません。

**出典と注意事項**

> 示唆内容・解析数値の出典：[ちょんぼりすた パチスロ解析様](https://chonborista.com/slot/yamasa-slot/263531/)。
>
> 導入直後のため解析が揃っていません。判明したものから追加します。

### 禁止語（テストで固定する）

`濃厚示唆` / `最強` / `6確定` / `設定○以上確定演出` の形 / `ベイズ` / `事後確率` を含めない。

---

## 5. 公開経路

### 5-1 `checkers.html`

`<div class="section-label">スマスロ・AT機</div>` 直後の `checker-list` の
**先頭行**に挿入する（既存の mhsunbreak 行の上）。

```html
    <div class="checker-row"><a class="checker-main" href="paripi-checker.html">スマスロパリピ孔明</a><a class="checker-guide" href="paripi-guide.html">使い方</a></div>
```

### 5-2 `sitemap.xml`

`counter-howto.html` の `<url>` の**前**に2件追加する。

```xml
  <url>
    <loc>https://slot-tools.jp/paripi-checker.html</loc>
    <lastmod>2026-10-05</lastmod>
  </url>
  <url>
    <loc>https://slot-tools.jp/paripi-guide.html</loc>
    <lastmod>2026-10-05</lastmod>
  </url>
```

### 5-3 `index.html` NEW欄（§9-92）

NEW欄の先頭に1行追加する。

```html
    <p>10/5｜<a href="paripi-checker.html">パリピ孔明 設定判別カウンターを公開</a></p>
```

**上限8行**なので、いちばん古い `9/25｜モグモグ風林火山 AT終了画面・くまトロフィーの設定示唆を追加`
の1行を削除する。追加後も `<p>` は8個。

### 5-4 `docs/ARCHITECTURE.md`

機種数を更新する。`25機種` の2箇所（§3 の表と §5 の表）を `26機種` にする。
`21機種` を含む行（§5 の 9/7導入の説明）は**過去の事実なので変えない**。

---

## 6. テスト

### 6-1 新規 `tests/paripi-st-end.verify.mjs`

`tests/new-1005-public.verify.mjs` と同じ書き方（`node tests/paripi-st-end.verify.mjs`
で単体実行し、落ちたら非0で終了）。固定する内容:

1. **出典照合**: `ST_END` 相当の12件の示唆が §1 の表どおりであること。
   `checker-data/paripi.js` を `vm` で読み、示唆タブのHTMLに12件のボタン表記と
   12件の画像番号（①〜⑫）がそれぞれ1回ずつ現れること
2. **rank**: 設定2以上濃厚=2／3以上=3／4以上=4／5以上=5／設定6濃厚=6、残り7種は0。
   判定がラベル文字列に依存しないこと（§9-62）。
   「偶数設定期待度UP・強」等に含まれる数字を rank に拾っていないこと
3. **カード1行目**: 2^12 = 4096通りの0/1の組み合わせすべてで、
   `card.bottom(ctx).columns[0].items[0].text` が
   - 濃厚系5種がすべて0なら `確定演出 なし`
   - そうでなければ rank 最大の濃厚ラベルを含む
   - デフォルト3種・期待度UP4種だけを立てても `確定演出 なし` のまま
4. **サマリー**: 全組み合わせで左5行・右3行の計8行、
   `startY+rowGap*(最大行数-1) === 896` で 936以下
5. **割合の分母**: 示唆タブの `pct` と詳細カードの割合が同じ分母（12種の合計）を使うこと。
   未知キーを混ぜても分母に入らないこと（§9-39）
6. **1/x**: 通常ゲーム数が0のときテンプレ・カードに `1/` が出ないこと、
   `NaN` / `Infinity` が出ないこと
7. **normalizeState**: `stEnd` 無しの旧データが読めること、未知キーが保持されること、
   負値が0に丸まること、冪等であること
8. **公開経路**: `paripi-checker.html` に noindex が無い／`paripi-guide.html` への
   使い方リンクがある／`checkers.html` の スマスロ・AT機 の**先頭**が paripi である／
   `sitemap.xml` に checker と guide の2経路がある／NEW欄に 10/5 の paripi 行があり
   `<p>` が8個である／`?v=20261005` であること
9. **ガイド**: `<style>` が `tonski-guide.html` と完全一致／canonical・og:url／
   `<title>` が `<h1>` で始まる／禁止語を含まない／checker と相互リンク／
   12件の示唆と画像番号が載っている
10. **入力タブ不変**: 入力タブのHTMLと `blocks` / `chart` が main の `c914173` 時点と
    バイト一致すること（`git show c914173:checker-data/paripi.js` と比較）

### 6-2 既存テストの更新

**paripi が取り下げ中であることを前提にした箇所だけを直す。他の機種の期待値は変えない。**

`tests/new-1005-four-machines.test.mjs`:

- `<style>` 比較: paripi も `tenten` と同じく `base`（mogumogu の style そのまま）になる。
  `id==='tenten'?base:...` を `['tenten','paripi'].includes(id)?base:...` にする
- 使い方リンク: `['mhsunbreak','tenten']` に `'paripi'` を加える
- noindex: `['juuou','paripi']` を `['juuou']` にする
- `?v=` マップ: `paripi:'20261004'` を `paripi:'20261005'` にする
- nav が3つになったので、テスト名の「specified nav count」の意味が変わる場合は
  コメントを更新してよい（アサーションの範囲は広げない）

`tests/new-1005-public.verify.mjs`（10/4リリースの監査。**paripi の解放分だけ**直す）:

- sitemap の「取り下げた経路」の期待値から paripi の2件を外し、`juuou` の2件だけにする
- 取り下げ機種のループ `['juuou','paripi']` を `['juuou']` にする。
  成功ログの文言（`held machines 2`）も実数に合わせる
- `25機種` の2箇所チェックを `26機種` にする
- 末尾の「他の機種データは 74f8e03 とバイト一致」の除外リストに `'paripi.js'` を加える
  （コメントに「夢爽裁可の ST終了画面追加のため」と理由を書く）
- `ids=['mhsunbreak','tenten']` の `checkers.html` 先頭2件チェックは、
  先頭が paripi になるので **`.slice(0,2)` を `.slice(1,3)`** に直す
  （10/4 の2機種が paripi の次に並んでいることを引き続き固定する）
- NEW欄の `<p>` 8個と 10/4 の2行のチェックは**そのまま通るはず**。通らない場合は止めて報告

`tests/new-1005-four-machines.browser.mjs` は実ブラウザ検証用。
529行目付近の `['juuou','paripi']`（取り下げ2機種の確認）を `['juuou']` にする。
128行目付近の4機種ループは paripi の `countKey:'cz'` のまま変えない。

### 6-3 実行して全件PASSを確認する

```
node test/verify.mjs
node --test "tests/*.test.mjs" "tests/*.test.js"
node tests/magireco-remove-estimate.verify.mjs
node tests/mhsunbreak-bz-groups.verify.mjs
node tests/mhsunbreak-template-v02.verify.mjs
node tests/new-1005-public.verify.mjs
node tests/wording-noukou.verify.mjs
node tests/paripi-st-end.verify.mjs
```

着手前の基準値: `node --test` が 22 tests / 22 pass / 0 fail、
verify スクリプト5本すべてPASS、`test/verify.mjs` が
「サニティチェック: 全設定OK / 区間分割: 全設定OK」。
**この基準から1件も減らさないこと。** 新規テストで件数が増えるのは良い。

HTML内の module script を抽出した `node --check` と `git diff --check` も実行する。

---

## 7. やってはいけないこと（再掲）

- 入力タブ（通常ゲーム数・初当り）の入力形式を変えない
- `blocks` と `chart` を変えない
- `checker-engine.js` / `checker-bayes.js` を変えない
- 他機種のファイルを触らない
- 出典に無い数値（出現率・振り分け）を内蔵しない
- index.html のNEW欄を8行より増やさない
- 本書に無いUI変更を足さない。直したくなったら実装せずに報告する

## 8. 報告様式

1. §1 の12種の照合結果（一致／不一致の明示）
2. 変更ファイル一覧と1行説明
3. 受け入れ条件の結果（カード1行目5種のみ・サマリー8行/lastY 896・noindexなし・
   一覧/sitemap/NEW欄の掲載・相互リンク・360/390pxの表示・44px）
4. テスト件数（before/after）と全件PASSの証跡
5. コミットSHA
