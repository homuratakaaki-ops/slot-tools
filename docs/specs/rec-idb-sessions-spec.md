# 仕様書：tools/rec 終わった実戦の保存先を IndexedDB へ移す

発行：シオン　2026-10-29　状態：本番反映済み（10/31 0:00 予定。night-merge）

## 1. 目的と対象（Step 0）
- 目的：tools/rec の記録が、ブラウザの保存枠（localStorage・slot-tools.jp 全体で約524万文字）を使い切って保存できなくなる問題を、恒久的になくす
- 経緯：2026-10-27〜29 に夢爽のスマホで「保存できません」。応急処置（未使用データの削除）で空き約173万文字を確保したが、rec は月約70万文字ずつ増えるため、約2か月半で再び満杯になる
- 対象：`tools/rec/index.html`（本体）、`tools/nisshi/index.html`（稼働日誌。rec のデータを直接読んでいるため）、新規の共通ファイル `js/rec-store.js`
- 対象外：`tools/rec-kit`・`tools/rec-kanokari`（同じ作りだが、夢爽の端末で使われていない。共通ファイルは将来流用できる作りにする）、遊タイムv3・狙い台記録の控え（別件）
- 根拠：夢爽の端末の `navigator.storage.estimate()` の quota は約10GB。IndexedDB はこちらの枠を使う

## 2. 方針（要するに）
- 打っている最中の台（`cur`）・収支帳（`entries`）・店舗（`stores`）・設定（`settings`）は、今までどおり localStorage に置く。小さいので問題ない
- **終わった実戦（`sessions`）だけを IndexedDB に置く**
- 画面側の作りは変えない。起動時に IndexedDB から全件を読み込み、メモリ上の `S.sessions` は今と同じ「全件の配列」にする。ノート・集計・書き出し・取り込み・収支帳の紐づけは、変更なしで動く
- 書き出し（JSON）の形式は変えない。旧版で書き出したファイルも、今までどおり取り込める

## 3. 保存の形

### 3.1 localStorage `slot-tools-rec`（version 3）
```
{ version:3, gen, settings, cur, entries, stores,
  sessionsIn:"idb",
  outbox:{ put:[未確定の実戦…], del:[未確定の削除id…] } }
```
- `sessions` は持たない（持っていたら旧形式として §4.3 の移行にかける）
- `outbox`：IndexedDB への書き込みが終わる前に閉じられても記録を失わないための控え。通常は空
- version 2（旧形式）は `sessions` を持ち、`sessionsIn` を持たない

### 3.2 IndexedDB
- DB名 `slot-tools-rec`、版 2、オブジェクトストア `sessions`（keyPath `id`）と `meta`（keyPath `key`）（10/30 版2に変更）
- `meta` の中身は `{key:"gen", gen:数値}` の1件だけ。IndexedDB に最後に確定した書き込みの世代
- 版1の DB は `onupgradeneeded` で `meta` を足すだけでそのまま使う。`sessions` の中身は変えない
- 中身は今の `S.sessions` の1件そのもの（加工しない・項目を足さない）
- 索引は作らない（全件読み込みで足りる。188件で約137万文字）

### 3.3 共通ファイル `js/rec-store.js`（新規・classic script、`window.RecStore`）
- `open(dbName)`：DBを開く。3秒で開けなければ失敗扱い
- `getAll(dbName)`：Promise。1トランザクションで、`complete` で解決する
- `commit(dbName, {put, del}, gen)`：書き込みはこれだけ（10/30 `putMany`・`deleteMany` から置き換え。世代の確認を通らない書き込み経路を残さない）。`sessions` と `meta` をまとめた1つの readwrite トランザクションの中で：
  1. `meta` の `gen` を読む
  2. 読んだ値が引数の `gen` より大きければ、何も書かずにトランザクションを中止し、「古い」と分かる失敗（`err.stale=true`）で返す
  3. そうでなければ put・delete を行い、`meta.gen` を `max(読んだ値, 引数の gen)` にする。`complete` で解決する
  - IndexedDB は同じ DB の readwrite トランザクションを、タブをまたいでも1本ずつ順番に処理するため、確認から書き込みまでの間に別のタブが割り込むことはない
