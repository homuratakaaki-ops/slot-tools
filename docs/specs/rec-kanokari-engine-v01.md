# tools/rec-kanokari｜器の拡張仕様 v0.1（ミコト実装用）

作成：2026-09-25（シオン）
ベース：tools/rec/index.html＝rec89（6f241ea）。これをコピーして tools/rec-kanokari/index.html にする
対象：仕様書 kanokari-spec-v02.md §10 の新規11点（4つ目カウンターは見送り）
原則：本線（tools/rec）は触らない。機種定義 MACHINES は karakuri2・hibireturn・generic を残したまま kanokari を足す（器の回帰確認に使う）

行番号は rec89 のもの。関数名・キー名は既存に合わせる。

---

## 0. コピーと名前

- `tools/rec-kanokari/index.html` ＝ rec89 のコピー
- localStorage のキー：`KEY="slot-tools-rec-kanokari"`（本線と混ざらないように）。`KEY_BROKEN` も同様
- `<title>` と見出しに「かのかり」を足す。noindex は本線と同じ
- 監査ハーネスは本線用なので、この箱には当てない。代わりに §12 の通し操作10本（仕様書）を回す

---

## 1. ストック2本（レンCHANCE／1G恋）

### 定義
```js
stocks:[{key:"ren",label:"レンCHANCE",short:"レン"},{key:"koi",label:"1G恋",short:"1G恋"}],
```

### 状態
- `c.stocks={ren:0,koi:0}`。打ち始めの setup から初期値（任意入力）。`fixSession` で無ければ `{}` から補う
- **SNAP_KEYS（768行）に `"stocks"` と `"stockPhase"` を足す**（取り消しで戻るように）

### 表示
- `renderBadges`（797行）：`d.stocks` があれば、各 stock を `badge` で「レン 2」「1G恋 1」。0でも出す（消化中に0になるのが見えるように）。タップで数値を直す（`askNum`、mark→push("stockFix")）

### 加算（終了時にまとめ）
- `atEndSheet`（1277行）：`hitProp(def,"stockGain")` が true なら、終了シートに数値欄「レンCHANCE獲得数」「1G恋獲得数」（`numInput("")`、空欄＝0）。`doEnd` の検証（`validateEndInputs`）に含める（負値・NaN 拒否）
- `leaveAt`（1252行）の後、値があれば `c.stocks[key]+=n`、`push("stock","ストック獲得：レン+2・1G恋+1　→ レン3／1G恋1")`
- REG の「1G恋獲得」ボタンはその場で `c.stocks.koi++`（`atExtras` の `type:"stockInc"`, `key:"koi"`。mark→push）

### 当選時に開始時の値を保存
- `startHit`（1045行）：`d.stocks` があれば `c.hit.stocksAtStart={...c.stocks}` を保存し、hitStart のログ本文に「（開始時 レン2／1G恋1）」を足す。`ev.stocksAtStart` にも乗せる（集計用）

---

## 2. 1GレンCHANCE のまとめ入力（stockPhase）

### 状態
- `c.stockPhase=true` のとき「1GレンCHANCE」の状態。`c.mode` は `"normal"` のまま、グリッドを差し替える
- 入口：AT終了（`leaveAt`）の最後で、`d.stocks` があり `c.stocks.ren+c.stocks.koi>0` なら `c.stockPhase=true; push("stockPhase","1GレンCHANCE 開始（レン2／1G恋1）")`。**このとき引き戻し区間には入らない**（§9 参照）
- バッジ：先頭を「1GレンCHANCE中」に（本前兆と同じく「通常時」を出さない）

### グリッド
- 定義 `grids.stock:[["stockResult","memo"]]`。`renderGrid` で `c.stockPhase` なら `grids.stock` を使う
- `makeGridButton` に `"stockResult"` → 「結果を入れる」

