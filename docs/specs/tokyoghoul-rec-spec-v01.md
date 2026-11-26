# tools/rec 東京喰種（MACHINES.tokyoghoul）仕様書 v0.1

- 作成：シオン／2026-11-26（JST）
- 根拠：骨格書 `docs/specs/tokyoghoul-rec-skeleton-v03.md`（夢爽裁可 2026-11-26 20:01）。本書と骨格書が食い違ったら本書が正
- 基準コード：main `8d041ce` の `tools/rec/index.html`（関数名は同コミット）
- 実装：ミコト／レビュー：ツムギ／検収：ネネ（§9 の作った担当と別の担当が検収するルール）

---

## 0. 絶対ルール

1. **既存の `generic` / `karakuri2` / `hibireturn` の挙動を1つも変えない。** 共通部分に足す処理は、すべて「定義にその項目があるときだけ効く」形にする（E1〜E12）
2. 共通部分に機種固有の文字列（"有馬"・"喰種対決"・"死神後" など）を直書きしない。すべて定義から引く
3. ありえない入力は記録できないようにする：数値欄は整数・0以上のみ。読めない値・負数は toast で止め、保存しない。未入力は `null`（0と区別）
4. 一次データだけ保存する。差枚・回数・累計などの導出値は保存しない（ノート用の文字ログ出力時に計算して書くのは可）
5. 店舗連動（acct*）、収支計算 `profit()`、`toChecker()`／`sendToChecker()`、kado-note、`checker-data/tokyo_ghoul.js` には触らない
6. 仕様書に書いていないUI変更（配色・文字サイズ・既存ボタンの並び替え）はしない。迷ったらツムギに聞く

---

## 1. 機種定義 `MACHINES.tokyoghoul`

`hibireturn` の後ろに追加する。表示名は既存記録と同じ「東京喰種」（着席画面で手入力した名前が一致すると自動でこの定義が選ばれる既存動作を利用）。

