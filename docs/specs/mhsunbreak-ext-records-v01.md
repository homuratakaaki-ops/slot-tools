# モンハンサンブレイク 追加記録（結果アイコンの位置／サイドランプ／過去への差し込み／元データの控え）実装指示書 v01

- 依頼: 夢爽（2026/10/10 決定・承認済み）
- 中継・検収: ツムギ
- 実装: ミコト
- 作業ディレクトリ: `C:\Users\homur\slot-tools`
- ブランチ: `feat/mhsunbreak-ext-records`（`main` の `d5fe40d` から作成済み）
- commit名義: ミコト

**最優先: 保存済みのBZ記録（`bzT1` / `bzT2` / `questN1` / `questN2` / `atLog` / `czType` ほか）を1件も失わない。**
変換・移し替え・キーの付け替えはしない。既存の項目はそのまま、項目を「足す」だけ。

---

## 0. 照合結果（ツムギが 2026/10/10 に実施済み。再調査は不要）

### 0.1 アイコン標準配列（位置1〜10）

一撃様 `https://1geki.jp/slot/l_mh_sun/48/` とちょんぼりすた様 `https://chonborista.com/slot/enta-slot/264514/`
の両方を再照合し、**7テーブルとも指示書の並びと一致**することを確認した。

| 位置 | ① | ② | ③ | ④ | ⑤ | ⑥ | ⑦ |
|---|---|---|---|---|---|---|---|
| 1 | QUEST青 | QUEST黄 | ライゼクス | セルレギオス | オロミドロ亜種 | テオ・テスカトル | AT |
| 2 | QUEST青 | QUEST黄 | ライゼクス | セルレギオス | オロミドロ亜種 | テオ・テスカトル | ＋G |
| 3 | QUEST黄 | ライゼクス | セルレギオス | オロミドロ亜種 | テオ・テスカトル | AT | ＋G |
| 4 | QUEST黄 | ライゼクス | セルレギオス | オロミドロ亜種 | テオ・テスカトル | ＋G | ＋G |
| 5 | ライゼクス | セルレギオス | オロミドロ亜種 | テオ・テスカトル | AT | ＋G | ＋G |
| 6 | セルレギオス | セルレギオス | オロミドロ亜種 | テオ・テスカトル | ＋G | ＋G | ＋G |
| 7 | オロミドロ亜種 | オロミドロ亜種 | テオ・テスカトル | AT | ＋G | ＋G | ＋G |
| 8 | オロミドロ亜種 | オロミドロ亜種 | テオ・テスカトル | ＋G | ＋G | ＋G | ＋G |
| 9 | テオ・テスカトル | テオ・テスカトル | AT | ＋G | ＋G | ＋G | ＋G |
| 10 | テオ・テスカトル | テオ・テスカトル | ＋G | ＋G | ＋G | ＋G | ＋G |

11個目は**全テーブル共通で「猛焔一閃」**（両出典に明記）。11個目は位置として記録しない。

### 0.2 サイドランプ

ちょんぼりすた様の原文は「ブレイクゾーン（BZ）終了時にPUSHボタンを押すとサイドランプの色が変化。
こちらも次回BZテーブルなどの示唆と予想。」のみで、**色の列挙も色別の示唆内容も公表されていない**
（一撃様・altema様も同様。2026/10/10 時点）。よって本件は色だけの記録専用項目とし、
意味・示唆は画面にもガイドにも書かない（§9-104）。

8色（白・青・黄・緑・赤・紫・虹・その他）は夢爽の指定。出典に色の一覧が無いため、
取りこぼしを「その他」で受ける。

---

## 1. 変更対象ファイル（これ以外は1バイトも変更しない）

### 1-A. 本番反映ブランチ `feat/mhsunbreak-ext-records`

| ファイル | 変更 |
|---|---|
| `checker-data/mhsunbreak.js` | 本体（§3） |
| `mhsunbreak-checker.html` | `?v=20261010-6` → `?v=20261010-7` のみ（§9-107） |
| `mhsunbreak-guide.html` | BZタブの説明を追記（§9-101・§5） |
| `AGENTS.md` | §9-108 に1段落追記（§6） |
| `docs/specs/mhsunbreak-ext-records-v01.md` | 本書（作成済み。ミコトは変更しない） |
| `tests/mhsunbreak-ext-records.verify.mjs` | 新規（§8） |
| `tests/mhsunbreak-at-log.verify.mjs` ほか既存テスト | 仕様変更分の期待値だけ追随 |
| `IDEAS.md` | **末尾に1行だけ追記**（§7） |

### 1-B. 検収用テスト版（`main` へ直接。§9-108）

| ファイル | 変更 |
|---|---|
| `mhsunbreak-test-checker.html` | 新規（本番HTMLの写し。§9） |
| `checker-data/mhsunbreak-test.js` | 新規（改修後の本体の写し。§9） |

### 変更してはいけないもの