- `readRecState(key, dbName)`：localStorage と IndexedDB を合わせた「全件の状態」を返す（稼働日誌用。§6）
- 合わせ方（rec 本体も同じ関数を使う。二重実装しない）：
  - version 2 の値なら、その `sessions` を正とし、IndexedDB 側にだけあるidを足す
  - version 3 なら、IndexedDB の全件に `outbox.put` を上書き（同じidは outbox を採用）し、`outbox.del` のidを除く
  - 並びは `startAt` の昇順（今の取り込み処理と同じ）

## 4. 状態と流れ

### 4.1 状態表
| 状態 | 条件 | sessions の置き場 | 動き |
|---|---|---|---|
| 移行前 | localStorage が version 2 | localStorage | 起動時に移行を試みる |
| 通常 | version 3、IndexedDB が開ける | IndexedDB（未確定分は outbox） | §4.4 の保存 |
| 予備 | IndexedDB が開けない（プライベートモード等） | localStorage（今と同じ） | 今と同じ動き。移行しない。画面の表示は変えない |
| 読めない | 値が壊れている／IndexedDB の中身が壊れている | — | 今の「読めない」処理（退避・書き出しボタン・保存しない）と同じ |

- localStorage が version 3（sessionsIn:"idb"）なのに IndexedDB が開けない・読めない場合は「読めない」扱いで保存しない。「予備」で動くのは version 2 のときだけ
- 「読めない」ときの「元データを書き出す」は、`{localStorage:元の文字列, idbSessions:[読めた生データ]}` を1ファイルで出す
- IndexedDB が絡む「読めない」でも、退避キー（`-broken`）には localStorage の元の文字列だけを書く。`{localStorage, idbSessions}` の全体は書き出しボタン用にメモリにだけ持つ（10/30。退避で保存枠を使い切らないため）。IndexedDB のデータは消さない
- version 3 で IndexedDB が開けない・読めないときだけ、案内の文言を「保存先のデータを読み込めないため、保存を止めています。「元データを書き出す」でファイルに保存して保管してください。」にする。それ以外の「読めない」の文言は今のまま（10/29 追記）

### 4.2 起動
1. localStorage を読む（今の `load()` と同じ検査）。壊れていれば「読めない」
2. IndexedDB を開く。開けない場合、localStorage が version 2 なら「予備」で起動、version 3 なら「読めない」扱い（§4.1）
3. version 2 なら §4.3 の移行。version 3 なら `readRecState` で全件を作る
4. IndexedDB から読んだ各実戦を `validSessionShape` で検査する。1件でも通らなければ「読めない」扱い（自動で捨てない）
5. outbox が空でなければ、ここで IndexedDB へ書き込み、確定後に outbox を空にする
   - 10/30 追記：IndexedDB の `meta.gen` が localStorage の `gen` より大きければ（localStorage を空の状態で始め直した後・localStorage の世代だけ小さいとき）、`saveGen` を `meta.gen` に合わせてから始める。起動時の outbox 反映・移行の書き込みもその値で行う（そうしないと、以後の `commit` がすべて「古い」で止まる）
6. ここから先は今の起動処理（`fixSession`・`stripSnaps`・画面表示）と同じ
- 起動中（IndexedDB を待つ間）は、画面の操作を受け付けない。通常は0.1秒程度