```js
,tokyoghoul:{
  name:"東京喰種",
  lcdG:true,
  // 着席時の項目（値はキー、表示は optionLabels）
  setup:[
    {key:"c3",label:"CZスルー回数",type:"num"},
    {key:"seatState",label:"着席時の状況",type:"select",
      options:["resetConfirmed","resetGuess","keepConfirmed","unknown"],
      optionLabels:{resetConfirmed:"リセット確認",resetGuess:"リセット推定",keepConfirmed:"据え置き確認",unknown:"不明"}},
    {key:"lastHit",label:"前回の当選",type:"select",
      options:["czFail","atEnd","judgeFail","unknown"],
      optionLabels:{czFail:"CZ失敗",atEnd:"AT終了",judgeFail:"有馬失敗",unknown:"不明"}}
  ],
  counter3:{label:"CZスルー",reset:"at",incOnCzFail:["レミニセンス","大喰いの利世"]},
  noteSeparate:true,          // E3：メモを本文に連結せず ev.note に分ける
  hitCredit:true,             // E4：当選シートにクレジット欄
  rares:[],
  lcdAdd:null,
  stages:null,
  zenchou:null,
  hitTriggers:["規定G数","レア役","天井","引き戻し","不明"],
  hits:[
    {label:"レミニセンス",kind:"cz",grid:[["hitEnd","memo"]],
      fixedEndG:[{real:6,lcd:0}],fixedEndGHint:"CZ後は実6／液晶0が基本です。ずれていれば直してください。",
      czEnd:{groups:[CZ_CARD_GROUP],successToAt:"AT",successSheet:true,successOneOp:true,credit:true}},
    {label:"大喰いの利世",kind:"cz",grid:[["hitEnd","memo"]],
      fixedEndG:[{real:6,lcd:0}],fixedEndGHint:"（同上）",
      czEnd:{groups:[CZ_CARD_GROUP],successToAt:"AT",successSheet:true,successOneOp:true,credit:true}},
    {label:"エピソードボーナス",kind:"at",grid:[["memo","hitEnd"]],
      atStart:null,askGOnEnd:false,revive:null,
      atEnd:{groups:[],credit:true},
      afterAt:{hit:"AT",trig:"EP後"}},
    {label:"AT直撃",kind:"at",enter:"AT"},
    {label:"AT",kind:"at",hidden:true,atStart:null,revive:null,
      atEnd:{note:"終了画面とトロフィーを確認してからBETしてください",
        numsBefore:[{key:"shownGain",label:"画面の獲得枚数"}],
        groups:[AT_SCREEN_GROUP,TROPHY_GROUP],
        credit:true,
        numsAfter:[{key:"totalG",label:"総回転数",kind:"totalG"}]},
      ticket:{label:"有馬権利",autoBy:{extra:"喰種対決",result:"勝利",match:{opp:"有馬貴将"},count:1}},
      afterAtWithTicket:{hit:"有馬ジャッジメント",trig:"有馬勝利"},
      phases:{ed:{label:"エンディング",cards:true,noRevive:true,
        grid:[["edCards","memo"],["hitEnd"]],
        afterAt:{hit:"有馬ジャッジメント",trig:"エンディング後"}}},
      grid:[["atx:0","phase:ed","memo"],["hitEnd"]]},
    {label:"有馬ジャッジメント",kind:"cz",hidden:true,grid:[["hitEnd","memo"]],
      fixedEndG:[{real:6,lcd:0}],fixedEndGHint:"ジャッジメント後は実6／液晶0が基本です。ずれていれば直してください。",
      czEnd:{groups:[],successToAt:"CCGの死神",successSheet:true,successOneOp:true,credit:true,failMark:"有馬失敗後"}},
    {label:"CCGの死神",kind:"at",hidden:true,grid:[["memo","hitEnd"]],
      atStart:null,askGOnEnd:false,revive:null,atEnd:{groups:[]},
      afterAt:{hit:"AT",trig:"死神後"}}
  ],
  atGain:{fromTrig:{"死神後":"有馬ジャッジメント"},excludeFirstHitTrigs:["死神後"]},   // E11
  atExtras:[TAISEN_EXTRA],
  extras:[SHISA_MENU],
  edCards:ED_CARDS_DEF,       // E10
  parallel:[],
  czEndStd:{groups:[]},
  rareCounts:false,
  grids:{
    normal:[["extra:0","hit","memo"],["counter3"]],
    cz:[["hitEnd","memo"]],
    at:[["hitEnd","memo"]]
  }
}
```

上の大文字の定数は、定義の中に**そのまま展開して書く**（別変数にしない。定義を1か所で読めるようにするため）。中身は §2。

- `checker` は**付けない**（付けると `toChecker()` のからくり用対応表で送られる）
- `yuuri` は付けない（今回の要望外）

---

## 2. 選択肢データ（キーは確定。表示名は後で直してよい）

選択肢オブジェクトは既存形式 `{l:表示, h:ヒント}` に **`k:キー`** を足す（E1）。

### 2-1. CZ_CARD_GROUP（CZ失敗の1枚絵・任意）
```js
{key:"czCard",label:"CZ終了画面（1枚絵）",options:[
  {k:"kaneki",l:"金木研",h:"デフォルト"},
  {k:"touka",l:"霧嶋董香",h:"モードB以上期待度UP"},{k:"hinami",l:"笛口雛実",h:"モードB以上期待度UP"},
  {k:"amon",l:"亜門鋼太朗",h:"モードB以上濃厚"},
  {k:"mado",l:"真戸呉緒",h:"モードC以上濃厚"},
  {k:"kanekiG",l:"金木研（喰種）",h:"チャンスモード以上濃厚"},{k:"toukaG",l:"霧嶋董香（喰種）",h:"チャンスモード以上濃厚"},
  {k:"tsukiyama",l:"月山習",h:"天国準備モード以上濃厚"},
  {k:"rize",l:"神代利世",h:"天国モード濃厚"},
  {k:"suzuya",l:"鈴屋什造",h:"偶数設定濃厚"},{k:"owl",l:"梟",h:"設定4以上濃厚"},{k:"arima",l:"有馬貴将",h:"設定6濃厚"}
]}
```
出典：既存チェッカー参照タブ「CZ終了画面のカード（モード示唆）」＋ CZ_CARDS。金木研①／②はデフォルトで同じなので1つにまとめる。

