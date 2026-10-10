# モンハンサンブレイク BZタブ 入力導線の改善（現在の状況／ここから記録／BZ①②③）実装指示書 v01

- 依頼: 夢爽（2026/10/10 承認済み）。元は台帳「スマホ検収追加指摘｜2026-10-10 ネネ：入力導線と現在状況」の改善案1〜5
- 中継・検収: ツムギ
- 実装: ミコト
- 作業ディレクトリ: `C:\Users\homur\slot-tools`
- ブランチ: `feat/mhsunbreak-ext-records`（PR #39。`docs/specs/mhsunbreak-ext-records-v01.md` の続き）
- commit名義: 実装者に合わせる

**この指示書は「画面の見せ方と入力の流れ」だけを変える。**
保存形式（`atLog` / `schemaVersion` / イベントのキー）・集計（`bzT1` / `bzT2` / `questN1` / `questN2`）・
候補計算の規則（`scenarioCandidates`）・なな様テンプレ v05 の出力・カードの描画・
台帳 S01（シナリオH濃厚は候補がちょうど {H} のときだけ）・S02（差し込み中はAT当選系を受け付けない）は
**1バイトも変えない。**

---

## 0. やらないこと（違反はそれだけで差し戻し）

1. **指示書に無いUIの変更を自分の判断で足さない。** 見た目を直したくなったら実装せずに報告する
   （動作の修正・検証の追加は従来どおり自由）
2. 保存データの形・キー・キーの順を変えない（`normalizeState` の冪等＝バイト一致を壊さない）
3. `scenarioCandidates` / `SCENARIOS` / `TABLE_LEVELS` / `EYE_MIN` / `SERIF_LEVELS` / `SCENARIO_MAX` を変えない
4. `template` / `compactTemplate` / `scenarioCardModel` / `drawScenarioCard` / `card` の出力を変えない
5. `checker-engine.js` を変えない（共通ファイル。§9-71）
6. 差し込み（`atInsert` / `atInsertCancel` / `insertTarget` / `addAtEvent`）・削除（`atDel`）・
   減算モード・「↩ 取消」の挙動を変えない
7. `-pre-ext`（`backupPreExt`）に触らない
8. 本番URL（slot-tools.jp）で保存を伴う操作をしない（検証はローカルサーバ＋headless Chrome）

---

## 1. 変更対象ファイル（これ以外は1バイトも変更しない）

| ファイル | 変更 |
|---|---|
| `checker-data/mhsunbreak.js` | 本体（§3・§4） |
| `mhsunbreak-checker.html` | `?v=20261010-8` → `?v=20261010-9` のみ（§9-107） |
| `mhsunbreak-guide.html` | BZタブの説明を実装に合わせる（§7・§9-101） |
| `tests/mhsunbreak-ext-records.verify.mjs` | §5.1 の2か所だけ |
| `tests/mhsunbreak-input-flow.verify.mjs` | 新規（§5.2） |
| `tests/mhsunbreak-input-flow.browser.mjs` | 新規（§5.3） |
| `IDEAS.md` | 末尾に1行追記（§8）。既存行は触らない |

`checker-data/mhsunbreak-test.js` と `mhsunbreak-test-checker.html`（検収用テスト版）は
**このブランチには無い。** main 側の追随はツムギが別コミットで行うので、ミコトは触らない。

---

## 2. 画面の構成

### 2.1 いまの並び（`pageBZ`）

```
<style>
このAT間      ← 開始・次のBZ・アイキャッチ／示唆1行／シナリオ1行／［開始］の選択ボタン8個
経過          ← 横スクロールのカード／押したカードの詳細（削除・結果アイコン・前に追加）
BZを記録      ← テーブル①〜⑦ → 計上先 → ［成功］［失敗］
示唆・福引・その他（折りたたみ）← アイキャッチ6／セリフ4／福引2／ランプ8／BZ以外でAT
集計（折りたたみ）
過去のAT間（折りたたみ）
コピー設定（折りたたみ）
```

（`BZシナリオカード` はカードタブ側の `scenarioSection` なので、この指示書の対象外）

### 2.2 変えたあとの並び

```
<style>
［現在の状況］        ← 1つの太枠。読む所（§3.2）
   開始／次のBZ／アイキャッチ
   アイキャッチの示唆（1行）
   シナリオ候補（1行・§3.6）
   経過（横スクロールのカード）
   最新の記録（1行）
   押したカードの詳細（削除・結果アイコン・前に追加）← 訂正の導線は維持
［ここから記録］      ← 入力する所（§3.3）
   このAT間の開始（canAtStart のときだけ）
   入口1 BZ（ブレイクゾーン）        ← 1 テーブル → 2 結果アイコン → 3 成功／失敗（§3.4）
   入口2 アイキャッチ（ステージチェンジ）
   入口3 チッチェのセリフ
   入口4 アイルー福引
   入口5 BZ終了時PUSH ランプ
   そのほか（BZ以外でAT）
   共通の補足（1行）
集計（折りたたみ・現状のまま）
過去のAT間（折りたたみ・現状のまま）
コピー設定（折りたたみ・現状のまま）
```

`pageBZ` の組み立ては
`</style>` ＋ `nowSection(ctx)` ＋ **新設の記録セクション** ＋ `totalsSection(ctx)` ＋
`pastSection(ctx)` ＋ `prefsSection()` になる（`historySection` と `extrasSection` は無くなる）。