- `checker-engine.js` / `checker-bayes.js` / 他機種の `checker-data/*.js` / 他機種のHTML
- `sitemap.xml` / `checkers.html` / `index.html` / `docs/ARCHITECTURE.md`
- `docs/specs/mhsunbreak-nana-template-v01〜v05.txt`（正本。1バイトも変えない）
- なな様テンプレ（v05）・収支帳用コピーの**出力**
- カード（`card.blocks` / `chart` / `bottom` / `detail`）の出力
- BZシナリオカードの出力のうち、**pos・lamp が1件も無いデータでの結果**
- ガイドの `<style>`（`tonski-guide.html` とバイト一致であることをテストが固定している）
- 既存の保存キー名（`mhsunbreak-checker-v1` / `-prefs` / `-bak`）

---

## 2. 実装前の基準づくり（検証の土台。最初にやる）

改修前 `main`（`d5fe40d`）の `checker-data/mhsunbreak.js` を基準に、**改修後と全件一致**することを
確認するためのデータを6通り用意する。これは §8-a の自動テストとして
`tests/mhsunbreak-ext-records.verify.mjs` に書く（手元のメモで済ませない）。

基準の読み込みは既存テストと同じ型を使う。

```js
const load=src=>{const box={window:{}};vm.runInNewContext(src,box);return box.window.CheckerConfigs.mhsunbreak;};
const after=load(read('checker-data/mhsunbreak.js'));
const before=load(execFileSync('git',[...,'show','d5fe40d:checker-data/mhsunbreak.js'],{encoding:'utf8',maxBuffer:1<<26}));
```

### 6通りのデータ（固定値で書く。乱数を使わない）

| # | 名前 | 中身 |
|---|---|---|
| 1 | `empty` | `{}`（保存なしと同じ） |
| 2 | `legacyIcon` | 旧10マス配列メモ `iconLog` 10件（1個目が `qBlue`/`qYellow`/`rai`/`sel`/`oro`/`teo`/`rush`/`gold`/`blaze`/`unknown` の各1件。`group` と `result` を混ぜる）＋ `iconPending` |
| 3 | `legacyQuestN` | 旧 `questN`（合算セーブ）と旧発展先キー（`blue`/`raizex` 等）を持つセーブ |
| 4 | `atLogFull` | `atLog` に3つのAT間（`bz`×6・`fuku`×2・`eye`×2・`serif`×2・`otherAt`×1 を混在）、うち2つは `closed:true`。`bzT1`/`bzT2`/`questN1`/`questN2`/`czType`/`cycle`/`bz`/`hits` にも値を入れる |
| 5 | `unknownStart` | `atLog.sessions[0].start={known:false}`、BZ6件・アイキャッチ1件 |
| 6 | `sessionMax` | AT間 55件（上限50を超える）。各AT間に `bz` 2件 |

### 一致を確認する対象（6通り×全件）

1. `config.normalizeState(clone(data))` の中身
   **ここだけ `atLog.schemaVersion` の追加を例外として認める**（§3.1.2 で意図して足した版数で、
   将来の版が形式を判断するためのもの）。改修後の出力から `atLog.schemaVersion` を取り除いたものが
   改修前と一致すること、かつ `atLog.schemaVersion` が厳密に数値 `2` であること、の2つを見る。
   例外はこの1キーだけで、他のキーの差は1つも許さない。
   比較は**キー順に依存しない** `assert.deepEqual` で行う（改修後の AT間は
   `Object.assign({},s,{...})` で作るため、入力のキー順によってはキー順が変わりうる。
   それは不一致として扱わない）。バイト一致で見るのは §8-b の冪等だけ。
2. 集計値 … `bzT1`/`bzT2`/`questN1`/`questN2` の全テーブル、`czType`、`cycle`、`bz`、`hits`、`games`
3. テンプレ … `config.template(ctx(S))`（＝v05 相当）
4. 収支帳用 … engine の `plainText` と同じ処理（既存テストの関数を再利用する）
5. カードJSON … `config.card.blocks/chart/bottom/detail` の戻り値
6. BZシナリオカードJSON … `config.scenarioModel(S)`

**2〜6 は例外なしの完全一致**（`schemaVersion` の例外をここに持ち込まない）。
**1つでも差が出たら実装を直す。期待値をゆるめない。**

---

## 3. `checker-data/mhsunbreak.js` の変更

### 3.1 読み込みを前方互換にする（最重要）

#### 3.1.1 `normalizeAtEvent`

現行は「知っている形だけを作り直して返す」。これを「**知らないものを捨てない**」に変える。

```js
  // 画面に出せる出来事の種類。ここに無い種類は捨てずに持つだけにする（表示も集計もしない）。
  const EVENT_TYPES=['bz','fuku','eye','serif','otherAt','lamp'];
  const ICON_POS_MAX=10;
  function normalizeAtEvent(e){
    if(!e||typeof e!=='object'||Array.isArray(e)||typeof e.t!=='string'||!e.t)return null;
    // 知らない種類はそのまま残す（将来の版で足した記録を、この版が消さないため）
    if(EVENT_TYPES.indexOf(e.t)<0)return Object.assign({},e);
    const out=Object.assign({},e);   // 知らない項目（キー）は値をそのまま残す
    if(e.t==='bz'){
      // BZ番号と集計の整合を壊すので、table・r が壊れている件だけは現行どおり捨てる
      if(!TABLES.some(c=>c[0]===e.table)||['win','miss'].indexOf(e.r)<0)return null;
      const pos=Math.trunc(Number(e.pos));
      if(Number.isInteger(pos)&&pos>=1&&pos<=ICON_POS_MAX)out.pos=pos;
      else delete out.pos;           // 1〜10 でない pos は項目ごと落とす（出来事は残す）
      return out;
    }
    if(e.t==='fuku')return ['win','miss'].indexOf(e.r)>=0?out:null;
    if(e.t==='eye')return EYE.some(c=>c[0]===e.c)?out:null;
    if(e.t==='serif')return SERIF.some(c=>c[0]===e.c)?out:null;
    // lamp は集計にもBZ番号にも使わないので、知らない色でも捨てずに残す（表示だけしない）
    return out;   // otherAt / lamp
  }
```