### 2-2. AT_SCREEN_GROUP（AT終了画面・任意）
既存チェッカー `SCREENS` の8種。キーは同じ（`kaneki`／`amonMado`／`suzuyaShinohara`／`rize`／`fueguchi`／`yomoItoriUta`／`kanekiKirishima`／`anteiku`）。表示・ヒントも同じ。

### 2-3. TROPHY_GROUP（ナミちゃんトロフィー・任意）
```js
{key:"trophy",label:"ナミちゃんトロフィー",options:[
  {k:"none",l:"なし"},{k:"unseen",l:"見逃した"},
  {k:"bronze",l:"銅",h:"設定2以上濃厚"},{k:"silver",l:"銀",h:"設定3以上濃厚"},{k:"gold",l:"金",h:"設定4以上濃厚"},
  {k:"ghoul",l:"喰柄",h:"設定5以上濃厚"},{k:"rainbow",l:"虹",h:"設定6濃厚"},{k:"black",l:"黒",h:"次回トロフィー出現濃厚"}
]}
```

### 2-4. TAISEN_EXTRA（喰種対決・AT中）
```js
{label:"喰種対決",title:"喰種対決",
  groups:[
    {key:"opp",label:"相手",required:true,options:[
      {k:"shachi",l:"鯱"},{k:"ayato",l:"霧嶋絢都"},{k:"yamori",l:"ヤモリ"},{k:"tokuto",l:"特等ら"},
      {k:"amon",l:"亜門"},{k:"arima",l:"有馬貴将"},{k:"unknown",l:"不明"}]},
    {key:"result",label:"勝敗",required:true,options:[{k:"win",l:"勝利"},{k:"lose",l:"敗北"}]}
  ],
  nums:[{key:"bites",label:"BITES獲得枚数",showWhen:{key:"result",in:["勝利"]}}],
  memo:true}
```

### 2-5. SHISA_MENU（通常時の「示唆」・E6）
```js
{type:"menu",label:"示唆",title:"示唆",memo:true,items:[
  {kind:"eyecatch",label:"アイキャッチ",groups:[{key:"v",label:"アイキャッチ",required:true,options:[/* 2-5-1 */]}]},
  {kind:"inviteG",label:"招待状（規定G数示唆）",groups:[{key:"v",label:"招待状",required:true,options:[/* 2-5-2 */]}]},
  {kind:"inviteSet",label:"招待状（設定示唆）",groups:[{key:"v",label:"招待状",required:true,options:[/* 2-5-3 */]}]},
  {kind:"zenchouG",label:"ゲーム数前兆",groups:[{key:"v",label:"ゲーム数前兆",required:true,options:[/* 2-5-4 */]}]}
]}
```
各選択肢のキー・表示・ヒントは骨格書 v0.3 §6 の表のとおり（2-5-1 アイキャッチ10、2-5-2 規定G数示唆9、2-5-3 設定示唆7＝既存 INVITES のキー、2-5-4 ゲーム数前兆14）。ヒントはちょんぼりすた優先の表記。

### 2-6. ED_CARDS_DEF（EDカード14分類・E10）
キー・表示・ヒントは既存チェッカー `ED_CARDS` と同じ。折りたたみのキャラ名（同じ分類に同姓がいるときだけ名前を付ける）：