- 折りたたみ `示唆・福引・その他`（`foldSection('extras',…)`）は**なくす**。中身は入口2〜5と「そのほか」に出す。
  `bzFold` の `extras` キーも消す（`totals` / `past` / `prefs` は残す）
- `<section class="sec">` の数は **2つだけ増やさない**。「現在の状況」で1つ、「ここから記録」で1つ。
  入口は `<div class="entry">` にする（`section.sec` を増やすと engine のジャンプナビ条件
  （`.crow` を含む `section.sec` が3つ以上）に掛かる。いまは掛かっていないので、掛けてはいけない）

---

## 3. 実装詳細

### 3.1 画面だけの一時状態（保存しない。再読み込みで消える）

既存の `pickTable` / `pickGroup` / `openEvent` / `insertBefore` / `insertShifted` / `insertRejected` に加える。

```js
let pickPos=null;        // 「BZを記録」の 2 で選んでいる位置（1〜10）。null＝未記録
let pickPosOpen=true;    // 2 の一覧を開いているか（選んだら閉じる）
let posEditOpen=false;   // 経過カードの詳細で結果アイコンの一覧を開いているか
let savedNote=null;      // 「記録しました：…」の1行。次の操作で消える
```

- `pickPos` / `pickPosOpen` は**保存しない・取消の履歴に積まない**
- `pickPos` は `pickTable` が変わったら必ず `null`、`pickPosOpen` は `true` に戻す（**前の結果を次のBZへ流用しない**）
- `savedNote` は「③を押して記録できたとき」だけ立て、**他のアクションの先頭で必ず `null` に戻す**
  （`bzPick` / `bzPickPos` / `bzPickPosOpen` / `bzPosOpen` / `bzGroup` / `bzFold` / `atOpen` /
  `atInsert` / `atInsertCancel` / `atStart` / `atEvent` / `atDel` / `bzPos` / `tplAtLog` / `scenarioCard`）

### 3.2 現在の状況（`nowSection`）

いまの `nowSection` と `historySection` を1つにまとめる。**読む所なので、入力と同じ選択ボタン群を置かない。**

- 置くもの: 開始／次のBZ／アイキャッチの3セル、アイキャッチの示唆1行、シナリオ候補1行、
  経過カード、最新の記録1行、押したカードの詳細、経過の補足1行
- 置かないもの: `［開始］`の8ボタン（→ §3.3 の「このAT間の開始」へ移す）
- 残すもの: 経過カードを押して開く詳細の `［削除］` `［このカードの前に追加］` `結果アイコン`（訂正の導線）

DOM（**既存の正規表現検証が読む所は1文字も変えない**）:

```html
<section class="sec"><div class="now-box">
  <div class="now-h">現在の状況</div>
  <div class="now-grid">
    <div class="now-cell"><small>開始</small><b>…</b></div>
    <div class="now-cell"><small>次のBZ</small><b>…</b></div>
    <div class="now-cell"><small>アイキャッチ</small><b…>…</b></div>
  </div>
  （アイキャッチがあれば）<div class="now-note" style="color:…">示唆</div>
  （シナリオ候補の1行。§3.6）
  <div class="now-sub">経過（古い順。右が最新）</div>   ← 直前のAT間を見ているときは「経過（直前のAT間・AT当選で終了）」
  <div class="ev-scroll" id="evScroll"><div class="ev-track">…カード…</div></div>
  <div class="now-last">最新：BZ2回目 ③ ライゼクス 失敗</div>
  （カードを押しているときだけ）詳細
  <div class="hint">…経過の補足…</div>
</div></section>
```

- 3セル・示唆1行・開始の文言・`now-cell` / `now-note` の markup は**現状のまま**
  （`tests/mhsunbreak-at-log.verify.mjs` の `startCell` / `topEye` がこの形を読む）
- `now-grid` と候補の行は **`currentAt(S)`**（＝今のAT間）で作る。カード・詳細・最新の記録は
  **`historyView(S)`** で作る。いまのコードと同じ使い分けを崩さない
- 「経過」の見出しは `sec-h` ではなく `now-sub` にする。`サブ`の文言は上記のとおり
  （いまの `<span class="sub">古い順。右が最新</span>` / `直前のAT間（AT当選で終了）` を括弧に移す）
- 「最新の記録」は `historyView(S).session` の **最後の `shownEvent`** を `atEventText` で出す。
  1件も無ければ `<div class="now-last none">最新：まだありません</div>`
- 経過カードが0件のときは `ev-scroll` を出さず、いまと同じ
  `<div class="hint">まだありません。下の「BZを記録」から押してください。</div>` を出す
  （文言はそのまま。「下の」で位置が合う）
- 経過の補足（カードが1件以上のとき）はいまの文をそのまま使う。
  **`テーブル別の回数は減算モードで直してください（集計の中のボタン）。` を含む文は消さない**（検証が固定している）
- `openEvent` / `insertBefore` の掃除（`shownEvent` でなくなったら閉じる、閉じたAT間では差し込みを外す）は
  いまの `historySection` の先頭にある処理をそのまま持ってくる。`evScroll` の右端送り（`setTimeout`）も同じ

### 3.3 ここから記録