### 結果シート（`openStockResult()`）
```
1GレンCHANCE の結果
  今のストック：1G恋 1 ／ レンCHANCE 2（1G恋から先に使います）
  [何個目で成功しましたか]  1 / 2 / 3（合計個数までのボタン）  ／ [全部失敗]
  成功のとき：[ALL変換あり]（トグル。残りレンCHANCEを全部1G恋に）
```
- 「n個目で成功」：mark → 消費 n 個（1G恋から先に減らし、足りなければレンから）。最後の1個が 1G恋 なら契機 `"1G恋成功"`、レンなら `"攻略成功"`。ALL変換あり なら `c.stocks.koi+=c.stocks.ren; c.stocks.ren=0`。`c.stockPhase=false`。push("stockResult","1GレンCHANCE 2個目で成功（1G恋1・レン1 消費）　残り レン1／1G恋0（ALL変換：レン1→1G恋）")。続けて `startHit(当選シート, trig)`：種別（かのかりBONUS／エピソード／スペシャル／ななかりDREAM）と攻略キャラを聞く
- 「全部失敗」：mark → 全消費 `c.stocks={ren:0,koi:0}`。`c.stockPhase=false`。push。**引き戻し区間へ**（`enterOnHitEnd` と同じ処理を呼ぶ：`enterZen(0)` 相当）
- 取り消しは op 単位なので、結果入力＋当選開始がまとめて戻る

---

## 3. 攻略人数（c3）の契機加算

### 定義
```js
counter3:{label:"攻略人数",reset:"never",incOnTriggers:["攻略成功","1G恋成功"]},
```
### 実装
- `startHit`（1045行）：`d.counter3.incOnTriggers` があり `trig` が含まれれば `c.c3++`、hitStart のログに「　攻略人数 3」を足す
- 既存の `onHitInStage` の c3 処理とは独立（かのかりは onHitInStage を使わない）

---

## 4. ハートメーター（gauge）

### 定義
```js
gauge:{label:"❤",max:5,maxLabel:"MAX"},
```
- レア役の `ask`：
```js
{key:"weak",label:"弱チャンス目",ask:{key:"gauge",label:"ハートメーター",options:[{l:"1",set:{gauge:1}},{l:"2",set:{gauge:2}},{l:"3",set:{gauge:3}},{l:"4",set:{gauge:4}},{l:"5",set:{gauge:5}},{l:"MAX",set:{gauge:"max"}},{l:"変わらず"}]}},
```
### 状態・表示
- `c.gauge=0`。SNAP_KEYS に `"gauge"`
- `recordRare`（996行）：`ask` の選択肢に `set.gauge` があれば `c.gauge=値`（"max" は `d.gauge.max+1`）。ログ本文に「　❤3」
- `renderBadges`：`d.gauge` があればバッジ「❤3」／MAX なら「❤MAX」（色を変える）。タップで数値を直す
- 有利区間切れ・ボーナス当選で 0（`yuuriReset` と `startHit`）。**変換高確に入ったら0**（extras の「高確開始」に `set:{gauge:0}`）

---

## 5. 引き戻し記録シート（stageSheet・追記型）

### 定義（zenchou の段階に持たせる）
```js
zenchou:{stages:["引き戻し中"],stageIndex:0,endLabel:"引き戻し終了",enterOnHitEnd:{unlessStocks:true},remindAtG:66,
  sheet:{label:"引き戻し記録",groups:[
    {key:"eye",label:"アイキャッチ",options:["白","赤","黒"]},
    {key:"stage0",label:"開始ステージ",options:["部屋と彼女","大学と彼女","街と彼女","専用（ユメカノ後）"]},
    {key:"serif",label:"セリフ演出",multi:true,options:["千鶴","和也","和","小百合","黒セリフ"]},
    {key:"cu33",label:"33G前後",options:["CUあり","CUなし"]},
    {key:"push33",label:"PUSH煽り",options:["あり","なし"]},
    {key:"cu66",label:"66G前後",options:["CUあり","CUなし"]}
  ]}},
```
### 実装
- 段階中のグリッドに `"zenSheet"` ボタン（「引き戻し記録」）。`makeGridButton` に追加
- `openZenSheet()`：`groupSheet(sheet.label, sheet.groups, onDone, {initial:c.zenNote||{}, goLabel:"保存"})`。`multi:true` のグループは複数選択（`groupSheet` に `g.multi` を足す：選択を配列で持つ）
- 保存：mark → `c.zenNote=sel` → push("zenNote","引き戻し記録：白・大学・33G CUなし")。**何度でも開いて上書き**（差分だけログに出せれば良いが、まず全文でよい）
- 段階終了（`zenchouEnd`）と段階中の当選（`startHit`）で、`c.zenNote` をログに含めて `c.zenNote=null`。当否と成功G は自動（当選なら成功G＝実G、終了なら「外れ」）
- SNAP_KEYS に `"zenNote"`