| キー | 表示 | キャラ名 |
|---|---|---|
| edWhiteW | 白・弱 | 金木・霧嶋・笛口・永近・西尾・月山 |
| edWhiteS | 白・強 | 芳村・四方・ウタ・イトリ・古間・入見 |
| edBlueW | 青・弱 | 金木・霧嶋・笛口・ナキ・西尾・月山 |
| edBlueS | 青・強 | 亜門・篠原・滝澤・真戸（暁）・真戸（呉緒）・丸手 |
| edRedW | 赤・弱 | 金木・霧嶋（董香）・ヤモリ・霧嶋（絢都） |
| edRedS | 赤・強 | 鯱・亜門・篠原・鈴屋 |
| edBrz1〜4 | 銅・鈴屋什造／高槻泉／梟／エト | （名前は表示名に含むので折りたたみなし） |
| edSilver・edGold4・edGold5・edRainbow | 銀・金木研／金・神代利世／金・隻眼の梟／虹・有馬貴将 | （同上） |

```js
edCards:{cats:[{k:"edWhiteW",l:"白・弱",h:"奇数設定示唆(弱)",names:"金木・霧嶋・笛口・永近・西尾・月山"}, /* …14件 */]}
```

---

## 3. 共通部分に足す機能（E1〜E12）

すべて「定義に指定があるときだけ」効く。指定がない機種では、生成される記録行・画面・保存データが今と1バイトも変わらないこと（§8 の回帰テストで確認）。

### E1 選択肢のキー（`k`）
- `groupSheet()`・`atEndSheet()` の選択肢処理で、選んだ選択肢に `k` があれば `sel["_key_"+g.key]=o.k` を入れ、外したら消す
- 記録行に `keys:{グループkey:選択肢k}` を入れる（`_key_` から作る）。`k` を持たない機種では `keys` を作らない

### E2 シートの数値欄（`nums`／`numsBefore`／`numsAfter`）
- 部品関数 `numFields(b,defs,sel)` を新設：既存 `numInput()` で欄を作り、`showWhen` は既存 `reeval` と同じ規則で出し入れ（隠れたら値を消す）
- 確定時に検証：空欄＝`null`、整数かつ0以上のみ通す。だめなら toast「◯◯は0以上の整数で入れてください」で止める
- `kind:"totalG"` の追加検証：着席時の `totalStart`（あれば）以上、かつ同じ台の直前のAT終了行の `totalG`（あれば）以上。下回れば toast で止める
- 値は記録行の同名項目（`bites`・`shownGain`・`totalG`）に入れる
- `openExtra()` の汎用経路は `x.nums` を、`atEndSheet()` は `atEnd.numsBefore`（グループの前）・`atEnd.numsAfter`（クレジットの後）を表示する

### E3 メモを分けて持つ（`noteSeparate`）
- 定義に `noteSeparate:true` があるとき、次のシートの任意メモを本文に連結せず `ev.note` に入れる（空なら持たない）：当選シート、CZ成功シート（E5）、CZ失敗シート、AT終了シート、`openExtra()`（`x.memo` 指定時）、示唆メニュー（E6）、EDカード画面（E10）
- 表示は既存 `evTxt()` が `（note）` を付けるので追加処理は不要
- 指定なしの機種は今のまま（本文に「：メモ」「　メモ」で連結）

### E4 クレジット欄（`hitCredit`／`czEnd.credit`／`atEnd.credit`）
- 部品関数 `creditInput(b)`：ラベル「今のクレジット（任意）」、`numInput("")`
- `hitCredit:true`：`openHit()` のシートに欄を足す（`after` フック）→ `hitStart` 行に `cr`
- `czEnd.credit:true`：CZ成功シート（E5）と失敗シートに欄。失敗シートでは既存の `medalInput()` の**代わり**に出す → `hitEnd` 行に `cr`
- `atEnd.credit:true`：`atEndSheet()` で `medalInput()` の**代わり**に出す → `hitEnd` 行に `cr`
- クレジットは `money.credit`（持ちメダル）を**更新しない**。`medal` 行も作らない
- 検証は E2 と同じ（整数・0以上・空欄は null）

### E5 CZ成功シートと1操作化（`czEnd.successSheet`／`czEnd.successOneOp`）
- `successSheet:true`：`czEndSheet()` で「成功」を押したら即確定せず、小さいシート（クレジット欄＋メモ＋「成功を記録」）を出す。確定時の処理は今の成功処理と同じ
- `successOneOp:true`：成功後の `startHit(at,trig)` を `{keepOp:true}` で呼び、成功行とAT開始行を1つの操作にする（取り消しでCZ中に戻る）
- 指定なしの機種は今のまま（即確定・別操作）