### 4.3 移行（version 2 → 3、1回だけ）
1. localStorage の `sessions` 全件に、起動時と同じ補正（`fixSession`・終了済みの実戦への `stripSnaps`）をかけ、その結果を IndexedDB に1トランザクションで書く（10/29 追記：補正前の値を移すと、起動時の補正で全件が「変更あり」になり、空きの少ない端末で outbox が localStorage に入りきらないため）
2. 書き終わったら IndexedDB から全件を読み直し、**すべてのidが揃い、各件の JSON 文字列が補正後の値と完全に一致する**ことを確かめる。`idbCache` は補正後の文字列で作る
3. 一致したときだけ、localStorage を version 3（`sessions` なし・outbox 空）で書き直す
4. 1〜2 で失敗・不一致なら、localStorage は一切変えず「予備」で起動する（次回の起動でまた試す）
- localStorage がほぼ満杯でも移行できること（書き直し後は小さくなるだけなので、追加の空きは要らない）

### 4.4 保存（`save()`）
- 「確定済みの控え」`idbCache`（id → その実戦の JSON 文字列）をメモリに持つ
- `save()` のたびに：
  1. `S.sessions` の各件を JSON 文字列にし、`idbCache` と違うものを「変更あり」、`idbCache` にあって `S.sessions` に無いidを「削除」とする
  2. 未確定の分（前回までの outbox で、まだ確定していないもの）と合わせて outbox を作り、localStorage に version 3 で書く（**ここまでは同期で、今と同じタイミング**）
  3. outbox が空でなければ IndexedDB へ書く。`complete` したら `idbCache` を更新し、確定した分を除いた outbox で localStorage を書き直す
     - この書き直しでは世代（`gen`）を上げない。localStorage の世代が自分の世代より進んでいたら（別タブが保存した）、書き直さない
  - 手順3の書き込みは `commit` で行い、引数の `gen` はその outbox を localStorage に書いたときの世代（`saveGen`）にする。起動時の outbox 反映では、読み込んだ localStorage の世代を使う。移行（§4.3）の書き込みも `commit` を使う（10/30）
  - `commit` が「古い」で失敗したら、そのタブは `staleTab()` で止める。outbox はそのままにする（新しいタブ側が正）
- localStorage に書く値は、メモリ上の `S` から `sessions` を除いて作る（`S.sessions` を JSON に含めない）
- 打っている最中は `S.sessions` が変わらないので、outbox は空のまま、localStorage には小さな値だけが書かれる
- 世代（`gen`）による別タブ対策・容量不足の警告（`storeWarn`）・「読めない」ときに書かない、は今のまま
- 容量不足時の `stripSnaps` は今のまま残す（cur は localStorage にあるため）
- IndexedDB の書き込みが失敗したら、outbox に残したまま次の `save()` で再試行する。outbox が原因で localStorage が満杯になれば、今と同じ警告が出る
- 手順2（localStorage への書き込み）が容量不足で失敗しても、手順3（IndexedDB への書き込み）は続ける。確定後に outbox を除いた小さい値で localStorage を書き直し、それが成功したら警告を消す（10/29 追記）

### 4.5 別タブ・旧版のタブ
- 反映時に旧版のタブが開いていると、旧版が version 2（sessions 入り）で書き戻すことがある。新版は次の起動でそれを §3.3 の合わせ方で取り込み、もう一度移行する。旧版のタブは新版の保存で世代が上がるため、今の仕組みで止まる
- 旧版のタブで削除した実戦は、IndexedDB 側に残っていれば復活しうる。発生は反映直後の1回に限られ、記録が消える方向ではないので許容する（告知で「反映後は記録ツールを開き直す」と案内する）

## 5. 変えないもの
- 画面・文言・ボタン・ノート・集計・収支帳・店舗・タグ
- 書き出し（`nExpJson`・`nDl`・`nDlNote`・`staleExport`・`storeExport`）の中身と形式（全件の `S.sessions` を出す）
- 取り込み（`doImport`）の判定と動き
- 判別ツールへ送る機能（`sendToChecker`）

## 6. 稼働日誌（tools/nisshi）の変更
- `browserBatch` の rec 読み込みを `RecStore.readRecState('slot-tools-rec','slot-tools-rec')` に置き換える（`browserBatch` は async にし、呼び出し側で await する）
- `rec-kanokari` の読み込みは今のまま（localStorage 直読み）
- ファイルからの取り込み（`fileBatch`）は変えない
- 日誌側から rec の IndexedDB には書かない（読むだけ）