**注意（事故になりやすい）**: 現行の `atEventAction` は DOM の `dataset` をそのまま
`normalizeAtEvent` に渡している。上の変更で「知らない項目をそのまま残す」ようにすると、
`action` / `index` / `label` などの画面都合の属性が保存データに混ざる。
**`atEventAction` 側で、`t` と必要な `c` / `r` だけを持つ素のオブジェクトを組んでから渡すこと。**

```js
  function atEventAction(ctx,ds){
    if(ctx.mode<0||ds.t==='bz')return false;
    // dataset をそのまま渡さない（action 等の画面都合の属性が保存に混ざるため）
    const src={t:ds.t};
    if(ds.c!==undefined)src.c=ds.c;
    if(ds.r!==undefined)src.r=ds.r;
    ...
  }
```

#### 3.1.2 `normalizeAtLog`

- `sessions` / `start` / `closed` の検証は現行どおり。
- **AT間（session）の知らない項目を残す。**
- **`atLog` 自体の知らない項目も残す。**
- `schemaVersion:2` を持たせる（無ければ 1 とみなす。表示には使わない）。

```js
  const AT_SCHEMA=2;
  function normalizeAtLog(log){
    const src=log&&typeof log==='object'&&!Array.isArray(log)?log:{};
    const sessions=(Array.isArray(src.sessions)?src.sessions:[]).filter(s=>s&&typeof s==='object'&&!Array.isArray(s)).slice(-AT_SESSION_MAX).map(s=>Object.assign({},s,{
      start:s.start&&s.start.known===true?{known:true,prior:Math.max(0,Math.min(AT_PRIOR_MAX,Math.trunc(Number(s.start.prior)||0)))}:{known:false},
      events:(Array.isArray(s.events)?s.events:[]).map(normalizeAtEvent).filter(Boolean).slice(0,AT_EVENT_MAX),
      closed:s.closed===true
    }));
    if(!sessions.length||sessions[sessions.length-1].closed)sessions.push(newAtSession());
    const out=Object.assign({},src);
    out.sessions=sessions.slice(-AT_SESSION_MAX);
    out.schemaVersion=AT_SCHEMA;
    return out;
  }
```

`Object.assign({},s,{...})` はもとのキー順を保つので、2回目以降の正規化で
JSON のバイト列が動かない（§8-b の冪等）。**キーの順を変える書き方にしないこと。**

### 3.2 元データの控え（`-pre-ext`）

```js
  const STORAGE_KEY='mhsunbreak-checker-v1';
  const PRE_EXT_KEY=STORAGE_KEY+'-pre-ext';
  // 拡張前（schemaVersion の無い形）の保存を、読んだ生の文字列のまま1回だけ控える。
  // 通常動作では読まない。リセットでも消さない。失敗しても動作は止めない。
  function backupPreExt(){
    const s=store();
    if(!s)return;
    try{
      if(s.getItem(PRE_EXT_KEY)!==null)return;       // 既にあれば上書きしない
      const raw=s.getItem(STORAGE_KEY);
      if(raw===null)return;                           // 保存が無ければ何もしない
      let parsed=null;
      try{parsed=JSON.parse(raw);}catch(e){return;}   // 壊れていれば何もしない
      if(!parsed||typeof parsed!=='object')return;
      const log=parsed.atLog;
      const v=log&&typeof log==='object'?log.schemaVersion:undefined;
      if(v!==undefined)return;                        // もう新しい形
      s.setItem(PRE_EXT_KEY,raw);
    }catch(e){}
  }
```

- `config.normalizeState` の**先頭**で呼ぶ。保存し直したあとは `schemaVersion` が付くので、
  2回目以降は何もしない（実質1回だけ）。
- `STORAGE_KEY` は定数にし、`CheckerConfigs` の `storageKey:` もこの定数を参照する。
  テスト版（§9）は定数を1か所変えるだけで `-test` 系のキーになるようにする。
- `PREFS_KEY` は現行のまま（`STORAGE_KEY+'-prefs'` に書き換えてよい。値は変えないこと）。

### 3.3 結果アイコンの位置（`bz` イベントの `pos`）

#### 3.3.1 定数