### E6 示唆メニュー（`extras[].type==="menu"`）
- `openExtra()` に分岐を足す：`items` の表示名を並べたシート → 選ぶと、その項目の `groups` で `groupSheet()`（メモ欄付き、即確定しない）
- 記録行：`type:"extra"`、`extra:"示唆"`、`sel:{kind, key, label}`、本文「示唆：アイキャッチ　霧嶋董香（喰種化）」、`note`
- ヒント（`h`）はボタンに小さく出す（既存どおり）。本文には表示名だけ

### E7 権利の条件と後始末（`ticket.autoBy.match`）
- `openExtra()` の権利自動付与の判定に `match` を足す：`autoBy.match` があれば `sel` の各キーが一致したときだけ数える。今の判定（`extra` と `result`）はそのまま
- `renderBadges()` の権利バッジの文言を、直書きの「一劇権利」から `hitProp(curHitDef(),"ticket").label` に変える（からくりは label が「一劇権利」なので表示は同じ）
- `leaveAt()` の権利消費条件を、直書きの `after.hit==="運命の一劇"` から「`after.hit` が今のATの `afterAtWithTicket.hit` と同じ」に変える（からくりでは同じ結果になる）

### E8 失敗後の印（`czEnd.failMark`）
- 状態に `nextMark`（文字列 or null）を足し、`SNAP_KEYS` に加える（取り消しで戻す。既存機種では常に null）
- `failMark` 付きCZの失敗確定で `c.nextMark=failMark`、記録行に変化なし
- `startHit()` で `target.kind==="cz"` かつ `c.nextMark` があれば、`hitStart` 行に `afterMark:c.nextMark` を入れて `c.nextMark=null`（同じ操作内）
- バッジ：`nextMark` があれば表示（文言は値そのもの）
- `fixSession()`：`nextMark` が無ければ null を入れる

### E9 G数の初期値の文言（`fixedEndGHint`）
- `gInputs()` で `fixedEndG` を使うとき、`fixedEndGHint` があればその文言を出す。無ければ今の文言

### E10 EDカード（`edCards`・`phases.*.cards`・グリッド `edCards`）
- **保存**：台に `edRuns:[{id, startedAt, counts:{キー:数}, note, fixes:[]}]`。`counts` は0のキーを持たなくてよい
- **作る**：`phase:` ボタンで段階に入るとき、その段階が `cards:true` なら `edRuns` に新しい枠を足し、`phase` 行に `edId` を入れる（同じ操作）
- **画面**：グリッド `edCards` → 全面シート
  - 上部：「◯回目のED」（今の台の edRuns の順番）
  - 14行：分類名（ヒント小さく）・［−］・今回の数・［＋］・累計。キャラ名は行の下に折りたたみ（初期は閉じる）
  - ［＋］［−］は `run.counts` を直接変えて `save()`・再描画。0未満にしない。**記録行を作らない・取り消しの対象にしない**
  - 下部：ED全体のメモ欄（`run.note`、入力の確定で保存）
  - 「前回のEDを直す」：今の台の過去の枠を選ぶと、その枠の数を同じ画面で直せる。直し終えたら「直した内容を記録」で `edFix` 行（`edId`・`before`・`after`）を1行作る。ほかの台の枠は直せない（表示のみ）
- **累計**：同じ日（JST、`startAt` 基準）・同じ店（`shop`）・同じ台番号（`dai`）・同じ `machineId` の台（記録中の台を含む）の `edRuns` の合計。台番号が空なら記録中の台だけ。保存しない
- **確定行**：AT終了（`leaveAt()`）で、そのATに枠があれば「EDカード 計N枚（白・弱2、銅・エト1…）」の `edSum` 行を同じ操作で作る（`edId` 付き）
- **取り消し**：
  - `edId` 付きの `phase` 行を取り消すとき、その枠のカードが1枚以上なら確認文に「EDカードN枚も消えます」を足す。取り消したら枠を `edRuns` から消す
  - `edFix` 行を取り消すと、その枠の `counts` を `before` に戻す
  - `edRuns` は `SNAP_KEYS` に**入れない**
