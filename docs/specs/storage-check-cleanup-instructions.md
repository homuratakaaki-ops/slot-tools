# 指示書：保存容量チェックに「片付け」を追加（tools/storage-check 第2便）

宛先：ツムギ（Claude Code）　発行：シオン　2026-10-29

## 背景
- 夢爽のスマホの測定結果（10/29 21:46）：slot-tools.jp 全体で 5,242,715文字＝上限100%、空き0
- 主な内訳：slot-tools-rec 136万／slot-tools-rec-kanokari 128万／ytv3 系 123万（本体39万＋控え84万）／nerai_record_v1 系 101万
- 夢爽の裁定（10/29）：使っていない `slot-tools-rec-kanokari` と、遊タイムv3の古い控え `ytv3:backup:s15`・`ytv3:backup:s17` は、ファイルに書き出してから消してよい
- s15・s17 は yutime-v3.html で旧形式データ（version < 33 / < 36）の移行時にだけ作られるため、消しても再作成されない（yutime-v3.html 4161・4177行で確認）
- nerai の控え（backup_1・last_good）は毎日作り直されるので対象外

## 作業内容
1. 新しいブランチ `feature/storage-check-cleanup` を作る
2. `tools/storage-check/index.html` を、シオンの新しいファイルでそのまま置き換える（中身は変更しない）
3. この指示書を `docs/specs/storage-check-cleanup-instructions.md` として同じブランチに含める
4. 導線・NEW欄・サイトマップは今回も触らない

## 新しいページの動き
- 「片付け」欄に、次の3キーのうち存在するものだけを出す：`slot-tools-rec-kanokari`／`ytv3:backup:s15`／`ytv3:backup:s17`（コード内の CLEANABLE 固定。ほかのキーは消せない）
- 「書き出す」で中身をそのまま `storage-<キー>-YYYYMMDD.json` に保存する
- 「消す」は、そのページを開いている間に書き出したキーでだけ押せる。1回目で「もう一度押すと消えます」と表示し、5秒以内にもう一度押すと `removeItem` する
- 消したあとは、内訳と片付け欄を描き直す

## 検証手順
1. コードの確認
   - `removeItem` が呼ばれるのは、CLEANABLE の3キーと測定用の `__slot_tools_storage_probe__` だけであること
   - `setItem` は測定用のキーだけであること
2. Playwright（390px）で確認
   - `slot-tools-rec`・`slot-tools-rec-kanokari`・`ytv3:backup:s15`・`ytv3:backup:latest` を入れて開く → 片付け欄は kanokari と s15 の2件だけ
   - 書き出す前は「消す」が押せない
   - 書き出したファイルの中身が、保存値と完全に一致する
   - 「消す」を1回押しただけでは消えない／2回目で消える
   - `slot-tools-rec` と `ytv3:backup:latest` の中身が変わらない
   - 横スクロールが出ない
3. 公開後、本番URLが200で返ることと md5 を報告する（シオンが原本と照合する）

## 反映
- 保存データを自動で書き換えるツールではなく、夢爽が自分で選んで押したときだけ消す新規ページの変更なので、日中に main へ反映してよい
- push承認：夢爽本人の一言をもらってから行う（前回と同じ扱い）
- マージは `--no-ff`
- 確認担当：作成はシオン、確認はツムギ

## commit 名義
- ページと指示書：Shion <claude@slot-tools.local>
- マージコミット：Shion <claude@slot-tools.local>

## 報告
- コミットハッシュは `git log` の出力からコピーし、push完了後にのみ報告する
- 報告内容：実装コミット・マージコミットのハッシュ、md5、Playwrightの結果

## このあと（今回はやらない）
- 恒久対策：tools/rec の終わった実戦を IndexedDB に移す（測定で使える容量は約10GBと確認）。別の指示書で、テスト版→ネネ検収→夜反映の手順で進める