```js
  // BZのアイコン標準配列（位置1〜10）。11個目は全テーブル共通で「猛焔一閃」。
  // 出典: https://1geki.jp/slot/l_mh_sun/48/ ・ https://chonborista.com/slot/enta-slot/264514/
  // （2026/10/10 にツムギが両者を再照合し、7テーブルとも一致を確認した）
  const IC_QB='QUEST青',IC_QY='QUEST黄',IC_RA='ライゼクス',IC_SE='セルレギオス',
        IC_OR='オロミドロ亜種',IC_TE='テオ・テスカトル',IC_AT='AT',IC_G='＋G';
  const TABLE_ICONS={
    t1:[IC_QB,IC_QB,IC_QY,IC_QY,IC_RA,IC_SE,IC_OR,IC_OR,IC_TE,IC_TE],
    t2:[IC_QY,IC_QY,IC_RA,IC_RA,IC_SE,IC_SE,IC_OR,IC_OR,IC_TE,IC_TE],
    t3:[IC_RA,IC_RA,IC_SE,IC_SE,IC_OR,IC_OR,IC_TE,IC_TE,IC_AT,IC_G],
    t4:[IC_SE,IC_SE,IC_OR,IC_OR,IC_TE,IC_TE,IC_AT,IC_G,IC_G,IC_G],
    t5:[IC_OR,IC_OR,IC_TE,IC_TE,IC_AT,IC_G,IC_G,IC_G,IC_G,IC_G],
    t6:[IC_TE,IC_TE,IC_AT,IC_G,IC_G,IC_G,IC_G,IC_G,IC_G,IC_G],
    t7:[IC_AT,IC_G,IC_G,IC_G,IC_G,IC_G,IC_G,IC_G,IC_G,IC_G]
  };
  // 経過カード・シナリオカードの狭い場所で使う短い名前
  const ICON_SHORT={[IC_QB]:'青',[IC_QY]:'黄',[IC_RA]:'ライ',[IC_SE]:'セル',
                    [IC_OR]:'オロ',[IC_TE]:'テオ',[IC_AT]:'AT',[IC_G]:'＋G'};
```

#### 3.3.2 入力（経過カードの詳細）

- 詳細の中に「結果アイコン」の行を置く。`bz` のカードのときだけ出す。
- ボタンは**位置1〜10の10個＋［未記録］の11個**。`grid-template-columns:repeat(3,1fr)` の3列。
- 表記は `4：QUEST黄` の形（`${pos}：${TABLE_ICONS[table][pos-1]}`）。
  `aria-label` は `位置4 QUEST黄`。選択中は `aria-pressed="true"` と `.on`。
- 高さは最低48px。360px で文字が切れないこと（`font-size` は10px まで下げてよい。
  **省略記号（…）で切らない**）。
- 成功・失敗どちらでも押せる。減算モードでは押せない（`disabled`）。
- `⑦`（`t7`）は**記録した時点で `pos:1` を既定で入れる**。あとから別の位置・［未記録］に変えられる。

action（保存を変えるので取消の履歴に積む。`rerender()` ではない）:

```js
    bzPos:(ctx,ds)=>{ ... }   // data-index=出来事の位置 / data-pos=1〜10 または '' （未記録）
```

- 戻り値の文言: `BZ3回目 結果アイコン 4：QUEST黄` / `BZ3回目 結果アイコン 未記録`。
- 同じ位置をもう一度押したときは**未記録に戻す**（トグル）。
- 対象は §3.5 の `historyView(S)` が出しているAT間の出来事。閉じたAT間でも押せる。

#### 3.3.3 表示

- 経過カード … 既存の `<em>×失敗</em>` の下に、**pos があるときだけ**1行足す。
  `<u class="ev-pos">結果：4 黄</u>`（`${pos} ${ICON_SHORT[icon]}`）。
- BZシナリオカード … `scenarioCardModel` の `flow` の `bz` の要素に、
  **pos があるときだけ** `pos`（数値）と `icon`（短い名前）を**末尾に足す**。
  描画は結果（○×）のあとに ` 4黄` を `SC_MUTED` で描く。
  **pos が1件も無いデータでは、モデルのJSONも描画も改修前と完全に同じになること**（§2-6）。
- 集計（テーブル別の成功／回数）には使わない。
- シナリオ候補の計算（`scenarioCandidates`）には使わない。成功＝AT当選の定義は不変。
- なな様テンプレ（v05）・収支帳用コピーには出さない。

### 3.4 サイドランプ（新しい種類 `lamp`）

```js
  // BZ終了時のPUSHで光るサイドランプ。色だけを記録する（解析が出るまで意味は書かない）。
  // 出典にも色の一覧・色別の示唆は無い（2026/10/10 時点）。色は画面の見分け用。
  const LAMPS=[
    ['white','白','#f2eef5'],['blue','青','#83caff'],['yellow','黄','#ffe881'],
    ['green','緑','#a9e6ad'],['red','赤','#ff9b9b'],['purple','紫','#cbb4ff'],
    ['rainbow','虹','#ffc94d'],['other','その他','#9a90a8']
  ];
```

- データ … `{t:'lamp', c:'white'|'blue'|'yellow'|'green'|'red'|'purple'|'rainbow'|'other'}`
- 「示唆・福引・その他」の折りたたみの中に `<div class="bz-sub">BZ終了時PUSH ランプ</div>` と
  8ボタン（既存の `.at-pick` / `.at-btn` を使う。減算モードでは `disabled`）。
