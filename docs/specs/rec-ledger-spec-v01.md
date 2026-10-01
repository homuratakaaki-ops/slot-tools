# tools/rec 簡易収支帳｜第1段 実装仕様（rec91）

作成：2026-09-28（シオン）
ベース：tools/rec/index.html（rec90＋F03＝6f4b762）
範囲：店舗設定・簡易収支の手入力・日別一覧への合流・二重計上の対策・JSON互換・「想定期待値」表記
範囲外：実戦記録からの変換（第2段）、実戦記録への交換条件の適用（第2段）、既存 session の money の変更（しない）

夢爽の裁定：交換条件は内部「1枚（玉）あたり円」、入力は「1,000円で何枚（玉）交換」／店舗設定は同じ保存キー／現金回収あり／パチンコは簡易収支だけ／実戦記録からの変換は手動（第2段）

---

## 1. データ

### 1-1. 保存（`slot-tools-rec` の中に追加）

```js
S = {sessions:[…], cur, settings, gen,
     stores:[…],    // 店舗設定
     entries:[…]}   // 簡易収支
```
- `fixState`（起動時）：`stores` / `entries` が無ければ `[]`。旧データはそのまま読める
- 世代番号・複数タブの凍結・壊れたデータの退避は既存のまま（同じキーなので自動で対象になる）

### 1-2. 店舗設定（store）

```js
{id, name:"DSG高岡", conds:[
  {id, kind:"slot",     label:"20円スロット", lend:50,  exchPer1000:50,  exch:20.0},   // 1000円で50枚貸出、1000円で50枚交換 → 1枚20円
  {id, kind:"pachinko", label:"4円パチンコ",  lend:250, exchPer1000:250, exch:4.0}
], createdAt, updatedAt}
```
- `exchPer1000`：入力値（1,000円で何枚・何玉交換）。`exch = 1000 / exchPer1000`（小数第2位まで）
- 等価なら `exchPer1000 === lend`。入力画面で「等価」ボタンを置くと lend をコピー
- label は自動生成でよい：`kind==="slot" ? (1000/lend が整数なら (1000/lend)+"円スロット" : lend+"枚スロット") : (1000/lend)+"円パチンコ"`。手で直せる

### 1-3. 簡易収支（entry）

```js
{id, date:"2026-09-28", kind:"slot"|"pachinko", machine:"彼女、お借りします",
 storeId, storeName:"DSG高岡",        // storeName はコピー（店舗を消しても残る）
 cond:{kind,label,lend,exchPer1000,exch}|null,   // 登録時点のコピー。店舗設定を変えても変わらない
 cashIn:20000, cashOut:0,             // 現金投資・現金回収（円）
 withdraw:460, deposit:2951,          // 引出・預入（枚 or 玉）
 memo:"", linkedSessionId:null, createdAt, updatedAt}
```

### 1-4. 収支の式

```
現金収支   = cashOut − cashIn
貯玉増減   = deposit − withdraw                    （枚 or 玉）
貯玉収支   = 貯玉増減 × cond.exch                   （cond があるときだけ。円、四捨五入）
合計収支   = 現金収支 + 貯玉収支                    （cond が無ければ現金収支のみ。貯玉増減は「＋120枚」と別表示）
```

### 1-5. 検証（validStore / validEntry）

- store：id・name が文字列、conds が配列、各 cond の kind が slot|pachinko、lend / exchPer1000 が正の有限数
- entry：id・date（YYYY-MM-DD）・kind・machine が文字列、cashIn / cashOut / withdraw / deposit が 0 以上の有限数（未入力は 0）、cond は null か上の形、linkedSessionId は null か文字列
- 取り込みは1件ずつ検証、id 重複は除外（既存の doImport と同じ流儀）

---

## 2. 画面

### 2-1. ノート上部：［＋収支を登録］

`#scNote` の「ノート（n件）」見出しの直下、既存の操作ボタン（JSON書き出し等）の上。`wide` ボタン。

### 2-2. 収支の入力シート（新規／編集 共通）

順にパチマガと同じ。

| 欄 | 型 | 既定 | 備考 |
|---|---|---|---|
| 実戦日 | 日付 | 今日 | `<input type="date">` |
| 種別 | パチンコ／パチスロ | 前回の値 | 切り替えると引出・預入の単位（玉／枚）と、店舗の条件候補が絞られる |
| 機種名 | 文字 | — | 既存の専用機種名（MACHINES の name）と、entries の履歴から候補（datalist） |
| 店舗 | 選択 | 前回の店舗 | stores から。末尾に「＋新しい店舗」→ 2-3 を開き、戻ってきたら選択済みに |
| 条件 | 選択 | 店舗の同種別の1つ目 | 店舗の conds のうち同じ kind。選ぶと cond をコピーして保持。「条件なし」も選べる |
| 現金投資 | 円 | 0 | numInput |
| 現金回収 | 円 | 0 | numInput |
| 引出 | 枚／玉 | 0 | 貯玉・貯メダルからおろした |
| 預入 | 枚／玉 | 0 | 貯玉・貯メダルに戻した |
| メモ | 文字 | — | 任意 |
| 収支プレビュー | 表示 | — | 現金収支／貯玉増減／合計。cond が無ければ「条件なしのため円換算しません」 |