```html
<section class="sec">
  <div class="rec-h">ここから記録</div>
  （canAtStart のときだけ）
  <div class="entry"><div class="entry-h">このAT間の開始</div>
    <div class="at-pick">…atStart の8ボタン（現状のまま）…</div>
    <div class="hint">据え置きの朝一は前日のAT間の続きなので、［途中から］を選んでください。シナリオは設定変更時とAT終了時に選ばれます。</div>
  </div>
  <div class="entry"><div class="entry-h">BZ（ブレイクゾーン）</div> …§3.4… </div>
  <div class="entry"><div class="entry-h">アイキャッチ（ステージチェンジ）</div>
    <div class="at-pick">…EYE の6ボタン（現状のまま）…</div>
    <div class="hint">アイキャッチはステージチェンジで出ます。滞在しているBZシナリオを示唆します（AT終了画面の設定示唆とは別の記録です）。</div>
  </div>
  <div class="entry"><div class="entry-h">チッチェのセリフ</div>
    <div class="at-pick">…SERIF の4ボタン（現状のまま）…</div>
    <div class="hint">ボタンにセリフの見分けどころを併記しています。示唆は次回のBZレベルについてのものです。</div>
  </div>
  <div class="entry"><div class="entry-h">アイルー福引</div>
    <div class="at-pick">…成功／失敗（現状のまま）…</div>
    <div class="hint">福引の成功はこのAT間を閉じます。BZ番号はブレイクゾーンの当選回数で数え、アイルー福引は数えません。</div>
  </div>
  <div class="entry"><div class="entry-h">BZ終了時PUSH ランプ</div>
    <div class="at-pick lamp-pick">…LAMPS の8ボタン（現状のまま）…</div>
    <div class="hint">解析が出るまで色だけ記録します。</div>
  </div>
  <div class="entry"><div class="entry-h">そのほか</div>
    <div class="at-pick one">…［BZ以外でAT］（現状のまま）…</div>
    <div class="hint">押すとそのAT間を閉じて次のAT間を始めます。BZの成功・福引の成功も同じようにAT間を閉じます。</div>
  </div>
  <div class="hint">減算モードではアイキャッチ・セリフ・福引・ランプ・［BZ以外でAT］は記録できません。設定推測には使いません。出典は一撃様です。</div>
</section>
```

- 入口の見出しは `entry-h`（17px・§4）。**入口を小さな見出しに埋めない**
- ボタンの `data-action` / `data-t` / `data-c` / `data-r` / `style` / `aria-label` / `disabled` は
  いまの `extrasSection` のものを**そのまま**使う（検証が `data-t="lamp" data-c="white"` 等を読む）
- `解析が出るまで色だけ記録します。` は1文字も変えない（検証が固定している）
- 入口に番号（①②…）は振らない。丸数字は **テーブル①〜⑦** に使っているので衝突させない
- 補足は `.hint` に入れるだけでよい。engine が先頭の短い文だけ残して
  「説明を見る」に畳む（§9-97）。先頭の1文は30字以内にする

### 3.4 BZ入口（順番を 1 → 2 → 3 に変える）

```html
（差し込み待ちのとき）insert-bar ＋ 断り1行（現状のまま）
（直前に記録できたとき）<div class="saved-note">記録しました：BZ2回目 ③ ライゼクス 失敗</div>

<div class="step-h">1. スタートのテーブル</div>
<div class="t-pick">…①〜⑦の7ボタン（data-action="bzPick"・現状のまま）…</div>

減算モードのとき:
  <div class="hint">減算モードでは記録できません。回数の訂正は下の「集計」の中のボタンで行います。</div>
  （2・3 は出さない）

加算モードのとき:
  開始が分かっている: <div class="mn calc">→ 2回目以降に計上（BZ2回目）</div>
  開始が不明:        <div class="bz-sub">どちらに計上するか</div><div class="at-pick">…bzGroup の2ボタン…</div>

  テーブル未選択: <div class="crow pick-row"><div class="lbl"><div class="nm">テーブルを選んでください</div></div><div class="cycle-actions"></div></div>

  テーブル選択済み:
    <div class="pick-sum">選んだテーブル：③ ライゼクス（BZ2回目）</div>
    <div class="step-h">2. 結果アイコン（任意）</div>
      …§3.4.1…
    <div class="step-h">3. 成功／失敗</div>
    <div class="crow pick-row"><div class="lbl"><div class="nm">③ ライゼクス</div></div>
      <div class="cycle-actions">…［成功］［失敗］（⑦は［＋］だけ）・data-action="bzQuest"・現状のまま…</div></div>

<div class="hint">BZ開始時のアイコン1個目でテーブルが決まります。…（§3.4.3）…</div>
```

- `<div class="mn calc">→ …</div>` の**文言と class は1文字も変えない**
  （`tests/mhsunbreak-at-log.verify.mjs` の `calc()` と `tests/mhsunbreak-ext-records.verify.mjs` の g2 が読む）
- `pick-sum` の BZ番号は `nextBzTarget(S).no` を使う。`no===null` のときは `（BZ番号なし）`
- `［成功］［失敗］` のボタンは **1組だけ**（加算モードで `data-action="bzQuest"` が2個、⑦なら1個）。
  `tests/mhsunbreak-bz-groups.verify.mjs` が個数を固定している