- 説明 … `解析が出るまで色だけ記録します。` を `.hint` に入れる。**意味・示唆は書かない。**
- `atEventText` … `ランプ 赤`
- 経過カード … `<b>ﾗﾝﾌﾟ</b><i>赤</i>`（色は `--c` に `LAMPS[2]`）
- BZシナリオカード … 流れに `ﾗﾝﾌﾟ 赤` を色付きで1語入れる。
  モデルの要素は `{lamp:'赤',color:'#ff9b9b'}`（`no`/`mark` を持たない）。
  描画は `Object.prototype.hasOwnProperty.call(step,'lamp')` で分岐する。
- テンプレには出さない（`tplAtFlow` で `lamp` は空文字を返す。明示的に書いてコメントを付ける）。
- シナリオ候補の計算に使わない。BZ番号の数えに入れない（`countsForNo` は `bz` のみ）。
- AT間を閉じない（`appendAtEvent` の締め条件に入れない）。

### 3.5 経過に出すAT間（夢爽裁定 2026/10/10）

BZ成功・福引成功・［BZ以外でAT］を押すとそのAT間は閉じ、新しい空のAT間が始まる。
現行はその瞬間に「経過」が空になるため、**成功したBZの結果アイコンを記録できない**。
これを次のとおりにする。

```js
  // 経過に出すAT間。このAT間がまだ空で、直前のAT間が閉じていて記録があるときは、
  // そちらを出す（AT当選の直後に、そのBZの結果アイコンを押せるようにするため）。
  function historyView(S){
    const list=S.atLog.sessions,last=list.length-1;
    if(list[last].events.length)return {index:last,session:list[last],closed:false};
    const prev=list[last-1];
    if(prev&&prev.closed&&prev.events.length)return {index:last-1,session:prev,closed:true};
    return {index:last,session:list[last],closed:false};
  }
```

- 見出し … 開いているAT間で出し分ける。
  - `closed:false` … `経過` ＋ `古い順。右が最新`（現行のまま）
  - `closed:true` … `経過` ＋ `直前のAT間（AT当選で終了）`
- 「このAT間」のセクション（上）は**現行どおり `currentAt(S)`** を出す（記録 0件になる）。
- `closed:true` のときは**［削除］と［このカードの前に追加］を出さない**（結果アイコンだけ押せる）。
  訂正は「↩ 取消」で行う。その旨を `.hint` に1行出す。
- `atOpen` / `atDel` / `bzPos` / 差し込みはすべて `historyView(S).session` を対象にする
  （`atDel` と差し込みは `closed:true` のとき `false` を返す）。
- `openEvent` が指す出来事が無くなっていたら、描画時に `null` に戻す（取消の直後の防御）。

### 3.6 過去への差し込み

画面だけの状態（保存しない）:

```js
  let insertBefore=null;   // 差し込み先（このAT間の出来事の位置）。次の1件だけ入れて解除する
  let insertShifted=false; // 差し込みでBZ番号が変わったときだけ true（説明を1行出す）
```

- 経過カードの詳細に ［このカードの前に追加］（`data-action="atInsert"`）。押すと
  `insertBefore` にその位置を持ち、`rerender()` で描き直す（**取消の履歴に積まない**）。
- 差し込み待ちのあいだは、
  - 対象カードに `.ev-card.target` を付けて「ここに入ります」と分かるようにする
  - 「BZを記録」の上に `差し込み待ち：このカードの前に1件だけ入ります` と ［差し込みをやめる］
    （`data-action="atInsertCancel"`）を出す
- 次に記録した1件（BZ・アイキャッチ・セリフ・福引・ランプ・［BZ以外でAT］のどれでも）を
  その位置に入れ、`insertBefore=null` に戻す。

```js
  function addAtEvent(S,event,at){
    const session=currentAt(S);
    if(session.events.length>=AT_EVENT_MAX)return false;
    if(!(Number.isInteger(at)&&at>=0&&at<session.events.length)){
      session.events.push(event);
      if(event.t==='otherAt'||(['bz','fuku'].indexOf(event.t)>=0&&event.r==='win')){
        session.closed=true;
        S.atLog.sessions.push(newAtSession());
        if(S.atLog.sessions.length>AT_SESSION_MAX)S.atLog.sessions.shift();
      }
      return true;
    }
    // 差し込みではAT間を閉じない（AT間が終わるのは最後の出来事で決まるため）
    session.events.splice(at,0,event);
    return true;
  }
  const appendAtEvent=(S,event)=>addAtEvent(S,event,null);
```

- 差し込み後のBZ番号・計上先は**順序から都度計算される**ので、特別な処理は要らない
  （`bzNoAt` は位置から数えている）。
- **既に集計済みの `bzT1`/`bzT2`/`questN1`/`questN2` は動かさない。**
- 差し込んだBZ自身の計上先は、**入った位置のBZ番号**で決める。

