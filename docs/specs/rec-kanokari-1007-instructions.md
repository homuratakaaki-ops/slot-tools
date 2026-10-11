# tools/rec-kanokari｜夢爽の実戦メモ（10/7）改善6件 実装指示書

作成：2026-10-07（ツムギ）／実装：ミコト（codex）／レビュー・検証：ツムギ
出典：夢爽の実戦メモ（2026-10-07 決定）
版数：**定義 v0.20 → v0.21　器 v0.16 → v0.17**

## 0. 前提と守ること

- **作業前に最新の `main` を取得する**（§9-79）。作業ブランチ：`fix/rec-kanokari-1007`
- 対象ファイルは次の5つだけ。ほかのファイルは触らない
  1. `tools/rec-kanokari/index.html`（器＋埋め込みの機種定義）
  2. `docs/specs/kanokari-def-v20.js` → **`git mv` で `docs/specs/kanokari-def-v21.js` に改名**して中身を更新
  3. `docs/specs/README.md`（`kanokari-def-v20.js` の参照2箇所を v21 に直す）
  4. `IDEAS.md`（§8 の追記。**新規行の挿入だけ**。全文差し替え・既存行の書き換えは禁止）
  5. （なし）
- **「ありえない入力はできないようにする」は絶対ルール。** 選択肢の無い値・負数・整数以外を記録できる経路を作らない
- **指示書に書いていないUI変更（枠の増減・文字サイズ・配色・並び替え）は実装せず、着手前にツムギへ聞く。** 動作の修正・検証の追加は自由
- 本線 `tools/rec/index.html` と、同じ `MACHINES` にいる `karakuri2` / `hibireturn` / `generic` は**挙動を変えない**。器に足す処理はすべて「定義にその項目があるときだけ効く」形にする
- 器に機種固有の文字列（"スルー"・"変わらず"・"不明"・"和也の部屋" 等）を直書きしない。すべて定義から引く
- `tools/rec-kanokari/index.html` の `kanokari:{` から対応する `}` までは、`docs/specs/kanokari-def-v21.js` の2行目以降と**1バイトも違わない**状態を保つ（検証項目）

### 版数の出し方

- 定義：`kanokari.defVer:"0.21"`。`docs/specs/kanokari-def-v21.js` の1行目を次の形にし、既存の履歴コメント行はそのまま下に残す

```js
// MACHINES.kanokari v0.21（第7弾：スルー回数の表示、前兆ステージの種類、前兆中のセリフ、青セリフ、メーターの既定選択、66Gの警告を液晶基準に）
```

- 器：`const ENGINE_VER="0.17";`
- ヘッダの版数表示が `定義 v0.21　器 v0.17` になること（表示処理は既存のまま。直書きしない）

---

## 1. スルー回数の表示

1GレンCHANCE の連続失敗回数は、すでに `c.renFail` として器にある（バッジ「レン失敗 n」）。
**数え方の仕組みは変えない。** 名前と表示場所と、0に戻す契機を足す。

### 1-1. 定義（名前と0に戻す契機）

```js
  // 1GレンCHANCE のスルー回数（バッジ「スルー n」）。救済抽選（2〜5回で振り分け）の判定に使う
  // 失敗で+1、成功で0。引き戻しを経由したら0（解析：引き戻し時はスルー回数を引き継がない）。有利区間切れでも0
  stockFail:{label:"スルー",resetOnTriggers:["引き戻し成功","レンカノ成功","妄想DT成功","ガチ恋目","最強目","ロングフリーズ","天井","規定G数前兆"]},
```

- `label` を `"レン失敗"` → `"スルー"` に変える。`resetOnTriggers` は変えない
- 引き戻し区間を抜けたときに0へ：`zenchou.onEndByStage` の `3` に `renFail:0` を足す

```js
    onEndByStage:{3:{clearTags:["ユメカノ"],c3:0,keepStage:true,renFail:0}},   // 引き戻し終了：ユメカノOFF、攻略人数0、スルー0
```