- 減算モードでは `t-btn` を `disabled` にする（現状のまま）

#### 3.4.1 2. 結果アイコン

**テーブル⑦のとき**（配列の1個目が AT で、記録時に `pos:1` が入る）:

```html
<div class="pos-fixed">位置1 AT を自動で記録します</div>
```
一覧も［未記録で進む］も出さない。

**①〜⑥のとき**:

- 一覧を開いている（`pickPosOpen===true`、初期状態）
  ```html
  <div class="pos-pick">
    …そのテーブルの配列だけ10個…
    <button type="button" class="pos-btn" data-action="bzPickPos" data-pos="3" aria-pressed="false" aria-label="位置3 QUEST黄">3：QUEST黄</button>
    …
    <button type="button" class="pos-btn" data-action="bzPickPos" data-pos="" aria-pressed="false" aria-label="結果アイコン 未記録で進む">未記録で進む</button>
  </div>
  ```
  - 属性の順は `data-action` → `data-pos` → `aria-pressed` → `aria-label`（検証がこの順で読む）
  - ボタンの文字は `${pos}：${アイコン名}`（例 `3：QUEST黄`）。アイコン名は `TABLE_ICONS[table]` の値をそのまま
  - **選んだテーブルの配列だけを出す。** 他のテーブルの配列は1つも出さない
  - 既に `pickPos` が入っている位置は `aria-pressed="true"` ＋ `class="pos-btn on"`
- 一覧を閉じている（`pickPosOpen===false`）
  ```html
  <div class="pos-done"><div class="nm">選択済み：3個目・黄</div>
    <button type="button" class="cycle-btn" data-action="bzPickPosOpen">変更</button></div>
  ```
  - `3個目・黄` の「黄」は `ICON_SHORT`（経過カードの `結果：3 黄` と同じ短い名前）
  - `pickPos===null` で閉じているとき（［未記録で進む］を押したあと）は `選択済み：未記録`

#### 3.4.2 アクション（§9-72：減算モードの挙動を明記する）

| action | data | すること | 減算モード | 取消の履歴 | 保存 |
|---|---|---|---|---|---|
| `bzPick` | `q` | `pickTable` を入／切。**必ず** `pickPos=null` `pickPosOpen=true` `openEvent=null` `posEditOpen=false` `savedNote=null` にして `rerender()` | 受け付けない（`false`） | 積まない | しない |
| `bzPickPos` | `pos` | `pos===''` → `pickPos=null`／`1〜10` → `pickPos=pos`。どちらも `pickPosOpen=false` にして `rerender()`。`pickTable` が無い・範囲外は `false` | 受け付けない（`false`） | 積まない | しない |
| `bzPickPosOpen` | — | `pickPosOpen=true` にして `rerender()` | 受け付けない（`false`） | 積まない | しない |
| `bzQuest` | 現状のまま | §3.4.4 | 現状のまま（集計だけ戻す） | 積む | する |
| `bzPosOpen` | — | `posEditOpen=true` にして `rerender()`。詳細を開いていなければ `false` | 受け付けない（`false`） | 積まない | しない |
| `bzPos` | 現状のまま | 現状のまま ＋ 押したあと `posEditOpen=false` | 現状のまま（`false`） | 積む | する |
| `atOpen` | 現状のまま | 現状のまま ＋ `posEditOpen=false` | 現状のまま | 積まない | しない |

- `bzPick` / `bzPickPos` / `bzPickPosOpen` / `bzPosOpen` は**画面だけの操作**なので、
  必ず `rerender()`（＝`false` を返す）で終える。engine の `customAction` は `false` を受けると
  履歴にも保存にも触らない

#### 3.4.3 3. ［成功］［失敗］を押したとき（`bzQuestAction` の加算側）

いまのコードに **`pos` の受け渡しと一時状態の後始末だけ**を足す。

```js
// テーブル⑦はAT濃厚で、結果アイコンは必ず位置1（配列の1個目がAT）なので既定で入れる。
// ①〜⑥は「2. 結果アイコン」で選んだ位置を、選んでいればここで1件に含める。
const event={t:'bz',table:id,r:ds.r};
if(id==='t7')event.pos=1;
else if(Number.isInteger(pickPos)&&pickPos>=1&&pickPos<=ICON_POS_MAX)event.pos=pickPos;
```

- **キーの順は `t` → `table` → `r` → `pos` に固定する**（いまの⑦の literal と同じ順。
  保存の冪等＝バイト一致がキー順に依存する）
- 記録できたとき（`addAtEvent` が成功した後）に
  `pickTable=null; pickPos=null; pickPosOpen=true;` と
  `savedNote='記録しました：'+atEventText(session,index);` を立てる
- 差し込み中にAT当選系を押したとき（`rejectInsert()` を返す経路）は
  **`pickTable` も `pickPos` も消さない・`savedNote` も立てない**（台帳 S02 の挙動は変えない）
- `atGroupAllowed` / `addAtEvent` が `false` のときも一時状態を消さない
- `afterRecord` に `posEditOpen=false;` を足す（記録直後の詳細は、
  `pos` があれば「選択済み：…／変更」、無ければ一覧が開いた状態になる）
- 減算側（`ctx.mode<0`）は1行も変えない

#### 3.4.4 補足（`.hint`）の文