```js
  // 次に記録するBZの番号と計上先。差し込み中は差し込み位置で計算する。
  function nextBzTarget(S){
    const session=currentAt(S);
    const at=Number.isInteger(insertBefore)?Math.min(insertBefore,session.events.length):session.events.length;
    const no=session.start.known?session.start.prior+session.events.slice(0,at).filter(countsForNo).length+1:null;
    return {no,group:no===null?pickGroup:(no===1?'bzT1':'bzT2')};
  }
```

  `inputSection` の「→ 2回目以降に計上（BZ7回目）」の表示と `bzQuestAction` の
  `atGroupAllowed` の判定は、どちらもこの `nextBzTarget(S)` を使う。

- 差し込んだのが `bz` で、そのうしろに他の `bz` があるとき（＝既存BZの番号が変わったとき）だけ
  `insertShifted=true` にし、**開いている詳細の中に** `集計の計上先は変わりません` を1行出す。
  別のカードを開く・削除する・次の記録をする、のいずれかで `false` に戻す。
- 差し込みは `customAction` 1回の中で終わるので、**「↩ 取消」1回で戻る**（engine は変更しない）。
- `closed:true` のAT間を見ているときは ［このカードの前に追加］を出さない（§3.5）。

### 3.7 記録直後に詳細を開く

- 記録（`bzQuest` / `atEvent`）が成功したら、その出来事を `openEvent` にする。
  - 末尾に積んで**閉じなかった**とき … `historyView` は今のAT間 → `events.length-1`
  - 末尾に積んで**閉じた**とき … `historyView` は閉じたAT間（§3.5）→ `events.length-1`
  - 差し込んだとき … 入れた位置
- `atDel` のあとは `openEvent=null`（現行どおり）。

### 3.8 表示できない出来事の扱い

- 知らない種類の出来事・知らない色の `lamp` は**カードを描かない**。
  `session.events.map((e,i)=>...)` の添字（`data-index`）は**実際の位置のまま**にすること
  （フィルタして詰めない。削除・差し込みが別の行に効いてしまう）。
- 「まだありません」の判定は**描けるカードの数**で行う。
- `atEventText` の最後の `return 'BZ以外でAT当選';` は `e.t==='otherAt'` の明示判定に直し、
  それ以外は `記録（この版では表示できません）` を返す（防御。通常は呼ばれない）。
- `tplAtFlow` / `scenarioCandidates` / `strongestEye` は、知らない種類を素通りする
  （現行の書き方のままで成り立つ。`lamp` を明示的に空文字にする1行だけ足す）。

---

## 4. 画面の寸法

- 追加するタップ要素はすべて**高さ48px以上**（小型画面でも44pxを下回らない）。
- 360px / 390px / 412px で**横のはみ出し0**（`documentElement.scrollWidth === clientWidth`）。
- 経過の横スクロール枠は現行どおり内部スクロール。カードの高さが増えても枠からはみ出さない。
- 結果アイコンの11ボタンは3列。360px で `6：オロミドロ亜種` が省略されずに入ること。

---

## 5. `mhsunbreak-guide.html`（§9-101）

`<h2>BZタブ</h2>` の節に追記する。`<style>` は1バイトも変えない。
「が確定」「設定差はありません」の形は使わない（`tests/wording-noukou.verify.mjs` が固定）。

1. 「BZタブの並び」の `<p>`（カードを押すと内容と［削除］が出ます…）のあとに、次を足す。

```html
    <p>カードを押して開く詳細には「結果アイコン」があります。ブレイクゾーンの結果が、並んだアイコンの何個目で出たかを位置1〜10で記録します（例「4：QUEST黄」）。成功・失敗どちらでも記録でき、押さなくてもかまいません。テーブル⑦は位置1を最初から入れています。11個目はどのテーブルでも猛焔一閃なので位置には置いていません。結果アイコンは経過カードとBZシナリオカードに出ますが、テーブル別の成功／回数・テンプレ・シナリオの候補には使いません。</p>
    <p>AT当選でそのAT間が終わったあとも、次の記録をするまでは「経過」に「直前のAT間（AT当選で終了）」として残ります。当選したブレイクゾーンの結果アイコンはここで押せます。この表示のあいだは［削除］と［このカードの前に追加］は出ません（訂正は「↩ 取消」で行います）。</p>
    <p>詳細の［このカードの前に追加］を押すと、次に記録する1件だけをそのカードの前に入れられます。押し忘れた記録をあとから正しい順に差し込むためのものです。差し込むとBZ番号は順番から数え直しますが、すでに数えたテーブル別の回数は動きません（記録の並びと集計は別に持っています）。やめるときは［差し込みをやめる］を押してください。</p>
```

2. 「AT間メモ」の節のアイキャッチ・セリフの説明のあとに、次を足す。

```html
    <p>ブレイクゾーン終了時のPUSHで光るサイドランプの色も記録できます（白・青・黄・緑・赤・紫・虹・その他）。色別の示唆は公表されていないため、解析が出るまで色だけを記録します。経過カードとBZシナリオカードに出ますが、テンプレ・設定推測には使いません。</p>
    <p>結果アイコン・サイドランプは新しい記録項目です。古い版に戻すと消える場合があります。</p>
```

3. 出典欄に変更は要らない（既に一撃様・ちょんぼりすた様を記載済み）。