---

## 6. REGのキャラ紹介5枠（slots）

### 定義
```js
atExtras:[
  {type:"slots",label:"キャラ紹介",n:5,
   default:["和也","麻美・白","瑠夏・白","墨・白","千鶴・白"],
   options:["和也","肺魚","麻美・白","麻美・ピンク","麻美・赤","瑠夏・白","瑠夏・ピンク","瑠夏・赤","墨・白","墨・ピンク","墨・赤","千鶴・白","千鶴・ピンク","千鶴・赤","その他"]},
  {type:"stockInc",label:"1G恋獲得",key:"koi"}
]
```
### 実装
- `openExtra`（1525行）に `type:"slots"`：シートに5行「1人目：和也」…（初期値は `default`。当選中に保存済みなら `c.hit.slots`）。各行タップで options の選択肢（`optRow`）。「保存」で `c.hit.slots=[...]`、push("slots","キャラ紹介：和也→麻美・白→瑠夏・赤→墨・白→千鶴・白（3人目を変更）")。once と同じく当選中は上書き
- `summarizeHints` で「キャラ紹介」の内訳に入れる（枠ごとに「3人目：瑠夏・赤」）

---

## 7. 場面で選択肢が変わるアイキャッチ（byState）

### 定義
```js
extras:[
  {type:"select",label:"アイキャッチ",byState:{
    normal:{title:"アイキャッチ（通常時）",groups:[{key:"eye",label:"種類",required:true,options:["白","青・4人","ピンク・2人","劇画調・和也背景"]}]},
    zen:{title:"アイキャッチ（ゲーム数前兆）",groups:[{key:"eye",label:"種類",required:true,options:["千鶴","麻美＋瑠夏","墨＋千鶴","祖母＋祖父＋千鶴"]}]}
  }},
  …
]
```
### 実装
- `openExtra`：`x.byState` があれば、今の状態で選ぶ：`zenIdx()>=0 && !zenIsStage()` → zen、それ以外 → normal。引き戻し中は §5 のシートで聞くのでここでは出さない（`byState.hikimodoshi` は作らない）
- 選んだ groups で `groupSheet`（1グループ必須なので即記録）

---

## 8. 66Gで「そろそろ終了」（remindAtG）

- `checkAutoStage`（1410行）：`z.remindAtG` があり `zenIdx()===0 && c.realG>=z.remindAtG && !c.zenReminded` なら `toast("66G を超えました。引き戻しが終わっていれば「引き戻し終了」を押してください")`、`c.zenReminded=true`、バッジに「66G超」を足す
- 自動終了はしない（`autoEndAtG` は付けない）
- 段階に入るとき `c.zenReminded=false`。SNAP_KEYS に足さなくてよい（表示だけ）

---

## 9. 引き戻し区間の入口条件（unlessStocks）

- `leaveAt`（1252行）・`atEndSheet` の汎用分岐・`czEnd` 失敗：`d.zenchou.enterOnHitEnd` を見ている3箇所（1269・1274・1324行あたり）を共通関数 `enterAfterHit()` にまとめる：
```js
function enterAfterHit(){
  const d=DEF(),c=S.cur,e=d.zenchou&&d.zenchou.enterOnHitEnd;if(!e)return;
  if(typeof e==="object"&&e.unlessStocks&&d.stocks&&(c.stocks.ren+c.stocks.koi)>0){c.stockPhase=true;push("stockPhase","1GレンCHANCE 開始（レン"+c.stocks.ren+"／1G恋"+c.stocks.koi+"）");return}
  c.zenchou=0;c.zenReminded=false;push("zenchou",zenStages()[0]+" 開始");
}
```
- `enterOnHitEnd:true`（からくり・ハイビ）は従来どおり段階へ