いまの長い補足のうち、順番を説明している1文だけを差し替える。他の文は順番も含めてそのまま。

- 差し替え前: `並んだアイコンの1個目でテーブルを選び、BZとその後のクエストが終わったら、ATに当選したかで［成功］［失敗］を押してください。`
- 差し替え後: `1でテーブル、2で結果アイコン（押さなくてもかまいません）、3で［成功］［失敗］の順に押します。BZとその後のクエストが終わってから、ATに当選したかで押してください。`

結果アイコンの説明（いまは経過カードの詳細側にある `posPicker` の補足）を、
BZ入口の補足の**最後**に1文だけ足す:

- `結果アイコンは、ブレイクゾーンの結果が並んだアイコンの何個目で出たかの記録です。11個目はどのテーブルでも猛焔一閃なので置いていません。テーブル別の成功／回数・テンプレ・シナリオの候補には使いません。`

`posPicker`（経過カードの詳細側）の補足は現状のまま残す。

### 3.5 経過カードの詳細（結果アイコンの訂正も「選んだら閉じる」）

`posPicker(e,index,minus)` を、開閉のある形に変える。

- 一覧を出す条件: `posEditOpen===true` **または** `!e.pos`（まだ記録が無い）
- 一覧を出すときの中身・属性・文言は**現状のまま**（`data-action="bzPos" data-index="…" data-pos="…"
  aria-pressed="…" aria-label="位置N アイコン名"`、末尾に `未記録`、見出し `結果アイコン`、補足もそのまま）
- 一覧を閉じているとき（`e.pos` があり `posEditOpen===false`）:
  ```html
  <div class="bz-sub">結果アイコン</div>
  <div class="pos-done"><div class="nm">選択済み：7個目・AT</div>
    <button type="button" class="cycle-btn" data-action="bzPosOpen"…>変更</button></div>
  ```
  - 見出し `結果アイコン` は残す（`tests/mhsunbreak-ext-records.verify.mjs` の i が読む）
  - 減算モードでは `変更` を `disabled aria-disabled="true"` にする
- `bzPos` で位置を押したら `posEditOpen=false`（＝閉じる）。
  同じ位置をもう一度押して未記録に戻したときは `e.pos` が無くなるので一覧が開いた状態になる
- `atOpen` で別のカードを開いた／閉じたときは `posEditOpen=false`

### 3.6 シナリオ候補の1行（`scenarioLine`）

いまは「ちょうど {H} のとき」と「0件のとき」しか出していない。4通りに増やす。
**候補の計算（`scenarioCandidates`）は1行も変えない。出し方だけを変える。**

| 状態 | 画面に出す文 | class |
|---|---|---|
| 開始が不明（`session.start.known!==true`） | `BZ番号が不明のため絞り込めません` | `at-sc unknown` |
| 候補が0 | `該当なし：開始の選び方・記録を確認してください`（`NO_CANDIDATE_TEXT` のまま） | `at-sc none` |
| 候補が1つ（H） | `シナリオH濃厚：3回目のBZでAT濃厚`（現状のまま） | `at-sc` |
| 候補が1つ（H以外） | `シナリオ{名前}濃厚`（例 `シナリオG濃厚`） | `at-sc` |
| 候補が2つ以上 | `候補：A・B・C・D・E・F・G・H・I`（`・` 区切り） | `at-sc cand` |

- 判定の順番も上の表のとおり（**開始不明が最優先**）。
  開始不明のときは BZ による絞り込みをしていないので、候補の数に関わらずこの1行だけを出す
- 順位・確率・「確定」は出さない。「濃厚」止まり（§9-103）
- `NO_CANDIDATE_TEXT` の定数と文言は変えない（BZシナリオカードの描画が同じ定数を使っている）
- `scenarioOnlyH` / `scenarioNone` の役割は変えない。カード（`scenarioCardModel.scenarioH`）と
  テンプレ（`ｼﾅﾘｵH濃厚`）は**この変更の影響を受けない**
- `scenarioLine` は「現在の状況」と「過去のAT間」（`atSummary`）の両方で使う。両方に同じ文が出る

### 3.7 変えない関数（名前も中身も）

`normalizeAtEvent` / `normalizeAtLog` / `normalizeState` / `addAtEvent` / `insertTarget` /
`nextBzTarget` / `atGroupAllowed` / `closesAt` / `atEventText` / `eventCard` / `bzNoAt` /
`nextBzNo` / `historyView` / `scenarioCandidates` / `scenarioCardModel` / `drawScenarioCard` /
`tplAtFlow` / `tplAtLogBlock` / `tplText` / `totalsSection` / `pastSection` / `prefsSection` /
`foldSection`（`bzFold` から `extras` を外すだけ）

---

## 4. CSS（`pageBZ` の `<style>` に足す）

既にあるクラス（`now-grid` / `now-cell` / `now-note` / `ev-scroll` / `ev-card` / `pos-pick` /
`pos-btn` / `t-pick` / `t-btn` / `at-pick` / `at-btn` / `calc` / `pick-row` / `insert-bar` / `bz-sub`）は
**値を変えない**。足すのは次だけ。