---

## 6. `AGENTS.md` §9-108 への追記（事故防止策①）

`## §9-108【大きい更新は閉店後にマージする】` の本文のあとに、**改行1つを空けて**次の1段落を足す。
既存の1行は変えない。

```
保存項目を増やした版を公開した後は、不具合があっても旧版に戻さず、前に進めて直す（revert禁止）。緊急で戻す場合は夢爽の明示指示と、`-pre-ext` 以降の記録が消える旨の告知を必須とする。
```

---

## 7. 旧版に戻した場合の事故と復旧

### 7.1 何が起きるか

現行版（`?v=20261010-6` 以前）の `normalizeAtEvent` は、知っている項目だけを組み直して返す。
よって**旧版で操作して保存し直すと、`pos`・`lamp`・知らない項目だけが消える**。
BZの回数・成功数（`bzT1`/`bzT2`/`questN1`/`questN2`）・示唆・AT間メモの本体は消えない。

- 読み捨ては**保存のときにしか起きない**。旧版で開いただけ（何も押していない）なら消えていない。
- 新版は `atLog.schemaVersion:2` を書くので、将来の版は版数を見て判断できる（事故防止策②）。

### 7.2 復旧手順

**a. 旧版で保存し直す前**

新版（`?v=20261010-7` 以降）を開き直すだけでよい。`pos`・`lamp` は残っている。

**b. 旧版で保存し直したあと**

`pos`・`lamp` は復元できない。`-pre-ext` は「**拡張前**」の控えなので、拡張後に足した
`pos`・`lamp` は含まない。利用者には次のように案内する。

> 結果アイコン・サイドランプの記録だけが消えた可能性があります。
> ブレイクゾーンの回数・成功数・示唆・AT間メモは残っています。

**c. `-pre-ext` から拡張前の状態に戻したいとき**

`mhsunbreak-checker-v1-pre-ext` は、新版が初めて旧形式の保存を読んだときに控えた
**そのときの生の文字列**。次の手順で戻す（**戻すと、控えを取ったあとに足した記録はすべて消える**。
実行前に現在の値を必ず控えること）。

1. スマホ版 Chrome なら PC と USB 接続して `chrome://inspect`、PC なら F12 で開発者ツールを開く
2. `Application`（アプリケーション）タブ →  `Local Storage` → `https://slot-tools.jp`
3. `mhsunbreak-checker-v1` の値を選んでコピーし、安全な場所に貼って保存しておく（今の記録の控え）
4. `mhsunbreak-checker-v1-pre-ext` の値を選んでコピーする
5. `mhsunbreak-checker-v1` の値を選び、4でコピーした文字列を貼り付けて確定する
6. ページを再読み込みする

`Console`（コンソール）タブからでも同じことができる。

```js
localStorage.setItem('mhsunbreak-checker-v1-bak-manual', localStorage.getItem('mhsunbreak-checker-v1'));
localStorage.setItem('mhsunbreak-checker-v1', localStorage.getItem('mhsunbreak-checker-v1-pre-ext'));
location.reload();
```

- `-pre-ext` は読むだけで、通常動作では使わない。**リセット（全データリセット）でも消さない。**
- リセット直前の状態は engine が `mhsunbreak-checker-v1-bak` に入れる（従来どおり。別物）。

---

## 8. 検証（すべて実行し、結果を報告する）

新規テストは `tests/mhsunbreak-ext-records.verify.mjs` にまとめる（a〜h）。

| # | 内容 |
|---|---|
| a | §2 の6通りが、改修前 `d5fe40d` と**全件一致**（normalizeState・集計・テンプレ・収支帳用・両カードJSON） |
| b | `pos`・`lamp`・差し込み・知らない項目を含む状態で、保存→読み直し→保存の文字列が**バイト一致**（冪等）。3サイクル |
| c | 知らない種類 `{t:'future',x:1}` と知らない項目 `{t:'bz',table:'t3',r:'miss',zz:9}` を読み込んで保存しても消えない。表示には出ない |
| d | 旧形式データを新版で開くと `-pre-ext` が**1回だけ**作られ、2回目以降は上書きされない。リセット（`clone(DEF)`→保存）のあとも残る |
| e | 旧版（`d5fe40d` の `normalizeState`）で新版データを読むと **`pos`・`lamp` だけが落ち**、他は一致する（事故の範囲の確認）。旧版の出力に `schemaVersion` は無いので、比較の際は新版側から `atLog.schemaVersion` を外す（§2-1 と同じ例外） |
| f | 位置1〜10の種類表示が §0.1 の表と一致（7テーブル×10＝70件）。`t7` を記録すると既定で `pos:1` が入る |
| g | 差し込み … セリフ→BZ③ の順を「BZの前にセリフ」に直せる／BZ番号が数え直される／`bzT1`/`bzT2`/`questN1`/`questN2` が不変／「↩ 取消」1回で戻る |
| h | ランプ8色が経過カードとシナリオカードのモデルに出る／テンプレ v05 はバイト一致のまま |

既存テストも全件実行する。

