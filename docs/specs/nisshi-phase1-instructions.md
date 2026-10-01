# 稼働日誌（tools/nisshi/）第1段 実装指示書

作成：2026-10-01（シオン）
正本の仕様書：nisshi-spec-v03.md（確定版）。この指示書は第1段（§8 の1段目）だけ
実装：Codex に委任（Mikoto 名義）。指示書外の UI 変更は実装前に確認を取る

---

## 0. 範囲

**作る**：新しいページ `tools/nisshi/index.html`（単一ファイル）。IndexedDB。このブラウザにある記録の取り込み。ホーム・日の詳細・台の詳細・分析・設定。書き出しと復元。容量表示。

**作らない（第2段以降）**：日記・狙い方タグ・自由タグ・note用コピー・「気になる」・収支の登録画面・店舗設定の編集・rec からの自動送信。画面にもボタンを出さない（「準備中」も出さない）。

**触らない**：tools/rec・tools/rec-kanokari・yutime-v3.html・ジャグラーのページ・kado-note.html。読むだけ。

**公開**：noindex。sitemap・トップ・他ページからの導線は付けない（限定公開）。

---

## 1. 保存（IndexedDB）

DB 名 `slot-tools-nisshi`、版 1。

| ストア | keyPath | 索引 |
|---|---|---|
| plays | id | date, machine, shop, source |
| days | date | — |
| stores | id | — |
| tagDefs | id | — |
| imports | id | at |
| meta | key | — |

- 起動時に `navigator.storage.persist()` を依頼し、結果を設定画面に出す
- 書き込みはトランザクション単位。失敗したら画面上部に「保存できませんでした」を出し、書き出しを促す
- 複数タブ：BroadcastChannel で「更新した」を伝え、他のタブは一覧を読み直す（rec のような凍結はしない。日誌は追記が主で、同じ台を同時に直す場面が少ないため）

### play の形（仕様書 §3-2）

```js
{id, source, sourceId, date, startAt, endAt, kind:"slot"|"pachinko",
 machine, shop, dai,
 money:{cashIn, cashOut, withdraw, deposit, unit:"枚"|"玉"},
 cond:{kind,label,lend,exchPer1000,exch}|null,
 yen:number|null, units:number,
 expected:number|null,
 events:[…]|null, raw:{…},
 aim:null, tags:[], diary:"", marks:[],          // 第2段以降で使う。第1段は空のまま保存
 mergedFrom:[], importedAt, updatedAt}
```

- `id` は `source + ":" + sourceId`（同じ元の記録は必ず同じ id）
- `yen`：cond があれば `round((deposit−withdraw)×cond.exch) + cashOut − cashIn`。cond が無ければ null
- `units`：`deposit − withdraw`

---

## 2. 取り込み（このブラウザから）

設定 →［このブラウザの記録を取り込む］。出どころごとにチェックボックス。押すと**取り込む前に件数の確認**：

```
rec（実戦記録）     新規 12 ／ 更新 3 ／ 変化なし 120
rec（簡易収支）     新規 0 ／ 更新 0 ／ 変化なし 57
かのかり            新規 3 ／ …
マイログ            …
遊タイム            …
同じ台の候補        2（あとで確認できます）
未換算              4件（＋1,086玉）
［取り込む］ ［やめる］
```

### 2-1. 出どころと変換

**rec 本線**：localStorage `slot-tools-rec` の `sessions`（終了済み = endAt あり だけ）、`entries`、`stores`。稼働中（cur）は取り込まない。
- session → play（source:"rec"）：date=startAt の日付（ローカル時刻）、machine、shop、dai、expected。money は rec の式から：withdraw＝開始持ちメダル＋再プレイ合計、deposit＝終了持ちメダル、cashIn＝現金投資、cashOut＝0、unit:"枚"。cond は session.lend を貸出とし、**交換条件は無いので null**（rec は等価前提で、交換は分からない）。ただし rec の画面と同じ収支を表示するために `raw.recProfit`（rec の profit() と同じ式で計算した円）を持ち、cond が null の rec の台は **yen に recProfit を使う**。events は元データのまま（ev.type・ev.tags を保持、snap は捨てる）
- entry → play（source:"ledger"）：cond・storeName・money をそのまま。kind も
- stores → stores（同じ id は上書きしない。名前が同じで id が違うものは別に入れる）