```css
/* 現在の状況（読む所。入力と見た目で分ける） */
.now-box{border:2px solid #2f5d72;background:linear-gradient(180deg,#131a22,#0f1319);border-radius:12px;padding:10px 10px 12px}
.now-h{font-size:19px;font-weight:800;color:var(--cyan);letter-spacing:.04em;margin-bottom:8px}
.now-sub{font-size:11px;font-weight:800;color:var(--muted);letter-spacing:.06em;margin:10px 0 6px}
.now-last{font-size:13px;font-weight:700;margin-top:6px;overflow-wrap:anywhere}
.now-last.none{color:var(--muted);font-weight:500}
/* ここから記録（入力する所） */
.rec-h{font-size:18px;font-weight:800;color:var(--gold);letter-spacing:.04em;margin:2px 0 10px}
.entry{background:var(--panel2);border:1px solid var(--line);border-radius:12px;padding:10px;margin-bottom:12px}
.entry-h{font-size:17px;font-weight:800;line-height:1.3;margin-bottom:8px;overflow-wrap:anywhere}
.step-h{font-size:12px;font-weight:800;color:var(--txt);letter-spacing:.06em;margin:10px 0 6px}
.pick-sum{font-size:13px;font-weight:800;color:var(--cyan);margin:0 0 6px;overflow-wrap:anywhere}
.saved-note{font-size:13px;font-weight:800;color:#8fe3b0;margin-bottom:8px;overflow-wrap:anywhere}
.pos-fixed{font-size:13px;font-weight:700;color:var(--muted);margin-bottom:6px}
.pos-done{display:flex;align-items:center;gap:8px;margin-bottom:6px}
.pos-done .nm{flex:1;min-width:0;font-size:14px;font-weight:800;overflow-wrap:anywhere}
.at-sc.cand{font-size:13px;font-weight:800;color:var(--cyan);margin:0 0 6px;overflow-wrap:anywhere}
.at-sc.unknown{font-size:12px;font-weight:700;color:var(--muted);margin:0 0 6px}
```

- `.at-sc` と `.at-sc.none` は既にある。値を変えない
- 入口の見出しは **16px以上**（17px）。`entry-h` の値を下げてはいけない
- タップできる要素は engine の `#main button{min-height:44px}` が効くので、
  新しく置くボタンは `cycle-btn` / `pos-btn` / `at-btn` のどれかを使う（独自の button を素で置かない）
- 360px で横にはみ出す要素を作らない。横スクロールは `ev-scroll` の中だけ

---

## 5. テスト

### 5.1 既存テストの変更（この2か所だけ。他の行は触らない）

`tests/mhsunbreak-ext-records.verify.mjs` の `test('f. …')`:

1. 7テーブル×10位置の照合は**経過カードの詳細側**（`data-action="bzPos"`）で続ける。
   ⑦は記録した時点で `pos:1` が入り一覧が閉じるので、**`act(S,'bzPosOpen',{})` を1回挟んでから**
   `page(S)` を読む。`n===70` は変えない
2. `assert.ok(html.includes('>未記録</button>'),…)` は⑦のときだけ
   `assert.ok(html.includes('選択済み：1個目・AT'),…)` に読み替える（一覧を開く前に確認する）

他のアサート（`S7.…pos===1` / `S6` の押し直し・範囲外・減算モード）は**そのまま通る**。
通らなくなった場合は実装側を直す（テストを緩めない）。

### 5.2 新規 `tests/mhsunbreak-input-flow.verify.mjs`

既存の `tests/mhsunbreak-ext-records.verify.mjs` の読み込み方（`vm.runInNewContext` ＋
`page(S)` ＋ `act(S,name,ds,mode)`）をそのまま流用する。各 test は `console.log('PASS …')` を出し、
最後に件数を出す。**1件も `assert` を緩めない。**

1. `新しい順番で 1→位置3→失敗 が1件になる`
   - `bzPick{q:'t1'}` が `false`（画面だけの操作）
   - `bzPickPos{pos:'3'}` が `false`
   - `bzQuest{d:'bzT1',n:'questN1',q:'t1',r:'miss'}` が文字列を返す
   - `S.atLog.sessions[0].events` が **`[{t:'bz',table:'t1',r:'miss',pos:3}]` と `deepEqual`**
   - `JSON.stringify(events[0])` が `'{"t":"bz","table":"t1","r":"miss","pos":3}'`（キー順の固定）
   - `S.bzT1.t1===1` / `S.questN1.t1===0` / `S.atLog.sessions.length===1`
   - `normalizeState` を2回かけてバイト一致（冪等）
   - 記録後の `page(S)` に `記録しました：BZ1回目 ① 青スタート 失敗` が出て、
     `1. スタートのテーブル` の選択が外れている（`class="t-btn on"` が無い・`選択済み：` が無い）
2. `［未記録で進む］では pos を付けない`
   - `bzPick{q:'t1'}` → `bzPickPos{pos:''}` → `page(S)` に `選択済み：未記録` と `data-action="bzPickPosOpen"`
   - `bzQuest{…r:'miss'}` → `events[0]` が `{t:'bz',table:'t1',r:'miss'}`（`pos` キーが無い）
3. `結果アイコンを選んだら一覧が閉じる`
   - `bzPick{q:'t1'}` 直後の `page(S)` に `data-action="bzPickPos"` が **11個**（10位置＋未記録で進む）
   - `bzPickPos{pos:'3'}` のあとは `data-action="bzPickPos"` が **0個**、`選択済み：3個目・黄` と
     `data-action="bzPickPosOpen"` が1個
   - `bzPickPosOpen` のあとは再び11個、`data-pos="3" aria-pressed="true"` が1個