- 有利区間切れで0へ：`yuuri.clear` の末尾に `"renFail"` を足す

```js
  yuuri:{askOnEnd:[],clear:["c3","stocks","gauge","tags","modeHints","renChara","renFail"],levels:["有利切れ","有利切れ濃厚"],askMedal:true},
```

### 1-2. 器

**(a) `applyStageEnd(k)`** … `oe.c3` の処理のあとに足す。0に戻す前の値をログに残す

```js
    if(oe.renFail===0&&d.stockFail){if(c.renFail>0)txt+="　"+d.stockFail.label+" "+c.renFail+"→0";c.renFail=0}
```

→ 引き戻し終了のログが `引き戻し終了　攻略人数 0　スルー 2→0` になる。
（スルーが0のときは文字を足さない）

**(b) `yuuriReset`** … `(y.clear||[]).forEach` の中に足す

```js
    else if(k==="renFail")c.renFail=0;
```

**(c) `openStockSet()` のシートに「スルー○回目」** … `groupSheet` の第4引数に `before` を足す

```js
  },{goLabel:"セットを記録",instant:false,before:b2=>{if(d.stockFail)b2.append(mk("div","hint",d.stockFail.label+((c.renFail||0)+1)+"回目"))}});
```

- `○ = (c.renFail||0)+1` ＝ **いま入れようとしているセットが何回目のスルーか**。1セット目は「スルー1回目」
- `before` を渡すと `instant` が立たなくなるが、このシートは元から `instant:false`・確定ボタンありなので挙動は変わらない

**(d) 各セットのログ末尾に「（スルー○）」** … `openStockSet()` の `record()` 内。
`c.renFail` を更新する**前**に番号を控え、成功・失敗とも同じ番号を出す

```js
    const record=()=>{
      mark();c.stocks[key]--;c.stockPhase=success?false:{used:n};
      const thru=d.stockFail?(c.renFail||0)+1:null;   // このセットのスルー番号（シートに出した値と同じ）
      if(d.stockFail)c.renFail=success?0:(c.renFail||0)+1;
      c.realG=n*d.stockGPerSet+(success?(d.stockSuccessOffset||0):0);c.lcdG=0;c._steps=[];
      if(success)c.pendingHit={trig:key==="koi"?"1G恋成功":"攻略成功"};
      push("stockResult","1GレンCHANCE セット"+n+(key==="koi"?"（1G恋）":"")+"："+sel.g1+(sel.g2!=null?"→"+sel.g2:"")+" "+(success?"成功":"失敗")+(thru!=null?"（"+d.stockFail.label+thru+"）":""),{sel,setNumber:n,thru});
    };
```

→ 失敗→失敗→成功なら
`…失敗（スルー1）` / `…失敗（スルー2）` / `…成功（スルー3）`、バッジは 1→2→0。

**(e) 器に残っている「失敗連続」の直書きを定義から引く形に直す**（`openStockResult()`＝perSet でない経路。かのかりでは使わないが文言を統一する）

- `"（失敗連続 "+c.renFail+" のあと成功）"` → `"（"+d.stockFail.label+c.renFail+" のあと成功）"`
- `"　失敗連続 "+c.renFail` → `"　"+d.stockFail.label+" "+c.renFail`

**(f) バッジの修正シートのエラー文** … `renderBadges` のスルーのバッジ

- `"失敗回数は0以上の整数で入れてください"` → `d.stockFail.label+"の回数は0以上の整数で入れてください"`

---

## 2. 前兆ステージの種類（和也の部屋／ヒ・ミ・ツ恋心／夜と彼女）

いまは「前兆」シートから「前兆ステージ」へ進むと、ステージ表示が段階名の `前兆ステージ` のままで
種類が残らない（ステージのシートから `和也の部屋` を選んで入ったときだけ種類が残る）。
**前兆シートから入ったときに種類を聞く。**