- **読み込み**：`fixSession()` で `edRuns` が配列でなければ消さずに空配列（定義に `edCards` がある機種のみ）。`validSession()`（取り込み時）に型検査を足す：配列、各要素は `id` 文字列・`counts` の値は0以上の整数

### E11 記録のまとめ（`atGain`）
「設定判別」シートの「設定示唆のまとめを見る」の下に「記録のまとめ」ボタンを足す（定義に `atGain` がある機種のみ）。中身はすべてその場で計算し、保存しない。

| 表示 | 計算 |
|---|---|
| CZ | 種別ごとの当選・成功・失敗（`kind:"cz"` のうち `hidden` でないもの） |
| AT初当たり | AT開始行のうち契機が `excludeFirstHitTrigs` に無いもの。契機別の内訳も |
| 有馬ジャッジメント | 成功／失敗 |
| 喰種対決 | 相手ごとの勝ち／負け、BITES合計 |
| ATごとの獲得枚数 | AT終了行の `cr` − 開始点の `cr`。開始点は ①AT開始行に `cr` があればそれ ②無ければ同じ操作の `hitEnd` 行の `cr`（CZ成功・EP終了）③契機が `fromTrig` にあれば、そこに書かれたCZの直近の成功行の `cr`。どれも無ければ「—」。区間中に `money` 行（投資・再プレイ）があれば「※途中で投資あり」 |
| 画面の獲得枚数 | AT終了行の `shownGain`（上と並べて表示、計算に混ぜない） |
| CZの差枚 | CZ終了行の `cr` − CZ当選行の `cr`。無ければ「—」 |
| EDカード | 今の台の各EDと、その日のその台の累計 |

### E12 ノート用の出力（`toEnvelope()`）
- 形式は変えない。定義に `atGain` がある機種だけ、`logs` の最後に「まとめ」の文字ログ1行を足す（E11 と同じ計算。例「まとめ　CZ 5回（成功2）／AT 2回／有馬 1-0／AT獲得 +1,240・+830」）
- 記録行の本文には、入力した値（クレジット・BITES・画面の獲得枚数・総回転数・選んだ表示名）を書く。例：「AT 終了　獲得1,245枚／あんていく全員集合／銀　クレジット 1,480　総回転 2,950G」

---

## 4. 着席

- 既存の着席画面に、定義の `setup` 3項目が出る（既存処理）
- `setup` には選んだ**キー**が入る。打ち始めメモの文には表示名を使う（既存の `optionLabels` 処理）。`unknown` は打ち始めメモに出さない（既存の「不明」除外と同じ扱いになるよう、`optionLabels` の値が「不明」のときも除外する。既存機種で「不明」以外の値の扱いは変えない）

---

## 5. 取り消しの一覧（確認用）

| 操作 | 取り消しの結果 |
|---|---|
| 示唆 | 行が消える |
| CZ当選 | 通常時に戻る |
| CZ成功（E5） | CZ中に戻る（成功行・AT開始行がまとめて消える） |
| CZ失敗 | CZ中に戻る。スルー・G数も戻る |
| EP終了 | EP中に戻る（AT開始行も消える） |
| 喰種対決 | 行が消える。その行で付いた有馬権利も消える |
| エンディング | AT中に戻る。ED枠も消える（カードがあれば確認） |
| EDカード±・EDメモ | 対象外 |
| ED訂正 | 訂正前の数に戻る |
| AT終了 | AT中（ED中）に戻る。edSum 行・ジャッジメント開始行も消える |
| ジャッジメント成功 | ジャッジメント中に戻る（死神開始も消える） |
| ジャッジメント失敗 | ジャッジメント中に戻る。`nextMark` も戻る |
| 死神終了 | 死神中に戻る |