**かのかり箱**：localStorage `slot-tools-rec-kanokari`。rec 本線と同じ変換、source:"rec-kanokari"。

**マイログ（ジャグラー）**：localStorage `juggler-mylog:v1`（キー名はジャグラーのページのソースで確認）。records → play（source:"mylog"）：date、machine=machineName、shop（「高岡DSG」はそのまま。名前の寄せはしない）、dai=seat、money：cashIn=money.yen、withdraw=money.startHold、deposit=money.hold、cashOut=0、unit:"枚"。cond：money.rate と money.exchangeMai が両方あれば `{kind:"slot",lend:rate,exchPer1000:exchangeMai,exch:1000/exchangeMai}`、どちらか無ければ null（未換算）。

**遊タイム**：localStorage の遊タイム v3 のデータ（キーは yutime-v3.html の STORAGE_PREFIX + "data" を読んで確認）。sessions のうち status が completed かつ endTotalBalls があるもの → play（source:"yutime"）。台ごとに1件：withdraw＝再プレイ（investments の type:"saipurei" の合計）＋開始持ち玉（startMochidama）、deposit＝endTotalBalls、cashIn＝investments の type:"cash" の合計、cashOut＝settlementRecoverYen（無ければ0）、unit:"玉"、kind:"pachinko"。cond：storeTerms（無ければ店の設定）から lend=1000/lendRate、exchPer1000=exchangeBalls×10、exch=1000/exchPer1000。machine：machines の name、無ければ presetId から（umi-sp5→PA大海物語5 スペシャル、agnes-pe→PA大海物語Withアグネス・ラム Premium Ed）、それも無ければ「パチンコ（機種不明）」。開始持ち玉があれば raw に残す。**除外の判断はしない**（テスト運用の記録も入れる。不要なら第2段の削除で消す）

**ファイル**：JSON を選ぶ。形で判別（rec の書き出し {sessions…}、kado-note 用の単一／配列、マイログ {format:"juggler-mylog"}、遊タイムの書き出し、9/28 にシオンが作った変換済み {entries…}）。変換は上と同じ。

### 2-2. 取り込み直し（合流）

同じ id がすでにあれば：money・cond・yen・units・events・raw・machine・shop・dai・date を新しい方に差し替え、**aim・tags・diary・marks・mergedFrom は残す**。内容が同じなら「変化なし」で書かない。

### 2-3. 二重計上の防止（自動でまとめる分）

- rec の session と、それに `linkedSessionId` で紐づいた entry → **1件にまとめる**。id は rec 側、events は rec、money・cond・yen は entry（裁定2）。entry の id は mergedFrom に入れ、entry 単体の play は作らない
- rec 本線とかのかり箱で sessionId が同じ → 1件（updatedAt の新しい方の元データ）
- 9/28 にシオンが変換した遊タイム・マイログの entries（rec の簡易収支に入っているもの。memo に「遊タイムツールから取り込み」「マイログから取り込み」、または source フィールドが yutime-v3 / juggler-mylog）と、遊タイム・マイログから直接取り込んだ play → **同じ台**。直接取り込んだ側を正にし、ledger 側は mergedFrom へ
  - 照合：遊タイムは日付＋開始玉（withdraw）＋終了玉（deposit）が一致、マイログは日付＋台番（memo の「台番 n」）＋終了持ちが一致
- それ以外の重なり（同じ日・店・機種で出どころが違う）は**まとめずに「同じ台の候補」として数えるだけ**。確認画面は第2段