### 2-1. 定義

**(a) ステージ名を実機表記に合わせる**（§9-64）。`stages.options` の `ヒミツ恋ゴコロ` を `ヒ・ミ・ツ恋心` に変える。
`h` / `tone` / `enterZen` / `askAfter` は変えない

```js
             {l:"ヒ・ミ・ツ恋心",h:"前兆",tone:"d",enterZen:1,askAfter:"アイキャッチ"},
```

**(b) `zenchou` に種類を聞く定義を足す**（`sheet:` の前、`backTo` の次あたり）

```js
    // 前兆シートから「前兆ステージ」へ入ったときに、どの前兆ステージかを聞く（ステージのシートから入ったときは選び済みなので聞かない）
    // options は stages.options の前兆ステージ（enterZen:1）と同じ文字列にそろえる。片方だけ直さないこと
    stageTypeAsk:{forStage:1,title:"前兆ステージの種類",label:"前兆ステージ",key:"ztype",
      options:["和也の部屋","ヒ・ミ・ツ恋心","夜と彼女","海と彼女"]},
```

### 2-2. 器

**(a) 新しい関数**（`openZenchou` の下に置く）

```js
// 前兆ステージに入ったとき、どの前兆ステージかを聞く（定義 zenchou.stageTypeAsk）。
// 前兆シートから入った場合だけ。ステージのシートから入った場合（openStage）は選び済みなので呼ばない。
// この選択ではアイキャッチ（askAfter）を呼ばない：前兆中はアイキャッチを記録しない（夢爽 10/7 決定）
function askZenStageType(i){
  const d=DEF(),c=S.cur,a=d.zenchou&&d.zenchou.stageTypeAsk;
  if(!a||a.forStage!==i||zenIdx()!==i)return;
  const opId=c.events.length?c.events[c.events.length-1].op:null;   // 前兆ステージ開始の op に相乗りさせる（取り消しは1回）
  groupSheet(a.title,[{key:a.key,label:a.label,options:a.options,required:true}],sel=>{
    c.stage=sel[a.key];
    push("stage",a.label+"："+sel[a.key],{sel,op:opId});
    closeSheet();
  },{instant:true});
}
```

**(b) `openZenchou()` の「次へ」の呼び出しだけに足す**

```js
    if(items.length){b.append(mk("div","lbl","次へ"));b.append(optRow(items,it=>{closeSheet();enterZen(it.i);askZenStageType(it.i)},items.length>=3?"q4":""))}
```

- ほかの `enterZen` の呼び出し（`openStage`・`applyHints` の `enterZen`・`backTo` で段階を戻す経路）には**足さない**
- シートを閉じて選ばなかった場合はステージ表示が `前兆ステージ` のまま。止めない（記録を強制しない）
- バッジは先頭が `前兆ステージ`、その隣にステージ（`和也の部屋` 等）が出る。ログは
  `前兆ステージ` → `前兆ステージ：和也の部屋` の2行で、取り消しは1回で両方戻る

---

## 3. 前兆ステージ中のセリフ（アイキャッチ枠と差し替え）

夢爽の裁可：**前兆中のグリッドはアイキャッチ枠をセリフに差し替える**（枠を増やさない＝スクロールを増やさない）。

### 定義のみ（器の変更なし）

`grids.zen` の `extra:1`（アイキャッチ）を `extra:2`（セリフ）に変え、コメントも直す

```js
    zen:[["rare:weak","zenchou","hit"],["rare","extra:2","memo"]],          // 前兆中（引き戻し以外）。3枠目はセリフ（前兆中はアイキャッチを聞かない）。ステージはバッジタップで
```

- `extras` の添字は変えない（0 小役変換・示唆／1 アイキャッチ／2 セリフ／3 ユメカノ／4 終了画面の枠）
- 前兆中のアイキャッチは、ステージのバッジ→ステージのシート経由（`askAfter`）では従来どおり開く。グリッドからは入力できなくなる