---

## 6. 版数・保存

- `S.version` は変えない。既存項目の意味は変えない。追加項目：台 `edRuns`・`nextMark`、記録行 `keys`・`note`・`cr`・`bites`・`shownGain`・`totalG`・`afterMark`・`edId`・`before`・`after`
- `validSession()`：新項目は「あれば型を確認」（`cr`・`bites`・`shownGain`・`totalG` は0以上の整数、`note`・`afterMark` は文字列、`keys` は文字列の値だけの object）
- 既存の記録（汎用の「東京喰種」108件を含む）は変換しない

---

## 7. テスト版

- 本番 `tools/rec/index.html` は、夢爽の実機確認とネネの検収が終わるまで main に入れない
- 確認用に `tools/rec/tg-test.html` を作る：作業ブランチの `index.html` から機械的に作る（保存先 `slot-tools-rec-tg-test`、表示設定キー `slot-tools-rec-tg-test:cycleLabel`、タイトル「実戦記録（東京喰種テスト版）」、noindex はそのまま）。生成スクリプト `tests/rec-tokyoghoul-build-test-page.mjs`（既存 `rec-account-build-test-page.mjs` と同じ作り。置換数を assert）
- 導線は作らない（トップ・ツール一覧・sitemap に載せない）
- 本番反映時は `tg-test.html` を消し、`acct-test.html` を既存スクリプトで作り直す（本書の範囲外。別の指示書で行う）

---

## 8. 検証

### 8-1. 回帰（既存機種が変わらないこと）
- 既存テストをすべて通す：`rec-account-test-page.test.mjs`、`rec-account.verify.mjs`、`rec-log-order.verify.mjs`、`rec-log-order-past.verify.mjs`、`rec-stock-replay.verify.mjs`、`rec-cycle-label.verify.mjs`、`rec-hibireturn-state-label.test.js`、`rec-idb-sessions.e2e.cjs`
- 新規 `tests/rec-tokyoghoul-regression.verify.mjs`：`8d041ce` の index.html と作業後の index.html で、`generic`・`karakuri2`・`hibireturn` の同じ操作列（各機種：着席→当選→終了→AT→終了→取り消し2回→ヤメ）を流し、保存された台データ（`id`・`at` 等の時刻と乱数由来の値を除く）が一致すること

### 8-2. 東京喰種の通し操作（`tests/rec-tokyoghoul.verify.mjs`）
骨格書 v0.3 §11 の具体例1〜8を、そのまま操作列にして確認する。加えて：
1. 数値欄に `-1`・`1.5`・`abc` を入れると止まり、保存されない（クレジット・BITES・画面の獲得枚数・総回転数）
2. 総回転数が着席時より小さい／前のAT終了より小さいと止まる
3. CZ失敗シートのG数の初期値が実6／液晶0。直した値が保存される
4. 有馬に勝利 → バッジ「有馬権利」→ AT終了の行き先が「有馬ジャッジメントへ（有馬勝利）」。鯱に勝利では権利が付かない
5. EDカード：＋3・−1 → 2。閉じて開き直しても2。0で−を押しても0。2回目EDは0から、累計は合算
6. 同じ日・同じ店・同じ台番号で座り直した台の累計に前の台のEDが入る。台番号が違えば入らない
7. 取り消し：§5 の表の全行
8. ノート用出力：まとめ行が1行入る。kado-note の取り込み形式（`schema:"slot-session"`・`schemaVer:2`）が変わらない
9. 書き出したJSONを取り込み直して同じ内容になる。`edRuns` の数が負の JSON は取り込みで弾かれる
10. 390px・360px：EDカード画面・AT終了シート・示唆メニューで横スクロールが出ない。ボタンの高さ44px以上

### 8-3. 画面
`tg-test.html` を 390px で開き、通常時・CZ・AT・ED・ジャッジメントの各画面と、EDカード画面・AT終了シート・示唆メニューのスクリーンショットを残す（夢爽とネネの確認用）