1. `node --check checker-data/mhsunbreak.js`
2. `node tests/mhsunbreak-ext-records.verify.mjs`（新規）
3. `node tests/mhsunbreak-at-log.verify.mjs`
4. `node tests/mhsunbreak-bz-groups.verify.mjs`
5. `node tests/mhsunbreak-scenario.verify.mjs`
6. `node tests/mhsunbreak-template-v02.verify.mjs`
7. `node tests/mhsunbreak-tpl-atlog.verify.mjs`
8. `node tests/new-1005-four-machines.test.mjs`
9. `node tests/new-1005-public.verify.mjs`
10. `node tests/no-regex-lookbehind.test.mjs`（§9-106）
11. `node tests/wording-noukou.verify.mjs`
12. `node test/verify.mjs`（「サニティチェック: 全設定OK / 区間分割: 全設定OK」）
13. `node tests/new-1005-four-machines.browser.mjs`（headless Chrome）
14. `git diff --check`

ブラウザ検証（i）では次を**実測**して報告する。

- 360 / 390 / 412px で横はみ出し0、追加したタップ要素の高さが44px以上
- 経過カードの詳細に結果アイコン11ボタンが出て、押すと `pos` が入り、もう一度押すと外れる
- `t7` を記録した直後のカードに `結果：1 AT` が出ている
- BZ成功の直後に「直前のAT間（AT当選で終了）」が出て、そのカードの詳細から結果アイコンを押せる
- 差し込みで順序が入れ替わり、BZ番号が数え直され、集計の数字が動かない
- `console` のエラーが0件

既存テストの期待値は、**この指示書で変えた仕様の分だけ**更新してよい。
共通ファイル不変・他機種不変・カード不変・テンプレのバイト一致は維持する。

---

## 9. 検収用テスト版（§9-108。`main` へ直接）

本番ファイルは変えずに、別URL・別保存キーのテスト版を `main` に直接足す。

- `mhsunbreak-test-checker.html` … 本番HTMLの写し。変更点は次だけ。
  - `<title>` / `og:title` の先頭に `【テスト版】`
  - `<meta name="robots" content="noindex,nofollow">`
  - `canonical` / `og:url` を `https://slot-tools.jp/mhsunbreak-test-checker.html`
  - ヘッダー直下の注意書き1行（前回と同じもの）
    `テスト版です。記録は本番と別に保存されます。`
  - `<script src="checker-data/mhsunbreak-test.js?v=20261010-ext1">`
  - `CheckerEngine.mount(CheckerConfigs["mhsunbreak-test"])`
- `checker-data/mhsunbreak-test.js` … **改修後の `checker-data/mhsunbreak.js` の写し**。
  変更点は次の3つだけ（`diff` が3行になること）。
  - `const ID="mhsunbreak-test";`
  - `const STORAGE_KEY='mhsunbreak-checker-v1-test';`
  - `window.CheckerConfigs["mhsunbreak-test"]={`
  （`PREFS_KEY` と `PRE_EXT_KEY` は `STORAGE_KEY` から作るので自動で `-test` 系になる）
- 保存キーは**前回のテスト版と同じ** `mhsunbreak-checker-v1-test` にする。
  夢爽・ネネの手元に残っている前回の検収データがそのまま読まれるので、
  **「既存の記録が1件も失われない」ことを実データで確認できる**。
- `sitemap.xml` / `checkers.html` / `index.html` からの導線は**張らない**。

---

## 10. 公開の段取り

1. ミコトが `feat/mhsunbreak-ext-records` で本番側を実装し、commit まで（push はしない）
2. ツムギが差分をレビューし、検証を再現
3. テスト版を `main` へ直接 push（ツムギ）→ テスト版URLを夢爽・ネネへ報告
4. 夢爽・ネネの検収
5. 本番反映PR … `main` を取り込み、**テスト版2ファイルの削除を含めて** PR 作成まで（ツムギ）
6. `night-merge` ラベルと閉店後のマージは**夢爽の指示後**（保存項目が増えるため §9-108）

---

## 11. 守ること

- 指示書の範囲外のUI変更（配置・文言・色・サイズ）は**実装前にツムギへ確認する**。
  動作の修正・検証の追加は自由。
- 受け取った文言は原文のまま使う。整形・言い換え・コメント削除をしない。
- 共通ファイル（`checker-engine.js`）は変更しない。必要になったら止めて報告する。
- `IDEAS.md` は**末尾に次の1行を足すだけ**（全文差し替え禁止。他チャットが同時に触る）。

```
- [ ] 2026-10-10 モンハンサンブレイク BZ：出来事の種類変更は未実装（削除→差し込みで代替）。結果アイコン（pos）は経過カードの詳細から、サイドランプは「示唆・福引・その他」から記録する。保存は atLog.schemaVersion:2 で、知らない種類・知らない項目は読み捨てずに保持する。拡張前の控えは mhsunbreak-checker-v1-pre-ext に1回だけ。実装指示書は docs/specs/mhsunbreak-ext-records-v01.md。
```

- 検証の証跡をリポジトリにコミットしない（`artifacts/` を作らない。`CHECKER_ARTIFACTS` の既定から変えない）。
- push・PR作成はツムギが行う。ミコトは commit まで。