4. `テーブルを選び直すと前の選択と前の詳細が消える`
   - `bzPick{q:'t1'}` → `bzPickPos{pos:'3'}` → `bzQuest{…r:'miss'}`（記録直後は詳細が開く）
   - このとき `page(S)` に `結果アイコン` が出ている（詳細が開いている）
   - `bzPick{q:'t2'}` のあとの `page(S)` で
     - `結果アイコン` が出ていない（＝①の詳細が閉じた）
     - 「2. 結果アイコン」の一覧に **`QUEST青` が1つも無い**（②の配列は 黄・ライ・セル・オロ・テオ）。
       判定は `pos-pick` のブロックだけを切り出して行う（ページ全体で `QUEST青` を探さない）
     - `data-pos="3" aria-pressed="true"` が無い（前の位置を流用していない）
5. `テーブル⑦は位置1を自動で入れる`
   - `bzPick{q:'t7'}` の `page(S)` に `位置1 AT を自動で記録します` が出て、
     `data-action="bzPickPos"` が0個、`data-action="bzQuest"` が1個（［＋］だけ）
   - `bzQuest{d:'bzT1',n:'questN1',q:'t7',r:'win'}` → `events[0].pos===1`
6. `シナリオ候補の4通り`（`page(S)` に出る文で固定する）
   | データ | 期待する文 |
   |---|---|
   | ③失敗（開始＝リセット後） | `候補：A・B・C・D・E・F・G・H・I` |
   | ⑤失敗 | `シナリオG濃厚` |
   | ①失敗→②失敗 | `シナリオH濃厚：3回目のBZでAT濃厚` |
   | ①失敗→⑤失敗 | `該当なし：開始の選び方・記録を確認してください` |
   | 開始＝不明 ＋ ①失敗 | `BZ番号が不明のため絞り込めません` |
   - 開始不明のときは `候補：` も `該当なし` も `濃厚` も出ないことまで確認する
   - カード側（`scenarioModel(S).rows[0].candidates`）が上の表と矛盾しないことも併せて確認する
     （③失敗＝9件／⑤失敗＝`['G']`／①②＝`['H']`／①⑤＝`[]`）
7. `入口と現在の状況の見出しが揃っている`
   - `page(S)` に `>現在の状況<` `>ここから記録<` が各1個
   - 入口の見出し5つ（`BZ（ブレイクゾーン）` `アイキャッチ（ステージチェンジ）` `チッチェのセリフ`
     `アイルー福引` `BZ終了時PUSH ランプ`）が `class="entry-h"` として各1個
   - `示唆・福引・その他` という折りたたみが無い（`data-k="extras"` が0個）
   - `data-k="totals"` / `data-k="past"` / `data-k="prefs"` は各1個のまま
   - `<section class="sec">` の数が **2**（現在の状況・ここから記録）
8. `減算モードでは1・2・3を押せない`
   - `page(S,-1)` で `t-btn` が全部 `disabled`、`data-action="bzPickPos"` が0個、
     `data-action="bzQuest"` が26個（集計の訂正だけ）
   - `act(S,'bzPick',{q:'t1'},-1)` / `act(S,'bzPickPos',{pos:'3'},-1)` /
     `act(S,'bzPickPosOpen',{},-1)` / `act(S,'bzPosOpen',{},-1)` が全部 `false`
9. `最新の記録`
   - 記録が無いとき `最新：まだありません`
   - ①失敗→②失敗 のあと `最新：BZ2回目 ② 黄スタート 失敗`

### 5.3 新規 `tests/mhsunbreak-input-flow.browser.mjs`

`tests/new-1005-four-machines.browser.mjs` の CDP ハーネス（ローカル http サーバ＋
`<iframe>` の実ビューポート＋`measure()`）を**そのまま流用**する。`CHECKER_ARTIFACTS` の既定は
**リポジトリの外**（`os.tmpdir()`）にする。リポジトリ内に出力を書かない。

1. 幅 **360 / 390 / 412px** × BZタブ（`[data-p="2"]`）で
   - 横にはみ出す要素が **0件**（`ev-scroll` の中は除外。既存 `measure()` と同じ判定）
   - 見えている `button` の実測高さが全部 **44px以上**
   - `.entry-h` 5つの `fontSize` が **16px以上**
   - `#main` の `scrollHeight` を記録して**報告に書く**（縦の長さ。3幅ぶん）
   - スクリーンショットを artifacts に保存
2. 実操作（390px）
   - `1` のテーブル③ → `2` の位置3 → `3` の［失敗］をクリック
   - `localStorage` の `atLog.sessions[0].events` が `[{t:'bz',table:'t3',r:'miss',pos:3}]`
   - `#undoBtn` を **1回** 押すと `events` が空・`bzT1.t3` が0に戻る
   - `2` を押した時点で `.pos-pick` が消えて `.pos-done` が出ている
   - `3` のあと `.saved-note` が出て、`.t-btn.on` が無い
3. コンソールエラー・未捕捉例外が0件

---

## 6. 検証（全部やって結果を報告する）