## 7. 具体例（Example Mapping）
- 例1（移行）：188件・137万文字の version 2 → 起動 → IndexedDB に188件 → 読み直し一致 → localStorage は cur・収支・店舗・設定だけになり、数万文字に減る
- 例2（打ち終わり）：台を終了 → `S.sessions` に1件追加 → outbox.put に1件（約7千文字）→ IndexedDB 書き込み完了 → outbox が空に戻る
- 例3（途中で閉じた）：例2の IndexedDB 書き込み前に画面を閉じる → 次の起動で outbox の1件が IndexedDB に入り、ノートに出る
- 例4（削除）：ノートで1件削除 → outbox.del に1件 → 確定後に消える。ノートの件数は削除直後から1件減って見える
- 例5（プライベートモード）：IndexedDB が開けない → 今と同じく localStorage にすべて置く
- 例6（容量ぎりぎりで移行）：localStorage が残り数千文字の状態でも移行は成功し、空きが増える
- 例7（日誌）：移行後に稼働日誌で「ブラウザから取り込む → 実戦記録」を選ぶ → 移行前と同じ件数・同じ内容が取り込まれる

## 8. 受け入れ条件（テストで確かめること）
1. 例1〜7 がすべてそのとおりに動く
2. 移行の前後で、`nDl` の書き出し JSON の `sessions`・`entries`・`stores` が完全に一致する（`exportedAt` を除く）
3. 移行前後で、ノートの件数・機種別・月別の集計表示が一致する
4. 移行の途中（IndexedDB 書き込み後・localStorage 書き直し前）でページを閉じても、次の起動で記録が欠けない
5. 打っている最中の1操作で、localStorage に書く文字数が「cur＋収支＋店舗＋設定」の分だけになっている
6. Chromium で localStorage を残り約1万文字まで埋めた状態から移行し、成功する。その後、台を3台終了しても警告が出ない
7. IndexedDB を使えない状態（テストで open を失敗させる）で、今と同じ動き・同じ保存になる
8. 別タブ：新版2タブで今と同じく古い方が止まる。旧版の値（version 2）を書き戻した状態から起動し、取りこぼしなく再移行する
9. 稼働日誌の取り込み件数・内容が、移行前と一致する
10. 後読みの正規表現を使わない（§9-106）。`js/rec-store.js` の読み込みに `?v=` を付ける（§9-107）
- テストデータは合成で作る（夢爽の実データはリポジトリに入れない）。件数・大きさは実データに合わせる（200件・合計約140万文字、1件あたりイベント30〜150件）

## 9. 夢爽に決めてもらうこと（10/30 裁定済み）
1. 反映の告知：rec は限定公開（導線なし）で、使っているのは実質夢爽だけ。§9-108-3a の「利用者への注意喚起」は、rec の画面に一時的なお知らせを出すだけでよいか（シオン推奨：反映の前日から当日まで、rec の上部に「◯/◯ 0時に保存方式を更新します。念のため書き出しをしておいてください」を出す）
   - 裁定（10/30）：シオン推奨案のとおり、rec 上部のお知らせ帯で告知する。文言は「10/31（土）0時に保存方式を更新します。念のため、ノートの「保存」で書き出しをしておいてください。」。10/30 に反映し、本番反映（第2便）で外す
2. 反映日：テスト版→ネネ検収→夢爽の実機確認が済んだ日の 0時（night-merge）。稼働の都合で避けたい日があれば指定する
   - 裁定（10/30）：今回の方式で本番に反映する。反映は 10/31（土）0:00 の night-merge。前提：テスト版 `9e90c8a` のネネ再検収合格（高0・中0・低0）、夢爽の Android 実機確認合格（10/30 2:00）

## 10. 戻し方
- §9-108-5 のとおり旧版には戻さない。旧版に戻すと終わった実戦がノートから見えなくなる（データは IndexedDB に残るので消えはしない）
- 不具合は前に進めて直す