---

## 10. 有利区間切れ（yuuriReset）に c3・stocks・gauge

- `yuuriReset`（1220行）の clear 分岐に追加：
```js
else if(k==="c3")c.c3=0;
else if(k==="stocks"&&d.stocks)c.stocks={ren:0,koi:0};
else if(k==="gauge")c.gauge=0;
```
- かのかりの定義：
```js
yuuri:{askOnEnd:[],clear:["c3","stocks","gauge","tags","modeHints"],levels:["有利切れ","有利切れ濃厚"]},
```
- 「有利切れ濃厚」は同じ処理でログの文言だけ変える（`yuuriReset("濃厚")`）。「投資・回収・出力」に2つのボタン

---

## 11. ENDING（phases）と DREAM TIME

### 定義（かのかりBONUS）
```js
{label:"かのかりBONUS",kind:"at",
 stockGain:true,
 phases:{
   ending:{label:"ENDING",grid:[["atx:0","memo"],["hitEnd"]],onEnter:{yuuri:true,ask:{key:"last",label:"開始時のLAST枚数（任意）",type:"num"}},
           afterAt:{hit:"DREAM TIME",trig:"ENDING後"},noRevive:true}
 },
 grid:[["rare","atx:1","atx:2"],["phase:ending","memo","hitEnd"]],
 …}
```
- `phase:ending` ボタン（からくりの `phase:ed` と同じ仕組み）で突入。**`onEnter.yuuri` があれば `yuuriReset("ENDING突入")` を呼ぶ**（既存の phase 遷移処理に1行）。`onEnter.ask` があれば数値を聞いて `c.hit.endingLast` に保存、ログに含める
- `afterAt` で DREAM TIME（`kind:"at"`、`stockGain:true`、終了→ `enterAfterHit()`）へ自動遷移

---

## 12. その他の定義（既存の仕組みで足りるもの）

| 項目 | 使うもの |
|---|---|
| 前兆3段（煽り／ステージ／連続演出） | `zenchou.stages`＋`cutStages:[0]`。連続演出の終了で CU・成否を `outGroups` |
| ヒロインステージ | `stages.options` に入れるだけ |
| 変換高確／超高確／次回超高確!?／高確終了 | `extras` の select（`set:{tag:...}`）。「高確終了」は `tagClear` |
| 小役変換 | `extras` の select。変換ありなら `set:{clearTags:["変換高確","変換超高確"]}` |
| レンカノCHALLENGE の色・延長・最終役 | `hitExtras`（once）＋トグル＋`czEnd.groups` |
| 妄想DT のヒロイン・PUSH | 同上 |
| かのかりBONUS 中の背景・下パネル | `atExtras`（once）＋トグル |
| EP の上部色・開始時虹・ルーレット色 | once＋トグル＋`atEnd.groups` |
| 終了画面の枠・獲得枚数表示 | `atEnd.groups` |
| ななかりDREAM の初期G数 | `hitExtraGroups` の `type:"num"`（当選時） |
| ユメカノモード | `toggle` でタグ ON、手動 OFF |
| 攻略キャラ | `hitExtraGroups`（契機が攻略成功／1G恋成功のときだけ `showWhen`） |
| 液晶G の引き継ぎ | CZ に `keepG:true` |
| 打ち始めの項目 | `setup[]` |

---

## 13. 実装の順序（提案）

1. コピーと KEY 変更、機種 kanokari の空定義（name だけ）→ 起動と本線3機種の回帰
2. §1 ストック・§3 攻略人数・§10 yuuriReset → 定義の当選・終了だけで通し操作1本
3. §2 stockPhase・§9 enterAfterHit → 通し操作2・3本
4. §4 gauge・§7 byState・§12 の通常時定義 → 通し操作1本目の前半
5. §5 stageSheet・§8 remindAtG → 通し操作3本目
6. §6 slots・§11 ENDING → 通し操作5・8本目
7. 仕様書 §12 の10本を全部回す

各段の終わりで、本線3機種（karakuri2・hibireturn・generic）の基本フロー（当選→終了→取り消し）が変わっていないことを確認する。