- 「登録」で保存 → ノートを再描画 → toast
- 編集は同じシート。「削除」も置く（確認あり）
- 入力の検証：数値は 0 以上の整数（既存の badNum / 負値拒否）。機種名は必須。店舗は任意（無ければ storeName=null、cond=null）

### 2-3. 店舗設定シート

「投資・回収・出力」か、ノート上部の［店舗設定］から。

- 一覧：店舗名と条件の数。タップで編集
- 編集：店舗名、条件の一覧（label／貸出／交換／等価か）。「＋条件を追加」で kind と lend と exchPer1000。「等価」ボタンで exchPer1000=lend
- 削除：条件に紐づく entry があっても、entry は cond のコピーを持つので影響なし。店舗の削除は確認あり
- 収支入力シートの「＋新しい店舗」から来た場合は、登録後に入力シートへ戻す

### 2-4. 日別一覧への合流

既存の `renderNote` は sessions を日別（dayKey）にまとめる。ここに entries を混ぜる。

- entry の日付は `date`、session は `startAt` の日
- 一覧の1行：先頭に「簡易」の印（小さいバッジ）、機種名、店舗名、合計収支。タップで編集シート
- 日別見出しの合計と全体集計：
  - session の profit：`linkedSessionId` で紐づいた entry があれば**使わない**（entry の合計収支を使う）
  - 紐づいていない entry：合計収支を加算
  - cond が無い entry：現金収支だけ加算。貯玉増減は円に入れず、見出しの横に「（貯玉 ＋120枚）」と別表示
- 想定期待値の合計は session だけ（entry には無い）

### 2-5. 二重計上の対策

- 新規登録時：同じ日・同じ店舗名・同じ機種名の session（未紐づけ）があれば「この実戦記録と同じ台ですか？」と候補を出す。選べば `linkedSessionId` をセット
- 編集シートに「実戦記録との紐づけ」欄：候補（同日）から選ぶ／外す
- 紐づいた entry の一覧行には「実戦記録あり」の印。session の側にも「簡易収支あり」の印
- 第2段の「実戦記録から作る」は、作った時点で紐づける

---

## 3. 書き出し・取り込み

- 「JSONを書き出す」：`{sessions, cur, entries, stores, exportedAt}`
- 画面の「JSON」（nExpJson）：同じ形
- 「テキスト」（nExpText）：日別の並びに entry を「簡易」印付きで含める。末尾の集計も 2-4 の規則
- 取り込み：`entries` / `stores` があれば validEntry / validStore で1件ずつ。id 重複は除外。無ければ sessions だけ（旧JSON）
- 「このタブの内容を書き出す」「今すぐ書き出す」（凍結・保存失敗時）にも entries / stores を含める
- kado-note 用（toEnvelope）は session 単位なので変更なし。entry の envelope は第2段で

---

## 4. 「想定期待値」表記

表示・テキスト出力の「想定」を「想定期待値」に。保存の項目名（expected）は変えない。

| 場所 | 今 | 後 |
|---|---|---|
| 日別見出し | 想定 +1,300円（2台） | 想定期待値 +1,300円（2台） |
| 全体集計 | 想定 … | 想定期待値 … |
| sessionText の集計行 | 想定 | 想定期待値 |
| kado-note memo | 想定期待値（既にそう） | 変更なし |
| 終了シート・打ち始めの案内 | 想定 | 想定期待値 |

---

## 5. 監査ハーネスに足すケース

- P03：`stores` が配列でない／`entries` に null → 壊れた扱いで退避
- P05：`entries` に cond の形が不正なもの → その1件だけ除外、他は入る
- 新規：紐づき entry がある日の合計が session の profit を含まない／紐づきなし entry は加算／cond なし entry は現金だけ
- 新規：店舗の cond を変えても既存 entry の cond が変わらない
- 新規：旧JSON（sessions のみ）を取り込んで entries/stores が空のまま動く

---

## 6. 実装の順序（提案）

1. データ層：fixState・validStore・validEntry・書き出し／取り込み → 旧JSONで起動、監査ハーネス150件 FAIL 0 のまま
2. 店舗設定シート → 登録・編集・削除
3. 収支入力シート → 登録・編集・削除、プレビュー
4. 日別一覧への合流と集計の規則、紐づけ
5. 「想定期待値」表記
6. 監査ケースの追加 → 全部 PASS

各段で本線の既存フロー（打ち始め→当選→終了→ノート）が変わらないことを確認する。