---

## 4. セリフの色（青セリフ）

`extras` の添字2（セリフ）に、キャラと成立役の間に色を足す。流れは**キャラ→色→成立役→センチメートル**。

```js
    {type:"select",label:"セリフ",title:"セリフ演出",groups:[
      {key:"who",label:"キャラ",required:true,options:["千鶴","和也","和","小百合","黒セリフ","その他"]},
      {key:"color",label:"色",options:["白","青"]},   // 青セリフの区別。任意（分からなければ入れない）
      {key:"role",label:"成立役",logParen:true,options:["ハズレ","リプレイ","ベル","弱チャンス目","チャンス目","強チャンス目","ガチ恋目","最強目","不明"]},   // ログは末尾に「（成立役：…）」で付ける
      {key:"cm",label:"センチメートル",options:["44cm","55cm","66cm"]}
    ]},
```

- 器の変更なし（`openExtra` の汎用シート・`selText`・`logParen` のまま）
- ログは `セリフ：千鶴、青（成立役：チャンス目）`。色を入れなければ従来どおり `セリフ：千鶴（成立役：…）`
- 設定示唆のまとめでは、既存の `hintsFromEv`（extra の sel を全部拾う）により「セリフ」の内訳に 白／青 の件数が出る。**ここは既存処理のままで、足さない**
- `黒セリフ` はキャラ側に残す（実機の呼び方が確定していないため、今回は動かさない）

---

## 5. メーターの既定選択（朝イチ＝不明／満タン待機＝変わらず）

夢爽の裁可：**場面で分ける。**

| 場面 | 既定 | 動き |
|---|---|---|
| 満タン（MAX）で待機中 | 変わらず | レア役の種類を押した時点で記録して閉じる（**1タップ**）。違っていたら「元に戻す」かメーターのバッジで直す |
| 朝イチでメーターが分からないうち | 不明 | 既定を光らせるだけ。押して記録（**2タップ**・選び直せる） |
| それ以外 | なし | 従来どおり |

### 5-1. 定義

**(a) レア役の ask に「不明」を足す**（`weak` と `chance` の両方。`変わらず` の後ろ）

```js
...{l:"MAX",set:{gauge:"max",tag:"変換高確",until:"manual",waitIfZen:"MAX待機"}},{l:"変わらず"},{l:"不明"}]}},
```

**(b) `gauge` に既定選択の定義を足す**

```js
  // §4。当選中はバッジを出さない
  // askDefault：レア役シートのメーターの既定選択。満タン（MAX）で待機中は「変わらず」で即記録（1タップ）、
  //   朝イチでメーターが分からないうちは「不明」を光らせるだけ（選び直せる）
  // unknownWhen：打ち始めで「朝イチ」を選び、メーターを空欄にしたときだけ「分からない」状態で始める
  gauge:{label:"❤",max:5,maxLabel:"MAX",hideInHit:true,
    askDefault:{full:{value:"変わらず",instant:true},unknown:{value:"不明",instant:false}},
    unknownWhen:{setupKey:"stage0",value:"朝イチ",gaugeBlank:true}},
```

### 5-2. 器

**(a) 状態 `c.gaugeUnknown`（真偽値）を足す**

- `SNAP_KEYS` の末尾に `"gaugeUnknown"` を足す（§9-68：取り消しで一緒に戻る）
- `fixSession(c)`：`if(d.gauge&&typeof c.gaugeUnknown!=="boolean")c.gaugeUnknown=false;`（旧データ・旧JSONは false）
- 打ち始め（`S.cur=` のあと、`if(d.gauge)S.cur.gauge=setup.gauge||0;` の直後）

```js
  if(d.gauge&&d.gauge.unknownWhen){const u=d.gauge.unknownWhen;S.cur.gaugeUnknown=setup[u.setupKey]===u.value&&(!u.gaugeBlank||setup.gauge==null)}
```