---

## 3. 画面

スマホ 390px が主。タップ 44px 以上。色・余白は rec に揃える（ダーク）。ヘッダに「稼働日誌」。

### ① ホーム
- 今日（記録が無ければ最後に打った日）：合計（円）、台のカード（時刻・機種・店・円 or 枚）。押すと台の詳細
- 今月：合計（円）・台数・想定期待値の合計。未換算があれば「未換算 n件（＋1,086玉）」
- 最近7日の日別合計（日を押すと日の詳細）
- 下に［履歴］［分析］［設定］

### ② 履歴
- 月のカレンダー。日の枠に収支（円、色つき）。前月・次月。日を押すと日の詳細

### ③ 日の詳細
- 日付、合計（円・未換算は別）、台のカード一覧

### ④ 台の詳細
- 要約：機種・店（第1段は伏せない。伏せるのは note用コピーだけ）・台番・時刻・出どころ・現金投資・現金回収・引出・預入・収支（円 or 枚）・換算条件・想定期待値・差
- **節目**（events がある台だけ）：ev.type が hitStart・hitEnd・money のもの＋ ev.tags が空でないもの。時刻・G数・本文・タグ。文章からは推定しない
- 示唆タグで絞る（その台に出てくるタグのボタン＋全部）
- ［全ログを開く］：events を全部
- events が無い台（ledger・mylog・yutime）は要約だけ

### ⑤ 分析
- 期間（月）・種別・機種（検索つき）・店で絞る
- 月別の棒 と 累積の折れ線 を切り替え（SVG を自前で描く。外部ライブラリなし）
- 機種別・店別の表：台数・合計円・1台平均・想定期待値の合計。行を押すと該当の台の一覧

### ⑥ 設定
- このブラウザの記録を取り込む／ファイルから取り込む
- 書き出し（全ストアを1つの JSON：{format:"slot-tools-nisshi", version:1, exportedAt, plays, days, stores, tagDefs, imports}）・復元（同じ形を読む。id が同じものは合流）
- 保存容量（navigator.storage.estimate の使用量）と永続化の状態
- 取り込みの履歴（いつ・どこから・何件）

---

## 4. 検証

- **実データで**：夢爽のスマホの状態を再現するため、rec の書き出し（jissen-backup-20260929.json があれば、なければ合成）・かのかりの書き出し・マイログ（mylog-2026-09-28.json）・遊タイム（yutime-v3-export-2026-09-28.json）を localStorage に入れた状態で取り込む
- **合計の照合**：
  - rec 本線の台だけで絞った合計 ＝ rec のノートの全体集計（同じ期間）
  - 遊タイムの台の合計 ＝ シオンの変換（9/28）の 35件 −20,553円 に、除外した16件の分を足したもの（除外分は報告で別に出す）
  - マイログの台の合計 ＝ シオンの変換の +73,016円
  - 二重計上が無いこと：9/28 に rec の簡易収支へ入れた遊タイム35件・マイログ11件が、直接取り込んだ遊タイム・マイログと**まとまって**、合計に二重に入っていない
- 取り込み直しで「変化なし」になる（2回目に新規0・更新0）
- 書き出し → 別のブラウザ（空）で復元 → 件数と合計が一致
- 節目：rec の台で hitStart・hitEnd・money・タグ付きの行だけが出る。文章による判定が無い
- 390×844 と 375×667 で横はみ出し0、タップ44px以上
- tools/rec・rec-kanokari の監査ハーネス・通し操作に変化なし（触っていないことの確認）

---

## 5. 報告に含めること

- コミットハッシュ（実装 Mikoto、マージ Shion）
- 実データでの取り込み件数（出どころ別：新規・まとめた件数・未換算・同じ台の候補）
- 合計の照合結果（上の各項目）
- IndexedDB の使用量
- 指示書と違う判断をしたところ（あれば）