```
node test/verify.mjs
node tests/mhsunbreak-ext-records.verify.mjs
node tests/mhsunbreak-input-flow.verify.mjs
node tests/mhsunbreak-at-log.verify.mjs
node tests/mhsunbreak-bz-groups.verify.mjs
node tests/mhsunbreak-scenario.verify.mjs
node tests/mhsunbreak-template-v02.verify.mjs
node tests/mhsunbreak-tpl-atlog.verify.mjs
node tests/wording-noukou.verify.mjs
node tests/no-regex-lookbehind.test.mjs
node tests/new-1005-public.verify.mjs
node tests/new-1005-four-machines.test.mjs
node tests/mhsunbreak-input-flow.browser.mjs
node tests/new-1005-four-machines.browser.mjs
git diff --check
```

- `node --check` 相当の構文確認（`checker-data/mhsunbreak.js` は `node --check` が通る）
- 検証の出力（artifacts）を**リポジトリに入れない**。`git status` が clean になることを確認する
- 全設定サニティチェック（`test/verify.mjs`）の「全設定OK」を確認する

---

## 7. ガイドの追随（`mhsunbreak-guide.html`・§9-101）

書き換えるのは次の段落だけ。他の段落は触らない。

1. 「BZタブの並び」の段落（`上から「このAT間」「経過」「BZを記録」の3つを…`）
   → 上から「現在の状況」「ここから記録」の2つを常に出し、その下に「集計」「過去のAT間」「コピー設定」を
   折りたたみで置いている、という説明に直す。「現在の状況」には
   開始・次のBZ番号・一番強いアイキャッチ・シナリオの候補・経過（横スクロール）・最新の記録が入り、
   カードを押すと内容と［削除］・結果アイコン・［このカードの前に追加］が出ること、
   「ここから記録」には BZ・アイキャッチ・チッチェのセリフ・アイルー福引・BZ終了時PUSHランプの
   5つの入口と［BZ以外でAT］があることを書く
2. 「BZを記録」の順番の段落（`「BZを記録」は、テーブル①〜⑦を選んでから…`）
   → `1. スタートのテーブル → 2. 結果アイコン（任意） → 3. 成功／失敗` の順に直す。
   2 で選んだ位置は 3 を押したときに記録の一部として1件で保存されること、
   2 は押さなくてもよく［未記録で進む］があること、
   テーブルを選び直すと 2 の選択と開いていた詳細が消えること、
   1・2 は画面だけの操作なので「↩ 取消」に積まれず、再読み込みで消えることを書く
3. 結果アイコンの段落（`カードを押して開く詳細には「結果アイコン」があります。…`）
   → 記録するときは「BZを記録」の 2 で、あとから直すときは経過カードの詳細で押す、
   どちらも選んだら一覧が閉じて「選択済み：3個目・黄」と［変更］になる、と書き足す
4. シナリオ候補の段落（`「シナリオH濃厚：3回目のBZでAT濃厚」は…`）
   → 画面の4通り（候補が複数＝`候補：A・B・…`／1つ＝`シナリオ○濃厚`／0＝
   `該当なし：開始の選び方・記録を確認してください`／開始が不明＝
   `BZ番号が不明のため絞り込めません`）を書く。順位・確率は出さないことも書く
5. 「BZシナリオカード」の候補の段落の `これは「このAT間」や過去のAT間の要約にも同じ文で出ます。`
   → 「現在の状況」に合わせて言い換える（カード側の文は変わらない）

「現在の状況」「ここから記録」以外のタブ構成・記録項目・出典の説明は変えない。

---

## 8. `IDEAS.md`（末尾に1行だけ足す。既存行は1バイトも触らない）

```
- [x] 2026-10-10 モンハンサンブレイク BZタブの入力導線を直した（夢爽承認・ネネ指摘）。上を「現在の状況」（太枠・読む所。開始／次のBZ／アイキャッチ／シナリオ候補／経過／最新の記録）、下を「ここから記録」（BZ・アイキャッチ・セリフ・福引・PUSHランプの5入口）に分け、BZは「1 テーブル → 2 結果アイコン（任意）→ 3 成功／失敗」の順に変えた。1・2は画面だけの一時状態で、保存は3を押した1件（posを含む）。結果アイコンは選んだら一覧を閉じて「選択済み：3個目・黄／変更」にする。シナリオ候補は複数／1つ／0／開始不明の4通りを出す。保存形式・集計・候補計算・テンプレv05は不変。指示書 docs/specs/mhsunbreak-input-flow-v01.md
```

---

## 9. 報告に入れること

1. `git diff --stat` と、hunk ごとに対応する本指示書の節番号
2. §6 の検証コマンドの結果（PASS件数をそのまま貼る）
3. BZタブの `#main` の `scrollHeight`（360 / 390 / 412px の3つ）。
   **改修前の実測（記録0件・開始の選択あり・ツムギが 2026/10/10 に測った基準値）は
   360px:1894 / 390px:1861 / 412px:1845、見出しは3つとも12px、ボタン最小44px、はみ出し0、
   `section.sec` は3つ。** 同じ条件で測り直して並べて書く
4. 入口5つの見出しの実測 `fontSize`、ボタンの実測最小高さ
5. 指示書に書いていない判断をした箇所（あれば。UIの変更は実装せずに報告する）