- **メーターの値が確定したら false にする。** 次の4箇所すべてで落とす（1箇所でも漏らすと「不明」が残り続ける）
  1. `setGauge(v)`：数値／`"max"` を入れたとき
  2. メーターのバッジの修正（`push("gaugeFix",...)` の経路）
  3. 当選に入ったときの `hitStartClear` のメーター0と、その `else` の `c.gauge=0`
  4. `yuuriReset` の `k==="gauge"`

**(b) 既定を決める関数**（`rareSheetGaugeOptions` の近くに置く）

```js
// v0.17/器: レア役シートのメーターの既定選択（定義 gauge.askDefault）。
// 満タンで待機中＝即記録、メーターが分からないうち＝光らせるだけ。どちらでもなければ既定なし
function gaugeAskDefault(){
  const d=DEF(),c=S.cur,a=d.gauge&&d.gauge.askDefault;if(!a)return null;
  if(a.full&&c.gauge>d.gauge.max)return a.full;
  if(a.unknown&&c.gaugeUnknown)return a.unknown;
  return null;
}
```

**(c) `openRareOnePage()` の ask の分岐**

```js
      const ask=(!c.hit&&it.r.ask)?it.r.ask:null;     // 当選中は ask を出さない
      if(!ask){closeSheet();recordRare(it.r,false);return}   // ask が無い種類は即記録
      const dflt=(ask.key==="gauge")?gaugeAskDefault():null;
      const idx=dflt?(ask.options||[]).findIndex(o=>((o&&o.l!=null)?o.l:o)===dflt.value):-1;
      if(idx>=0&&dflt.instant){const o=ask.options[idx];closeSheet();recordRare(it.r,false,(o&&o.l!=null)?o.l:o,o&&o.set);return}
      askWrap.append(mk("div","lbl",ask.label));
      const row=optRow(ask.options,o=>{
        closeSheet();recordRare(it.r,false,(o&&o.l!=null)?o.l:o,o&&o.set);
      },"q4");
      if(idx>=0&&row.children[idx])row.children[idx].classList.add("on");   // 既定を光らせるだけ（押して記録）
      askWrap.append(row);
```

- `optRow` は items と同じ順・同じ数のボタンを返すので、添字で対応させる（文字列一致で探さない）
- 「不明」「変わらず」を記録してもメーターの値は動かない（`set` が無い）。`c.gaugeUnknown` も変えない
- `rareSheetGaugeOptions()`（定義 `rareSheetGauge` 用）はかのかりでは使わない。**触らない**

---

## 6. 引き戻し区間の66Gの警告を液晶ゲーム数基準にする

いまは実Gで判定している。引き戻し区間は液晶が0から数え直すので、液晶基準に変える。

### 6-1. 定義

`zenchou` の `remindAtG:66` の隣に `remindOn:"lcd"` を足す

```js
    enterOnHitEnd:{unlessStocks:true,stage:3},endLabel:"引き戻し終了",remindAtG:66,remindOn:"lcd",   // §8 §9。66Gは液晶ゲーム数で見る
```

### 6-2. 器 `checkAutoStage()`

```js
  if(z.remindAtG!=null&&inHikimodoshi()){
    const g=(z.remindOn==="lcd"&&d.lcdG)?(c.lcdG||0):c.realG;
    if(g>=z.remindAtG&&!c.zenReminded){
      c.zenReminded=true;save();renderBadges();
      toast(z.remindAtG+"G を超えました。引き戻しが終わっていれば「引き戻し終了」を押してください");
    }
  }
```

- バッジ（`66G超`）とトーストの文言は変えない
- `remindOn` が無い機種（からくり2・ハイビ）は従来どおり実G基準

---

## 7. 検証（すべて通ってから push）

1. `node --check`（HTML内の module script を抽出）／`node test/verify.mjs`／`git diff --check`
2. `docs/specs/kanokari-def-v21.js` の2行目以降と `index.html` の `kanokari:{…}` が**1バイトも違わない**こと（差分0を出力で示す）
3. ヘッダの版数が `定義 v0.21　器 v0.17`
4. **実ブラウザ（headless Chrome・CDP）で 360×530 と 390×844 の両方**を確認する。項目：
   - スルー：失敗→失敗→成功で バッジ 1→2→0。ログに `（スルー1）（スルー2）（スルー3）`。1GレンCHANCE のシートに `スルー○回目` が出る
   - スルー：引き戻し区間を経由（全部失敗→引き戻し中→引き戻し終了）で0に戻り、`引き戻し終了　…　スルー n→0` が残る。次の1GレンCHANCE は「スルー1回目」から
   - スルー：有利区間切れで0に戻る
   - 前兆シート→前兆ステージで種類を聞かれ、3種類＋海と彼女が選べる。ログに `前兆ステージ：和也の部屋` が残り、バッジにステージが出る。取り消し1回で両方戻る
   - 前兆シートからの種類選択でアイキャッチのシートが開かないこと
   - 前兆中のグリッド3枠目がセリフで、前兆中にセリフが記録できること（アイキャッチ枠が無いこと）
   - セリフで青が選べ、ログが `セリフ：千鶴、青（成立役：チャンス目）` になること。色を入れないときの従来のログも維持
   - メーター：満タン待機中（MAX＋変換高確）はレア役の種類を押した時点で `（メーターは何個になったか：変わらず）` まで付いて記録・閉じる（1タップ）
   - メーター：打ち始めで「朝イチ」＋メーター空欄のとき、「不明」が光った状態で出て、押して記録（2タップ）。別の値を選び直せる。数値／MAX を1度入れたら以降は光らない
   - 66G：引き戻し区間で**液晶**66Gでトーストとバッジが出る（実Gが66を超えていても液晶が66未満なら出ない）
   - 360×530・390×844 でグリッドの枠数・行数が増えていないこと（**スクロールが増えたら実装を止めて報告**）
   - セリフシートは1項目増える。先頭行の位置と内部スクロール量を実測して報告する
5. **旧形式JSON（10/3相当・定義 v0.20 で記録したもの）の取り込み**で、設定示唆のまとめ・エンベロープ書き出し・振り返りノート表示が **HEAD版と1バイトも違わない**こと。進行中セッション（`cur`）の復元でも落ちないこと
6. からくり2・ハイビ・generic の回帰：打ち始め→レア役→当選→終了 の通し1本が従来どおり動くこと（`remindOn`・`stageTypeAsk`・`askDefault`・`renFail` が無い機種で新処理が発火しないこと）

## 8. IDEAS.md の追記

`### 夢爽の実戦メモ（10/3）：改善5件（定義 v0.20・器 v0.16）` のブロックの**直後**（その節の最後の行と `---` の間）に、
`### 夢爽の実戦メモ（10/7）：改善6件（定義 v0.21・器 v0.17）` の節を**挿入する**。
既存行の書き換え・並べ替え・全文差し替えはしない（複数チャットが同じファイルを触るため）。
内容は6件のチェック済み一覧＋判断の記録（スルーを0に戻す契機／前兆のアイキャッチ枠をセリフに差し替えた理由／メーターを場面で分けた理由／ステージ名を実機表記にした件）＋検証結果。
同じ節の `定義：docs/specs/kanokari-def-v19.js` という古い参照行は**今回は触らない**（別の追記で直す）。

## 9. コミット・PR

- コミット名義：**ミコト**（`Mikoto <codex@slot-tools.local>`）
- コミットメッセージ：`fix(rec-kanokari): 夢爽の実戦メモ（10/7）改善6件（定義 v0.21・器 v0.17）` ＋ 本文に変更点の表と検証結果
- 検証がすべて通ったら push と PR 作成まで（マージは夢爽の承認後）
- `tools/rec-kanokari/` は noindex の非インデックス公開のまま。**導線・sitemap は変更しない**
